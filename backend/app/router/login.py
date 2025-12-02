from fastapi import APIRouter, Header, HTTPException
from firebase_admin import auth

router = APIRouter(prefix="/login", tags=["login"])

@router.post("/verify")
async def verify_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")

    token = authorization.split(" ")[1]

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        email = decoded_token["email"]
        return {"uid": uid, "email": email}
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
