from fastapi import APIRouter, Depends, HTTPException, status, Header
from ..database import get_db
from ..schemas_auth import UserRegister, UserLogin, TokenResponse, UserResponse, UserUpdate
from ..utils.password_handler import hash_password, verify_password
from ..utils.jwt_handler import create_access_token, verify_token
from datetime import timedelta, datetime
from typing import Optional

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def extract_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract JWT token from Authorization header"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    return parts[1]


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db = Depends(get_db)):
    """Register a new user"""
    
    existing_user = await db.user.find_unique(where={"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = hash_password(user_data.password)
    
    new_user = await db.user.create(
        data={
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "role": user_data.role.lower(),
            "school_id": user_data.school_id,
        }
    )
    
    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db = Depends(get_db)):
    """Login user and return JWT token"""
    
    user = await db.user.find_unique(where={"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last_login timestamp
    user = await db.user.update(
        where={"id": user.id},
        data={"last_login": datetime.utcnow()}
    )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(db = Depends(get_db), token: str = Depends(extract_token)):
    """Get current logged-in user info"""
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = int(payload.get("sub"))
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.post("/refresh")
async def refresh_token(db = Depends(get_db), token: str = Depends(extract_token)):
    """Refresh JWT token"""
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = int(payload.get("sub"))
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    new_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
    }


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserUpdate, db = Depends(get_db), token: str = Depends(extract_token)):
    """Update user information (name, role, school_id)"""
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    current_user_id = int(payload.get("sub"))
    
    # Users can only update their own profile (except principals)
    if current_user_id != user_id:
        current_user = await db.user.find_unique(where={"id": current_user_id})
        if not current_user or current_user.role != "principal":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this user"
            )
    
    # Check if user exists
    existing_user = await db.user.find_unique(where={"id": user_id})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update data - only update fields that are provided
    update_data = {}
    if user_data.name is not None:
        update_data["name"] = user_data.name
    if user_data.role is not None:
        update_data["role"] = user_data.role.lower()
    if user_data.school_id is not None:
        update_data["school_id"] = user_data.school_id
    
    # If no data to update, return existing user
    if not update_data:
        return existing_user
    
    # Update user in database
    updated_user = await db.user.update(
        where={"id": user_id},
        data=update_data
    )
    
    return updated_user


@router.get("/users", response_model=list[UserResponse])
async def list_users(db = Depends(get_db), token: str = Depends(extract_token)):
    """List all users (principals only)"""
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    current_user_id = int(payload.get("sub"))
    current_user = await db.user.find_unique(where={"id": current_user_id})
    
    # Only principals can list users
    if not current_user or current_user.role != "principal":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only principals can list users"
        )
    
    # Get all users
    users = await db.user.find_many()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db = Depends(get_db), token: str = Depends(extract_token)):
    """Get specific user by ID"""
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user
