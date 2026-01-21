from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.stock import StockResponse, StockCreate, StockUpdate, PaginatedStocks
from ...crud import stock as stock_crud
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.post("/", response_model=StockResponse)
async def create_stock(
    stock: StockCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if stock.ts_code:
        db_stock = stock_crud.get_stock_by_ts_code(db, ts_code=stock.ts_code)
        if db_stock:
            raise HTTPException(status_code=400, detail="Stock ts_code already registered")
    return stock_crud.create_stock(db=db, stock=stock)


@router.get("/", response_model=PaginatedStocks)
async def read_stocks(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = stock_crud.get_stocks(db, skip=skip, limit=limit, search=search)
    return result


@router.get("/{stock_id}", response_model=StockResponse)
async def read_stock(
    stock_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_stock = stock_crud.get_stock(db, stock_id=stock_id)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@router.put("/{stock_id}", response_model=StockResponse)
async def update_stock(
    stock_id: int,
    stock: StockUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_stock = stock_crud.update_stock(db=db, stock_id=stock_id, stock=stock)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@router.delete("/{stock_id}")
async def delete_stock(
    stock_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    success = stock_crud.delete_stock(db=db, stock_id=stock_id)
    if not success:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {"message": "Stock deleted successfully"}
