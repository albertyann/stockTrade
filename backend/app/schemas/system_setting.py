from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SystemSettingBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    value: str
    value_type: str = Field(default='string', pattern='^(string|integer|boolean|json)$')
    description: Optional[str]
    category: str = Field(..., pattern='^(ai|scheduler|system)$')
    is_encrypted: bool = False


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str]


class SystemSettingResponse(SystemSettingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AISettings(BaseModel):
    provider: str = 'openai'
    api_key: str
    model: str = 'gpt-4'
    temperature: float = 0.7
    max_tokens: int = 2000
    timeout: int = 60


class SchedulerSettings(BaseModel):
    enabled: bool = True
    max_workers: int = 4
    task_timeout: int = 300
