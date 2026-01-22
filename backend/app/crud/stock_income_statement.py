from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.stock_income_statement import StockIncomeStatement
from ..schemas.stock_income_statement import StockIncomeStatementCreate, StockIncomeStatementUpdate


def get_income_statements(db: Session, stock_id: int, skip: int = 0, limit: int = 100) -> List[StockIncomeStatement]:
    return db.query(StockIncomeStatement).filter(StockIncomeStatement.stock_id == stock_id).order_by(StockIncomeStatement.fiscal_date_ending.desc()).offset(skip).limit(limit).all()


def get_income_statement_by_id(db: Session, statement_id: int) -> Optional[StockIncomeStatement]:
    return db.query(StockIncomeStatement).filter(StockIncomeStatement.id == statement_id).first()


def create_income_statement(db: Session, statement: StockIncomeStatementCreate) -> StockIncomeStatement:
    db_statement = StockIncomeStatement(**statement.dict())
    db.add(db_statement)
    db.commit()
    db.refresh(db_statement)
    return db_statement


def update_income_statement(db: Session, statement_id: int, statement: StockIncomeStatementUpdate) -> Optional[StockIncomeStatement]:
    db_statement = db.query(StockIncomeStatement).filter(StockIncomeStatement.id == statement_id).first()
    if db_statement:
        update_data = statement.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_statement, key, value)
        db.commit()
        db.refresh(db_statement)
    return db_statement


def delete_income_statement(db: Session, statement_id: int) -> bool:
    db_statement = db.query(StockIncomeStatement).filter(StockIncomeStatement.id == statement_id).first()
    if db_statement:
        db.delete(db_statement)
        db.commit()
        return True
    return False


def upsert_income_statements(db: Session, stock_id: int, statements: List[dict]) -> int:
    count = 0
    for stmt_data in statements:
        existing = db.query(StockIncomeStatement).filter(
            StockIncomeStatement.stock_id == stock_id,
            StockIncomeStatement.fiscal_date_ending == stmt_data.get("fiscal_date_ending")
        ).first()

        if existing:
            for key, value in stmt_data.items():
                setattr(existing, key, value)
        else:
            new_stmt = StockIncomeStatement(**stmt_data, stock_id=stock_id)
            db.add(new_stmt)
        count += 1

    db.commit()
    return count
