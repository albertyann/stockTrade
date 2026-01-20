from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class SyncInterfaceBase(BaseModel):
    interface_name: str = Field(..., description="接口名称，如 daily, daily_basic")
    description: Optional[str] = None
    interface_params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    data_model: Optional[str] = None
    enabled: bool = True


class SyncInterfaceCreate(SyncInterfaceBase):
    pass


class SyncInterfaceUpdate(BaseModel):
    interface_name: Optional[str] = None
    description: Optional[str] = None
    interface_params: Optional[Dict[str, Any]] = None
    data_model: Optional[str] = None
    enabled: Optional[bool] = None


class SyncInterfaceResponse(SyncInterfaceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SyncTaskBase(BaseModel):
    task_name: str = Field(..., description="任务名称")
    interface_id: int = Field(..., description="关联的同步接口ID")
    schedule_type: str = Field(..., pattern="^(cron|interval|date)$", description="调度类型")
    schedule_config: Dict[str, Any] = Field(..., description="调度配置")
    task_params: Optional[Dict[str, Any]] = Field(default_factory=dict, description="任务参数")
    retry_policy: Optional[Dict[str, Any]] = Field(default={"max_retries": 3, "backoff_factor": 2}, description="重试策略")


class SyncTaskCreate(SyncTaskBase):
    pass


class SyncTaskUpdate(BaseModel):
    task_name: Optional[str] = None
    interface_id: Optional[int] = None
    schedule_type: Optional[str] = Field(None, pattern="^(cron|interval|date)$")
    schedule_config: Optional[Dict[str, Any]] = None
    task_params: Optional[Dict[str, Any]] = None
    retry_policy: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, pattern="^(active|paused|error)$")


class SyncTaskResponse(SyncTaskBase):
    id: int
    status: str
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    last_run_status: Optional[str] = None
    last_error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SyncExecutionLogBase(BaseModel):
    task_id: int
    execution_type: str = Field(..., pattern="^(manual|scheduled|retry)$")
    records_processed: int = 0
    error_message: Optional[str] = None
    output_summary: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SyncExecutionLogCreate(SyncExecutionLogBase):
    pass


class SyncExecutionLogResponse(SyncExecutionLogBase):
    id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
