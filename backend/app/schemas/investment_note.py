from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class InvestmentNoteBase(BaseModel):
    stock_id: int
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str]
    tags: Optional[List[str]]


class InvestmentNoteCreate(InvestmentNoteBase):
    pass


class InvestmentNoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str]
    tags: Optional[List[str]]


class InvestmentNoteResponse(InvestmentNoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaginatedInvestmentNotes(BaseModel):
    data: list[InvestmentNoteResponse]
    total: int
