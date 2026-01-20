import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.crud.sync_management import create_sync_interface, get_sync_interface_by_name
from app.schemas.sync_management import SyncInterfaceCreate


def init_default_sync_interfaces():
    """初始化默认的 Tushare 接口配置"""
    db = SessionLocal()
    try:
        default_interfaces = [
            {
                "interface_name": "daily",
                "description": "日线行情数据 - 获取每日开高低收和成交量",
                "interface_params": {
                    "fields": "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount"
                },
                "data_model": "StockDaily",
                "enabled": True
            },
            {
                "interface_name": "daily_basic",
                "description": "每日指标 - 获取每日PE、PB、换手率等指标",
                "interface_params": {
                    "fields": "ts_code,trade_date,turnover_rate,turnover_rate_f,volume_ratio,pe,pe_ttm,pb,ps,ps_ttm,dv_ratio,dv_ttm,total_share,float_share,free_share,total_mv,circ_mv"
                },
                "data_model": "StockDailyBasic",
                "enabled": True
            },
            {
                "interface_name": "moneyflow",
                "description": "资金流向数据 - 获取超大单、大单、中单、小单的资金流向",
                "interface_params": {
                    "fields": "ts_code,trade_date,buy_elg_vol,buy_elg_amt,sell_elg_vol,sell_elg_amt,buy_lg_vol,buy_lg_amt,sell_lg_vol,sell_lg_amt,buy_md_vol,buy_md_amt,sell_md_vol,sell_md_amt,buy_sm_vol,buy_sm_amt,sell_sm_vol,sell_sm_amt"
                },
                "data_model": "StockMoneyflow",
                "enabled": True
            },
            {
                "interface_name": "moneyflow_hsgt",
                "description": "沪深港通资金流向",
                "interface_params": {},
                "data_model": None,
                "enabled": True
            },
            {
                "interface_name": "top_list",
                "description": "龙虎榜数据",
                "interface_params": {},
                "data_model": None,
                "enabled": True
            }
        ]

        for interface_data in default_interfaces:
            existing = get_sync_interface_by_name(db, interface_data["interface_name"])
            if not existing:
                interface_create = SyncInterfaceCreate(**interface_data)
                create_sync_interface(db, interface_create)
                print(f"Created interface: {interface_data['interface_name']}")
            else:
                print(f"Interface already exists: {interface_data['interface_name']}")

        print("Default Tushare interfaces initialized successfully")

    except Exception as e:
        print(f"Error initializing default interfaces: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_default_sync_interfaces()
