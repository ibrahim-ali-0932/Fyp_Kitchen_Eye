from fastapi import HTTPException, Header
from firebase_admin import auth


def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    try:
        token = authorization.split(" ")[1]
        return auth.verify_id_token(token)          # returns decoded JWT
    except Exception as e:
        raise HTTPException(401, "Invalid or expired token")
