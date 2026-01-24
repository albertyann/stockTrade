import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.crud.user import get_user_by_username
from app.crud.system_setting import get_system_setting, set_setting_value


def init_strategy_execution_config():
    """初始化策略执行配置"""
    db = SessionLocal()

    try:
        username = "admin"
        user = get_user_by_username(db, username=username)

        if not user:
            print(f"Admin user '{username}' not found. Please run create_admin.py first.")
            return

        strategy_settings = [
            {
                "key": "strategy.max_execution_time",
                "value": "300",
                "value_type": "integer",
                "description": "策略最大执行时间（秒），超过时间自动终止",
                "category": "system"
            },
            {
                "key": "strategy.max_memory_usage",
                "value": "512",
                "value_type": "integer",
                "description": "策略最大内存使用量（MB），超过限制自动终止",
                "category": "system"
            },
            {
                "key": "strategy.default_commission_rate",
                "value": "0.001",
                "value_type": "json",
                "description": "默认手续费率，用于回测计算",
                "category": "system"
            },
            {
                "key": "strategy.enable_sandbox",
                "value": "true",
                "value_type": "boolean",
                "description": "启用策略沙箱执行模式，隔离用户代码",
                "category": "system"
            },
            {
                "key": "strategy.allow_custom_imports",
                "value": "false",
                "value_type": "boolean",
                "description": "允许策略脚本导入自定义模块",
                "category": "system"
            },
            {
                "key": "strategy.max_positions",
                "value": "10",
                "value_type": "integer",
                "description": "单策略最大持仓数量",
                "category": "system"
            },
            {
                "key": "strategy.enable_backtest_cache",
                "value": "true",
                "value_type": "boolean",
                "description": "启用回测结果缓存，加速重复回测",
                "category": "system"
            },
            {
                "key": "strategy.default_initial_capital",
                "value": "100000",
                "value_type": "integer",
                "description": "默认初始资金（元）",
                "category": "system"
            },
            {
                "key": "strategy.risk_max_drawdown",
                "value": "0.2",
                "value_type": "json",
                "description": "最大回撤限制（20%），超过自动平仓",
                "category": "system"
            },
            {
                "key": "strategy.enable_auto_trading",
                "value": "false",
                "value_type": "boolean",
                "description": "启用自动交易功能（生产环境）",
                "category": "system"
            },
            {
                "key": "strategy.auto_trading_interval",
                "value": "60",
                "value_type": "integer",
                "description": "自动交易执行间隔（分钟）",
                "category": "system"
            },
            {
                "key": "strategy.notification_on_signal",
                "value": "true",
                "value_type": "boolean",
                "description": "策略信号生成时发送通知",
                "category": "system"
            },
            {
                "key": "strategy.log_execution_details",
                "value": "true",
                "value_type": "boolean",
                "description": "记录策略执行详细日志",
                "category": "system"
            },
            {
                "key": "strategy.backtest_parallel_jobs",
                "value": "3",
                "value_type": "integer",
                "description": "并行回测任务数量",
                "category": "system"
            },
            {
                "key": "strategy.enable_performance_tracking",
                "value": "true",
                "value_type": "boolean",
                "description": "启用策略绩效跟踪",
                "category": "system"
            },
            {
                "key": "strategy.performance_update_interval",
                "value": "30",
                "value_type": "integer",
                "description": "绩效数据更新间隔（分钟）",
                "category": "system"
            }
        ]

        created_count = 0
        for setting_data in strategy_settings:
            existing = get_system_setting(db, setting_data["key"])
            if not existing:
                set_setting_value(
                    db,
                    setting_data["key"],
                    setting_data["value"],
                    setting_data["value_type"],
                    "system",
                    setting_data["description"]
                )
                print(f"Created setting: {setting_data['key']}")
                created_count += 1
            else:
                print(f"Setting already exists: {setting_data['key']}")

        print(f"\nSuccessfully initialized {created_count} strategy execution settings!")

    except Exception as e:
        print(f"Error initializing strategy execution config: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_strategy_execution_config()
