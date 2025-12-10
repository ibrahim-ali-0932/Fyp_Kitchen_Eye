from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db

router = APIRouter(prefix="/violations", tags=["violations"])


class ViolationLogRequest(BaseModel):
    violation_type: str
    camera_location: str
    destination_email: Optional[str] = None
    is_test: bool = True


@router.post("/log")
async def log_violation(
    payload: ViolationLogRequest, token: str = Depends(oauth2_scheme)
):
    """Log a violation/test email for the authenticated user."""
    decoded = verify_token(token, require_verified=True)
    user_email = decoded.get("email")

    if not user_email:
        raise HTTPException(status_code=400, detail="User email missing in token")

    try:
        doc = {
            "email": user_email,
            "destination_email": payload.destination_email or user_email,
            "violation_type": payload.violation_type,
            "camera_location": payload.camera_location,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_test": payload.is_test,
            "sent_via": "emailjs",
        }
        db.collection("violations").add(doc)
        return {"message": "Logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user")
async def list_user_violations(token: str = Depends(oauth2_scheme)):
    """Return recent violations for the authenticated user."""
    decoded = verify_token(token, require_verified=True)
    user_email = decoded.get("email")

    if not user_email:
        raise HTTPException(status_code=400, detail="User email missing in token")

    try:
        docs = db.collection("violations").where("email", "==", user_email).stream()
        items = []
        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            items.append(data)

        # Sort newest first using ISO timestamps
        items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
