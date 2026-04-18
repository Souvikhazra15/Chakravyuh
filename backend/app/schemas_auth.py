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

    class Config:
        from_attributes = True
