from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SyncRequest(BaseModel):
    stock_codes: Optional[List[str]] = None
    sync_type: str = Field(..., pattern="^(stock|financial|all)$")


class SyncResult(BaseModel):
    success: bool
    message: str
    synced_count: int
    failed_count: int
    failures: Optional[List[str]]


class SyncStatus(BaseModel):
    last_sync_time: Optional[datetime]
    next_sync_time: Optional[datetime]
    syncing: bool
    status: str
