from sqlalchemy import Column, String, Float, Integer, DateTime, Date
from sqlalchemy.sql import func
from ..database import Base


class IndexBasic(Base):
    """指数基本信息表"""
    __tablename__ = "index_basic"

    ts_code = Column(String(20), primary_key=True, comment="TS代码")
    name = Column(String(50), comment="指数名称")
    market = Column(String(10), comment="市场")
    publisher = Column(String(50), comment="发布方")
    index_type = Column(String(20), comment="指数类型")
    category = Column(String(50), comment="指数类别")
    base_date = Column(Date, comment="基期")
    base_point = Column(Float, comment="基点")
    list_date = Column(Date, comment="上市日期")
    weight_rule = Column(String(50), comment="加权规则")
    desc = Column(String(500), comment="描述")
    exp_date = Column(Date, comment="终止日期")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
