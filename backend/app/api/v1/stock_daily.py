from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.stock_daily import StockDailyResponse
from ...crud.stock_daily import get_stock_daily_by_ts_code, get_latest_stock_daily, get_stock_daily_by_date_range, count_stock_daily
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse
from ...services.data_sync_service import DataSyncService

router = APIRouter()


@router.get("/{ts_code}", response_model=List[StockDailyResponse])
async def get_stock_daily(
    ts_code: str,
    skip: int = 0,
    limit: int = 1000,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    data_count = count_stock_daily(db, ts_code=ts_code)

    if data_count == 0:
        sync_service = DataSyncService(db)
        try:
            sync_service.sync_stock_trading_data(ts_code)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取K线数据失败: {str(e)}")

    daily_data = get_stock_daily_by_ts_code(db, ts_code=ts_code, skip=skip, limit=limit)
    return daily_data


@router.get("/{ts_code}/latest", response_model=StockDailyResponse)
async def get_latest_stock_daily_data(
    ts_code: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    data_count = count_stock_daily(db, ts_code=ts_code)

    if data_count == 0:
        sync_service = DataSyncService(db)
        try:
            sync_service.sync_stock_trading_data(ts_code)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取K线数据失败: {str(e)}")

    daily_data = get_latest_stock_daily(db, ts_code=ts_code)
    if daily_data is None:
        raise HTTPException(status_code=404, detail="Stock daily data not found")
    return daily_data


@router.get("/{ts_code}/range", response_model=List[StockDailyResponse])
async def get_stock_daily_by_range(
    ts_code: str,
    start_date: str,
    end_date: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    data_count = count_stock_daily(db, ts_code=ts_code)

    if data_count == 0:
        sync_service = DataSyncService(db)
        try:
            sync_service.sync_stock_trading_data(ts_code)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取K线数据失败: {str(e)}")

    daily_data = get_stock_daily_by_date_range(db, ts_code=ts_code, start_date=start_date, end_date=end_date)
    return daily_data
