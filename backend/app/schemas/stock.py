from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class StockBase(BaseModel):
    ts_code: Optional[str] = Field(None, max_length=20)
    symbol: Optional[str] = Field(None, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    area: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    fullname: Optional[str] = Field(None, max_length=200)
    enname: Optional[str] = Field(None, max_length=200)
    cnspell: Optional[str] = Field(None, max_length=50)
    market: Optional[str] = Field(None, max_length=20)
    exchange: Optional[str] = Field(None, max_length=10)
    curr_type: Optional[str] = Field(None, max_length=10)
    list_status: Optional[str] = Field(None, max_length=5)
    list_date: Optional[date] = None
    delist_date: Optional[date] = None
    is_hs: Optional[str] = Field(None, max_length=5)
    act_name: Optional[str] = Field(None, max_length=200)
    act_ent_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    area: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    fullname: Optional[str] = Field(None, max_length=200)
    enname: Optional[str] = Field(None, max_length=200)
    cnspell: Optional[str] = Field(None, max_length=50)
    market: Optional[str] = Field(None, max_length=20)
    exchange: Optional[str] = Field(None, max_length=10)
    curr_type: Optional[str] = Field(None, max_length=10)
    list_status: Optional[str] = Field(None, max_length=5)
    list_date: Optional[date] = None
    delist_date: Optional[date] = None
    is_hs: Optional[str] = Field(None, max_length=5)
    act_name: Optional[str] = Field(None, max_length=200)
    act_ent_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class StockResponse(StockBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PaginatedStocks(BaseModel):
    data: list[StockResponse]
    total: int
