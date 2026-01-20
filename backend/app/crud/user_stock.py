from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from ..models.user_stock import UserStock
from ..schemas.user_stock import UserStockCreate
from typing import Optional


def get_user_stock(db: Session, user_stock_id: int) -> Optional[UserStock]:
    return db.query(UserStock).filter(UserStock.id == user_stock_id).first()


def get_user_stocks_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    total = db.query(UserStock).filter(UserStock.user_id == user_id).count()
    stocks = db.query(UserStock).options(joinedload(UserStock.stock)).filter(UserStock.user_id == user_id).offset(skip).limit(limit).all()
    return {"data": stocks, "total": total}

def get_user_stock_by_user_and_stock(db: Session, user_id: int, stock_id: int) -> Optional[UserStock]:
    return db.query(UserStock).filter(
        UserStock.user_id == user_id,
        UserStock.stock_id == stock_id
    ).first()


def create_user_stock(db: Session, user_stock: UserStockCreate, user_id: int) -> UserStock:
    db_user_stock = UserStock(**user_stock.model_dump(), user_id=user_id)
    db.add(db_user_stock)
    db.commit()
    db.refresh(db_user_stock)
    db_user_stock = db.query(UserStock).options(joinedload(UserStock.stock)).filter(UserStock.id == db_user_stock.id).first()
    return db_user_stock


def delete_user_stock(db: Session, user_stock_id: int) -> bool:
    db_user_stock = get_user_stock(db, user_stock_id)
    if db_user_stock:
        db.delete(db_user_stock)
        db.commit()
        return True
    return False
