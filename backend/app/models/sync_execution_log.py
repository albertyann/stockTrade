from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class SyncExecutionLog(Base):
    """同步任务执行日志模型"""
    __tablename__ = "sync_execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("sync_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    execution_type = Column(String(50), comment="执行类型: manual, scheduled, retry")
    started_at = Column(DateTime(timezone=True), server_default=func.now(), comment="开始时间")
    finished_at = Column(DateTime(timezone=True), comment="结束时间")
    status = Column(String(20), comment="执行状态: success, failed, running")
    records_processed = Column(Integer, default=0, comment="处理记录数")
    error_message = Column(Text, comment="错误信息")
    output_summary = Column(JSON, default={}, comment="执行结果摘要")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    task = relationship("SyncTask", back_populates="execution_logs")

    def __repr__(self):
        return f"<SyncExecutionLog(id={self.id}, task_id={self.task_id}, status={self.status})>"
