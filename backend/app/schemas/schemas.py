from pydantic import BaseModel, EmailStr


class Signup(BaseModel):
    email: EmailStr
    Fullname: str
    Branchname: str
    


class profile(BaseModel):
    email: EmailStr
    Fullname: str
    Branchname: str
