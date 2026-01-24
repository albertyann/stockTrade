from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models.trading import Order, Position, Portfolio, Transaction
from ..schemas.trading import (
    OrderCreate,
    OrderUpdate,
    PositionCreate,
    PositionUpdate,
    PortfolioCreate,
    PortfolioUpdate,
    TransactionCreate,
)
from typing import Optional, List
from datetime import datetime


# Order CRUD
def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_order_by_code(db: Session, order_code: str) -> Optional[Order]:
    return db.query(Order).filter(Order.order_code == order_code).first()


def get_orders(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None,
               strategy_id: Optional[int] = None, status: Optional[str] = None,
               side: Optional[str] = None, stock_id: Optional[int] = None):
    query = db.query(Order)

    if user_id:
        query = query.filter(Order.user_id == user_id)

    if strategy_id:
        query = query.filter(Order.strategy_id == strategy_id)

    if status:
        query = query.filter(Order.status == status)

    if side:
        query = query.filter(Order.side == side)

    if stock_id:
        query = query.filter(Order.stock_id == stock_id)

    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    return {"data": orders, "total": total}


def create_order(db: Session, order: OrderCreate, user_id: int) -> Order:
    order_data = order.model_dump()
    db_order = Order(**order_data, user_id=user_id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def update_order(db: Session, order_id: int, order: OrderUpdate) -> Optional[Order]:
    db_order = get_order(db, order_id)
    if db_order:
        update_data = order.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_order, key, value)
        db.commit()
        db.refresh(db_order)
    return db_order


def delete_order(db: Session, order_id: int) -> bool:
    db_order = get_order(db, order_id)
    if db_order:
        db.delete(db_order)
        db.commit()
        return True
    return False


# Position CRUD
def get_position(db: Session, position_id: int) -> Optional[Position]:
    return db.query(Position).filter(Position.id == position_id).first()


def get_positions(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None,
                  strategy_id: Optional[int] = None, stock_id: Optional[int] = None):
    query = db.query(Position)

    if user_id:
        query = query.filter(Position.user_id == user_id)

    if strategy_id:
        query = query.filter(Position.strategy_id == strategy_id)

    if stock_id:
        query = query.filter(Position.stock_id == stock_id)

    total = query.count()
    positions = query.order_by(desc(Position.created_at)).offset(skip).limit(limit).all()
    return {"data": positions, "total": total}


def create_position(db: Session, position: PositionCreate, user_id: int) -> Position:
    position_data = position.model_dump()
    db_position = Position(**position_data, user_id=user_id)
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position


def update_position(db: Session, position_id: int, position: PositionUpdate) -> Optional[Position]:
    db_position = get_position(db, position_id)
    if db_position:
        update_data = position.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_position, key, value)
        db.commit()
        db.refresh(db_position)
    return db_position


def delete_position(db: Session, position_id: int) -> bool:
    db_position = get_position(db, position_id)
    if db_position:
        db.delete(db_position)
        db.commit()
        return True
    return False


# Portfolio CRUD
def get_portfolio(db: Session, portfolio_id: int) -> Optional[Portfolio]:
    return db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()


def get_portfolios(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None,
                   strategy_id: Optional[int] = None, as_of_date: Optional[datetime] = None):
    query = db.query(Portfolio)

    if user_id:
        query = query.filter(Portfolio.user_id == user_id)

    if strategy_id:
        query = query.filter(Portfolio.strategy_id == strategy_id)

    if as_of_date:
        query = query.filter(Portfolio.as_of_date == as_of_date)

    total = query.count()
    portfolios = query.order_by(desc(Portfolio.as_of_date)).offset(skip).limit(limit).all()
    return {"data": portfolios, "total": total}


def create_portfolio(db: Session, portfolio: PortfolioCreate, user_id: int) -> Portfolio:
    portfolio_data = portfolio.model_dump()
    db_portfolio = Portfolio(**portfolio_data, user_id=user_id)
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio


def update_portfolio(db: Session, portfolio_id: int, portfolio: PortfolioUpdate) -> Optional[Portfolio]:
    db_portfolio = get_portfolio(db, portfolio_id)
    if db_portfolio:
        update_data = portfolio.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_portfolio, key, value)
        db.commit()
        db.refresh(db_portfolio)
    return db_portfolio


def delete_portfolio(db: Session, portfolio_id: int) -> bool:
    db_portfolio = get_portfolio(db, portfolio_id)
    if db_portfolio:
        db.delete(db_portfolio)
        db.commit()
        return True
    return False


# Transaction CRUD
def get_transaction(db: Session, transaction_id: int) -> Optional[Transaction]:
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()


def get_transaction_by_code(db: Session, transaction_code: str) -> Optional[Transaction]:
    return db.query(Transaction).filter(Transaction.transaction_code == transaction_code).first()


def get_transactions(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None,
                     strategy_id: Optional[int] = None, order_id: Optional[int] = None,
                     stock_id: Optional[int] = None, transaction_type: Optional[str] = None,
                     start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    query = db.query(Transaction)

    if user_id:
        query = query.filter(Transaction.user_id == user_id)

    if strategy_id:
        query = query.filter(Transaction.strategy_id == strategy_id)

    if order_id:
        query = query.filter(Transaction.order_id == order_id)

    if stock_id:
        query = query.filter(Transaction.stock_id == stock_id)

    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)

    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    total = query.count()
    transactions = query.order_by(desc(Transaction.transaction_date)).offset(skip).limit(limit).all()
    return {"data": transactions, "total": total}


def create_transaction(db: Session, transaction: TransactionCreate, user_id: int) -> Transaction:
    transaction_data = transaction.model_dump()
    db_transaction = Transaction(**transaction_data, user_id=user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_transaction(db: Session, transaction_id: int) -> bool:
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
        return True
    return False
