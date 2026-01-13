from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# 用户相关schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr]
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# 股票相关schemas
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


# 用户自选股相关schemas
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


# 投资笔记相关schemas
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


# 文件上传相关schemas
class UploadedFileBase(BaseModel):
    stock_id: int
    file_name: str = Field(..., min_length=1, max_length=200)
    file_type: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]]


class UploadedFileCreate(UploadedFileBase):
    pass


class UploadedFileUpdate(BaseModel):
    file_name: Optional[str] = Field(None, min_length=1, max_length=200)
    file_type: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]]


class UploadedFileResponse(BaseModel):
    id: int
    user_id: int
    stock_id: int
    file_name: str
    file_type: Optional[str]
    file_path: str
    file_size: Optional[int]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# 分析规则相关schemas
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


# 认证相关schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# 数据同步相关schemas
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


# 分析结果相关schemas
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
