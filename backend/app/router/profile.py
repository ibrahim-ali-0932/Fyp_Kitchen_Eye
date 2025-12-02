from ..auth.authentication import verify_token
from fastapi import APIRouter, Depends, HTTPException
from ..schemas.schemas import profile
from app.database.db import db
router = APIRouter(
    prefix="/profile",
    tags=["profile"]
)


@router.get("/", response_model=profile)
def getprofile(decoded=Depends(verify_token)):
    uid = decoded["uid"]
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        raise HTTPException(404, "profile not found")
    data = snap.to_dict()
    try:
        return profile(**data)
    except Exception:
        raise HTTPException(422, "Profile data shape mismatch")
