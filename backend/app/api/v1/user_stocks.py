from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.user_stock import UserStockResponse, UserStockCreate, PaginatedUserStocks
from ...crud import user_stock as user_stock_crud
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.post("/", response_model=UserStockResponse)
async def create_user_stock(
    user_stock: UserStockCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_user_stock = user_stock_crud.get_user_stock_by_user_and_stock(
        db, user_id=current_user.id, stock_id=user_stock.stock_id
    )
    if db_user_stock:
        raise HTTPException(status_code=400, detail="Stock already in user's portfolio")
    return user_stock_crud.create_user_stock(db=db, user_stock=user_stock, user_id=current_user.id)


@router.get("/", response_model=PaginatedUserStocks)
async def read_user_stocks(
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_stocks = user_stock_crud.get_user_stocks_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return user_stocks


@router.delete("/{user_stock_id}")
async def delete_user_stock(
    user_stock_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    success = user_stock_crud.delete_user_stock(db=db, user_stock_id=user_stock_id)
    if not success:
        raise HTTPException(status_code=404, detail="User stock not found")
    return {"message": "User stock deleted successfully"}
