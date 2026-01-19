from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class UploadedFileBase(BaseModel):
    stock_id: Optional[int]
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
