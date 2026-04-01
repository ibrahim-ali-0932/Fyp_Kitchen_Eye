import os
import sys
from pathlib import Path

_backend_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.database.db import db  # noqa: E402


def _renamed_counts(raw: dict) -> dict:
    return {
        "apron_count": int(raw.get("apron_count", raw.get("ppe_count", 0)) or 0),
        "fire_count": int(raw.get("fire_count", 0) or 0),
        "gloves_count": int(raw.get("gloves_count", raw.get("spill_count", 0)) or 0),
        "hair_net_count": int(raw.get("hair_net_count", raw.get("hairnet_count", raw.get("pest_count", 0))) or 0),
    }


def migrate_stats_daily() -> int:
    updated = 0
    for doc in db.collection("stats_daily").stream():
        data = doc.to_dict() or {}
        counts = _renamed_counts(data)
        payload = {
            **counts,
            "total_count": counts["apron_count"] + counts["fire_count"] + counts["gloves_count"] + counts["hair_net_count"],
        }
        doc.reference.set(payload, merge=True)
        updated += 1
    return updated


def migrate_stats_summary() -> int:
    updated = 0
    for doc in db.collection("stats_summary").stream():
        data = doc.to_dict() or {}
        counts = _renamed_counts(data)
        payload = {
            **counts,
            "apron_change_pct": int(data.get("apron_change_pct", data.get("ppe_change_pct", 0)) or 0),
            "fire_change_pct": int(data.get("fire_change_pct", 0) or 0),
            "gloves_change_pct": int(data.get("gloves_change_pct", data.get("spill_change_pct", 0)) or 0),
            "hair_net_change_pct": int(data.get("hair_net_change_pct", data.get("hairnet_change_pct", data.get("pest_change_pct", 0))) or 0),
            "total_count": int(data.get("total_count", counts["apron_count"] + counts["fire_count"] + counts["gloves_count"] + counts["hair_net_count"]) or 0),
        }
        doc.reference.set(payload, merge=True)
        updated += 1
    return updated


def migrate_violations_chart() -> int:
    updated = 0
    for doc in db.collection("violations_chart").stream():
        data = doc.to_dict() or {}
        days = data.get("days", [])
        normalized = []
        for day in days:
            normalized.append({
                "date": str(day.get("date", "")),
                "apron": int(day.get("apron", day.get("ppe", 0)) or 0),
                "fire": int(day.get("fire", 0) or 0),
                "gloves": int(day.get("gloves", day.get("spill", 0)) or 0),
                "hair_net": int(day.get("hair_net", day.get("hairnet", day.get("pest", 0))) or 0),
            })
        doc.reference.set({"days": normalized}, merge=True)
        updated += 1
    return updated


def attach_snapshot_filenames(snapshot_dir: Path) -> int:
    if not snapshot_dir.exists():
        return 0

    updated = 0
    for doc in db.collection("violations").stream():
        data = doc.to_dict() or {}
        violation_id = str(data.get("violation_id") or doc.id)
        snapshot_filename = data.get("snapshot_filename")
        if snapshot_filename:
            continue

        exact = snapshot_dir / f"{violation_id}.jpg"
        candidate = exact if exact.exists() else None
        if candidate is None:
            matches = list(snapshot_dir.glob(f"*{violation_id}*.jpg"))
            if matches:
                candidate = matches[0]

        if candidate is not None:
            doc.reference.set({
                "snapshot_id": violation_id,
                "snapshot_filename": candidate.name,
            }, merge=True)
            updated += 1
    return updated


def main() -> None:
    snapshot_dir = Path(_backend_dir) / "model" / "saved_snapshots"
    daily = migrate_stats_daily()
    summary = migrate_stats_summary()
    chart = migrate_violations_chart()
    snap = attach_snapshot_filenames(snapshot_dir)

    print("Migration complete")
    print(f"stats_daily updated: {daily}")
    print(f"stats_summary updated: {summary}")
    print(f"violations_chart updated: {chart}")
    print(f"violations snapshot metadata updated: {snap}")


if __name__ == "__main__":
    main()
