from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.stock_cash_flow import StockCashFlow
from ..schemas.stock_cash_flow import StockCashFlowCreate, StockCashFlowUpdate


def get_cash_flows(db: Session, stock_id: int, skip: int = 0, limit: int = 100) -> List[StockCashFlow]:
    return db.query(StockCashFlow).filter(StockCashFlow.stock_id == stock_id).order_by(StockCashFlow.fiscal_date_ending.desc()).offset(skip).limit(limit).all()


def get_cash_flow_by_id(db: Session, flow_id: int) -> Optional[StockCashFlow]:
    return db.query(StockCashFlow).filter(StockCashFlow.id == flow_id).first()


def create_cash_flow(db: Session, flow: StockCashFlowCreate) -> StockCashFlow:
    db_flow = StockCashFlow(**flow.dict())
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    return db_flow


def update_cash_flow(db: Session, flow_id: int, flow: StockCashFlowUpdate) -> Optional[StockCashFlow]:
    db_flow = db.query(StockCashFlow).filter(StockCashFlow.id == flow_id).first()
    if db_flow:
        update_data = flow.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_flow, key, value)
        db.commit()
        db.refresh(db_flow)
    return db_flow


def delete_cash_flow(db: Session, flow_id: int) -> bool:
    db_flow = db.query(StockCashFlow).filter(StockCashFlow.id == flow_id).first()
    if db_flow:
        db.delete(db_flow)
        db.commit()
        return True
    return False


def upsert_cash_flows(db: Session, stock_id: int, flows: List[dict]) -> int:
    count = 0
    for flow_data in flows:
        existing = db.query(StockCashFlow).filter(
            StockCashFlow.stock_id == stock_id,
            StockCashFlow.fiscal_date_ending == flow_data.get("fiscal_date_ending")
        ).first()

        if existing:
            for key, value in flow_data.items():
                setattr(existing, key, value)
        else:
            new_flow = StockCashFlow(**flow_data, stock_id=stock_id)
            db.add(new_flow)
        count += 1

    db.commit()
    return count
