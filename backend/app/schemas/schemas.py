from pydantic import BaseModel, EmailStr
from typing import Optional


class Signup(BaseModel):
    email: EmailStr
    full_name: str
    organization: str
    address: str


class profile(BaseModel):
    email: EmailStr
    Fullname: str
    Branchname: str
    address: str
    plan: str = "basic"
    role: Optional[str] = None
    createdAt: Optional[str] = None
    subscription_status: Optional[str] = None
