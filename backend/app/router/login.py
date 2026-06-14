from fastapi import APIRouter, Depends, HTTPException, status, Header
from firebase_admin import auth as firebase_auth
from ..router.signup import ensure_user_profile


CLOCK_SKEW_SECONDS = 10

router = APIRouter(prefix="/login", tags=["login"])


@router.post("/")
async def login(Authorization: str = Header(None)):
    id_token = (Authorization or "").replace("Bearer ", "")
    try:
        decoded = firebase_auth.verify_id_token(
            id_token,
            clock_skew_seconds=CLOCK_SKEW_SECONDS,
        )
        if not decoded.get("email_verified"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email first.",
            )

        uid = decoded["uid"]
        email = decoded.get("email", "")
        ensure_user_profile(uid, email)

        return {"uid": uid, "email": email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
