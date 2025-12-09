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
    email_from_token = decoded.get("email", "")
    
    print(f"🔵 Profile request - UID: {uid}, Email from token: {email_from_token}")
    
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        print(f"❌ No profile found for UID: {uid}")
        raise HTTPException(404, "profile not found")
    
    data = snap.to_dict()
    print(f"🔵 Firestore data retrieved: {data}")
    
    # Transform field names to match profile schema
    # Firestore stores: fullName, branchName (camelCase)
    # Schema expects: Fullname, Branchname (PascalCase)
    transformed_data = {
        "email": data.get("email", ""),
        "Fullname": data.get("fullName", data.get("Fullname", "")),
        "Branchname": data.get("branchName", data.get("Branchname", "")),
        "address": data.get("address", "")
    }
    
    print(f"✅ Returning profile data: {transformed_data}")
    
    try:
        return profile(**transformed_data)
    except Exception as e:
        print(f"❌ Error transforming profile data: {str(e)}")
        raise HTTPException(422, f"Profile data shape mismatch: {str(e)}")


@router.put("/", response_model=profile)
def update_profile(body: profile, decoded=Depends(verify_token)):
    uid = decoded["uid"]
    email_from_token = decoded.get("email", "")
    
    print(f"🔵 Update profile request - UID: {uid}, Email from token: {email_from_token}")
    
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        print(f"❌ No profile found for UID: {uid}")
        raise HTTPException(404, "profile not found")
    
    # Update only the fields that can be changed (name, branch, and address)
    # Email cannot be changed, so we use the email from the token
    update_data = {
        "fullName": body.Fullname,  # Store in camelCase in Firestore
        "branchName": body.Branchname,  # Store in camelCase in Firestore
        "address": body.address,  # Address field
        "email": email_from_token  # Keep the email from token (cannot be changed)
    }
    
    try:
        # Update the document
        db.collection("users").document(uid).update(update_data)
        
        # Return the updated profile
        updated_data = {
            "email": email_from_token,
            "Fullname": body.Fullname,
            "Branchname": body.Branchname,
            "address": body.address
        }
        
        print(f"✅ Profile updated successfully: {updated_data}")
        return profile(**updated_data)
    except Exception as e:
        print(f"❌ Error updating profile: {str(e)}")
        raise HTTPException(500, f"Failed to update profile: {str(e)}")
