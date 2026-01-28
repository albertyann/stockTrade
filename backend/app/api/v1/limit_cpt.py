from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from ..services.tushare_api import TushareAPI
from ..core.security import get_current_user

router = APIRouter()

tushare_api = TushareAPI()


@router.get("/limit-concept-sectors")
async def get_limit_concept_sectors(
    trade_date: Optional[str] = Query(None, description="交易日期 (YYYYMMDD)"),
    ts_code: Optional[str] = Query(None, description="板块代码"),
    start_date: Optional[str] = Query(None, description="开始日期 (YYYYMMDD)"),
    end_date: Optional[str] = Query(None, description="结束日期 (YYYYMMDD)"),
    current_user = Depends(get_current_user)
):
    """
    获取涨停股票最多最强的概念板块
    """
    if not tushare_api.is_available():
        raise HTTPException(status_code=503, detail="Tushare API 未配置或不可用")

    result = tushare_api.get_limit_cpt_list(
        trade_date=trade_date,
        ts_code=ts_code,
        start_date=start_date,
        end_date=end_date
    )

    if result is None:
        raise HTTPException(status_code=500, detail="获取最强板块数据失败")

    return {"data": result}
