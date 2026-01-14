from sqlalchemy.orm import Session
from ..models.stock import Stock
from ..schemas.stock import StockCreate, StockUpdate
from typing import Optional


def get_stock(db: Session, stock_id: int) -> Optional[Stock]:
    return db.query(Stock).filter(Stock.id == stock_id).first()


def get_stock_by_code(db: Session, code: str) -> Optional[Stock]:
    return db.query(Stock).filter(Stock.code == code).first()


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Stock).offset(skip).limit(limit).all()


def create_stock(db: Session, stock: StockCreate) -> Stock:
    db_stock = Stock(**stock.model_dump())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


def update_stock(db: Session, stock_id: int, stock: StockUpdate) -> Optional[Stock]:
    db_stock = get_stock(db, stock_id)
    if db_stock:
        update_data = stock.model_dump(exclude_unset=True)
        for key, value in update_data.items():
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
