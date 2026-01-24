from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...database import get_db
from ...schemas.trading import (
    OrderResponse,
    OrderCreate,
    OrderUpdate,
    PositionResponse,
    PositionCreate,
    PositionUpdate,
    PortfolioResponse,
    PortfolioCreate,
    PortfolioUpdate,
    TransactionResponse,
    PlaceOrderRequest,
    CancelOrderRequest,
    PortfolioSummary,
    PaginatedOrderResponse,
    PaginatedPositionResponse,
)
from ...schemas.user import UserResponse
from ...core.security import get_current_active_user
from ...crud import trading as trading_crud
from ...services.trading_service import TradingService

router = APIRouter()


# Orders endpoints
@router.post("/orders", response_model=dict)
async def place_order(
    request: PlaceOrderRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TradingService(db)
    result = service.place_order(request, current_user.id)
    return result


@router.get("/orders", response_model=PaginatedOrderResponse)
async def read_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    side: Optional[str] = None,
    strategy_id: Optional[int] = None,
    stock_id: Optional[int] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = trading_crud.get_orders(
        db, skip=skip, limit=limit, user_id=current_user.id,
        status=status, side=side, strategy_id=strategy_id, stock_id=stock_id
    )
    return result


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def read_order(
    order_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_order = trading_crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this order")
    
    return db_order


@router.put("/orders/{order_id}/cancel", response_model=dict)
async def cancel_order(
    order_id: int,
    request: CancelOrderRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TradingService(db)
    result = service.cancel_order(order_id, request)
    return result


# Positions endpoints
@router.get("/positions", response_model=PaginatedPositionResponse)
async def read_positions(
    skip: int = 0,
    limit: int = 100,
    strategy_id: Optional[int] = None,
    stock_id: Optional[int] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = trading_crud.get_positions(
        db, skip=skip, limit=limit, user_id=current_user.id,
        strategy_id=strategy_id, stock_id=stock_id
    )
    return result


@router.get("/positions/{position_id}", response_model=PositionResponse)
async def read_position(
    position_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_position = trading_crud.get_position(db, position_id=position_id)
    if db_position is None:
        raise HTTPException(status_code=404, detail="Position not found")
    
    if db_position.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this position")
    
    return db_position


@router.put("/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    position: PositionUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_position = trading_crud.get_position(db, position_id=position_id)
    if db_position is None:
        raise HTTPException(status_code=404, detail="Position not found")
    
    if db_position.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this position")
    
    updated = trading_crud.update_position(db, position_id=position_id, position=position)
    if updated is None:
        raise HTTPException(status_code=404, detail="Position not found")
    
    return updated


@router.delete("/positions/{position_id}")
async def delete_position(
    position_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_position = trading_crud.get_position(db, position_id=position_id)
    if db_position is None:
        raise HTTPException(status_code=404, detail="Position not found")
    
    if db_position.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this position")
    
    success = trading_crud.delete_position(db, position_id=position_id)
    if not success:
        raise HTTPException(status_code=404, detail="Position not found")
    
    return {"message": "Position deleted successfully"}


# Portfolio endpoints
@router.get("/portfolio", response_model=PortfolioSummary)
async def get_portfolio_summary(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TradingService(db)
    summary = service.get_portfolio_summary(current_user.id)
    return summary


@router.get("/portfolio/breakdown", response_model=List[dict])
async def get_portfolio_breakdown(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TradingService(db)
    breakdown = service.get_position_breakdown(current_user.id)
    return breakdown


@router.get("/portfolio/history", response_model=dict)
async def get_portfolio_history(
    skip: int = 0,
    limit: int = 100,
    strategy_id: Optional[int] = None,
    as_of_date: Optional[datetime] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = trading_crud.get_portfolios(
        db, skip=skip, limit=limit, user_id=current_user.id,
        strategy_id=strategy_id, as_of_date=as_of_date
    )
    return result


@router.post("/portfolio/update-prices")
async def update_portfolio_prices(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TradingService(db)
    service.update_positions_prices(current_user.id)
    return {"message": "Portfolio prices updated successfully"}


# Transactions endpoints
@router.get("/transactions", response_model=dict)
async def read_transactions(
    skip: int = 0,
    limit: int = 100,
    strategy_id: Optional[int] = None,
    order_id: Optional[int] = None,
    stock_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = trading_crud.get_transactions(
        db, skip=skip, limit=limit, user_id=current_user.id,
        strategy_id=strategy_id, order_id=order_id, stock_id=stock_id,
        transaction_type=transaction_type, start_date=start_date, end_date=end_date
    )
    return result


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def read_transaction(
    transaction_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_transaction = trading_crud.get_transaction(db, transaction_id=transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if db_transaction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
    
    return db_transaction


# Dashboard endpoints
@router.get("/dashboard")
async def get_trading_dashboard(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TradingService(db)
    
    portfolio_summary = service.get_portfolio_summary(current_user.id)
    position_breakdown = service.get_position_breakdown(current_user.id)
    
    orders = trading_crud.get_orders(db, user_id=current_user.id, limit=10)
    recent_transactions = trading_crud.get_transactions(db, user_id=current_user.id, limit=10)
    
    return {
        "portfolio": portfolio_summary,
        "positions": position_breakdown,
        "recent_orders": orders["data"],
        "recent_transactions": recent_transactions["data"],
    }
