from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, List, Optional


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


class AnalysisTaskCreate(BaseModel):
    task_name: str
    rule_ids: List[int]


class AnalysisTaskResponse(BaseModel):
    id: int
    user_id: int
    task_name: str
    ai_provider: Optional[str]
    ai_generated_script: Optional[str]
    ai_reasoning: Optional[str]
    execution_log: Optional[Dict[str, Any]]
    matched_stock_ids: Optional[List[int]]
    status: str
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AnalysisTaskExecuteResponse(BaseModel):
    task_id: int
    status: str
    message: str
