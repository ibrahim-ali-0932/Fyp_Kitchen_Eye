///////////backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import signup, login, profile, stats, violations, users, cameras, reports

app = FastAPI(title="KitchenEye API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],  # Your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers with /auth prefix
app.include_router(signup.router, prefix="/auth")
app.include_router(login.router, prefix="/auth")
app.include_router(profile.router, prefix="/auth")
app.include_router(stats.router)
app.include_router(violations.router)
app.include_router(reports.router)
app.include_router(users.router, prefix="/auth")
app.include_router(cameras.router, prefix="/auth")


@app.get("/")
def read_root():
    return {"message": "KitchenEye API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

////////////////backend/app/router/stats.py
# backend/services/stats_service.py
# backend/app/router/stats.py
import os
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db
from services.stats_service import build_chart_days
from services.violation_categories import map_violation_to_category, normalize_violation_type

router = APIRouter()

# Legacy .txt folder — keep for backward compat
DATA_FOLDER = os.path.join(os.path.dirname(__file__), "..", "..", "app", "data")


def _safe_int(v: Any) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def _summary_payload(user_id: str, raw: dict) -> dict:
    hair_net_count = _safe_int(raw.get("hair_net_count", raw.get("hairnet_count", raw.get("pest_count"))))
    hair_net_change_pct = _safe_int(
        raw.get("hair_net_change_pct", raw.get("hairnet_change_pct", raw.get("pest_change_pct")))
    )
    return {
        "user_id": user_id,
        "last_updated": str(raw.get("last_updated", "")),
        "apron_count": _safe_int(raw.get("apron_count", raw.get("ppe_count"))),
        "fire_count": _safe_int(raw.get("fire_count")),
        "gloves_count": _safe_int(raw.get("gloves_count", raw.get("spill_count"))),
        "hair_net_count": hair_net_count,
        # Compatibility alias for existing frontend keys.
        "hairnet_count": hair_net_count,
        "total_count": _safe_int(raw.get("total_count")),
        "hygiene_score": _safe_int(raw.get("hygiene_score")),
        "apron_change_pct": _safe_int(raw.get("apron_change_pct", raw.get("ppe_change_pct"))),
        "fire_change_pct": _safe_int(raw.get("fire_change_pct")),
        "gloves_change_pct": _safe_int(raw.get("gloves_change_pct", raw.get("spill_change_pct"))),
        "hair_net_change_pct": hair_net_change_pct,
        # Compatibility alias for existing frontend keys.
        "hairnet_change_pct": hair_net_change_pct,
    }


def _normalize_chart_day(day: dict) -> dict:
    hair_net_value = _safe_int(day.get("hair_net", day.get("hairnet", day.get("pest"))))
    return {
        "date": str(day.get("date", "")),
        "apron": _safe_int(day.get("apron", day.get("ppe"))),
        "fire": _safe_int(day.get("fire")),
        "gloves": _safe_int(day.get("gloves", day.get("spill"))),
        "hair_net": hair_net_value,
        # Compatibility alias for existing frontend keys.
        "hairnet": hair_net_value,
    }


def _display_type(raw_type: str) -> str:
    """Map violation_type to display name."""
    normalized = normalize_violation_type(raw_type)
    if normalized == "no_apron":
        return "Apron"
    if normalized == "no_gloves":
        return "Gloves"
    if normalized == "no_hair_net":
        return "Hair Net"
    if normalized == "fire_detected":
        return "Fire"
    return str(normalized).replace("_", " ").title()


def _uid(token: str = Depends(oauth2_scheme)) -> str:
    decoded = verify_token(token, require_verified=True)
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="User ID missing in token")
    return uid


# ── /stats/summary ────────────────────────────────────────────

@router.get("/stats/summary")
async def get_summary(user_id: str = Depends(_uid)):
    """Dashboard stat cards: counts + % changes + hygiene score."""
    doc = db.collection("stats_summary").document(user_id).get()
    if not doc.exists:
        return _empty_summary(user_id)
    return _summary_payload(user_id, doc.to_dict() or {})


def _empty_summary(user_id: str) -> dict:
    return {
        "user_id": user_id, "last_updated": None,
        "apron_count": 0, "fire_count": 0,
        "gloves_count": 0,
        "hair_net_count": 0,
        "hairnet_count": 0,
        "total_count": 0, "hygiene_score": 100,
        "apron_change_pct": 0, "fire_change_pct": 0,
        "gloves_change_pct": 0,
        "hair_net_change_pct": 0,
        "hairnet_change_pct": 0,
    }


# ── /stats/chart ──────────────────────────────────────────────

@router.get("/stats/chart")
async def get_chart(
    days: int = Query(default=7, ge=1, le=30),
    user_id: str = Depends(_uid),
):
    """
    Chart data for last N days (7, 14, or 30).
    Reads from 30-day cached array, slices last N.
    """
    doc = db.collection("violations_chart").document(user_id).get()
    if doc.exists:
        cached = doc.to_dict().get("days", [])
        if len(cached) >= days:
            return {"user_id": user_id, "days": [_normalize_chart_day(day) for day in cached[-days:]]}

    # Cache miss — build from daily docs
    all_days = build_chart_days(user_id=user_id, days=30)
    return {"user_id": user_id, "days": [_normalize_chart_day(day) for day in all_days[-days:]]}


# ── /stats/dashboard ──────────────────────────────────────────

@router.get("/stats/dashboard")
async def get_dashboard(
    days: int = Query(default=7, ge=1, le=30),
    user_id: str = Depends(_uid),
):
    """
    Single endpoint for Dashboard page.
    Returns summary + chart + 10 most recent violations.
    """
    # Summary
    s_doc = db.collection("stats_summary").document(user_id).get()
    summary = _empty_summary(user_id)
    if s_doc.exists:
        summary = _summary_payload(user_id, s_doc.to_dict() or {})

    # Chart
    c_doc = db.collection("violations_chart").document(user_id).get()
    if c_doc.exists:
        cached = c_doc.to_dict().get("days", [])
        chart_raw = cached[-days:] if len(cached) >= days else build_chart_days(user_id, 30)[-days:]
    else:
        chart_raw = build_chart_days(user_id, 30)[-days:]
    chart = [_normalize_chart_day(day) for day in chart_raw]

    # Recent violations (last 10)
    recent = []
    for doc in db.collection("violations").where("user_id", "==", user_id).stream():
        d = doc.to_dict() or {}
        vtype = str(d.get("violation_type", "unknown"))
        normalized = normalize_violation_type(vtype)
        category = map_violation_to_category(vtype)
        violation_id = str(d.get("violation_id") or doc.id)
        snapshot_filename = d.get("snapshot_filename")

        # Calculate severity based on canonical violation type.
        if normalized == "fire_detected":
            severity = "High"
        elif normalized == "no_apron":
            severity = "Medium"
        elif normalized in {"no_gloves", "no_hair_net"}:
            severity = "Low"
        else:
            severity = "Low"  # default for unknown types

        recent.append({
            "id": violation_id,
            "type": _display_type(vtype),
            "description": f"Detected {normalized.replace('_', ' ')}",
            "severity": severity,
            "category": category,
            "location": str(d.get("camera_id", "Unknown")),
            "timestamp": str(d.get("violation_time", d.get("timestamp", ""))),
            "status": "Resolved" if d.get("resolved") else "Pending",
            "has_snapshot": bool(snapshot_filename),
            "snapshot_filename": snapshot_filename,
        })
    recent.sort(key=lambda x: x["timestamp"], reverse=True)

    return {"summary": summary, "chart": chart, "recent_violations": recent[:10]}


# ── Legacy .txt endpoint ──────────────────────────────────────

@router.get("/stats/{filename}")
async def get_stats_file(filename: str, response: Response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    file_path = os.path.normpath(os.path.join(DATA_FOLDER, filename))

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"value": int(content) if content.isdigit() else content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

## backend/app/router/violations.py
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db

router = APIRouter(prefix="/violations", tags=["violations"])
SNAPSHOT_DIR = Path(__file__).resolve().parents[2] / "model" / "saved_snapshots"


class ViolationLogRequest(BaseModel):
    violation_type: str
    camera_location: str
    destination_email: Optional[str] = None
    is_test: bool = True


@router.post("/log")
async def log_violation(
    payload: ViolationLogRequest, token: str = Depends(oauth2_scheme)
):
    """Log a violation for the authenticated user."""
    decoded = verify_token(token, require_verified=True)
    user_email = decoded.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email missing in token")
    try:
        doc = {
            "email": user_email,
            "destination_email": payload.destination_email or user_email,
            "violation_type": payload.violation_type,
            "camera_location": payload.camera_location,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_test": payload.is_test,
            "sent_via": "emailjs",
        }
        db.collection("violations").add(doc)
        return {"message": "Logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user")
async def list_user_violations(
    limit: int = Query(default=100, ge=1, le=1000),
    token: str = Depends(oauth2_scheme),
):
    """Return violations for the authenticated user, newest first."""
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    user_email = decoded.get("email")

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    try:
        items = []
        seen_doc_ids = set()

        # Primary query: by user_id (model-written violations)
        docs = db.collection("violations").where("user_id", "==", user_id).stream()
        for doc in docs:
            seen_doc_ids.add(doc.id)
            data = doc.to_dict() or {}
            data["id"] = str(data.get("violation_id") or doc.id)
            items.append(data)

        # Secondary query: by email (frontend-logged violations)
        if user_email:
            docs2 = db.collection("violations").where("email", "==", user_email).stream()
            for doc in docs2:
                if doc.id not in seen_doc_ids:
                    seen_doc_ids.add(doc.id)
                    data = doc.to_dict() or {}
                    data["id"] = str(data.get("violation_id") or doc.id)
                    items.append(data)

        # Sort newest first
        items.sort(
            key=lambda x: str(x.get("violation_time") or x.get("timestamp") or ""),
            reverse=True,
        )

        return items[:limit]

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{violation_id}/image")
async def get_violation_image(
    violation_id: str,
    token: str = Depends(oauth2_scheme),
):
    """Return snapshot image bytes matched by violation ID/snapshot ID."""
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    user_email = decoded.get("email")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    doc = db.collection("violations").document(violation_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Violation not found")

    payload = doc.to_dict() or {}
    owner_user_id = payload.get("user_id")
    owner_email = payload.get("email")
    if owner_user_id and owner_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if (not owner_user_id) and owner_email and owner_email != user_email:
        raise HTTPException(status_code=403, detail="Forbidden")

    filename = str(payload.get("snapshot_filename") or "")
    if filename:
        exact = SNAPSHOT_DIR / filename
        if exact.exists():
            return FileResponse(str(exact), media_type="image/jpeg", filename=exact.name)

    # Backward fallback for older naming schemes.
    candidates = list(SNAPSHOT_DIR.glob(f"*{violation_id}*.jpg"))
    if candidates:
        return FileResponse(str(candidates[0]), media_type="image/jpeg", filename=candidates[0].name)

    raise HTTPException(status_code=404, detail="Snapshot image not found")
////////////////////backend/services/violation_service.py
# backend/services/violation_service.py
import os
import sys
import uuid
from datetime import datetime, timezone
from firebase_admin import firestore as fs

# Works when run from backend/ (uvicorn app.main:app) or project root.
try:
    from app.database.db import db
except ImportError:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from app.database.db import db

try:
    from services.stats_service import update_stats
except ImportError:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from services.stats_service import update_stats

try:
    from services.violation_categories import normalize_violation_type
except ImportError:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from services.violation_categories import normalize_violation_type


def save_violation(
    user_id: str,
    violation_type: str,
    camera_id: str = None,
    confidence: float = None,
    snapshot_filename: str = None,
) -> dict:
    """
    Writes violation to Firestore then updates all stats collections.
    Snapshot linkage is stored so UI can fetch local evidence image by violation ID.
    """
    violation_id = str(uuid.uuid4())
    normalized_type = normalize_violation_type(violation_type)
    violation_time = datetime.now(timezone.utc).isoformat()
    snapshot_filename = snapshot_filename or f"{violation_id}.jpg"

    doc = {
        "violation_id": violation_id,
        "user_id": user_id,
        "violation_type": normalized_type,
        "violation_time": violation_time,
        "timestamp": fs.SERVER_TIMESTAMP,
        "camera_id": camera_id or "unknown",
        "confidence": confidence,
        "resolved": False,
        "snapshot_id": violation_id,
        "snapshot_filename": snapshot_filename,
    }

    db.collection("violations").document(violation_id).set(doc)
    print(f"[KitchenEye] ✅ Saved: {normalized_type} | user: {user_id} | id: {violation_id}")

    # Update stats — non-blocking, violation save already succeeded
    try:
        update_stats(user_id=user_id, violation_type=normalized_type)
    except Exception as e:
        print(f"[KitchenEye] ⚠️  Stats update failed (violation still saved): {e}")

    return doc
/////////////////////////backend/services/stats_service.py
# backend/services/stats_service.py
# Run from: cd backend && uvicorn app.main:app --reload

from datetime import datetime, timedelta, timezone

from firebase_admin import firestore as fs

from app.database.db import db
from services.violation_categories import (
    CATEGORY_APRON,
    CATEGORY_FIRE,
    CATEGORY_GLOVES,
    CATEGORY_HAIR_NET,
    map_violation_to_category,
)

WEIGHTS = {
    CATEGORY_APRON: 2,
    CATEGORY_FIRE: 5,
    CATEGORY_GLOVES: 1,
    CATEGORY_HAIR_NET: 3,
}


def _normalize_counts(doc: dict) -> dict:
    if not doc:
        doc = {}
    return {
        "apron_count": int(doc.get("apron_count", doc.get("ppe_count", 0)) or 0),
        "fire_count": int(doc.get("fire_count", 0) or 0),
        "gloves_count": int(doc.get("gloves_count", doc.get("spill_count", 0)) or 0),
        "hair_net_count": int(doc.get("hair_net_count", doc.get("hairnet_count", doc.get("pest_count", 0))) or 0
        ),
    }


def _hygiene_score(apron: int, fire: int, gloves: int, hair_net: int) -> int:
    penalty = (
        apron * WEIGHTS[CATEGORY_APRON]
        + fire * WEIGHTS[CATEGORY_FIRE]
        + gloves * WEIGHTS[CATEGORY_GLOVES]
        + hair_net * WEIGHTS[CATEGORY_HAIR_NET]
    )
    return max(0, 100 - penalty)


def _pct_change(today: int, yesterday: int) -> int:
    if yesterday <= 0:
        return 100 if today > 0 else 0
    return round(((today - yesterday) / yesterday) * 100)


def _get_daily(user_id: str, date_str: str) -> dict:
    doc = db.collection("stats_daily").document(f"{user_id}_{date_str}").get()
    if doc.exists:
        return _normalize_counts(doc.to_dict())
    return {"apron_count": 0, "fire_count": 0, "gloves_count": 0, "hair_net_count": 0}


def update_stats(user_id: str, violation_type: str):
    """
    Called after every violation write.
    Updates: stats_daily, stats_summary, violations_chart.
    """
    today = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    category = map_violation_to_category(violation_type)

    if not category:
        return

    daily_id = f"{user_id}_{today}"
    daily_ref = db.collection("stats_daily").document(daily_id)
    snap = daily_ref.get()

    data = (
        snap.to_dict()
        if snap.exists
        else {
            "user_id": user_id,
            "date": today,
            "apron_count": 0,
            "fire_count": 0,
            "gloves_count": 0,
            "hair_net_count": 0,
            "total_count": 0,
            "hygiene_score": 100,
        }
    )

    counts = _normalize_counts(data)
    data["apron_count"] = counts["apron_count"]
    data["fire_count"] = counts["fire_count"]
    data["gloves_count"] = counts["gloves_count"]
    data["hair_net_count"] = counts["hair_net_count"]

    data[f"{category}_count"] = data.get(f"{category}_count", 0) + 1
    data["total_count"] = (
        data["apron_count"]
        + data["fire_count"]
        + data["gloves_count"]
        + data["hair_net_count"]
    )
    data["hygiene_score"] = _hygiene_score(
        data["apron_count"],
        data["fire_count"],
        data["gloves_count"],
        data["hair_net_count"],
    )
    daily_ref.set(data)

    yd = _get_daily(user_id, yesterday)
    summary = {
        "user_id": user_id,
        "last_updated": fs.SERVER_TIMESTAMP,
        "apron_count": data["apron_count"],
        "fire_count": data["fire_count"],
        "gloves_count": data["gloves_count"],
        "hair_net_count": data["hair_net_count"],
        "total_count": data["total_count"],
        "hygiene_score": data["hygiene_score"],
        "apron_change_pct": _pct_change(data["apron_count"], yd["apron_count"]),
        "fire_change_pct": _pct_change(data["fire_count"], yd["fire_count"]),
        "gloves_change_pct": _pct_change(data["gloves_count"], yd["gloves_count"]),
        "hair_net_change_pct": _pct_change(data["hair_net_count"], yd["hair_net_count"]),
    }
    db.collection("stats_summary").document(user_id).set(summary)

    chart_days = build_chart_days(user_id=user_id, days=30)
    db.collection("violations_chart").document(user_id).set(
        {
            "user_id": user_id,
            "last_updated": fs.SERVER_TIMESTAMP,
            "days": chart_days,
        }
    )


def build_chart_days(user_id: str, days: int = 30) -> list:
    """
    Returns list of {date, apron, fire, gloves, hair_net} for last N days.
    Missing days are zero-filled so chart always has exactly N points.
    """
    today = datetime.now(timezone.utc).date()
    result = []
    for i in range(days - 1, -1, -1):
        date_str = (today - timedelta(days=i)).isoformat()
        d = _get_daily(user_id, date_str)
        result.append(
            {
                "date": date_str,
                "apron": d.get("apron_count", 0),
                "fire": d.get("fire_count", 0),
                "gloves": d.get("gloves_count", 0),
                "hair_net": d.get("hair_net_count", 0),
            }
        )
    return result
/////////////backend/model/snapshot.py
# backend/model/snapshot.py
# Run from PROJECT ROOT: python backend/model/snapshot.py
# (snapshot runs standalone — different from uvicorn which runs from backend/)

import os
import sys
from dotenv import load_dotenv

# ── Bootstrap: add backend/ to path so imports work ───────────
_backend_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Load backend/.env
_env_path = os.path.join(_backend_dir, ".env")
load_dotenv(_env_path)

# ── Standard imports ──────────────────────────────────────────
from ultralytics import YOLO
import cv2
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# ── KitchenEye services (imported as if running from backend/) ─
from services.violation_service import save_violation
from services.dedup_service import should_save_violation, reset_state
from services.violation_categories import normalize_violation_type

# ============================================================
# CONFIGURATION — fill in before running
# ============================================================

MODEL_PATH  = r"D:\sem 7\FYP\Frontend\backend\model\best (6).pt"
VIDEO_PATH  = r"D:\sem 7\FYP\Frontend\backend\model\CHEFS WORKING _BUSY KITCHEN_ Over 3000 Meals A Week _Chef Life _Gopro(720P_60FPS).mp4"

# Firebase Auth UID of the user who owns this camera
# Firebase Console → Authentication → Users → copy User UID
USER_ID     = "nTZMtubSmmTjJuZqNKTMnIeMDes2"

# Camera document ID from Firestore cameras collection
CAMERA_ID   = "EZYuxqna15bB5dVtz4to"

CONFIDENCE          = 0.3
VIDEO_START_SEC     = None   # None = beginning
VIDEO_END_SEC       = None   # None = end
IOU_THRESHOLD       = 0.3
MIN_FIRE_AREA_RATIO = 0.35
SNAPSHOT_RESIZE     = 0.4
SNAPSHOT_QUALITY    = 20
SNAPSHOT_CROP_ONLY  = False
SAVE_SNAPSHOTS      = True

SNAPSHOT_DIR = Path(os.path.join(os.path.dirname(__file__), "saved_snapshots"))
SNAPSHOT_DIR.mkdir(exist_ok=True)

VIOLATION_CLASSES = {
    "no_apron":   "Apron Violation",
    "no_gloves":  "Gloves Violation",
    "no_hairnet": "Hair Net Violation",
    "no_hair_net": "Hair Net Violation",
    "fire":       "Fire Alert",
    "fire_detected": "Fire Alert",
}
COMPLIANT_CLASSES = ["apron", "gloves", "hairnet"]

# ── Load model ─────────────────────────────────────────────────
print(f"[KitchenEye] Loading model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# ── IoU helpers ────────────────────────────────────────────────

def calculate_iou(box1, box2):
    x1 = max(box1[0], box2[0]); y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2]); y2 = min(box1[3], box2[3])
    if x2 < x1 or y2 < y1:
        return 0.0
    inter = (x2 - x1) * (y2 - y1)
    a1 = (box1[2]-box1[0]) * (box1[3]-box1[1])
    a2 = (box2[2]-box2[0]) * (box2[3]-box2[1])
    return inter / (a1 + a2 - inter) if (a1 + a2 - inter) > 0 else 0.0

def get_box_coords(box):
    return box.xyxy[0].cpu().numpy()

# ── Conflict resolution ────────────────────────────────────────

def resolve_ppe_conflicts_multi_person(detections):
    groups = {"apron": [], "gloves": [], "hairnet": []}
    others = []
    for cls, conf, box, tid in detections:
        if cls in ("apron", "no_apron"):       groups["apron"].append((cls, conf, box, tid))
        elif cls in ("gloves", "no_gloves"):   groups["gloves"].append((cls, conf, box, tid))
        elif cls in ("hairnet", "no_hairnet", "no_hair_net"): groups["hairnet"].append((cls, conf, box, tid))
        else:                                  others.append((cls, conf, box, tid))

    resolved = []
    for dets in groups.values():
        if not dets:
            continue
        if len(dets) == 1:
            resolved.append(dets[0]); continue
        used = [False] * len(dets)
        for i in range(len(dets)):
            if used[i]: continue
            grp = [i]
            bi = get_box_coords(dets[i][2])
            for j in range(i+1, len(dets)):
                if not used[j] and calculate_iou(bi, get_box_coords(dets[j][2])) > IOU_THRESHOLD:
                    grp.append(j); used[j] = True
            used[i] = True
            resolved.append(max([dets[k] for k in grp], key=lambda x: x[1]))
    resolved.extend(others)
    return resolved

# ── Main ───────────────────────────────────────────────────────

def process_video():
    if USER_ID in ("CHANGE_TO_REAL_FIREBASE_UID", "", None):
        print("❌ Set USER_ID in CONFIGURATION before running.")
        print("   Firebase Console → Authentication → Users → copy UID")
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
        print(f"❌ Cannot open: {VIDEO_PATH}"); return

    fps          = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration     = total_frames / fps

    start_frame = int(VIDEO_START_SEC * fps) if VIDEO_START_SEC else 0
    end_frame   = int(VIDEO_END_SEC * fps)   if VIDEO_END_SEC   else total_frames
    start_frame = max(0, min(start_frame, total_frames))
    end_frame   = max(start_frame, min(end_frame, total_frames))

    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    print(f"[KitchenEye] Video: {VIDEO_PATH}")
    print(f"[KitchenEye] Duration: {duration:.1f}s | FPS: {fps}")
    print(f"[KitchenEye] User: {USER_ID} | Camera: {CAMERA_ID}")
    print("=" * 60)

    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        frame_count += 1
        if start_frame + frame_count > end_frame: break

        results = model.track(frame, conf=CONFIDENCE, iou=0.5, persist=True, verbose=False)

        detections = []
        for result in results:
            if result.boxes.id is None: continue
            for i, box in enumerate(result.boxes):
                detections.append((
                    model.names[int(box.cls[0])],
                    float(box.conf[0]),
                    box,
                    int(result.boxes.id[i]),
                ))

        resolved = resolve_ppe_conflicts_multi_person(detections)

        for cls, conf, box, tid in resolved:
            key = f"{cls}_{tid}"
            canonical_type = normalize_violation_type(cls)

            if cls in VIOLATION_CLASSES and key not in counted_violations:
                # Fire size check
                if canonical_type == "fire_detected":
                    c = get_box_coords(box)
                    ratio = ((c[2]-c[0])*(c[3]-c[1])) / (frame.shape[0]*frame.shape[1])
                    fire_max_area[tid] = max(fire_max_area.get(tid, 0), ratio)
                    if ratio < MIN_FIRE_AREA_RATIO:
                        if tid not in ignored_fires:
                            ignored_fires.add(tid)
                        continue
                    elif tid in ignored_fires:
                        ignored_fires.discard(tid)

                counted_violations.add(key)
                violation_counts[canonical_type] += 1
                total_violations += 1
                print(f"🚨 [{frame_count}] {VIOLATION_CLASSES[cls]} | ID:{tid} | conf:{conf:.2f}")

                # Save to Firestore (dedup gate)
                saved = None
                can_save = should_save_violation(key)
                if can_save:
                    saved = save_violation(
                        user_id=USER_ID,
                        violation_type=canonical_type,
                        camera_id=CAMERA_ID,
                        confidence=round(conf, 3),
                    )

                # Save snapshot locally
                if SAVE_SNAPSHOTS and can_save:
                    ann = results[0].plot()
                    if SNAPSHOT_RESIZE < 1.0:
                        ann = cv2.resize(ann, (
                            int(ann.shape[1]*SNAPSHOT_RESIZE),
                            int(ann.shape[0]*SNAPSHOT_RESIZE),
                        ))
                    filename = saved.get("snapshot_filename") if isinstance(saved, dict) else None
                    if not filename:
                        filename = f"{saved.get('violation_id')}.jpg" if isinstance(saved, dict) else f"{cls}_ID{tid}_{datetime.now().strftime('%H%M%S')}.jpg"
                    cv2.imwrite(
                        str(SNAPSHOT_DIR / filename),
                        ann,
                        [cv2.IMWRITE_JPEG_QUALITY, SNAPSHOT_QUALITY],
                    )

            elif cls in COMPLIANT_CLASSES and key not in counted_compliant:
                counted_compliant.add(key)

        if frame_count % 100 == 0:
            seg = end_frame - start_frame
            print(f"Progress: {frame_count}/{seg} ({frame_count/seg*100:.1f}%)")

    cap.release()
    cv2.destroyAllWindows()

    print("\n" + "=" * 60)
    print("📊 FINAL SUMMARY")
    for v in ["no_apron", "no_gloves", "no_hair_net", "fire_detected"]:
        if violation_counts[v]:
            print(f"   {v}: {violation_counts[v]}")
    print(f"\n📈 TOTAL: {total_violations}")
    print(f"📁 Snapshots: {SNAPSHOT_DIR}/")


if __name__ == "__main__":
    process_video()
////////////////////backend/app/database/db.py
# backend/app/database/db.py
# Works when run as: cd backend && uvicorn app.main:app --reload

import os
from pathlib import Path

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, firestore

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ENV_PATH = _BACKEND_DIR / ".env"
_CREDENTIALS_DIR = _BACKEND_DIR / "app" / "credentials"


def _load_env_file() -> None:
    # Skip loading if .env is a directory (common accidental setup issue).
    if _ENV_PATH.is_file():
        load_dotenv(_ENV_PATH)


def _resolve_cred_path() -> Path:
    env_cred = os.getenv("FIREBASE_CREDENTIALS", "").strip()
    candidates = []

    if env_cred:
        env_path = Path(env_cred)
        candidates.extend(
            [
                env_path,
                Path.cwd() / env_path,
                _BACKEND_DIR / env_path,
            ]
        )

    # Safe fallback for local dev if env var is missing or invalid.
    candidates.extend(sorted(_CREDENTIALS_DIR.glob("*.json")))

    seen = set()
    for candidate in candidates:
        resolved = candidate.resolve()
        if str(resolved) in seen:
            continue
        seen.add(str(resolved))
        if resolved.exists() and resolved.is_file():
            return resolved

    raise RuntimeError(
        "Firebase credentials not found. Configure FIREBASE_CREDENTIALS with a valid "
        "path, for example FIREBASE_CREDENTIALS=app/credentials/your-key.json"
    )


_load_env_file()

if not firebase_admin._apps:
    cred_path = _resolve_cred_path()
    firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))

db = firestore.client()
