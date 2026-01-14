from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class StockBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    market: Optional[str] = Field(None, max_length=20)
    industry: Optional[str] = Field(None, max_length=100)
    description: Optional[str]


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    market: Optional[str] = Field(None, max_length=20)
    industry: Optional[str] = Field(None, max_length=100)
    description: Optional[str]


class StockResponse(StockBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
