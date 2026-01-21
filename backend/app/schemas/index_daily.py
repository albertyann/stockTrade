from pydantic import BaseModel
from datetime import date


class IndexDailyResponse(BaseModel):
    ts_code: str
    name: str
    trade_date: date
    open: float
    high: float
    low: float
    close: float
    pre_close: float
    change: float
    pct_chg: float
    vol: float
    amount: float

    class Config:
        from_attributes = True
