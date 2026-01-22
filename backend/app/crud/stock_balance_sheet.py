from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.stock_balance_sheet import StockBalanceSheet
from ..schemas.stock_balance_sheet import StockBalanceSheetCreate, StockBalanceSheetUpdate


def get_balance_sheets(db: Session, stock_id: int, skip: int = 0, limit: int = 100) -> List[StockBalanceSheet]:
    return db.query(StockBalanceSheet).filter(StockBalanceSheet.stock_id == stock_id).order_by(StockBalanceSheet.fiscal_date_ending.desc()).offset(skip).limit(limit).all()


def get_balance_sheet_by_id(db: Session, sheet_id: int) -> Optional[StockBalanceSheet]:
    return db.query(StockBalanceSheet).filter(StockBalanceSheet.id == sheet_id).first()


def create_balance_sheet(db: Session, sheet: StockBalanceSheetCreate) -> StockBalanceSheet:
    db_sheet = StockBalanceSheet(**sheet.dict())
    db.add(db_sheet)
    db.commit()
    db.refresh(db_sheet)
    return db_sheet


def update_balance_sheet(db: Session, sheet_id: int, sheet: StockBalanceSheetUpdate) -> Optional[StockBalanceSheet]:
    db_sheet = db.query(StockBalanceSheet).filter(StockBalanceSheet.id == sheet_id).first()
    if db_sheet:
        update_data = sheet.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_sheet, key, value)
        db.commit()
        db.refresh(db_sheet)
    return db_sheet


def delete_balance_sheet(db: Session, sheet_id: int) -> bool:
    db_sheet = db.query(StockBalanceSheet).filter(StockBalanceSheet.id == sheet_id).first()
    if db_sheet:
        db.delete(db_sheet)
        db.commit()
        return True
    return False


def upsert_balance_sheets(db: Session, stock_id: int, sheets: List[dict]) -> int:
    count = 0
    for sheet_data in sheets:
        existing = db.query(StockBalanceSheet).filter(
            StockBalanceSheet.stock_id == stock_id,
            StockBalanceSheet.fiscal_date_ending == sheet_data.get("fiscal_date_ending")
        ).first()

        if existing:
            for key, value in sheet_data.items():
                setattr(existing, key, value)
        else:
            new_sheet = StockBalanceSheet(**sheet_data, stock_id=stock_id)
            db.add(new_sheet)
        count += 1

    db.commit()
    return count
