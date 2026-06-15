from datetime import datetime, timezone

from fastapi import HTTPException

from app.database.db import db
from services.plan_limits_config import (
    DEFAULT_PLAN_LIMITS,
    UNLIMITED,
    build_quantifiable_features,
    normalize_plan,
    sanitize_limit,
)


PLAN_LIMITS_COLLECTION = "plan_limits"
METRIC_TO_LIMIT_KEY = {
    "branches": "max_branches",
    "cameras": "max_cameras",
    "users": "max_users",
}
METRIC_TO_COLLECTION = {
    "branches": "branches",
    "cameras": "cameras",
    "users": "users",
}
def _build_limits_payload(plan: str, source: dict | None = None) -> dict:
    source = source or {}
    base = DEFAULT_PLAN_LIMITS.get(plan, DEFAULT_PLAN_LIMITS["basic"])

    return {
        "plan": plan,
        "max_branches": sanitize_limit(source.get("max_branches"), base["max_branches"]),
        "max_cameras": sanitize_limit(source.get("max_cameras"), base["max_cameras"]),
        "max_users": sanitize_limit(source.get("max_users"), base["max_users"]),
    }


def list_plan_limits() -> list[dict]:
    docs = {
        doc.id: (doc.to_dict() or {})
        for doc in db.collection(PLAN_LIMITS_COLLECTION).stream()
    }

    plans = sorted(set(DEFAULT_PLAN_LIMITS.keys()) | set(docs.keys()))
    return [_build_limits_payload(plan, docs.get(plan)) for plan in plans]


def get_plan_limits(plan: str | None) -> dict:
    normalized_plan = normalize_plan(plan)
    doc = db.collection(PLAN_LIMITS_COLLECTION).document(normalized_plan).get()
    return _build_limits_payload(normalized_plan, doc.to_dict() if doc.exists else None)


def update_plan_limits(plan: str, updates: dict, updated_by: str | None = None) -> dict:
    normalized_plan = normalize_plan(plan)
    current = get_plan_limits(normalized_plan)
    next_limits = {
        "max_branches": sanitize_limit(updates.get("max_branches"), current["max_branches"]),
        "max_cameras": sanitize_limit(updates.get("max_cameras"), current["max_cameras"]),
        "max_users": sanitize_limit(updates.get("max_users"), current["max_users"]),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if updated_by:
        next_limits["updated_by"] = updated_by

    db.collection(PLAN_LIMITS_COLLECTION).document(normalized_plan).set(next_limits, merge=True)
    return get_plan_limits(normalized_plan)


def _get_user_doc(user_id: str) -> dict:
    snapshot = db.collection("users").document(user_id).get()
    return snapshot.to_dict() if snapshot.exists else {}


def get_account_owner_id(user_id: str) -> str:
    user_id = str(user_id or "").strip()
    if not user_id:
        raise HTTPException(status_code=400, detail="User id is required")

    snapshot = db.collection("users").document(user_id).get()
    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="User profile not found")

    data = snapshot.to_dict() or {}
    owner_id = str(data.get("owner_id") or "").strip() or user_id

    if not data.get("owner_id"):
        db.collection("users").document(user_id).set({"owner_id": owner_id}, merge=True)

    return owner_id


def get_user_plan(user_id: str) -> str:
    data = _get_user_doc(user_id)
    return normalize_plan(data.get("plan") or data.get("subscription_plan") or "basic")


def get_limits_for_user(user_id: str) -> dict:
    owner_id = get_account_owner_id(user_id)
    plan = get_user_plan(owner_id)
    limits = get_plan_limits(plan)
    limits["owner_id"] = owner_id
    return limits


def _count_collection_for_owner(collection_name: str, owner_id: str) -> int:
    collection = db.collection(collection_name)

    # Primary count path for new records that include owner_id.
    owner_docs = list(collection.where("owner_id", "==", owner_id).stream())
    seen_ids = {doc.id for doc in owner_docs}

    # Backward compatibility for legacy records created before owner_id existed.
    legacy_docs = list(collection.where("user_id", "==", owner_id).stream())
    for doc in legacy_docs:
        if doc.id in seen_ids:
            continue
        payload = doc.to_dict() or {}
        if str(payload.get("owner_id") or "").strip():
            continue
        seen_ids.add(doc.id)

    count = len(seen_ids)

    if collection_name == "users" and count == 0:
        owner_doc = db.collection("users").document(owner_id).get()
        if owner_doc.exists:
            # Backward compatibility for old docs without owner_id.
            return 1

    return count


def get_usage_for_owner(owner_id: str) -> dict:
    return {
        "branches": _count_collection_for_owner("branches", owner_id),
        "cameras": _count_collection_for_owner("cameras", owner_id),
        "users": _count_collection_for_owner("users", owner_id),
    }


def _limit_message(metric: str, limit: int, plan: str) -> str:
    noun = metric[:-1] if metric.endswith("s") else metric
    return (
        f"You have reached the {plan.upper()} plan limit for {metric} "
        f"({limit} {noun if limit == 1 else metric})."
    )


def enforce_limit_for_owner(owner_id: str, plan: str, metric: str, incoming: int = 1) -> dict:
    if metric not in METRIC_TO_LIMIT_KEY:
        raise HTTPException(status_code=500, detail=f"Unsupported limit metric: {metric}")

    limits = get_plan_limits(plan)
    limit_key = METRIC_TO_LIMIT_KEY[metric]
    max_allowed = int(limits[limit_key])

    if max_allowed == UNLIMITED:
        return {
            "allowed": True,
            "plan": plan,
            "metric": metric,
            "max_allowed": max_allowed,
            "current_usage": get_usage_for_owner(owner_id)[metric],
        }

    usage = get_usage_for_owner(owner_id)
    current = int(usage[metric])
    next_total = current + max(1, int(incoming))

    if next_total > max_allowed:
        raise HTTPException(status_code=403, detail=_limit_message(metric, max_allowed, plan))

    return {
        "allowed": True,
        "plan": plan,
        "metric": metric,
        "max_allowed": max_allowed,
        "current_usage": current,
    }


def enforce_limit_for_user(user_id: str, metric: str, incoming: int = 1) -> dict:
    owner_id = get_account_owner_id(user_id)
    plan = get_user_plan(owner_id)
    result = enforce_limit_for_owner(owner_id, plan, metric, incoming=incoming)
    result["owner_id"] = owner_id
    return result


