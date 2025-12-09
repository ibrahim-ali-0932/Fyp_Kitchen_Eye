from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from firebase_admin import auth as firebase_auth
from ..database.db import db

router = APIRouter(prefix="/signup", tags=["signup"])


@router.post("/")
async def signup(request: Request, Authorization: str = Header(None)):
    data = await request.json()
    id_token = (Authorization or "").replace("Bearer ", "")

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        user = firebase_auth.get_user(uid)

        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Cannot create profile.",
            )

        db.collection("users").document(uid).set(
            {
                "email": data.get("email"),
                "fullName": data.get("full_name"),
                "branchName": data.get("organization"),
                "address": data.get("address"),
            }
        )

        return {"message": "Profile created successfully."}

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
