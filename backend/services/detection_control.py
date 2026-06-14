from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

STATE_FILE = Path(__file__).resolve().parents[1] / "model" / "detection_state.json"
DEFAULT_STATE = {"enabled": True}


def _read_state() -> dict:
    if not STATE_FILE.exists():
        return DEFAULT_STATE.copy()

    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return DEFAULT_STATE.copy()
        return {"enabled": bool(data.get("enabled", True)), **data}
    except Exception:
        return DEFAULT_STATE.copy()


def get_detection_state() -> dict:
    return _read_state()


def is_detection_enabled() -> bool:
    return bool(_read_state().get("enabled", True))


def set_detection_enabled(enabled: bool) -> dict:
    state = {
        "enabled": bool(enabled),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = STATE_FILE.with_suffix(".tmp")
    temp_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
    temp_file.replace(STATE_FILE)
    return state
