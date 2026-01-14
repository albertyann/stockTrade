from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...schemas.sync import SyncRequest, SyncResult, SyncStatus
from ...services.data_sync_service import DataSyncService
from ...core.security import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()


@router.post("/stocks", response_model=SyncResult)
async def sync_stock_data(
    sync_request: SyncRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sync_service = DataSyncService(db)
    result = sync_service.sync_stock_data(sync_request.dict())
    return result


@router.post("/financials", response_model=SyncResult)
async def sync_financial_data(
    sync_request: SyncRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sync_service = DataSyncService(db)
    result = sync_service.sync_stock_data({"stock_codes": sync_request.stock_codes, "sync_type": "financial"})
    return result


@router.get("/status", response_model=SyncStatus)
async def get_sync_status(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sync_service = DataSyncService(db)
    status = sync_service.get_sync_status()
    return status


@router.post("/all-stocks", response_model=SyncResult)
async def sync_all_stocks(
    list_status: str = "L",
    market: str = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    sync_service = DataSyncService(db)
    result = sync_service.sync_all_chinese_stocks(list_status=list_status, market=market)
    return result
