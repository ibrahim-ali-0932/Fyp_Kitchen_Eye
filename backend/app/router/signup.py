from fastapi import APIRouter, HTTPException, Depends
from ..schemas.schemas import Signup
from ..database.db import db
from ..auth.authentication import verify_token
import logging
from firebase_admin import exceptions

router = APIRouter(
    prefix="/signup",
    tags=['signup']
)
logger = logging.getLogger(__name__)


@router.post('/')
async def createUser(body: Signup, user_data: dict = Depends(verify_token)):
    """
    Create user profile in Firestore after Firebase Auth signup.
    The frontend already created the user in Firebase Auth,
    so we just need to save their profile data to Firestore.
    """
    
    # Get UID from the verified token
    user_uid = user_data.get('uid')
    user_email = user_data.get('email')
    
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
        )
    
    return {
        "uid": user_uid, 
        "email": user_email,
        "message": "Profile created successfully"
    }