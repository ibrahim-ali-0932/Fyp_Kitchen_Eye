# backend/services/dedup_service.py
import time

COOLDOWN_SECONDS = 30  # seconds between saves for the same unique_key

_last_reported: dict = {}


def should_save_violation(unique_key: str) -> bool:
    """Returns True if cooldown has expired for this key."""
    now = time.time()
    if now - _last_reported.get(unique_key, 0) < COOLDOWN_SECONDS:
        return False
    _last_reported[unique_key] = now
    return True


def reset_state():
    """Call at the start of each new video or stream session."""
    _last_reported.clear()
    print("[KitchenEye] Dedup state reset.")
