from fastapi import APIRouter, Depends, HTTPException, Query
from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db
from services.stats_service import build_chart_days

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


def _empty_summary(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "last_updated": None,
        "apron_count": 0,
        "gloves_count": 0,
        "hairnet_count": 0,
        "fire_count": 0,
        "total_count": 0,
        "hygiene_score": 100,
        "apron_change_pct": 0,
        "gloves_change_pct": 0,
        "hairnet_change_pct": 0,
        "fire_change_pct": 0,
    }


def _summary_payload(user_id: str, raw: dict) -> dict:
    def si(v): 
        try: return int(v)
        except: return 0
    return {
        "user_id": user_id,
        "last_updated": str(raw.get("last_updated", "")),
        "apron_count":        si(raw.get("apron_count")),
        "gloves_count":       si(raw.get("gloves_count")),
        "hairnet_count":      si(raw.get("hairnet_count")),
        "fire_count":         si(raw.get("fire_count")),
        "total_count":        si(raw.get("total_count")),
        "hygiene_score":      si(raw.get("hygiene_score", 100)),
        "apron_change_pct":   si(raw.get("apron_change_pct")),
        "gloves_change_pct":  si(raw.get("gloves_change_pct")),
        "hairnet_change_pct": si(raw.get("hairnet_change_pct")),
        "fire_change_pct":    si(raw.get("fire_change_pct")),
    }


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
        return _empty_summary(user_id)
    return _summary_payload(user_id, doc.to_dict() or {})


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
    chart = [_chart_day(d) for d in chart_raw]

    # Recent violations — last 10, with snapshot URL hint
    recent = []
    for doc in db.collection("violations").where("user_id", "==", user_id).stream():
        d = doc.to_dict() or {}
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