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


def _aggregate_days(user_id: str, date_strings: list[str]) -> dict:
    totals = {
        "apron_count": 0,
        "gloves_count": 0,
        "hairnet_count": 0,
        "fire_count": 0,
    }

    for date_str in date_strings:
        daily = _get_daily(user_id, date_str)
        totals["apron_count"] += int(daily.get("apron_count", 0) or 0)
        totals["gloves_count"] += int(daily.get("gloves_count", 0) or 0)
        totals["hairnet_count"] += int(daily.get("hairnet_count", 0) or 0)
        totals["fire_count"] += int(daily.get("fire_count", 0) or 0)

    totals["total_count"] = (
        totals["apron_count"]
        + totals["gloves_count"]
        + totals["hairnet_count"]
        + totals["fire_count"]
    )
    totals["hygiene_score"] = _hygiene_score(
        totals["apron_count"],
        totals["gloves_count"],
        totals["hairnet_count"],
        totals["fire_count"],
    )
    return totals


def _date_strings_for_range(days: int, offset_days: int = 0) -> list[str]:
    today = datetime.now(timezone.utc).date()
    days = max(1, int(days or 1))
    result = []
    for i in range(days - 1, -1, -1):
        result.append((today - timedelta(days=i + offset_days)).isoformat())
    return result


def _parse_violation_datetime(raw_value) -> datetime | None:
    if raw_value is None:
        return None

    text = str(raw_value).strip().replace("Z", "+00:00")
    if not text:
        return None

    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _violation_docs_for_user(user_id: str, camera_ids: list[str] | None = None) -> list[dict]:
    docs = [d.to_dict() or {} for d in db.collection("violations").where("user_id", "==", user_id).stream()]

    if camera_ids is not None:
        if len(camera_ids) == 0:
            return []
        camera_id_set = set(camera_ids)
        docs = [d for d in docs if str(d.get("camera_id") or "") in camera_id_set]

    return docs


def _aggregate_violations_for_dates(
    user_id: str,
    date_strings: list[str],
    camera_ids: list[str] | None,
) -> dict:
    targets = set(date_strings)
    totals = {
        "apron_count": 0,
        "gloves_count": 0,
        "hairnet_count": 0,
        "fire_count": 0,
    }

    for row in _violation_docs_for_user(user_id, camera_ids):
        occurred_at = _parse_violation_datetime(row.get("violation_time") or row.get("timestamp"))
        if not occurred_at or occurred_at.date().isoformat() not in targets:
            continue

        category = _map_category(str(row.get("violation_type", "")))
        if not category:
            continue

        totals[f"{category}_count"] += 1

    totals["total_count"] = (
        totals["apron_count"]
        + totals["gloves_count"]
        + totals["hairnet_count"]
        + totals["fire_count"]
    )
    totals["hygiene_score"] = _hygiene_score(
        totals["apron_count"],
        totals["gloves_count"],
        totals["hairnet_count"],
        totals["fire_count"],
    )
    return totals


def update_stats(user_id: str, violation_type: str):
    """Called after every violation write. Updates stats_daily, stats_summary, violations_chart."""
    today     = datetime.now(timezone.utc).date().isoformat()
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    category  = _map_category(violation_type)

    if not category:
        print(f"[stats] Unknown violation type: {violation_type} — skipping stats")
        return

    summary_ref = db.collection("stats_summary").document(user_id)
    summary_snap = summary_ref.get()
    notification_count = int((summary_snap.to_dict() or {}).get("notification_count", 0) or 0) + 1

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
        "notification_count": notification_count,
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


def build_summary_for_days(user_id: str, days: int, camera_ids: list[str] | None = None) -> dict:
    days = max(1, int(days or 1))
    if days == 2:
        current_dates = _date_strings_for_range(1, offset_days=1)
        previous_dates = _date_strings_for_range(1, offset_days=2)
    else:
        current_dates = _date_strings_for_range(days)
        previous_dates = _date_strings_for_range(days, offset_days=days)

    if camera_ids is None:
        current = _aggregate_days(user_id, current_dates)
        previous = _aggregate_days(user_id, previous_dates)
    else:
        current = _aggregate_violations_for_dates(user_id, current_dates, camera_ids)
        previous = _aggregate_violations_for_dates(user_id, previous_dates, camera_ids)

    return {
        "user_id": user_id,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "notification_count": int((db.collection("stats_summary").document(user_id).get().to_dict() or {}).get("notification_count", 0) or 0),
        "apron_count": current["apron_count"],
        "gloves_count": current["gloves_count"],
        "hairnet_count": current["hairnet_count"],
        "fire_count": current["fire_count"],
        "total_count": current["total_count"],
        "hygiene_score": current["hygiene_score"],
        "apron_change_pct": _pct_change(current["apron_count"], previous["apron_count"]),
        "gloves_change_pct": _pct_change(current["gloves_count"], previous["gloves_count"]),
        "hairnet_change_pct": _pct_change(current["hairnet_count"], previous["hairnet_count"]),
        "fire_change_pct": _pct_change(current["fire_count"], previous["fire_count"]),
    }


def build_chart_days(user_id: str, days: int = 30, camera_ids: list[str] | None = None) -> list[dict]:
    """Returns [{date, apron, gloves, hairnet, fire}] for last N days. Missing days zero-filled."""
    today = datetime.now(timezone.utc).date()
    result = []

    if camera_ids is not None:
        if len(camera_ids) == 0:
            for i in range(days - 1, -1, -1):
                date_str = (today - timedelta(days=i)).isoformat()
                result.append({"date": date_str, "apron": 0, "gloves": 0, "hairnet": 0, "fire": 0})
            return result

        counts_by_day: dict[str, dict[str, int]] = {}
        for row in _violation_docs_for_user(user_id, camera_ids):
            occurred_at = _parse_violation_datetime(row.get("violation_time") or row.get("timestamp"))
            if not occurred_at:
                continue

            category = _map_category(str(row.get("violation_type", "")))
            if not category:
                continue

            day_key = occurred_at.date().isoformat()
            day_counts = counts_by_day.setdefault(day_key, {
                "apron": 0,
                "gloves": 0,
                "hairnet": 0,
                "fire": 0,
            })
            day_counts[category] += 1

        for i in range(days - 1, -1, -1):
            date_str = (today - timedelta(days=i)).isoformat()
            day_counts = counts_by_day.get(date_str, {})
            result.append({
                "date": date_str,
                "apron": int(day_counts.get("apron", 0) or 0),
                "gloves": int(day_counts.get("gloves", 0) or 0),
                "hairnet": int(day_counts.get("hairnet", 0) or 0),
                "fire": int(day_counts.get("fire", 0) or 0),
            })
        return result

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


def _compute_summary_for_cameras(user_id: str, camera_ids: list[str] | None) -> dict:
    if camera_ids is not None and len(camera_ids) == 0:
        return {
            "user_id": user_id,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "notification_count": int((db.collection("stats_summary").document(user_id).get().to_dict() or {}).get("notification_count", 0) or 0),
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

    current_dates = _date_strings_for_range(1)
    previous_dates = _date_strings_for_range(1, offset_days=1)
    current = _aggregate_violations_for_dates(user_id, current_dates, camera_ids)
    previous = _aggregate_violations_for_dates(user_id, previous_dates, camera_ids)

    return {
        "user_id": user_id,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "notification_count": int((db.collection("stats_summary").document(user_id).get().to_dict() or {}).get("notification_count", 0) or 0),
        "apron_count": current["apron_count"],
        "gloves_count": current["gloves_count"],
        "hairnet_count": current["hairnet_count"],
        "fire_count": current["fire_count"],
        "total_count": current["total_count"],
        "hygiene_score": current["hygiene_score"],
        "apron_change_pct": _pct_change(current["apron_count"], previous["apron_count"]),
        "gloves_change_pct": _pct_change(current["gloves_count"], previous["gloves_count"]),
        "hairnet_change_pct": _pct_change(current["hairnet_count"], previous["hairnet_count"]),
        "fire_change_pct": _pct_change(current["fire_count"], previous["fire_count"]),
    }


def empty_summary(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "last_updated": None,
        "notification_count": 0,
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


def summary_payload(user_id: str, raw: dict) -> dict:
    def si(v):
        try:
            return int(v)
        except Exception:
            return 0

    return {
        "user_id": user_id,
        "last_updated": str(raw.get("last_updated", "")),
        "notification_count": si(raw.get("notification_count", 0)),
        "apron_count": si(raw.get("apron_count")),
        "gloves_count": si(raw.get("gloves_count")),
        "hairnet_count": si(raw.get("hairnet_count")),
        "fire_count": si(raw.get("fire_count")),
        "total_count": si(raw.get("total_count")),
        "hygiene_score": si(raw.get("hygiene_score", 100)),
        "apron_change_pct": si(raw.get("apron_change_pct")),
        "gloves_change_pct": si(raw.get("gloves_change_pct")),
        "hairnet_change_pct": si(raw.get("hairnet_change_pct")),
        "fire_change_pct": si(raw.get("fire_change_pct")),
    }