from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    stock_id = Column(Integer, nullable=True)
    file_name = Column(String(200), nullable=False)
    file_type = Column(String(50))
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    tags = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
