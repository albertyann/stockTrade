from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.index_daily import IndexDailyResponse
from ...crud.index_daily import get_latest_index_data, get_index_daily_by_code

router = APIRouter()


@router.get("/latest", response_model=List[IndexDailyResponse])
async def get_latest_indices(db: Session = Depends(get_db)):
    indices = get_latest_index_data(db)
    return indices


@router.get("/{ts_code}", response_model=List[IndexDailyResponse])
async def get_index_daily_history(
    ts_code: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    data = get_index_daily_by_code(db, ts_code, skip, limit)
    return data
