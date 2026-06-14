import os
import re
import sys
import time
from dotenv import load_dotenv

_backend_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

load_dotenv(os.path.join(_backend_dir, ".env"))

from ultralytics import YOLO
import cv2
from pathlib import Path
from collections import defaultdict
from app.database.db import db
from services.violation_service import save_violation
from services.dedup_service import should_save_violation, reset_state
from services.detection_control import is_detection_enabled

# ============================================================
# CONFIGURATION
# ============================================================
MODEL_DIR = Path(__file__).resolve().parent
PATCH_DIR = MODEL_DIR / "patches"


def _resolve_model_path() -> str:
    env_path = os.getenv("KITCHEN_EYE_MODEL_PATH")
    if env_path:
        candidate = Path(env_path)
        if candidate.is_file():
            return str(candidate)

    preferred_names = ["best (6).pt", "best.pt"]
    for name in preferred_names:
        candidate = MODEL_DIR / name
        if candidate.is_file():
            return str(candidate)

    model_files = sorted(
        MODEL_DIR.glob("*.pt"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if model_files:
        return str(model_files[0])

    raise FileNotFoundError(f"No .pt model file found in {MODEL_DIR}")


MODEL_PATH = _resolve_model_path()

DEFAULT_USER_ID = os.getenv("KITCHEN_EYE_USER_ID", "")
POLL_INTERVAL_SEC = 5  # Seconds to wait when no patch is available

CONFIDENCE = 0.3
IOU_THRESHOLD = 0.3
MIN_FIRE_AREA_RATIO = 0.35
SNAPSHOT_RESIZE = 0.4
SNAPSHOT_QUALITY = 20
SAVE_SNAPSHOTS = True

SNAPSHOT_DIR = Path(os.path.join(os.path.dirname(__file__), "saved_snapshots"))
SNAPSHOT_DIR.mkdir(exist_ok=True)

PATCH_DIR_PATH = Path(PATCH_DIR)

# Canonical violation classes only
VIOLATION_CLASSES = {
    "no_apron": "Apron Violation",
    "no_gloves": "Gloves Violation",
    "no_hairnet": "Hair Net Violation",
    "fire": "Fire Alert",
}
COMPLIANT_CLASSES = {"apron", "gloves", "hairnet"}

# Internal normalization (model may output variants)
_TYPE_MAP = {
    "no_apron": "no_apron",
    "no_gloves": "no_gloves",
    "no_hairnet": "no_hairnet",
    "no_hair_net": "no_hairnet",
    "fire": "fire",
    "fire_detected": "fire",
}

print(f"[KitchenEye] Loading model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)


# ============================================================
# CAMERA ID EXTRACTION
# ============================================================


def extract_camera_id(patch_path: Path) -> str:
    """
    Extract camera ID from patch filename.
    e.g.  CAM-001_patch_003.mp4  ->  CAM-001
          Cam-002_patch_001.mp4  ->  CAM-002
    Falls back to full stem if pattern not matched.
    """
    stem = patch_path.stem  # e.g. CAM-001_patch_003
    match = re.match(r"^(CAM-\d+)", stem, re.IGNORECASE)
    if match:
        return match.group(1).upper()  # normalise to upper-case
    # Fallback: everything before the first '_patch_'
    parts = re.split(r"_patch_", stem, flags=re.IGNORECASE)
    return parts[0].upper() if parts else stem.upper()


def _candidate_camera_tokens(camera_id: str) -> set[str]:
    raw = str(camera_id or "").strip()
    upper = raw.upper()
    stem = Path(raw).stem.upper()
    tokens = {raw, upper, stem}
    if stem:
        tokens.add(f"{stem}.MP4")
    return {token for token in tokens if token}


def resolve_camera_record(camera_id: str) -> tuple[str, str, str]:
    """
    Resolve the owning app user and real Firestore camera document id.
    Cameras are stored with auto-generated document ids, so we match against
    the camera metadata first and fall back to the patch label only if needed.
    """
    try:
        camera_tokens = _candidate_camera_tokens(camera_id)

        exact_doc = db.collection("cameras").document(camera_id).get()
        if exact_doc.exists:
            payload = exact_doc.to_dict() or {}
            user_id = str(payload.get("user_id") or "").strip()
            if user_id:
                camera_name = str(
                    payload.get("branch") or payload.get("name") or exact_doc.id
                ).strip()
                return user_id, camera_name or exact_doc.id, exact_doc.id

        for doc in db.collection("cameras").stream():
            payload = doc.to_dict() or {}
            user_id = str(payload.get("user_id") or "").strip()
            if not user_id:
                continue

            doc_id = str(doc.id or "").strip()
            branch = str(payload.get("branch") or "").strip()
            source_value = str(payload.get("source_value") or "").strip()
            stream_url = str(payload.get("stream_url") or "").strip()
            ip_address = str(payload.get("ip_address") or "").strip()

            candidates = {
                doc_id,
                branch,
                source_value,
                stream_url,
                ip_address,
                Path(source_value).name,
                Path(stream_url).name,
            }

            normalized_candidates = {
                str(value).upper() for value in candidates if value
            }
            if camera_tokens & normalized_candidates:
                camera_name = branch or source_value or doc_id or camera_id
                return user_id, camera_name, doc_id or camera_id

        matches = db.collection("cameras").where("branch", "==", camera_id).stream()
        for doc in matches:
            payload = doc.to_dict() or {}
            user_id = str(payload.get("user_id") or "").strip()
            if user_id:
                camera_name = str(payload.get("branch") or doc.id or camera_id).strip()
                return user_id, camera_name, doc.id

        matches = (
            db.collection("cameras").where("source_value", "==", camera_id).stream()
        )
        for doc in matches:
            payload = doc.to_dict() or {}
            user_id = str(payload.get("user_id") or "").strip()
            if user_id:
                camera_name = str(
                    payload.get("branch") or payload.get("source_value") or doc.id
                ).strip()
                return user_id, camera_name, doc.id
    except Exception as e:
        print(f"[KitchenEye] Warning: could not resolve user_id for {camera_id}: {e}")

    if DEFAULT_USER_ID:
        return DEFAULT_USER_ID, camera_id, camera_id

    return "", camera_id, camera_id


# ============================================================
# HELPERS (unchanged from original)
# ============================================================


def normalize(cls: str) -> str:
    return _TYPE_MAP.get(cls, cls)


def calculate_iou(box1, box2):
    x1, y1 = max(box1[0], box2[0]), max(box1[1], box2[1])
    x2, y2 = min(box1[2], box2[2]), min(box1[3], box2[3])
    if x2 < x1 or y2 < y1:
        return 0.0
    inter = (x2 - x1) * (y2 - y1)
    a1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    a2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = a1 + a2 - inter
    return inter / union if union > 0 else 0.0


def get_box_coords(box):
    return box.xyxy[0].cpu().numpy()


def resolve_ppe_conflicts(detections):
    groups = {"apron": [], "gloves": [], "hairnet": []}
    others = []
    for cls, conf, box, tid in detections:
        n = normalize(cls)
        if n in ("no_apron", "apron"):
            groups["apron"].append((cls, conf, box, tid))
        elif n in ("no_gloves", "gloves"):
            groups["gloves"].append((cls, conf, box, tid))
        elif n in ("no_hairnet", "hairnet"):
            groups["hairnet"].append((cls, conf, box, tid))
        else:
            others.append((cls, conf, box, tid))

    resolved = []
    for dets in groups.values():
        if not dets:
            continue
        if len(dets) == 1:
            resolved.append(dets[0])
            continue
        used = [False] * len(dets)
        for i in range(len(dets)):
            if used[i]:
                continue
            grp = [i]
            bi = get_box_coords(dets[i][2])
            for j in range(i + 1, len(dets)):
                if (
                    not used[j]
                    and calculate_iou(bi, get_box_coords(dets[j][2])) > IOU_THRESHOLD
                ):
                    grp.append(j)
                    used[j] = True
            used[i] = True
            resolved.append(max([dets[k] for k in grp], key=lambda x: x[1]))
    resolved.extend(others)
    return resolved


# ============================================================
# PATCH QUEUE
# ============================================================


def get_next_patch() -> Path | None:
    """
    Return the lexicographically smallest .mp4 patch in PATCH_DIR, or None.
    Lexicographic order ensures CAM-001_patch_001 is processed before patch_002,
    and CAM-001 before CAM-002.
    """
    patches = sorted(PATCH_DIR_PATH.glob("*.mp4"))
    return patches[0] if patches else None


# ============================================================
# INFERENCE ON A SINGLE PATCH
# ============================================================


def process_patch(patch_path: Path):
    if not is_detection_enabled():
        print("[KitchenEye] Detection paused before patch start; keeping patch queued.")
        return False

    camera_id = extract_camera_id(patch_path)

    print(f"\n{'=' * 60}")
    print(f"[KitchenEye] Patch  : {patch_path.name}")
    print(f"[KitchenEye] Camera : {camera_id}")
    user_id, resolved_camera_name, resolved_camera_doc_id = resolve_camera_record(
        camera_id
    )
    print(f"[KitchenEye] User   : {user_id or 'unresolved'}")
    print(f"[KitchenEye] Camera name stored as: {resolved_camera_name}")
    print(f"[KitchenEye] Camera doc id: {resolved_camera_doc_id}")
    print(f"{'=' * 60}")

    reset_state()

    counted_violations = set()
    counted_compliant = set()
    ignored_fires = set()
    fire_max_area = {}
    violation_counts = defaultdict(int)
    total_violations = 0

    cap = cv2.VideoCapture(str(patch_path))
    if not cap.isOpened():
        print(f"❌ Cannot open patch: {patch_path}")
        return

    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    frame_count = 0
    while cap.isOpened():
        if not is_detection_enabled():
            print(
                f"[KitchenEye] Detection paused mid-patch ({patch_path.name}); leaving patch in queue."
            )
            cap.release()
            cv2.destroyAllWindows()
            return False

        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1

        results = model.track(
            frame, conf=CONFIDENCE, iou=0.5, persist=True, verbose=False
        )

        detections = []
        for result in results:
            if result.boxes.id is None:
                continue
            for i, box in enumerate(result.boxes):
                detections.append(
                    (
                        model.names[int(box.cls[0])],
                        float(box.conf[0]),
                        box,
                        int(result.boxes.id[i]),
                    )
                )

        resolved = resolve_ppe_conflicts(detections)

        for cls, conf, box, tid in resolved:
            canonical = normalize(cls)
            key = f"{canonical}_{tid}"

            if canonical in VIOLATION_CLASSES and key not in counted_violations:
                # Fire size gate
                if canonical == "fire":
                    c = get_box_coords(box)
                    ratio = ((c[2] - c[0]) * (c[3] - c[1])) / (
                        frame.shape[0] * frame.shape[1]
                    )
                    fire_max_area[tid] = max(fire_max_area.get(tid, 0), ratio)
                    if ratio < MIN_FIRE_AREA_RATIO:
                        ignored_fires.add(tid)
                        continue
                    elif tid in ignored_fires:
                        ignored_fires.discard(tid)

                counted_violations.add(key)
                violation_counts[canonical] += 1
                total_violations += 1
                print(
                    f"🚨 [{frame_count}] {VIOLATION_CLASSES[canonical]} | "
                    f"ID:{tid} | conf:{conf:.2f} | cam:{camera_id}"
                )

                saved = None
                if should_save_violation(key):
                    if not user_id:
                        print(
                            f"[KitchenEye] ⚠️  Skipping save for {camera_id}: no user_id found in cameras collection"
                        )
                        continue

                    saved = save_violation(
                        user_id=user_id,
                        violation_type=canonical,
                        camera_id=resolved_camera_name,
                        confidence=round(conf, 3),
                    )

                if SAVE_SNAPSHOTS and saved:
                    violation_id = saved.get("violation_id")
                    filename = f"{violation_id}.jpg"
                    ann = results[0].plot()
                    if SNAPSHOT_RESIZE < 1.0:
                        ann = cv2.resize(
                            ann,
                            (
                                int(ann.shape[1] * SNAPSHOT_RESIZE),
                                int(ann.shape[0] * SNAPSHOT_RESIZE),
                            ),
                        )
                    cv2.imwrite(
                        str(SNAPSHOT_DIR / filename),
                        ann,
                        [cv2.IMWRITE_JPEG_QUALITY, SNAPSHOT_QUALITY],
                    )
                    print(f"[KitchenEye] Snapshot: {SNAPSHOT_DIR / filename}")

            elif canonical in COMPLIANT_CLASSES and key not in counted_compliant:
                counted_compliant.add(key)

        if frame_count % 100 == 0 and total_frames > 0:
            print(
                f"  Progress: {frame_count}/{total_frames} "
                f"({frame_count / total_frames * 100:.1f}%)"
            )

    cap.release()
    cv2.destroyAllWindows()

    # ── Summary ──────────────────────────────────────────────
    print(f"\n📊 [{patch_path.name}] SUMMARY")
    for v in ["no_apron", "no_gloves", "no_hairnet", "fire"]:
        if violation_counts[v]:
            print(f"   {v}: {violation_counts[v]}")
    print(f"   TOTAL: {total_violations}")
    return True


# ============================================================
# MAIN LOOP
# ============================================================


def main():
    print("[KitchenEye] Patch consumer started.")
    print(f"  PATCH_DIR  : {PATCH_DIR}")
    print(f"  MODEL      : {MODEL_PATH}")
    print(f"  POLL every : {POLL_INTERVAL_SEC}s when queue is empty")
    if DEFAULT_USER_ID:
        print(f"  DEFAULT USER: {DEFAULT_USER_ID} (fallback only)")

    while True:
        if not is_detection_enabled():
            print(f"[KitchenEye] Detection paused. Waiting {POLL_INTERVAL_SEC}s...")
            time.sleep(POLL_INTERVAL_SEC)
            continue

        patch = get_next_patch()

        if patch is None:
            print(f"[KitchenEye] No patches available. Waiting {POLL_INTERVAL_SEC}s...")
            time.sleep(POLL_INTERVAL_SEC)
            continue

        completed = False
        try:
            completed = process_patch(patch)
        except Exception as e:
            print(f"[KitchenEye] ❌ Error processing {patch.name}: {e}")
        finally:
            if "completed" in locals() and completed:
                try:
                    patch.unlink()
                    print(f"[KitchenEye] 🗑️  Deleted patch: {patch.name}")
                except Exception as e:
                    print(f"[KitchenEye] Warning: could not delete {patch.name}: {e}")


if __name__ == "__main__":
    main()
