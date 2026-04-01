# backend/model/snapshot.py
# Run from PROJECT ROOT: python backend/model/snapshot.py

import os
import sys
from dotenv import load_dotenv

_backend_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

load_dotenv(os.path.join(_backend_dir, ".env"))

from ultralytics import YOLO
import cv2
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from services.violation_service import save_violation
from services.dedup_service import should_save_violation, reset_state

# ============================================================
# CONFIGURATION
# ============================================================
MODEL_PATH  = r"D:\sem 7\FYP\Frontend\backend\model\best (6).pt"
VIDEO_PATH  = r"D:\sem 7\FYP\Frontend\backend\model\CHEFS WORKING _BUSY KITCHEN_ Over 3000 Meals A Week _Chef Life _Gopro(720P_60FPS).mp4"

USER_ID   = "nTZMtubSmmTjJuZqNKTMnIeMDes2"
CAMERA_ID = "EZYuxqna15bB5dVtz4to"

CONFIDENCE          = 0.3
VIDEO_START_SEC     = None
VIDEO_END_SEC       = None
IOU_THRESHOLD       = 0.3
MIN_FIRE_AREA_RATIO = 0.35
SNAPSHOT_RESIZE     = 0.4
SNAPSHOT_QUALITY    = 20
SAVE_SNAPSHOTS      = True

SNAPSHOT_DIR = Path(os.path.join(os.path.dirname(__file__), "saved_snapshots"))
SNAPSHOT_DIR.mkdir(exist_ok=True)

# Canonical violation classes only
VIOLATION_CLASSES = {
    "no_apron":   "Apron Violation",
    "no_gloves":  "Gloves Violation",
    "no_hairnet": "Hair Net Violation",
    "fire":       "Fire Alert",
}
COMPLIANT_CLASSES = {"apron", "gloves", "hairnet"}

# Internal normalization (model may output variants)
_TYPE_MAP = {
    "no_apron":    "no_apron",
    "no_gloves":   "no_gloves",
    "no_hairnet":  "no_hairnet",
    "no_hair_net": "no_hairnet",
    "fire":        "fire",
    "fire_detected": "fire",
}

print(f"[KitchenEye] Loading model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)


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
        if n in ("no_apron", "apron"):         groups["apron"].append((cls, conf, box, tid))
        elif n in ("no_gloves", "gloves"):     groups["gloves"].append((cls, conf, box, tid))
        elif n in ("no_hairnet", "hairnet"):   groups["hairnet"].append((cls, conf, box, tid))
        else:                                  others.append((cls, conf, box, tid))

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
                if not used[j] and calculate_iou(bi, get_box_coords(dets[j][2])) > IOU_THRESHOLD:
                    grp.append(j)
                    used[j] = True
            used[i] = True
            resolved.append(max([dets[k] for k in grp], key=lambda x: x[1]))
    resolved.extend(others)
    return resolved


def process_video():
    if USER_ID in ("CHANGE_TO_REAL_FIREBASE_UID", "", None):
        print("❌ Set USER_ID before running.")
        return

    reset_state()

    counted_violations = set()
    counted_compliant  = set()
    ignored_fires      = set()
    fire_max_area      = {}
    violation_counts   = defaultdict(int)
    total_violations   = 0

    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"❌ Cannot open: {VIDEO_PATH}")
        return

    fps          = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration     = total_frames / fps
    start_frame  = int(VIDEO_START_SEC * fps) if VIDEO_START_SEC else 0
    end_frame    = int(VIDEO_END_SEC * fps) if VIDEO_END_SEC else total_frames
    start_frame  = max(0, min(start_frame, total_frames))
    end_frame    = max(start_frame, min(end_frame, total_frames))

    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    print(f"[KitchenEye] Video: {VIDEO_PATH}")
    print(f"[KitchenEye] Duration: {duration:.1f}s | FPS: {fps}")
    print(f"[KitchenEye] User: {USER_ID} | Camera: {CAMERA_ID}")
    print("=" * 60)

    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        if start_frame + frame_count > end_frame:
            break

        results = model.track(frame, conf=CONFIDENCE, iou=0.5, persist=True, verbose=False)

        detections = []
        for result in results:
            if result.boxes.id is None:
                continue
            for i, box in enumerate(result.boxes):
                detections.append((
                    model.names[int(box.cls[0])],
                    float(box.conf[0]),
                    box,
                    int(result.boxes.id[i]),
                ))

        resolved = resolve_ppe_conflicts(detections)

        for cls, conf, box, tid in resolved:
            canonical = normalize(cls)
            key = f"{canonical}_{tid}"

            if canonical in VIOLATION_CLASSES and key not in counted_violations:
                # Fire size gate
                if canonical == "fire":
                    c = get_box_coords(box)
                    ratio = ((c[2] - c[0]) * (c[3] - c[1])) / (frame.shape[0] * frame.shape[1])
                    fire_max_area[tid] = max(fire_max_area.get(tid, 0), ratio)
                    if ratio < MIN_FIRE_AREA_RATIO:
                        ignored_fires.add(tid)
                        continue
                    elif tid in ignored_fires:
                        ignored_fires.discard(tid)

                counted_violations.add(key)
                violation_counts[canonical] += 1
                total_violations += 1
                print(f"🚨 [{frame_count}] {VIOLATION_CLASSES[canonical]} | ID:{tid} | conf:{conf:.2f}")

                # Save to Firestore, get violation_id back
                saved = None
                if should_save_violation(key):
                    saved = save_violation(
                        user_id=USER_ID,
                        violation_type=canonical,
                        camera_id=CAMERA_ID,
                        confidence=round(conf, 3),
                    )

                # Save snapshot — filename = {violation_id}.jpg
                if SAVE_SNAPSHOTS and saved:
                    violation_id = saved.get("violation_id")
                    filename = f"{violation_id}.jpg"
                    ann = results[0].plot()
                    if SNAPSHOT_RESIZE < 1.0:
                        ann = cv2.resize(ann, (
                            int(ann.shape[1] * SNAPSHOT_RESIZE),
                            int(ann.shape[0] * SNAPSHOT_RESIZE),
                        ))
                    cv2.imwrite(
                        str(SNAPSHOT_DIR / filename),
                        ann,
                        [cv2.IMWRITE_JPEG_QUALITY, SNAPSHOT_QUALITY],
                    )
                    print(f"[KitchenEye] Snapshot saved: {SNAPSHOT_DIR / filename}")

            elif canonical in COMPLIANT_CLASSES and key not in counted_compliant:
                counted_compliant.add(key)

        if frame_count % 100 == 0:
            seg = end_frame - start_frame
            print(f"Progress: {frame_count}/{seg} ({frame_count / seg * 100:.1f}%)")

    cap.release()
    cv2.destroyAllWindows()

    print("\n" + "=" * 60)
    print("📊 FINAL SUMMARY")
    for v in ["no_apron", "no_gloves", "no_hairnet", "fire"]:
        if violation_counts[v]:
            print(f"   {v}: {violation_counts[v]}")
    print(f"\n📈 TOTAL: {total_violations}")
    print(f"📁 Snapshots: {SNAPSHOT_DIR}/")


if __name__ == "__main__":
    process_video()