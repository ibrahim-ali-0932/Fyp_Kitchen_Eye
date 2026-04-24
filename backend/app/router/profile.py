from ..auth.authentication import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from ..schemas.schemas import profile
from app.database.db import db

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/", response_model=profile)
def getprofile(decoded=Depends(get_current_user)):
    uid = decoded["uid"]
    email_from_token = decoded.get("email", "")

    print(f"🔵 Profile request - UID: {uid}, Email from token: {email_from_token}")

    snap = db.collection("users").document(uid).get()

    if not snap.exists:
        print(f"❌ No profile found for UID: {uid}")
        raise HTTPException(
            404,
            f"Profile not found. Please complete the signup process to create your profile.",
        )

    print(f"✅ Profile document exists")
    data = snap.to_dict()
    print(f"🔵 ===== FIRESTORE DATA RETRIEVED =====")
    print(f"🔵 Raw Firestore data: {data}")
    print(f"🔵 Available keys in Firestore: {list(data.keys()) if data else 'None'}")
    print(f"🔵 Data type: {type(data)}")

    # Log each field individually
    if data:
        print(
            f"🔵 fullName value: '{data.get('fullName')}' (type: {type(data.get('fullName'))})"
        )
        print(
            f"🔵 Fullname value: '{data.get('Fullname')}' (type: {type(data.get('Fullname'))})"
        )
        print(
            f"🔵 branchName value: '{data.get('branchName')}' (type: {type(data.get('branchName'))})"
        )
        print(
            f"🔵 Branchname value: '{data.get('Branchname')}' (type: {type(data.get('Branchname'))})"
        )
        print(
            f"🔵 address value: '{data.get('address')}' (type: {type(data.get('address'))})"
        )
        print(
            f"🔵 email value: '{data.get('email')}' (type: {type(data.get('email'))})"
        )

    # Use email from token as fallback if not in Firestore
    email = data.get("email") or email_from_token or ""

    # Transform field names to match profile schema
    # Firestore stores: fullName, branchName (camelCase)
    # Schema expects: Fullname, Branchname (PascalCase)
    # Check both camelCase and PascalCase versions
    fullname = data.get("fullName") or data.get("Fullname") or ""
    branchname = data.get("branchName") or data.get("Branchname") or ""
    address = data.get("address") or ""

    print(f"🔵 ===== TRANSFORMED VALUES =====")
    print(f"🔵 Email (transformed): '{email}'")
    print(f"🔵 Fullname (transformed): '{fullname}'")
    print(f"🔵 Branchname (transformed): '{branchname}'")
    print(f"🔵 Address (transformed): '{address}'")

    transformed_data = {
        "email": email,
        "Fullname": fullname,
        "Branchname": branchname,
        "address": address,
    }

    print(f"✅ Transformed data:")
    print(f"   - Email: {email}")
    print(f"   - Fullname: {fullname}")
    print(f"   - Branchname: {branchname}")
    print(f"   - Address: {address}")
    print(f"✅ Returning profile data: {transformed_data}")

    try:
        return profile(**transformed_data)
    except Exception as e:
        print(f"❌ Error transforming profile data: {str(e)}")
        raise HTTPException(422, f"Profile data shape mismatch: {str(e)}")


@router.put("/", response_model=profile)
def update_profile(body: profile, decoded=Depends(get_current_user)):
    uid = decoded["uid"]
    email_from_token = decoded.get("email", "")

    print(
        f"🔵 Update profile request - UID: {uid}, Email from token: {email_from_token}"
    )

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
        "email": email_from_token,  # Keep the email from token (cannot be changed)
    }

    try:
        # Update the document
        db.collection("users").document(uid).update(update_data)

        # Return the updated profile
        updated_data = {
            "email": email_from_token,
            "Fullname": body.Fullname,
            "Branchname": body.Branchname,
            "address": body.address,
        }

        print(f"✅ Profile updated successfully: {updated_data}")
        return profile(**updated_data)
    except Exception as e:
        print(f"❌ Error updating profile: {str(e)}")
        raise HTTPException(500, f"Failed to update profile: {str(e)}")
