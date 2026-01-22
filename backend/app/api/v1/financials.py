from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.stock_income_statement import StockIncomeStatementResponse
from ...schemas.stock_balance_sheet import StockBalanceSheetResponse
from ...schemas.stock_cash_flow import StockCashFlowResponse
from ...crud.stock_income_statement import get_income_statements
from ...crud.stock_balance_sheet import get_balance_sheets
from ...crud.stock_cash_flow import get_cash_flows
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.get("/{stock_id}/income", response_model=List[StockIncomeStatementResponse])
async def get_income_statements_by_stock(
    stock_id: int,
    skip: int = 0,
    limit: int = 10,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    statements = get_income_statements(db, stock_id=stock_id, skip=skip, limit=limit)
    return statements


@router.get("/{stock_id}/balance", response_model=List[StockBalanceSheetResponse])
async def get_balance_sheets_by_stock(
    stock_id: int,
    skip: int = 0,
    limit: int = 10,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sheets = get_balance_sheets(db, stock_id=stock_id, skip=skip, limit=limit)
    return sheets


@router.get("/{stock_id}/cashflow", response_model=List[StockCashFlowResponse])
async def get_cash_flows_by_stock(
    stock_id: int,
    skip: int = 0,
    limit: int = 10,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    flows = get_cash_flows(db, stock_id=stock_id, skip=skip, limit=limit)
    return flows
