from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from firebase_admin import auth as firebase_auth
from ..database.db import db

router = APIRouter(prefix="/signup", tags=["signup"])


@router.post("/")
async def signup(request: Request, Authorization: str = Header(None)):
    data = await request.json()
    id_token = (Authorization or "").replace("Bearer ", "")

    try:
        # Check if user document already exists
        user_doc = db.collection("users").document(user_uid).get()
        if user_doc.exists:
            logger.warning(f"User profile already exists for UID: {user_uid}")
            raise HTTPException(
                status_code=409,  # Conflict status code
                detail="This email is already registered. Please sign in instead."
            )
        
        # Check if email already exists in Firestore (by querying)
        # This is a safety check in case UID doesn't match but email does
        users_ref = db.collection("users")
        query = users_ref.where("email", "==", user_email).limit(1).get()
        if len(query) > 0:
            logger.warning(f"Email already exists in Firestore: {user_email}")
            raise HTTPException(
                status_code=409,  # Conflict status code
                detail="This email is already registered. Please sign in instead."
            )
        
        # Save user profile to Firestore
        db.collection("users").document(user_uid).set({
            "email": user_email,
            "branchName": body.organization,  # Match frontend field name
            "fullName": body.full_name,       # Match frontend field name
            "address": body.address            # Address field
        })
        
        logger.info(f"Successfully created profile for user: {user_uid}")
        
    except HTTPException:
        # Re-raise HTTP exceptions (like our 409 conflict)
        raise
    except exceptions.FirebaseError as e:
        logger.error(f"Failed to create user document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user profile: {str(e)}"
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
