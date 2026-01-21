from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from ..models.index_daily import IndexDaily
from ..models.index_basic import IndexBasic


def get_latest_index_data(db: Session) -> List[Dict[str, Any]]:
    from sqlalchemy import func, select

    subq = (
        select(
            IndexDaily.ts_code,
            func.max(IndexDaily.trade_date).label('max_date')
        )
        .group_by(IndexDaily.ts_code)
        .subquery()
    )

    results = (
        db.query(IndexDaily, IndexBasic)
        .join(IndexBasic, IndexDaily.ts_code == IndexBasic.ts_code)
        .join(
            subq,
            (IndexDaily.ts_code == subq.c.ts_code) &
            (IndexDaily.trade_date == subq.c.max_date)
        )
        .order_by(IndexDaily.ts_code)
        .all()
    )

    return [
        {
            'ts_code': daily.ts_code,
            'trade_date': daily.trade_date,
            'open': daily.open,
            'high': daily.high,
            'low': daily.low,
            'close': daily.close,
            'pre_close': daily.pre_close,
            'change': daily.change,
            'pct_chg': daily.pct_chg,
            'vol': daily.vol,
            'amount': daily.amount,
            'name': basic.name if basic else '',
        }
        for daily, basic in results
    ]


def get_index_daily_by_code(
    db: Session,
    ts_code: str,
    skip: int = 0,
    limit: int = 100
) -> list:
    return (
        db.query(IndexDaily)
        .filter(IndexDaily.ts_code == ts_code)
        .order_by(IndexDaily.trade_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
