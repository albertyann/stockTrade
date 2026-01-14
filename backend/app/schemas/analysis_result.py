from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any


class AnalysisResult(BaseModel):
    rule_id: int
    stock_id: int
    timestamp: datetime
    data: Dict[str, Any]
    matched: bool


class AnalysisResultResponse(BaseModel):
    id: int
    rule_id: int
    stock_id: int
    timestamp: datetime
    data: Dict[str, Any]
    matched: bool
    
    class Config:
        from_attributes = True
