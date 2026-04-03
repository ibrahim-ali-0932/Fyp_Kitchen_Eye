# backend/services/dedup_service.py
#
# Two-gate deduplication — InsightFace (ArcFace R100) edition
#
#   Gate 1  — InsightFace detects + embeds any face in the search region.
#             Works for frontal, angled, and full profile faces.
#   Gate 2  — Cosine-similarity comparison against stored 512-float embeddings.
#   Fallback— Legacy key-based cooldown timer (fire detections + no-face cases).
#
# InsightFace install (run once):
#   pip install insightface onnxruntime      # CPU
#   pip install insightface onnxruntime-gpu  # GPU (recommended)
#
# First run downloads ~300 MB of model weights to ~/.insightface/

import time
import cv2
import numpy as np

# ── InsightFace lazy init (imported once at module level) ─────────────────────
try:
    from insightface.app import FaceAnalysis as _FaceAnalysis  # type: ignore[import-not-found]
    _INSIGHTFACE_AVAILABLE = True
except ImportError:
    _FaceAnalysis = None
    _INSIGHTFACE_AVAILABLE = False
    print("[KitchenEye] ⚠️  insightface not installed — face gate disabled, fallback only.")


# ── Tunables ──────────────────────────────────────────────────────────────────
COOLDOWN_SECONDS      = 30      # fallback: seconds between saves for the same unique_key
FACE_COOLDOWN_MINUTES = 30      # face-gate: minutes before same face+type is saved again

COSINE_SIM_THRESHOLD  = 0.40   # 0–1; dot product of L2-normed ArcFace embeddings.
                                 # 0.40 is a solid default for kitchen footage.
                                 # Raise to 0.45 to be stricter (fewer false matches).
                                 # Lower to 0.35 if same person is being re-saved too often.

SEARCH_EXPAND_FACTOR  = 2.0    # multiplier: how far upward to look for a face
                                 # above a gloves/apron bounding box.

DET_SCORE_MIN         = 0.55   # minimum InsightFace RetinaFace detection confidence.
                                 # Lower to 0.45 if faces in your footage are often
                                 # partially occluded by steam, masks, or camera angle.


# ── InsightFace singleton ─────────────────────────────────────────────────────
_fa = None


def _get_fa():
    """
    Lazy-load InsightFace FaceAnalysis once per process.

    buffalo_l  = RetinaFace detector  +  ArcFace R100 recogniser
                 Handles frontal, angled (~60° yaw), and profile faces.
                 Swap to "buffalo_s" for a faster/lighter model at slight accuracy cost.

    ctx_id=0   → first CUDA GPU (fastest).
    ctx_id=-1  → CPU (slower but works everywhere).
    """
    global _fa
    if _fa is not None:
        return _fa
    if not _INSIGHTFACE_AVAILABLE:
        return None
    try:
        _fa = _FaceAnalysis(
            name      = "buffalo_l",
            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"],
        )
        # det_size=(640,640) is better than the default (320,320) for small/distant faces.
        _fa.prepare(ctx_id=0, det_size=(640, 640))
        print("[KitchenEye] ✅ InsightFace (buffalo_l / ArcFace R100) loaded.")
    except Exception as exc:
        print(f"[KitchenEye] ⚠️  InsightFace load failed: {exc}  — using key-timer fallback.")
        _fa = None
    return _fa


# ── In-memory state ───────────────────────────────────────────────────────────
_last_reported: dict[str, float] = {}

# List of registered identities.
# Each entry: (embedding np.ndarray shape(512,), violations dict {type: last_seen_ts})
_face_log: list[tuple[np.ndarray, dict[str, float]]] = []


# ════════════════════════════════════════════════════════════════════════════
# Embedding / similarity helpers
# ════════════════════════════════════════════════════════════════════════════

def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    """
    Cosine similarity between two ArcFace embeddings.
    InsightFace already L2-normalises every embedding, so dot product == cosine sim.
    Result is in [-1, 1]; same person typically scores ≥ 0.40 with buffalo_l.
    """
    return float(np.dot(a, b))


def _find_matching_entry(
    embedding: np.ndarray,
) -> "tuple[np.ndarray, dict[str, float]] | None":
    """
    Linear scan of _face_log for the nearest stored embedding.
    Returns the matching (emb, violations) pair if similarity ≥ threshold, else None.

    O(n) over unique faces seen in the session — typically < 20 kitchen workers,
    so this is negligible even on CPU.
    """
    best_sim   = -1.0
    best_entry = None

    for emb, violations in _face_log:
        sim = _cosine_sim(embedding, emb)
        if sim > best_sim:
            best_sim   = sim
            best_entry = (emb, violations)

    if best_sim >= COSINE_SIM_THRESHOLD:
        return best_entry
    return None


# ════════════════════════════════════════════════════════════════════════════
# Search-region + embedding extraction
# ════════════════════════════════════════════════════════════════════════════

def _xyxy(box) -> tuple[int, int, int, int]:
    """Extract (x1, y1, x2, y2) from a YOLO box object or a plain array."""
    try:
        coords = box.xyxy[0].cpu().numpy()
    except AttributeError:
        coords = np.asarray(box)
    return int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])


def _clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


def _build_search_region(
    frame: np.ndarray,
    box,
    violation_type: str,
) -> "np.ndarray | None":
    """
    Crop the area of the frame where InsightFace should look for a face.

    no_hairnet → violation box IS on the head; use it directly (+ small h-pad).
    no_gloves  → hands are at bottom; search the space ABOVE the box.
    no_apron   → torso is mid-body; search the space ABOVE the box.
    fire       → no person involved; return None immediately.
    """
    if violation_type == "fire":
        return None

    H, W            = frame.shape[:2]
    x1, y1, x2, y2 = _xyxy(box)
    box_h           = y2 - y1
    box_w           = x2 - x1

    if violation_type == "no_hairnet":
        # Head box — add a small horizontal pad so ears/temples aren't clipped
        pad = int(box_w * 0.15)
        rx1, ry1 = _clamp(x1 - pad, 0, W), _clamp(y1, 0, H)
        rx2, ry2 = _clamp(x2 + pad, 0, W), _clamp(y2, 0, H)

    else:
        # no_gloves / no_apron — face is above the violation box
        search_h = int(box_h * SEARCH_EXPAND_FACTOR)
        rx1, ry1 = _clamp(x1,            0, W), _clamp(y1 - search_h, 0, H)
        rx2, ry2 = _clamp(x2,            0, W), _clamp(y1,            0, H)

    if rx2 <= rx1 or ry2 <= ry1:
        return None

    return frame[ry1:ry2, rx1:rx2].copy()


def _extract_best_embedding(region: np.ndarray) -> "np.ndarray | None":
    """
    Run InsightFace on a BGR crop; return the 512-float ArcFace embedding
    of the highest-confidence detected face, or None if no face qualifies.

    Why InsightFace handles profiles correctly:
    • RetinaFace detector is trained on WIDER FACE which includes profile angles.
    • ArcFace R100 embedding space is trained on MS1MV3 (large pose variation).
    • Unlike Haar cascade, it does NOT require a frontal view.
    """
    fa = _get_fa()
    if fa is None:
        return None

    try:
        faces = fa.get(region)   # expects BGR — no conversion needed
    except Exception as exc:
        print(f"[KitchenEye] InsightFace inference error: {exc}")
        return None

    if not faces:
        return None

    # Drop low-confidence detections, keep the best one
    valid = [f for f in faces if f.det_score >= DET_SCORE_MIN]
    if not valid:
        return None

    best = max(valid, key=lambda f: f.det_score)

    emb = best.embedding   # np.ndarray (512,), L2-normalised by InsightFace
    if emb is None or emb.shape[0] != 512:
        return None

    return emb


# ════════════════════════════════════════════════════════════════════════════
# Public API  ← same signatures as the previous Haar+pHash version
#               snapshot.py needs zero changes
# ════════════════════════════════════════════════════════════════════════════

def should_save_violation_face(
    frame: np.ndarray,
    box,
    violation_type: str,
) -> tuple[bool, bool]:
    """
    InsightFace-powered deduplication gate.

    Parameters
    ----------
    frame          : Full BGR frame from OpenCV.
    box            : YOLO bounding box object (or xyxy array) for the violation.
    violation_type : Canonical type string, e.g. "no_gloves", "no_hairnet".

    Returns
    -------
    (should_save, face_found)
        should_save : True  → write the violation to Firestore.
        face_found  : True  → face gate fired (result is reliable).
                      False → no face detected; caller should use should_save_violation().
    """
    region = _build_search_region(frame, box, violation_type)
    if region is None:
        return False, False

    embedding = _extract_best_embedding(region)
    if embedding is None:
        return False, False     # no face found — caller falls back to key timer

    now    = time.time()
    cutoff = now - FACE_COOLDOWN_MINUTES * 60

    entry = _find_matching_entry(embedding)

    if entry is not None:
        _, violations = entry
        last_seen = violations.get(violation_type, 0)

        if last_seen > cutoff:
            # Same person, same violation type, within cooldown → suppress
            return False, True

        # Same person, cooldown expired → allow save, refresh timestamp
        violations[violation_type] = now
        return True, True

    # Brand-new face → register and allow save
    _face_log.append((embedding, {violation_type: now}))
    return True, True


def should_save_violation(unique_key: str) -> bool:
    """
    Fallback gate — identical to the original implementation.
    Used for 'fire' violations and any frame where InsightFace finds no face.
    """
    now = time.time()
    if now - _last_reported.get(unique_key, 0) < COOLDOWN_SECONDS:
        return False
    _last_reported[unique_key] = now
    return True


def reset_state() -> None:
    """Call at the start of each new video or stream session."""
    _last_reported.clear()
    _face_log.clear()
    print("[KitchenEye] Dedup state reset (key-log + face-log cleared).")