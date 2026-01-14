from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class AnalysisRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str]
    conditions: Dict[str, Any]
    priority: int = Field(..., ge=1, le=10)
    enabled: bool = True


class AnalysisRuleCreate(AnalysisRuleBase):
    pass


class AnalysisRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str]
    conditions: Optional[Dict[str, Any]]
    priority: Optional[int] = Field(None, ge=1, le=10)
    enabled: Optional[bool]


class AnalysisRuleResponse(AnalysisRuleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
