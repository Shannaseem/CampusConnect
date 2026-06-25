from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User, RoleEnum
from app.api.deps import get_current_user, get_current_active_admin

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.department is not None:
        current_user.department = user_update.department
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[UserResponse])
def read_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    users = db.query(User).all()
    return users

@router.get("/students", response_model=List[UserResponse])
def get_all_students(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).lower()
    if user_role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).filter(User.role == RoleEnum.student).all()

@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure admin cannot delete themselves (optional safety feature)
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted successfully"}

@router.put("/{user_id}/approve", response_model=dict)
def approve_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_approved = 1
    db.commit()
    return {"status": "success", "message": "User approved successfully"}

@router.get("/pending", response_model=List[UserResponse])
def get_pending_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    users = db.query(User).filter(User.is_approved == 0).all()
    return users
