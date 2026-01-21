from sqlalchemy.orm import Session
from ..models.stock import Stock
from ..schemas.stock import StockCreate, StockUpdate
from typing import Optional


def get_stock(db: Session, stock_id: int) -> Optional[Stock]:
    return db.query(Stock).filter(Stock.id == stock_id).first()


def get_stock_by_ts_code(db: Session, ts_code: str) -> Optional[Stock]:
    return db.query(Stock).filter(Stock.ts_code == ts_code).first()


def get_stocks(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Stock)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Stock.ts_code.ilike(search_pattern)) |
            (Stock.symbol.ilike(search_pattern)) |
            (Stock.name.ilike(search_pattern))
        )

    total = query.count()
    stocks = query.offset(skip).limit(limit).all()
    return {"data": stocks, "total": total}


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
