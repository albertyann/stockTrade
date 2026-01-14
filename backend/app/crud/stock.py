from sqlalchemy.orm import Session
from ..models.stock import Stock
from ..schemas.stock import StockCreate, StockUpdate
from typing import Optional


def get_stock(db: Session, stock_id: int) -> Optional[Stock]:
    return db.query(Stock).filter(Stock.id == stock_id).first()


def get_stock_by_ts_code(db: Session, ts_code: str) -> Optional[Stock]:
    return db.query(Stock).filter(Stock.ts_code == ts_code).first()


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Stock).offset(skip).limit(limit).all()


def create_stock(db: Session, stock: StockCreate) -> Stock:
    stock_data = stock.model_dump()
    db_stock = Stock(**stock_data)
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


def update_stock(db: Session, stock_id: int, stock: StockUpdate) -> Optional[Stock]:
    db_stock = get_stock(db, stock_id)
    if db_stock:
        update_data = stock.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_stock, key, value)
        db.commit()
        db.refresh(db_stock)
    return db_stock


def delete_stock(db: Session, stock_id: int) -> bool:
    db_stock = get_stock(db, stock_id)
    if db_stock:
        db.delete(db_stock)
        db.commit()
        return True
    return False
