import schedule
import time
from datetime import datetime, timedelta
from .data_sync_service import DataSyncService
from ..database import get_db


def sync_stock_data_task():
    """
    定时同步股票数据
    """
    print(f"Starting stock data sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    db = next(get_db())
    sync_service = DataSyncService(db)
    
    try:
        # 获取所有用户的自选股
        user_stocks = sync_service.get_all_user_stocks()
        
        # 按用户同步数据
        for user_stock in user_stocks:
            try:
                sync_service.sync_stock_data_for_user(user_stock["user_id"], user_stock["stock_id"])
            except Exception as e:
                print(f"Error syncing stock {user_stock['stock_id']} for user {user_stock['user_id']}: {str(e)}")
                
        print(f"Stock data sync completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    except Exception as e:
        print(f"Error in stock data sync task: {str(e)}")
    finally:
        db.close()


def sync_financial_data_task():
    """
    定时同步财务数据
    """
    print(f"Starting financial data sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    db = next(get_db())
    sync_service = DataSyncService(db)
    
    try:
        # 获取所有用户的自选股
        user_stocks = sync_service.get_all_user_stocks()
        
        # 按用户同步数据
        for user_stock in user_stocks:
            try:
                sync_service.sync_financial_data_for_user(user_stock["user_id"], user_stock["stock_id"])
            except Exception as e:
                print(f"Error syncing financial data for stock {user_stock['stock_id']} for user {user_stock['user_id']}: {str(e)}")
                
        print(f"Financial data sync completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    except Exception as e:
        print(f"Error in financial data sync task: {str(e)}")
    finally:
        db.close()


# 配置任务调度
schedule.every().day.at("18:30").do(sync_stock_data_task)  # 每日收盘后同步
schedule.every(7).days.do(sync_financial_data_task)  # 每周同步财务数据


def run_scheduler():
    """
    启动调度器
    """
    print("Scheduler started")
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次任务
