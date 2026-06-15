import os
import re
from urllib.parse import quote, urlparse
from urllib.request import Request as UrlRequest, urlopen

from fastapi import APIRouter, HTTPException, Header, Query
from firebase_admin import auth as firebase_auth
from ..database.db import db
from datetime import datetime
from pydantic import BaseModel
from services.plan_limits_service import enforce_limit_for_user, get_account_owner_id

CLOCK_SKEW_SECONDS = 10
PUBLIC_API_BASE_URL = "http://127.0.0.1:8000"


def _find_videos_dir() -> str:
    router_dir = os.path.dirname(__file__)
    candidates = [
        os.path.normpath(os.path.join(router_dir, "..", "videos")),
        os.path.normpath(os.path.join(router_dir, "..", "..", "videos")),
    ]

    for candidate in candidates:
        if os.path.isdir(candidate):
            return candidate

    return candidates[0]


def _normalize_local_video_path(value: str) -> str:
    file_name = os.path.basename(value.strip())
    return os.path.join(_find_videos_dir(), file_name)


def _looks_like_ipv4(value: str) -> bool:
    return bool(
        re.fullmatch(
            r"(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}", value
        )
    )


def _resolve_source_url(source_type: str, source_value: str) -> str:
    candidate = source_value.strip()
    if not candidate:
        raise HTTPException(status_code=400, detail="Missing camera source")

    if source_type == "video":
        parsed = urlparse(candidate)
        if parsed.scheme in {"http", "https"}:
            return candidate

        local_path = _normalize_local_video_path(candidate)
        if not os.path.exists(local_path):
            raise HTTPException(
                status_code=400,
                detail=f"Video file not found in videos folder: {os.path.basename(local_path)}",
            )

        return f"{PUBLIC_API_BASE_URL}/videos/{quote(os.path.basename(local_path))}"

    parsed = urlparse(candidate)
    if parsed.scheme in {"http", "https", "rtsp"}:
        return candidate

    if _looks_like_ipv4(candidate):
        return f"http://{candidate}"

    raise HTTPException(
        status_code=400,
        detail="Camera IP must be a valid IPv4 address or URL",
    )


def _probe_source(source_url: str, source_type: str) -> None:
    if source_type == "video" and source_url.startswith(PUBLIC_API_BASE_URL):
        return

    try:
        request = UrlRequest(source_url, method="HEAD")
        with urlopen(request, timeout=3):
            return
    except Exception:
        if source_type == "ip":
            raise HTTPException(
                status_code=400,
                detail="Camera source could not be reached. Check the IP address or stream URL.",
            )


def _build_camera_payload(request: "CreateCameraRequest") -> dict:
    source_url = _resolve_source_url(request.source_type, request.source_value)
    _probe_source(source_url, request.source_type)
    source_label = request.source_value.strip()

    return {
        "branch": request.branch,
        "branch_id": request.branch_id,
        "ip_address": request.ip_address,
        "location": request.location,
        "status": request.status,
        "user_id": request.user_id,
        "source_type": request.source_type,
        "source_value": source_label,
        "stream_url": source_url,
        "starting_date": datetime.now().strftime("%d-%m-%y,%I:%M%p"),
        "createdAt": datetime.now().isoformat(),
    }


router = APIRouter(prefix="/cameras", tags=["cameras"])


class CreateCameraRequest(BaseModel):
    branch: str
    branch_id: str | None = None
    ip_address: str
    location: str
    source_type: str = "ip"
    source_value: str
    status: str = "active"
    user_id: str = ""


class TestCameraSourceRequest(BaseModel):
    source_type: str = "ip"
    source_value: str


@router.get("/")
async def get_all_cameras(
    Authorization: str = Header(None),
    user_id: str | None = Query(default=None),
    branch_id: str | None = Query(default=None),
):
    """Get all cameras from Firestore"""
    try:
        # Admin bypass or verify token
        id_token = (Authorization or "").replace("Bearer ", "")
        active_user_id = None

        if id_token != "admin_bypass" and id_token:
            try:
                decoded_token = firebase_auth.verify_id_token(
                    id_token,
                    clock_skew_seconds=CLOCK_SKEW_SECONDS,
                )
                active_user_id = decoded_token.get("uid")
            except Exception as e:
                print(f"Token verification failed: {e}")
                raise HTTPException(status_code=401, detail="Invalid token")
        elif user_id:
            active_user_id = user_id

        # Fetch all cameras from Firestore
        cameras_ref = db.collection("cameras")
        cameras_docs = cameras_ref.stream()

        cameras_list = []
        for doc in cameras_docs:
            camera_data = doc.to_dict()
            camera_data["id"] = doc.id  # Add document ID
            if active_user_id and camera_data.get("user_id") != active_user_id:
                continue
            if branch_id and branch_id != "all" and camera_data.get("branch_id") != branch_id:
                continue
            cameras_list.append(camera_data)

        return {"cameras": cameras_list}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch cameras: {str(e)}"
        )


@router.post("/test")
async def test_camera_source(
    request: TestCameraSourceRequest,
    Authorization: str = Header(None),
):
    """Validate that a camera source is reachable before saving it."""
    try:
        id_token = (Authorization or "").replace("Bearer ", "")

        if id_token != "admin_bypass" and id_token:
            try:
                firebase_auth.verify_id_token(
                    id_token,
                    clock_skew_seconds=CLOCK_SKEW_SECONDS,
                )
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid token")

        source_url = _resolve_source_url(request.source_type, request.source_value)
        _probe_source(source_url, request.source_type)

        return {
            "ok": True,
            "source_type": request.source_type,
            "source_value": request.source_value.strip(),
            "stream_url": source_url,
            "message": "Camera source is reachable",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to test camera source: {str(e)}"
        )


@router.post("/")
async def create_camera(
    request: CreateCameraRequest, Authorization: str = Header(None)
):
    """Create a new camera"""
    try:
        print(f"📥 Received camera creation request")
        print(f"   Branch: {request.branch}")
        print(f"   IP: {request.ip_address}")
        print(f"   Location: {request.location}")
        print(f"   Source Type: {request.source_type}")
        print(f"   Source Value: {request.source_value}")
        print(f"   Status: {request.status}")
        print(f"   User ID: {request.user_id}")

        # Admin bypass or verify token
        id_token = (Authorization or "").replace("Bearer ", "")

        decoded_token = None
        if id_token != "admin_bypass" and id_token:
            try:
                decoded_token = firebase_auth.verify_id_token(
                    id_token,
                    clock_skew_seconds=CLOCK_SKEW_SECONDS,
                )
            except Exception as e:
                print(f"Token verification failed: {e}")
                raise HTTPException(status_code=401, detail="Invalid token")

        target_user_id = str(request.user_id or "").strip() or str((decoded_token or {}).get("uid") or "").strip()
        if not target_user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        owner_id = get_account_owner_id(target_user_id)
        enforce_limit_for_user(target_user_id, "cameras")
        request.user_id = target_user_id

        # Enforce: same IP / source path cannot be assigned to two different branches.
        incoming_ip = str(request.ip_address or "").strip().lower()
        incoming_source = str(request.source_value or "").strip().lower()
        incoming_branch_id = str(request.branch_id or "").strip()

        existing_cameras = (
            db.collection("cameras")
            .where("owner_id", "==", owner_id)
            .stream()
        )
        # Fallback for cameras without owner_id: also check by user_id.
        legacy_cameras = (
            db.collection("cameras")
            .where("user_id", "==", target_user_id)
            .stream()
        )
        seen_cam_ids: set[str] = set()
        all_cams: list[dict] = []
        for doc in list(existing_cameras) + list(legacy_cameras):
            if doc.id in seen_cam_ids:
                continue
            seen_cam_ids.add(doc.id)
            all_cams.append(doc.to_dict() or {})

        for cam in all_cams:
            existing_ip = str(cam.get("ip_address") or "").strip().lower()
            existing_source = str(cam.get("source_value") or "").strip().lower()
            existing_branch_id = str(cam.get("branch_id") or "").strip()

            source_matches = (
                (incoming_ip and existing_ip and incoming_ip == existing_ip)
                or (incoming_source and existing_source and incoming_source == existing_source)
            )
            if not source_matches:
                continue

            # Same source on the same branch (or no branch) — outright duplicate.
            if incoming_branch_id == existing_branch_id:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This camera source is already registered in this branch. "
                        "Each camera source can only be added once per branch."
                    ),
                )

            # Same source on a different branch — also not allowed.
            if incoming_branch_id and existing_branch_id and incoming_branch_id != existing_branch_id:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This camera source is already assigned to a different branch. "
                        "A camera cannot be shared across multiple branches."
                    ),
                )

        # Create camera document
        camera_data = _build_camera_payload(request)
        camera_data["owner_id"] = owner_id

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
            "camera_data": camera_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to create camera: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to create camera: {str(e)}"
        )


@router.delete("/{camera_id}")
async def delete_camera(camera_id: str, Authorization: str = Header(None)):
    """Delete a camera from Firestore"""
    print(f"🗑️ DELETE CAMERA REQUEST - Received for camera_id: {camera_id}")

    try:
        # Admin bypass or verify token
        id_token = (Authorization or "").replace("Bearer ", "")
        print(
            f"🔑 Token: {'admin_bypass' if id_token == 'admin_bypass' else 'user token'}"
        )

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
        raise HTTPException(
            status_code=500, detail=f"Failed to delete camera: {str(e)}"
        )
