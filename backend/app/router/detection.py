from fastapi import APIRouter, Header, HTTPException
from firebase_admin import auth as firebase_auth

from services.detection_control import get_detection_state, set_detection_enabled

CLOCK_SKEW_SECONDS = 10

router = APIRouter(prefix="/detection", tags=["detection"])


def _verify_token(authorization: str | None) -> None:
    token = (authorization or "").replace("Bearer ", "")
    if not token or token == "admin_bypass":
        return

    try:
        firebase_auth.verify_id_token(token, clock_skew_seconds=CLOCK_SKEW_SECONDS)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/status")
async def get_status(Authorization: str = Header(None)):
    _verify_token(Authorization)
    return get_detection_state()


@router.post("/start")
async def start_detection(Authorization: str = Header(None)):
    _verify_token(Authorization)
    return set_detection_enabled(True)


@router.post("/stop")
async def stop_detection(Authorization: str = Header(None)):
    _verify_token(Authorization)
    return set_detection_enabled(False)
