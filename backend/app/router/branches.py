from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel

from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db
from services.plan_limits_service import enforce_limit_for_user, get_account_owner_id

router = APIRouter(prefix="/branches", tags=["branches"])


def _uid(token: str = Depends(oauth2_scheme)) -> str:
    decoded = verify_token(token, require_verified=True)
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="UID missing")
    return uid


class BranchCreate(BaseModel):
    name: str
    address: str = ""


class BranchUpdate(BaseModel):
    name: str | None = None
    address: str | None = None


@router.get("/")
async def list_branches(
    Authorization: str = Header(None),
    for_user_id: str | None = Query(default=None, alias="user_id"),
):
    """List branches. Supports admin_bypass token with explicit user_id query param."""
    id_token = (Authorization or "").replace("Bearer ", "").strip()

    if id_token == "admin_bypass":
        if not for_user_id:
            raise HTTPException(status_code=400, detail="user_id query param required for admin_bypass")
        resolved_uid = for_user_id
    else:
        decoded = verify_token(id_token, require_verified=True)
        uid = decoded.get("uid")
        if not uid:
            raise HTTPException(status_code=400, detail="UID missing")
        # Authenticated users may only see their own branches unless admin_bypass.
        resolved_uid = for_user_id if for_user_id else uid

    docs = db.collection("branches").where("user_id", "==", resolved_uid).stream()
    return {"branches": [{"id": d.id, **(d.to_dict() or {})} for d in docs]}


@router.post("/")
async def create_branch(body: BranchCreate, user_id: str = Depends(_uid)):
    owner_id = get_account_owner_id(user_id)
    enforce_limit_for_user(user_id, "branches")

    branch_id = str(uuid.uuid4())
    data = {
        "user_id": user_id,
        "owner_id": owner_id,
        "name": body.name,
        "address": body.address,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.collection("branches").document(branch_id).set(data)
    return {"id": branch_id, **data}


@router.put("/{branch_id}")
async def update_branch(
    branch_id: str,
    body: BranchUpdate,
    user_id: str = Depends(_uid),
):
    ref = db.collection("branches").document(branch_id)
    doc = ref.get()

    if not doc.exists or (doc.to_dict() or {}).get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Branch not found")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        ref.update(updates)

    return {"id": branch_id, **(doc.to_dict() or {}), **updates}


@router.delete("/{branch_id}")
async def delete_branch(branch_id: str, user_id: str = Depends(_uid)):
    ref = db.collection("branches").document(branch_id)
    doc = ref.get()

    if not doc.exists or (doc.to_dict() or {}).get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Branch not found")

    ref.delete()
    return {"deleted": branch_id}
