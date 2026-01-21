from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.index_basic import IndexBasic


def get_all_indices(db: Session, skip: int = 0, limit: int = 100) -> List[IndexBasic]:
    return db.query(IndexBasic).offset(skip).limit(limit).all()


def get_index_by_code(db: Session, ts_code: str) -> Optional[IndexBasic]:
    return db.query(IndexBasic).filter(IndexBasic.ts_code == ts_code).first()


def get_indices_by_category(db: Session, category: str) -> List[IndexBasic]:
    return db.query(IndexBasic).filter(IndexBasic.category == category).all()
