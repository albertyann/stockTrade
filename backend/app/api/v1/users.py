from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.user import UserResponse, UserUpdate
from ...crud import user as user_crud
from ...core.security import get_current_active_user
from ...models.user import User

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return user_crud.update_user(db=db, user_id=current_user.id, user=user)


@router.delete("/me")
async def delete_user_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_crud.delete_user(db=db, user_id=current_user.id)
    return {"message": "User deleted successfully"}
