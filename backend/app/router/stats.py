from fastapi import APIRouter, Depends, HTTPException, Query
from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db
from services.stats_service import (
    build_chart_days,
    build_summary_for_days,
    empty_summary,
    summary_payload,
)
from services.violation_service import is_violation_today

router = APIRouter()

VIOLATION_DISPLAY = {
    "no_apron":   "Apron",
    "no_gloves":  "Gloves",
    "no_hairnet": "Hairnet",
    "fire":       "Fire",
}

VIOLATION_SEVERITY = {
    "no_apron":   "Medium",
    "no_gloves":  "Low",
    "no_hairnet": "Low",
    "fire":       "High",
}


def _uid(token: str = Depends(oauth2_scheme)) -> str:
    decoded = verify_token(token, require_verified=True)
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="User ID missing in token")
    return uid


def _chart_day(day: dict) -> dict:
    def si(v):
        try: return int(v)
        except: return 0
    return {
        "date":    str(day.get("date", "")),
        "apron":   si(day.get("apron")),
        "gloves":  si(day.get("gloves")),
        "hairnet": si(day.get("hairnet")),
        "fire":    si(day.get("fire")),
    }


@router.get("/stats/summary")
async def get_summary(user_id: str = Depends(_uid)):
    doc = db.collection("stats_summary").document(user_id).get()
    if not doc.exists:
        return empty_summary(user_id)
    return summary_payload(user_id, doc.to_dict() or {})


@router.get("/stats/chart")
async def get_chart(
    days: int = Query(default=7, ge=1, le=30),
    user_id: str = Depends(_uid),
):
    doc = db.collection("violations_chart").document(user_id).get()
    if doc.exists:
        cached = doc.to_dict().get("days", [])
        if len(cached) >= days:
            return {"user_id": user_id, "days": [_chart_day(d) for d in cached[-days:]]}
    all_days = build_chart_days(user_id=user_id, days=30)
    return {"user_id": user_id, "days": [_chart_day(d) for d in all_days[-days:]]}


@router.get("/stats/dashboard")
async def get_dashboard(
    days: int = Query(default=7, ge=1, le=30),
    user_id: str = Depends(_uid),
):
    # Summary for selected range
    summary = build_summary_for_days(user_id, days)

    # Chart
    c_doc = db.collection("violations_chart").document(user_id).get()
    if c_doc.exists:
        cached = c_doc.to_dict().get("days", [])
        chart_raw = cached[-days:] if len(cached) >= days else build_chart_days(user_id, 30)[-days:]
    else:
        chart_raw = build_chart_days(user_id, 30)[-days:]
    chart = [_chart_day(d) for d in chart_raw]

    # Recent violations — last 10, with snapshot URL hint
    recent = []
    for doc in db.collection("violations").where("user_id", "==", user_id).stream():
        d = doc.to_dict() or {}
        if not is_violation_today(d.get("violation_time")):
            continue
        vtype = str(d.get("violation_type", "unknown"))
        violation_id = str(d.get("violation_id") or doc.id)
        has_snapshot = bool(d.get("snapshot_filename"))
        recent.append({
            "id":            violation_id,
            "type":          VIOLATION_DISPLAY.get(vtype, vtype.replace("_", " ").title()),
            "violation_type": vtype,
            "severity":      VIOLATION_SEVERITY.get(vtype, "Low"),
            "location":      str(d.get("camera_id", "Unknown")),
            "timestamp":     str(d.get("violation_time", d.get("timestamp", ""))),
            "status":        "Resolved" if d.get("resolved") else "Pending",
            "has_snapshot":  has_snapshot,
            # Frontend uses this to build: GET /violations/{violation_id}/image
            "snapshot_url":  f"/violations/{violation_id}/image" if has_snapshot else None,
        })

    recent.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"summary": summary, "chart": chart, "recent_violations": recent[:10]}