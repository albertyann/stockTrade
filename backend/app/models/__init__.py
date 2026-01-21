# Import all models to ensure they are registered with SQLAlchemy
from .user import User
from .stock import Stock
from .user_stock import UserStock
from .investment_note import InvestmentNote
from .uploaded_file import UploadedFile
from .analysis_rule import AnalysisRule
from .analysis_result import AnalysisResult
from .system_setting import SystemSetting
from .sync_interface import SyncInterface
from .sync_task import SyncTask
from .sync_execution_log import SyncExecutionLog
from .stock_daily import StockDaily
from .stock_daily_basic import StockDailyBasic
from .stock_moneyflow import StockMoneyflow
from .index_basic import IndexBasic
from .index_daily import IndexDaily

__all__ = [
    'User',
    'Stock',
    'UserStock',
    'InvestmentNote',
    'UploadedFile',
    'AnalysisRule',
    'AnalysisResult',
    'SystemSetting',
    'SyncInterface',
    'SyncTask',
    'SyncExecutionLog',
    'StockDaily',
    'StockDailyBasic',
    'StockMoneyflow',
    'IndexBasic',
    'IndexDaily',
]
