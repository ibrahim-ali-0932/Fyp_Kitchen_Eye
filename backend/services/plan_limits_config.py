UNLIMITED = -1

DEFAULT_PLAN_LIMITS = {
    "basic": {
        "max_branches": 1,
        "max_cameras": 1,
        "max_users": 1,
    },
    "pro": {
        "max_branches": 3,
        "max_cameras": 10,
        "max_users": 5,
    },
    "enterprise": {
        "max_branches": UNLIMITED,
        "max_cameras": UNLIMITED,
        "max_users": UNLIMITED,
    },
}


def normalize_plan(plan: str | None) -> str:
    candidate = str(plan or "").strip().lower()
    return candidate if candidate else "basic"


def sanitize_limit(value, fallback: int) -> int:
    if value in (None, ""):
        return fallback

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback

    if parsed < UNLIMITED:
        return fallback

    return parsed


def build_quantifiable_features(limits: dict) -> list[str]:
    def fmt(value: int, label: str) -> str:
        if int(value) == UNLIMITED:
            return f"Unlimited {label}"
        return f"Up to {int(value)} {label}"

    return [
        fmt(limits.get("max_cameras", 0), "camera feeds"),
        fmt(limits.get("max_branches", 0), "branches"),
        fmt(limits.get("max_users", 0), "users"),
    ]
