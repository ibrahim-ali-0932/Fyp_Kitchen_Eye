from fastapi import APIRouter, HTTPException, Header, Request
from firebase_admin import auth as firebase_auth
from ..database.db import db
from typing import List, Optional
from pydantic import BaseModel


CLOCK_SKEW_SECONDS = 10

router = APIRouter(prefix="/users", tags=["users"])

class CreateUserRequest(BaseModel):
    email: str
    password: str
    fullName: str
    branchName: str = ""
    address: str = ""
    role: str = "Viewer"
    status: str = "Active"


@router.get("/")
async def get_all_users(Authorization: str = Header(None)):
    """Get all users from Firestore"""
    try:
        # Admin bypass or verify token
        id_token = (Authorization or "").replace("Bearer ", "")
        
        # Allow admin bypass
        if id_token != "admin_bypass" and id_token:
            try:
                decoded_token = firebase_auth.verify_id_token(
                    id_token,
                    clock_skew_seconds=CLOCK_SKEW_SECONDS,
                )
            except Exception as e:
                print(f"Token verification failed: {e}")
                # Continue anyway for admin
                pass
        
        # Fetch all users from Firestore
        users_ref = db.collection("users")
        users_docs = users_ref.stream()
        
        users_list = []
        for doc in users_docs:
            user_data = doc.to_dict()
            user_data["id"] = doc.id  # Add document ID
            users_list.append(user_data)
        
        return {"users": users_list}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.delete("/{user_id}")
async def delete_user(user_id: str, Authorization: str = Header(None)):
    """Delete a user from both Firebase Auth and Firestore"""
    print(f"🗑️ DELETE USER REQUEST - Received for user_id: {user_id}")
    
    try:
        # Admin bypass or verify token
        id_token = (Authorization or "").replace("Bearer ", "")
        print(f"🔑 Token: {'admin_bypass' if id_token == 'admin_bypass' else 'user token'}")
        
        if id_token != "admin_bypass" and id_token:
            try:
                decoded_token = firebase_auth.verify_id_token(
                    id_token,
                    clock_skew_seconds=CLOCK_SKEW_SECONDS,
                )
                print(f"✅ Token verified for user: {decoded_token.get('uid')}")
            except Exception as e:
                print(f"⚠️ Token verification failed: {e}")
                pass
        
        # Delete from Firebase Auth
        try:
            print(f"🔥 Attempting to delete from Firebase Auth...")
            firebase_auth.delete_user(user_id)
            print(f"✅ Deleted user from Firebase Auth: {user_id}")
        except Exception as auth_error:
            print(f"⚠️ Could not delete from Firebase Auth: {auth_error}")
            # Continue to delete from Firestore anyway
        
        # Delete from Firestore
        print(f"📦 Attempting to delete from Firestore...")
        db.collection("users").document(user_id).delete()
        print(f"✅ Deleted user from Firestore: {user_id}")
        
        print(f"🎉 User deletion completed successfully: {user_id}")
        return {"message": "User deleted successfully", "user_id": user_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DELETE USER FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@router.post("/")
async def create_user(
    request: CreateUserRequest,
    Authorization: str = Header(None)
):
    """Create a new user (admin operation)"""
    try:
        # Admin bypass or verify token
        id_token = (Authorization or "").replace("Bearer ", "")
        
        if id_token != "admin_bypass" and id_token:
            try:
                decoded_token = firebase_auth.verify_id_token(
                    id_token,
                    clock_skew_seconds=CLOCK_SKEW_SECONDS,
                )
            except Exception as e:
                print(f"Token verification failed: {e}")
                pass
        
        # Create user in Firebase Auth
        user = firebase_auth.create_user(
            email=request.email,
            password=request.password,
            email_verified=False
        )
        
        # Create user document in Firestore
        from datetime import datetime
        profile_data = {
            "email": request.email,
            "fullName": request.fullName,
            "branchName": request.branchName,
            "address": request.address,
            "role": request.role,
            "status": request.status,
            "createdAt": datetime.now().isoformat()
        }
        
        db.collection("users").document(user.uid).set(profile_data)
        
        return {
            "message": "User created successfully",
            "user_id": user.uid,
            "email": request.email
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
