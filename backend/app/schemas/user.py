from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import RoleEnum

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[RoleEnum] = RoleEnum.student
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    # Password change could be separate or included, but let's keep it simple for profile update

class UserResponse(UserBase):
    id: int
    is_approved: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class SocialLoginRequest(BaseModel):
    provider: str
    email: EmailStr
    name: str
