# backend/services/stats_service.py
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore as fs
from app.database.db import db

# Category names (match Firestore field names)
CATEGORY_APRON   = "apron"
CATEGORY_GLOVES  = "gloves"
CATEGORY_HAIRNET = "hairnet"
CATEGORY_FIRE    = "fire"

# Violation type → category
TYPE_TO_CATEGORY = {
    "no_apron":   CATEGORY_APRON,
    "no_gloves":  CATEGORY_GLOVES,
    "no_hairnet": CATEGORY_HAIRNET,
    "fire":       CATEGORY_FIRE,
}

# Hygiene score penalty weights
WEIGHTS = {
    CATEGORY_APRON:   2,
    CATEGORY_GLOVES:  1,
    CATEGORY_HAIRNET: 3,
    CATEGORY_FIRE:    5,
}


def _map_category(violation_type: str) -> str | None:
    return TYPE_TO_CATEGORY.get(str(violation_type).lower().strip())


def _hygiene_score(apron: int, gloves: int, hairnet: int, fire: int) -> int:
    penalty = (
        apron   * WEIGHTS[CATEGORY_APRON]
        + gloves  * WEIGHTS[CATEGORY_GLOVES]
        + hairnet * WEIGHTS[CATEGORY_HAIRNET]
        + fire    * WEIGHTS[CATEGORY_FIRE]
    )
    return max(0, 100 - penalty)


def _pct_change(today: int, yesterday: int) -> int:
    if yesterday <= 0:
        return 100 if today > 0 else 0
    return round(((today - yesterday) / yesterday) * 100)


def _get_daily(user_id: str, date_str: str) -> dict:
    doc = db.collection("stats_daily").document(f"{user_id}_{date_str}").get()
    if doc.exists:
        d = doc.to_dict() or {}
        return {
            "apron_count":   int(d.get("apron_count",   0) or 0),
            "gloves_count":  int(d.get("gloves_count",  0) or 0),
            "hairnet_count": int(d.get("hairnet_count", 0) or 0),
            "fire_count":    int(d.get("fire_count",    0) or 0),
        }
    return {"apron_count": 0, "gloves_count": 0, "hairnet_count": 0, "fire_count": 0}


def update_stats(user_id: str, violation_type: str):
    """Called after every violation write. Updates stats_daily, stats_summary, violations_chart."""
    today     = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    category  = _map_category(violation_type)

    if not category:
        print(f"[stats] Unknown violation type: {violation_type} — skipping stats")
        return

    daily_id  = f"{user_id}_{today}"
    daily_ref = db.collection("stats_daily").document(daily_id)
    snap      = daily_ref.get()

    data = snap.to_dict() if snap.exists else {
        "user_id":       user_id,
        "date":          today,
        "apron_count":   0,
        "gloves_count":  0,
        "hairnet_count": 0,
        "fire_count":    0,
        "total_count":   0,
        "hygiene_score": 100,
    }

    # Ensure int fields
    for f in ("apron_count", "gloves_count", "hairnet_count", "fire_count", "total_count"):
        data[f] = int(data.get(f, 0) or 0)

    # Increment the right counter
    data[f"{category}_count"] += 1
    data["total_count"] = (
        data["apron_count"] + data["gloves_count"]
        + data["hairnet_count"] + data["fire_count"]
    )
    data["hygiene_score"] = _hygiene_score(
        data["apron_count"], data["gloves_count"],
        data["hairnet_count"], data["fire_count"],
    )
    daily_ref.set(data)

    # Summary (today vs yesterday)
    yd = _get_daily(user_id, yesterday)
    summary = {
        "user_id":           user_id,
        "last_updated":      fs.SERVER_TIMESTAMP,
        "apron_count":       data["apron_count"],
        "gloves_count":      data["gloves_count"],
        "hairnet_count":     data["hairnet_count"],
        "fire_count":        data["fire_count"],
        "total_count":       data["total_count"],
        "hygiene_score":     data["hygiene_score"],
        "apron_change_pct":   _pct_change(data["apron_count"],   yd["apron_count"]),
        "gloves_change_pct":  _pct_change(data["gloves_count"],  yd["gloves_count"]),
        "hairnet_change_pct": _pct_change(data["hairnet_count"], yd["hairnet_count"]),
        "fire_change_pct":    _pct_change(data["fire_count"],    yd["fire_count"]),
    }
    db.collection("stats_summary").document(user_id).set(summary)

    # Chart cache
    chart_days = build_chart_days(user_id=user_id, days=30)
    db.collection("violations_chart").document(user_id).set({
        "user_id":      user_id,
        "last_updated": fs.SERVER_TIMESTAMP,
        "days":         chart_days,
    })


def build_chart_days(user_id: str, days: int = 30) -> list:
    """Returns [{date, apron, gloves, hairnet, fire}] for last N days. Missing days zero-filled."""
    today = datetime.now(timezone.utc).date()
    result = []
    for i in range(days - 1, -1, -1):
        date_str = (today - timedelta(days=i)).isoformat()
        d = _get_daily(user_id, date_str)
        result.append({
            "date":    date_str,
            "apron":   d["apron_count"],
            "gloves":  d["gloves_count"],
            "hairnet": d["hairnet_count"],
            "fire":    d["fire_count"],
        })
    return result