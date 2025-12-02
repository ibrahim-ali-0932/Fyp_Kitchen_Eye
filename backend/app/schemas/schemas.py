from pydantic import BaseModel, EmailStr


class Signup(BaseModel):
    email: EmailStr
    full_name: str
    organization: str
    


class profile(BaseModel):
    email: EmailStr
    Fullname: str
    Branchname: str
