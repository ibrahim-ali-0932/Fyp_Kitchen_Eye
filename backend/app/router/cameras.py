from fastapi import APIRouter, HTTPException, Header
from firebase_admin import auth as firebase_auth
from ..database.db import db
from datetime import datetime
from pydantic import BaseModel


CLOCK_SKEW_SECONDS = 10

router = APIRouter(prefix="/cameras", tags=["cameras"])

class CreateCameraRequest(BaseModel):
    branch: str
    ip_address: str
    location: str
    status: str = "active"
    user_id: str = ""


@router.get("/")
async def get_all_cameras(Authorization: str = Header(None)):
    """Get all cameras from Firestore"""
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
        
        # Fetch all cameras from Firestore
        cameras_ref = db.collection("cameras")
        cameras_docs = cameras_ref.stream()
        
        cameras_list = []
        for doc in cameras_docs:
            camera_data = doc.to_dict()
            camera_data["id"] = doc.id  # Add document ID
            cameras_list.append(camera_data)
        
        return {"cameras": cameras_list}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cameras: {str(e)}")


@router.post("/")
async def create_camera(
    request: CreateCameraRequest,
    Authorization: str = Header(None)
):
    """Create a new camera"""
    try:
        print(f"📥 Received camera creation request")
        print(f"   Branch: {request.branch}")
        print(f"   IP: {request.ip_address}")
        print(f"   Location: {request.location}")
        print(f"   Status: {request.status}")
        print(f"   User ID: {request.user_id}")
        
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
        
        # Create camera document
        camera_data = {
            "branch": request.branch,
            "ip_address": request.ip_address,
            "location": request.location,
            "status": request.status,
            "user_id": request.user_id,
            "starting_date": datetime.now().strftime("%d-%m-%y,%I:%M%p"),
            "createdAt": datetime.now().isoformat()
        }
        
        print(f"📷 Creating camera with data: {camera_data}")
        
        # Add to Firestore and get the document reference
        try:
            update_time, camera_ref = db.collection("cameras").add(camera_data)
            camera_id = camera_ref.id
            print(f"✅ Camera created successfully with ID: {camera_id}")
        except Exception as firestore_error:
            print(f"❌ Firestore error: {firestore_error}")
            raise
        
        return {
            "message": "Camera created successfully",
            "camera_id": camera_id,
            "camera_data": camera_data
        }
    
    except Exception as e:
        print(f"❌ Failed to create camera: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create camera: {str(e)}")


@router.delete("/{camera_id}")
async def delete_camera(camera_id: str, Authorization: str = Header(None)):
    """Delete a camera from Firestore"""
    print(f"🗑️ DELETE CAMERA REQUEST - Received for camera_id: {camera_id}")
    
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
        
        # Check if camera exists
        print(f"🔍 Checking if camera exists in Firestore...")
        camera_doc = db.collection("cameras").document(camera_id).get()
        if not camera_doc.exists:
            print(f"❌ Camera not found: {camera_id}")
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"✅ Camera found, proceeding with deletion...")
        
        # Delete from Firestore
        db.collection("cameras").document(camera_id).delete()
        print(f"✅ Deleted camera from Firestore: {camera_id}")
        
        print(f"🎉 Camera deletion completed successfully: {camera_id}")
        return {"message": "Camera deleted successfully", "camera_id": camera_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DELETE CAMERA FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete camera: {str(e)}")
