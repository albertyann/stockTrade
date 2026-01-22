from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..models.stock_daily import StockDaily
from ..schemas.stock_daily import StockDailyResponse
from dateutil.parser import parse as parse_date


def get_stock_daily_by_ts_code(db: Session, ts_code: str, skip: int = 0, limit: int = 1000) -> List[StockDaily]:
    return db.query(StockDaily).filter(StockDaily.ts_code == ts_code).order_by(StockDaily.trade_date.desc()).offset(skip).limit(limit).all()


def get_latest_stock_daily(db: Session, ts_code: str) -> Optional[StockDaily]:
    return db.query(StockDaily).filter(StockDaily.ts_code == ts_code).order_by(StockDaily.trade_date.desc()).first()


def get_stock_daily_by_date_range(db: Session, ts_code: str, start_date: str, end_date: str) -> List[StockDaily]:
    return db.query(StockDaily).filter(
        StockDaily.ts_code == ts_code,
        StockDaily.trade_date >= start_date,
        StockDaily.trade_date <= end_date
    ).order_by(StockDaily.trade_date.desc()).all()


def count_stock_daily(db: Session, ts_code: str) -> int:
    return db.query(StockDaily).filter(StockDaily.ts_code == ts_code).count()


def upsert_stock_daily(db: Session, ts_code: str, daily_data_list: List[Dict[str, Any]]) -> int:
    count = 0
    for item in daily_data_list:
        trade_date_str = item.get("trade_date")
        if not trade_date_str:
            continue

        trade_date = parse_date(trade_date_str).date()
        existing = db.query(StockDaily).filter(
            StockDaily.ts_code == ts_code,
            StockDaily.trade_date == trade_date
        ).first()

        if existing:
            existing.open = item.get("open") or None
            existing.high = item.get("high") or None
            existing.low = item.get("low") or None
            existing.close = item.get("close") or None
            existing.pre_close = item.get("pre_close") or None
            existing.change = item.get("change") or None
            existing.pct_chg = item.get("pct_chg") or None
            existing.vol = item.get("vol") or None
            existing.amount = item.get("amount") or None
        else:
            new_daily = StockDaily(
                ts_code=ts_code,
                trade_date=trade_date,
                open=item.get("open"),
                high=item.get("high"),
                low=item.get("low"),
                close=item.get("close"),
                pre_close=item.get("pre_close"),
                change=item.get("change"),
                pct_chg=item.get("pct_chg"),
                vol=item.get("vol"),
                amount=item.get("amount")
            )
            db.add(new_daily)
        count += 1

    db.commit()
    return count
