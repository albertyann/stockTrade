from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class SyncInterface(Base):
    """Tushare 同步接口配置模型"""
    __tablename__ = "sync_interfaces"

    id = Column(Integer, primary_key=True, index=True)
    interface_name = Column(String(100), unique=True, nullable=False, index=True, comment="接口名称，如 daily, daily_basic")
    description = Column(Text, comment="接口描述")
    interface_params = Column(JSON, default={}, comment="接口默认参数")
    data_model = Column(String(100), comment="对应的数据表模型")
    enabled = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    # 关系
    tasks = relationship("SyncTask", back_populates="interface", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SyncInterface(id={self.id}, name={self.interface_name})>"
