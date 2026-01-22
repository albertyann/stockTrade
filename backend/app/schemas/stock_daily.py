from pydantic import BaseModel
from pydantic import BeforeValidator
from typing import Annotated
from datetime import datetime, date
from typing import Optional

def convert_datetime(v):
    if isinstance(v, datetime):
        return v.date()
    return v

class StockDailyBase(BaseModel):
    ts_code: Optional[str] = None
    trade_date: Optional[datetime] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    pre_close: Optional[float] = None
    change: Optional[float] = None
    pct_chg: Optional[float] = None
    vol: Optional[float] = None
    amount: Optional[float] = None


class StockDailyResponse(StockDailyBase):
    created_at: Optional[Annotated[date, BeforeValidator(convert_datetime)]] = None

    class Config:
        from_attributes = True
