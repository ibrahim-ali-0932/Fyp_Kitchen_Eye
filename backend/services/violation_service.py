# backend/services/violation_service.py
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore as fs

try:
    from app.database.db import db
except ImportError:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from app.database.db import db

try:
    from services.stats_service import update_stats
except ImportError:
    from stats_service import update_stats

# Canonical violation types accepted
VALID_TYPES = {"no_apron", "no_gloves", "no_hairnet", "fire"}

# Map any model variant to canonical type
TYPE_MAP = {
    "no_apron":      "no_apron",
    "no_gloves":     "no_gloves",
    "no_hairnet":    "no_hairnet",
    "no_hair_net":   "no_hairnet",
    "fire":          "fire",
    "fire_detected": "fire",
}


def normalize_type(raw: str) -> str:
    return TYPE_MAP.get(str(raw).lower().strip(), raw)


def utc_day_bounds(moment: datetime | None = None) -> tuple[datetime, datetime]:
    current = moment or datetime.now(timezone.utc)
    start = current.astimezone(timezone.utc).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    end = start + timedelta(days=1)
    return start, end


def utc_recent_bounds(days: int, moment: datetime | None = None) -> tuple[datetime, datetime]:
    current = moment or datetime.now(timezone.utc)
    days = max(1, int(days or 1))
    end = current.astimezone(timezone.utc).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    ) + timedelta(days=1)
    start = end - timedelta(days=days)
    return start, end


def parse_violation_time(value) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value))
    except Exception:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def is_violation_today(value, moment: datetime | None = None) -> bool:
    parsed = parse_violation_time(value)
    if not parsed:
        return False
    start, end = utc_day_bounds(moment)
    return start <= parsed < end


def is_violation_in_recent_days(value, days: int, moment: datetime | None = None) -> bool:
    parsed = parse_violation_time(value)
    if not parsed:
        return False
    start, end = utc_recent_bounds(days, moment)
    return start <= parsed < end


def save_violation(
    user_id: str,
    violation_type: str,
    camera_id: str = None,
    confidence: float = None,
) -> dict:
    """
    Writes one violation to Firestore.
    Snapshot filename = {violation_id}.jpg — saved by snapshot.py after this returns.
    """
    violation_id = str(uuid.uuid4())
    canonical_type = normalize_type(violation_type)
    violation_time = datetime.now(timezone.utc).isoformat()
    snapshot_filename = f"{violation_id}.jpg"

    doc = {
        "violation_id":      violation_id,
        "user_id":           user_id,
        "violation_type":    canonical_type,
        "violation_time":    violation_time,
        "timestamp":         fs.SERVER_TIMESTAMP,
        "camera_id":         camera_id or "unknown",
        "confidence":        confidence,
        "resolved":          False,
        "snapshot_filename": snapshot_filename,
    }

    db.collection("violations").document(violation_id).set(doc)
    print(f"[KitchenEye] ✅ Saved: {canonical_type} | user: {user_id} | id: {violation_id}")

    try:
        update_stats(user_id=user_id, violation_type=canonical_type)
    except Exception as e:
        print(f"[KitchenEye] ⚠️  Stats update failed (violation still saved): {e}")

    return doc