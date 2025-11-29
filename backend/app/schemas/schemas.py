from pydantic import BaseModel, EmailStr


class Signup(BaseModel):
    email: EmailStr
    Fullname: str
    Branchname: str
    password: str


class profile(BaseModel):
    email: EmailStr
    Fullname: str
    Branchname: str
