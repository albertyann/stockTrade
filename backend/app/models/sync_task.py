from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class SyncTask(Base):
    """Tushare 同步任务配置模型"""
    __tablename__ = "sync_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(100), unique=True, nullable=False, index=True, comment="任务名称")
    interface_id = Column(Integer, ForeignKey("sync_interfaces.id", ondelete="CASCADE"), nullable=False, comment="关联的同步接口ID")
    schedule_type = Column(String(20), nullable=False, comment="调度类型: cron, interval, date")
    schedule_config = Column(JSON, nullable=False, comment="调度配置(JSON格式)")
    task_params = Column(JSON, default={}, comment="任务特定参数")
    retry_policy = Column(JSON, default={"max_retries": 3, "backoff_factor": 2}, comment="重试策略")
    status = Column(String(20), default="active", comment="任务状态: active, paused, error")
    last_run_at = Column(DateTime(timezone=True), comment="上次执行时间")
    next_run_at = Column(DateTime(timezone=True), comment="下次执行时间")
    last_run_status = Column(String(20), comment="上次执行状态: success, failed, running")
    last_error_message = Column(Text, comment="上次错误信息")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    interface = relationship("SyncInterface", back_populates="tasks")
    execution_logs = relationship("SyncExecutionLog", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SyncTask(id={self.id}, name={self.task_name}, status={self.status})>"
