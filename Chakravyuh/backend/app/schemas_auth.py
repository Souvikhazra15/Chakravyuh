from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = Field(..., description="peon, principal, deo, or contractor")
    school_id: Optional[int] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    name: Optional[str] = None
    role: Optional[str] = None
    school_id: Optional[int] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    name: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    school_id: Optional[int]
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
