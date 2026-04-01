from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db

router = APIRouter(prefix="/violations", tags=["violations"])

SNAPSHOT_DIR = Path(__file__).resolve().parents[2] / "model" / "saved_snapshots"


def _uid_and_email(token: str = Depends(oauth2_scheme)) -> tuple:
    decoded = verify_token(token, require_verified=True)
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="User ID missing in token")
    return uid, decoded.get("email")


@router.get("/user")
async def list_user_violations(
    limit: int = Query(default=100, ge=1, le=1000),
    token: str = Depends(oauth2_scheme),
):
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    try:
        items = []
        for doc in db.collection("violations").where("user_id", "==", user_id).stream():
            d = doc.to_dict() or {}
            vtype = str(d.get("violation_type", "unknown"))
            violation_id = str(d.get("violation_id") or doc.id)
            has_snapshot = bool(d.get("snapshot_filename"))
            items.append({
                "id":             violation_id,
                "violation_type": vtype,
                "camera_id":      d.get("camera_id", "Unknown"),
                "violation_time": str(d.get("violation_time", "")),
                "confidence":     d.get("confidence"),
                "resolved":       d.get("resolved", False),
                "has_snapshot":   has_snapshot,
                "snapshot_url":   f"/violations/{violation_id}/image" if has_snapshot else None,
            })
        items.sort(key=lambda x: x["violation_time"], reverse=True)
        return items[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{violation_id}/image")
async def get_violation_image(
    violation_id: str,
    token: str = Depends(oauth2_scheme),
):
    print(f"[violations.image] request received for violation_id={violation_id}")
    decoded = verify_token(token, require_verified=True)
    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    # Auth check — verify this violation belongs to the user
    print(f"[violations.image] authenticated user_id={user_id}")
    doc = db.collection("violations").document(violation_id).get()
    if not doc.exists:
        print(f"[violations.image] no Firestore doc found for id={violation_id}")
        raise HTTPException(status_code=404, detail="Violation not found")

    payload = doc.to_dict() or {}
    print(f"[violations.image] Firestore payload keys={list(payload.keys())}")
    if payload.get("user_id") != user_id:
        print(
            f"[violations.image] forbidden: payload.user_id={payload.get('user_id')} does not match auth user_id={user_id}"
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    # Match: snapshot_filename stored in Firestore (always {violation_id}.jpg)
    filename = str(payload.get("snapshot_filename") or f"{violation_id}.jpg")
    image_path = SNAPSHOT_DIR / filename
    print(f"[violations.image] snapshot_dir={SNAPSHOT_DIR}")
    print(f"[violations.image] trying exact path={image_path}")

    if image_path.exists():
        print(f"[violations.image] exact match found -> {image_path}")
        return FileResponse(str(image_path), media_type="image/jpeg", filename=filename)

    wildcard_matches = []
    for ext in ["jpg", "jpeg", "png"]:
        wildcard_matches.extend(SNAPSHOT_DIR.glob(f"*{violation_id}*.{ext}"))
    print(f"[violations.image] exact missing; wildcard matches={len(wildcard_matches)}")
    for match in wildcard_matches:
        print(f"[violations.image] wildcard candidate={match}")
        if match.exists():
            print(f"[violations.image] wildcard match found -> {match}")
            return FileResponse(str(match), media_type="image/jpeg", filename=match.name)

    print(f"[violations.image] no image found for violation_id={violation_id}")
    raise HTTPException(status_code=404, detail="Snapshot not found")
    print(f"[DEBUG] SNAPSHOT_DIR absolute = {SNAPSHOT_DIR.resolve()}")
    print(f"[DEBUG] Exists? {SNAPSHOT_DIR.exists()}")
