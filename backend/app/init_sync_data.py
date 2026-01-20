from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .sync_interface import SyncInterface
from .sync_task import SyncTask
from .sync_execution_log import SyncExecutionLog


def init_sync_data(db: Session) -> None:
    """初始化同步接口和任务数据"""

    if db.query(SyncInterface).count() > 0:
        print("Sync interfaces already initialized")
        return

    interfaces = [
        SyncInterface(
            interface_name='daily',
            description='日线行情数据',
            interface_params={},
            data_model='StockDaily',
            enabled=True,
        ),
        SyncInterface(
            interface_name='daily_basic',
            description='每日基础指标',
            interface_params={},
            data_model='StockDailyBasic',
            enabled=True,
        ),
        SyncInterface(
            interface_name='moneyflow',
            description='资金流向数据',
            interface_params={},
            data_model='StockMoneyflow',
            enabled=True,
        ),
        SyncInterface(
            interface_name='income',
            description='利润表数据',
            interface_params={},
            data_model='FinancialStatement',
            enabled=True,
        ),
        SyncInterface(
            interface_name='cashflow',
            description='现金流量表数据',
            interface_params={},
            data_model='CashFlowStatement',
            enabled=True,
        ),
    ]

    db.add_all(interfaces)
    db.commit()

    for interface in interfaces:
        print(f"Created interface: {interface.interface_name}")

    now = datetime.now()
    tasks = [
        SyncTask(
            task_name='每日股票行情同步',
            interface_id=1,
            schedule_type='cron',
            schedule_config={'cron': '0 15 * * 1-5'},
            task_params={'trade_date': ''},
            retry_policy={'max_retries': 3, 'backoff_factor': 2},
            status='active',
            last_run_at=now - timedelta(hours=1),
            next_run_at=now + timedelta(hours=4),
            last_run_status='success',
        ),
        SyncTask(
            task_name='每日基础数据同步',
            interface_id=2,
            schedule_type='cron',
            schedule_config={'cron': '0 18 * * 1-5'},
            task_params={},
            retry_policy={'max_retries': 3, 'backoff_factor': 2},
            status='active',
            last_run_at=now - timedelta(hours=2),
            next_run_at=now + timedelta(hours=3),
            last_run_status='success',
        ),
        SyncTask(
            task_name='财务数据同步',
            interface_id=4,
            schedule_type='date',
            schedule_config={'run_date': '2024-01-01 00:00:00'},
            task_params={},
            retry_policy={'max_retries': 3, 'backoff_factor': 2},
            status='paused',
            last_run_at=now - timedelta(days=1),
            last_run_status='success',
        ),
        SyncTask(
            task_name='实时行情同步',
            interface_id=3,
            schedule_type='interval',
            schedule_config={'seconds': 30},
            task_params={},
            retry_policy={'max_retries': 5, 'backoff_factor': 1.5},
            status='error',
            last_run_at=now - timedelta(minutes=30),
            next_run_at=now + timedelta(minutes=30),
            last_run_status='failed',
            last_error_message='API 请求超时: 连接 tushare 接口失败，网络响应时间超过 30 秒',
        ),
        SyncTask(
            task_name='现金流数据同步',
            interface_id=5,
            schedule_type='cron',
            schedule_config={'cron': '0 2 1 * *'},
            task_params={},
            retry_policy={'max_retries': 3, 'backoff_factor': 2},
            status='active',
            last_run_at=now - timedelta(days=15),
            next_run_at=now + timedelta(days=16),
            last_run_status='success',
        ),
    ]

    db.add_all(tasks)
    db.commit()

    for task in tasks:
        print(f"Created task: {task.task_name}")

    logs = [
        SyncExecutionLog(
            task_id=1,
            execution_type='scheduled',
            started_at=now - timedelta(hours=1),
            finished_at=now - timedelta(hours=1) + timedelta(seconds=45),
            status='success',
            records_processed=5234,
            error_message=None,
            output_summary={'total_stocks': 5234, 'success_count': 5234, 'failed_count': 0},
        ),
        SyncExecutionLog(
            task_id=1,
            execution_type='scheduled',
            started_at=now - timedelta(hours=25),
            finished_at=now - timedelta(hours=25) + timedelta(seconds=42),
            status='success',
            records_processed=5189,
            error_message=None,
            output_summary={'total_stocks': 5189, 'success_count': 5189, 'failed_count': 0},
        ),
        SyncExecutionLog(
            task_id=1,
            execution_type='manual',
            started_at=now - timedelta(hours=30),
            finished_at=now - timedelta(hours=30) + timedelta(seconds=48),
            status='success',
            records_processed=5156,
            error_message=None,
            output_summary={'total_stocks': 5156, 'success_count': 5156, 'failed_count': 0},
        ),
        SyncExecutionLog(
            task_id=2,
            execution_type='scheduled',
            started_at=now - timedelta(hours=2),
            finished_at=now - timedelta(hours=2) + timedelta(seconds=38),
            status='success',
            records_processed=5234,
            error_message=None,
            output_summary={'total_stocks': 5234, 'success_count': 5234, 'failed_count': 0},
        ),
        SyncExecutionLog(
            task_id=4,
            execution_type='retry',
            started_at=now - timedelta(minutes=30),
            finished_at=now - timedelta(minutes=30) + timedelta(seconds=31),
            status='failed',
            records_processed=0,
            error_message='API 请求超时: 连接 tushare 接口失败，网络响应时间超过 30 秒',
            output_summary={'error': 'timeout', 'retry_count': 2},
        ),
        SyncExecutionLog(
            task_id=4,
            execution_type='retry',
            started_at=now - timedelta(minutes=32),
            finished_at=now - timedelta(minutes=32) + timedelta(seconds=29),
            status='failed',
            records_processed=0,
            error_message='API 请求超时: 连接 tushare 接口失败，网络响应时间超过 30 秒',
            output_summary={'error': 'timeout', 'retry_count': 1},
        ),
        SyncExecutionLog(
            task_id=5,
            execution_type='scheduled',
            started_at=now - timedelta(days=15),
            finished_at=now - timedelta(days=15) + timedelta(seconds=2*60*60 + 15),
            status='success',
            records_processed=4892,
            error_message=None,
            output_summary={'total_stocks': 4892, 'success_count': 4892, 'failed_count': 0},
        ),
    ]

    db.add_all(logs)
    db.commit()

    for log in logs:
        print(f"Created log for task {log.task_id}: {log.status}")

    print("Sync data initialization completed")
