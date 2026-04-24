from pathlib import Path
from datetime import date, datetime, time, timezone
from firebase_admin import firestore as fs
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db
from services.violation_service import is_violation_today
from services.violation_categories import map_violation_to_category, normalize_violation_type

router = APIRouter(prefix="/violations", tags=["violations"])

SNAPSHOT_DIR = Path(__file__).resolve().parents[2] / "model" / "saved_snapshots"


def _uid_and_email(token: str = Depends(oauth2_scheme)) -> tuple:
    decoded = verify_token(token, require_verified=True)
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="User ID missing in token")
    return uid, decoded.get("email")


def _build_violation_payload(doc, d: dict) -> dict:
    vtype = str(d.get("violation_type", "unknown"))
    violation_id = str(d.get("violation_id") or doc.id)
    has_snapshot = bool(d.get("snapshot_filename"))
    return {
        "id": violation_id,
        "violation_type": vtype,
        "camera_id": d.get("camera_id", "Unknown"),
        "camera_location": d.get("camera_location"),
        "violation_time": str(d.get("violation_time", "")),
        "confidence": d.get("confidence"),
        "resolved": d.get("resolved", False),
        "has_snapshot": has_snapshot,
        "snapshot_url": f"/violations/{violation_id}/image" if has_snapshot else None,
    }


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _parse_date(value: str | None, field_name: str) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}. Use YYYY-MM-DD.")


def _parse_time(value: str | None, field_name: str) -> time | None:
    if value is None:
        return None
    try:
        return time.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}. Use HH:MM or HH:MM:SS.")


def _normalize_category(value: str) -> str:
    normalized = str(value or "").strip().lower().replace("-", "_")
    if normalized == "hairnet":
        return "hair_net"
    return normalized


def _severity_from_type(violation_type: str) -> str:
    normalized = normalize_violation_type(violation_type)
    if normalized == "no_apron":
        return "medium"
    if normalized == "fire_detected" or normalized == "fire":
        return "high"
    return "low"


def _matches_search(payload: dict, search_text: str | None) -> bool:
    if not search_text:
        return True
    needle = search_text.strip().lower()
    if not needle:
        return True
    fields = [
        str(payload.get("id", "")),
        str(payload.get("violation_type", "")),
        str(payload.get("camera_id", "")),
        str(payload.get("camera_location", "")),
    ]
    haystack = " ".join(fields).lower()
    return needle in haystack


def _list_user_violations(
    user_id: str,
    limit: int,
    today_only: bool = False,
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> list[dict]:
    normalized_category = _normalize_category(category) if category else None
    normalized_status = status.lower() if status else None
    normalized_severity = severity.lower() if severity else None

    items = []
    for doc in db.collection("violations").where("user_id", "==", user_id).stream():
        d = doc.to_dict() or {}
        raw_timestamp = d.get("violation_time") or d.get("timestamp")
        occurred_at = _parse_timestamp(raw_timestamp)

        if today_only and not is_violation_today(raw_timestamp):
            continue
        if start_at or end_at:
            if not occurred_at:
                continue
            if start_at and occurred_at < start_at:
                continue
            if end_at and occurred_at > end_at:
                continue

        payload = _build_violation_payload(doc, d)
        normalized_type = normalize_violation_type(payload.get("violation_type", ""))
        mapped_category = map_violation_to_category(normalized_type) or "unknown"

        if normalized_category and mapped_category != normalized_category:
            continue
        if normalized_status == "resolved" and not bool(payload.get("resolved")):
            continue
        if normalized_status == "pending" and bool(payload.get("resolved")):
            continue
        if normalized_severity and _severity_from_type(normalized_type) != normalized_severity:
            continue
        if not _matches_search(payload, search):
            continue

        items.append(payload)

    items.sort(key=lambda x: _parse_timestamp(x.get("violation_time")) or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return items[:limit]


@router.get("/user")
async def list_user_violations(
    limit: int = Query(default=100, ge=1, le=1000),
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    start_time: str | None = Query(default=None),
    end_time: str | None = Query(default=None),
    token: str = Depends(oauth2_scheme),
):
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    if status and status.lower() not in {"pending", "resolved"}:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'pending' or 'resolved'.")
    if severity and severity.lower() not in {"low", "medium", "high", "critical"}:
        raise HTTPException(status_code=400, detail="Invalid severity. Use low, medium, high, or critical.")
    if start_time and not start_date:
        raise HTTPException(status_code=400, detail="start_time requires start_date.")
    if end_time and not end_date:
        raise HTTPException(status_code=400, detail="end_time requires end_date.")

    start_date_value = _parse_date(start_date, "start_date")
    end_date_value = _parse_date(end_date, "end_date")
    start_time_value = _parse_time(start_time, "start_time")
    end_time_value = _parse_time(end_time, "end_time")

    start_at = None
    end_at = None

    if start_date_value:
        start_at = datetime.combine(start_date_value, start_time_value or time.min).replace(tzinfo=timezone.utc)
    if end_date_value:
        end_at = datetime.combine(end_date_value, end_time_value or time.max).replace(tzinfo=timezone.utc)
    if start_at and end_at and end_at < start_at:
        raise HTTPException(status_code=400, detail="end_date/end_time must be on or after start_date/start_time.")

    try:
        return _list_user_violations(
            user_id=user_id,
            limit=limit,
            today_only=False,
            search=search,
            category=category,
            status=status,
            severity=severity,
            start_at=start_at,
            end_at=end_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/today")
async def list_today_violations(
    limit: int = Query(default=100, ge=1, le=1000),
    token: str = Depends(oauth2_scheme),
):
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    try:
        return _list_user_violations(user_id, limit, today_only=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/reset")
async def reset_notifications(token: str = Depends(oauth2_scheme)):
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    try:
        db.collection("stats_summary").document(user_id).set(
            {
                "user_id": user_id,
                "notification_count": 0,
                "notifications_last_reset": fs.SERVER_TIMESTAMP,
            },
            merge=True,
        )
        return {"message": "Notifications reset.", "notification_count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{violation_id}/image")
async def get_violation_image(
    violation_id: str,
    token: str = Depends(oauth2_scheme),
):
    print(f"[violations.image] request received for violation_id={violation_id}")
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    # Auth check — verify this violation belongs to the user
    print(f"[violations.image] authenticated user_id={user_id}")
    doc = db.collection("violations").document(violation_id).get()
    if not doc.exists:
        print(f"[violations.image] no Firestore doc found for id={violation_id}")
        raise HTTPException(status_code=404, detail="Violation not found")

    payload = doc.to_dict() or {}
    print(f"[violations.image] Firestore payload keys={list(payload.keys())}")
    if payload.get("user_id") != user_id:
        print(
            f"[violations.image] forbidden: payload.user_id={payload.get('user_id')} does not match auth user_id={user_id}"
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    # Match: snapshot_filename stored in Firestore (always {violation_id}.jpg)
    filename = str(payload.get("snapshot_filename") or f"{violation_id}.jpg")
    image_path = SNAPSHOT_DIR / filename
    print(f"[violations.image] snapshot_dir={SNAPSHOT_DIR}")
    print(f"[violations.image] trying exact path={image_path}")

    if image_path.exists():
        print(f"[violations.image] exact match found -> {image_path}")
        return FileResponse(str(image_path), media_type="image/jpeg", filename=filename)

    wildcard_matches = []
    for ext in ["jpg", "jpeg", "png"]:
        wildcard_matches.extend(SNAPSHOT_DIR.glob(f"*{violation_id}*.{ext}"))
    print(f"[violations.image] exact missing; wildcard matches={len(wildcard_matches)}")
    for match in wildcard_matches:
        print(f"[violations.image] wildcard candidate={match}")
        if match.exists():
            print(f"[violations.image] wildcard match found -> {match}")
            return FileResponse(str(match), media_type="image/jpeg", filename=match.name)

    print(f"[violations.image] no image found for violation_id={violation_id}")
    raise HTTPException(status_code=404, detail="Snapshot not found")
    print(f"[DEBUG] SNAPSHOT_DIR absolute = {SNAPSHOT_DIR.resolve()}")
    print(f"[DEBUG] Exists? {SNAPSHOT_DIR.exists()}")
