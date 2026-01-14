from pydantic import BaseModel
from datetime import datetime
from .stock import StockResponse


class UserStockBase(BaseModel):
    stock_id: int


class UserStockCreate(UserStockBase):
    pass


class UserStockResponse(BaseModel):
    id: int
    user_id: int
    stock_id: int
    created_at: datetime
    stock: StockResponse
    
    class Config:
        from_attributes = True
