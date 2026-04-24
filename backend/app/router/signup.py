from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from firebase_admin import auth as firebase_auth
from ..database.db import db


CLOCK_SKEW_SECONDS = 10

router = APIRouter(prefix="/signup", tags=["signup"])


def normalize_organization_name(value: str) -> str:
    # Normalize for duplicate checks: trim, collapse internal spaces, lowercase.
    return " ".join(value.strip().split()).lower()


@router.post("/")
async def signup(request: Request, Authorization: str = Header(None)):
    # Get raw request body for debugging
    try:
        data = await request.json()
    except Exception as e:
        print(f"❌ ERROR parsing JSON: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    
    id_token = (Authorization or "").replace("Bearer ", "")

    print(f"🔵 ===== SIGNUP REQUEST RECEIVED =====")
    print(f"🔵 Parsed request data: {data}")
    print(f"🔵 Data type: {type(data)}")
    print(f"🔵 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
    print(f"🔵 Email from request: '{data.get('email', 'NOT PROVIDED')}' (type: {type(data.get('email'))})")
    print(f"🔵 Full name from request: '{data.get('full_name', 'NOT PROVIDED')}' (type: {type(data.get('full_name'))})")
    print(f"🔵 Organization from request: '{data.get('organization', 'NOT PROVIDED')}' (type: {type(data.get('organization'))})")
    print(f"🔵 Address from request: '{data.get('address', 'NOT PROVIDED')}' (type: {type(data.get('address'))})")
    
    # Check if values are actually present (not just keys)
    if 'full_name' not in data or data.get('full_name') is None:
        print(f"⚠️ WARNING: 'full_name' key missing or None!")
    if 'organization' not in data or data.get('organization') is None:
        print(f"⚠️ WARNING: 'organization' key missing or None!")
    if 'address' not in data or data.get('address') is None:
        print(f"⚠️ WARNING: 'address' key missing or None!")

    try:
        # Step 1: Verify ID token and get user info
        decoded_token = firebase_auth.verify_id_token(
            id_token,
            clock_skew_seconds=CLOCK_SKEW_SECONDS,
        )
        uid = decoded_token["uid"]
        user_email = decoded_token.get("email", data.get("email", ""))
        user = firebase_auth.get_user(uid)

        print(f"🔵 User info from Firebase:")
        print(f"   - UID: {uid}")
        print(f"   - Email: {user_email}")
        print(f"   - Email verified: {user.email_verified}")

        # Note: We allow profile creation even if email is not verified yet
        # Email verification will be required when user tries to login
        # This provides better UX - user can complete signup, then verify email

        # Step 2: Check if user document already exists
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            raise HTTPException(
                status_code=409,  # Conflict status code
                detail="This email is already registered. Please sign in instead."
            )
        
        # Step 4: Check if email already exists in Firestore (by querying)
        # This is a safety check in case UID doesn't match but email does
        users_ref = db.collection("users")
        query = users_ref.where("email", "==", user_email).limit(1).get()
        if len(query) > 0:
            raise HTTPException(
                status_code=409,  # Conflict status code
                detail="This email is already registered. Please sign in instead."
            )
        
        # Step 5: Save user profile to Firestore
        # Get values directly from request - don't use empty string fallback
        # This ensures we save exactly what was sent
        organization_value = data.get("organization")
        full_name_value = data.get("full_name")
        address_value = data.get("address")
        
        # Check if values are actually provided
        if organization_value is None:
            print(f"⚠️ WARNING: 'organization' is None in request!")
            organization_value = ""
        else:
            organization_value = str(organization_value).strip()
            
        if full_name_value is None:
            print(f"⚠️ WARNING: 'full_name' is None in request!")
            full_name_value = ""
        else:
            full_name_value = str(full_name_value).strip()
            
        if address_value is None:
            print(f"⚠️ WARNING: 'address' is None in request!")
            address_value = ""
        else:
            address_value = str(address_value).strip()

        normalized_organization = normalize_organization_name(organization_value)

        if normalized_organization:
            organization_conflict = (
                users_ref.where("branchNameNormalized", "==", normalized_organization)
                .limit(1)
                .get()
            )
            if len(organization_conflict) > 0:
                raise HTTPException(
                    status_code=409,
                    detail="This organization already exists. You cannot register with this organization.",
                )

            # Backward-compatible duplicate check for legacy docs without branchNameNormalized.
            legacy_conflict = False
            for doc in users_ref.stream():
                branch_name = str((doc.to_dict() or {}).get("branchName", ""))
                if normalize_organization_name(branch_name) == normalized_organization:
                    legacy_conflict = True
                    break

            if legacy_conflict:
                raise HTTPException(
                    status_code=409,
                    detail="This organization already exists. You cannot register with this organization.",
                )
        
        profile_data = {
            "email": user_email,
            "branchName": organization_value,  # Save exactly what was sent (after trim)
            "branchNameNormalized": normalized_organization,
            "fullName": full_name_value,       # Save exactly what was sent (after trim)
            "address": address_value           # Save exactly what was sent (after trim)
        }
        
        print(f"🔵 ===== SAVING PROFILE TO FIRESTORE =====")
        print(f"🔵 UID: {uid}")
        print(f"🔵 Email: {user_email}")
        print(f"🔵 Full Name (raw): '{data.get('full_name')}' → (processed): '{profile_data['fullName']}'")
        print(f"🔵 Branch Name (raw): '{data.get('organization')}' → (processed): '{profile_data['branchName']}'")
        print(f"🔵 Address (raw): '{data.get('address')}' → (processed): '{profile_data['address']}'")
        print(f"🔵 Complete profile data: {profile_data}")
        
        # Verify data before saving
        if not profile_data['fullName']:
            print(f"⚠️ WARNING: fullName is empty!")
        if not profile_data['branchName']:
            print(f"⚠️ WARNING: branchName is empty!")
        if not profile_data['address']:
            print(f"⚠️ WARNING: address is empty!")
        
        db.collection("users").document(uid).set(profile_data)
        
        # Verify it was saved
        verify_doc = db.collection("users").document(uid).get()
        if verify_doc.exists:
            saved_data = verify_doc.to_dict()
            print(f"✅ Profile saved successfully to Firestore")
            print(f"✅ Verification - Saved data: {saved_data}")
        else:
            print(f"❌ ERROR: Profile was not saved!")

        return {"message": "Profile created successfully."}

    except HTTPException:
        # Re-raise HTTP exceptions (like our 409 conflict or 403)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")
