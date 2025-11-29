from fastapi import APIRouter, HTTPException
from ..schemas.schemas import Signup
from ..database.database import db
import logging
from firebase_admin import auth, exceptions

router = APIRouter(
    prefix="/signup",
    tags=['signup']
)
logger = logging.getLogger(__name__)


@router.post('/')
async def createUser(body: Signup):

    try:
        user = auth.create_user(email=body.email, password=body.password)

    except auth.EmailAlreadyExistsError:
        raise HTTPException(409, "Email ALready registered")
    try:

        db.collection("users").document(user.uid).set({
            "email": body.email,
            "branchName": body.Branchname,
            "fullName": body.Fullname
        })

    except exceptions.FirebaseError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user document: {str(e)}"
        )

    # just to show that its done
    return {"uid": user.uid, "email": user.email}
