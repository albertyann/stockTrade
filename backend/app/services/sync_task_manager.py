from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
import logging
from ..models.sync_interface import SyncInterface
from ..models.sync_task import SyncTask
from ..models.sync_execution_log import SyncExecutionLog
from ..models.user_stock import UserStock
from ..models.stock import Stock
from ..crud.sync_management import (
    create_sync_task,
    update_sync_task,
    delete_sync_task,
    get_sync_task,
    create_sync_execution_log
)
from ..services.tushare_interface_registry import TushareInterfaceRegistry
from ..services.dynamic_scheduler import DynamicScheduler
from ..core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SyncTaskManager:
    """同步任务管理器 - 管理任务生命周期"""

    def __init__(self, db: Session, scheduler: DynamicScheduler):
        self.db = db
        self.scheduler = scheduler
        self.tushare_registry = TushareInterfaceRegistry(settings.TUSHARE_API_TOKEN)

    async def create_and_schedule_task(self, task_data: Dict[str, Any]) -> SyncTask:
        """创建新任务并添加到调度器"""
        logger.info(f"[任务创建] 开始创建任务: {task_data.get('task_name', 'Unknown')}")
        db_task = create_sync_task(self.db, task_data)
        self.scheduler.register_task_function(db_task.id, self._execute_task_wrapper(db_task.id))
        await self.scheduler.add_task(
            db_task.id,
            db_task.schedule_type,
            db_task.schedule_config
        )
        logger.info(f"[任务创建] ✓ 任务 ID {db_task.id} ({db_task.task_name}) 已创建并调度")
        return db_task

    async def update_and_reschedule_task(self, task_id: int, task_data: Dict[str, Any]) -> SyncTask:
        """更新任务配置并重新调度"""
        logger.info(f"[任务更新] 开始更新任务 ID: {task_id}")
        db_task = update_sync_task(self.db, task_id, task_data)
        await self.scheduler.update_task(
            db_task.id,
            db_task.schedule_type,
            db_task.schedule_config
        )
        logger.info(f"[任务更新] ✓ 任务 ID {task_id} ({db_task.task_name}) 已更新并重新调度")
        return db_task

    async def delete_and_unschedule_task(self, task_id: int) -> bool:
        """删除任务并从调度器移除"""
        logger.info(f"[任务删除] 尝试删除任务 ID: {task_id}")
        await self.scheduler.remove_task(task_id)
        result = delete_sync_task(self.db, task_id)
        if result:
            logger.info(f"[任务删除] ✓ 任务 ID {task_id} 已删除")
        else:
            logger.warning(f"[任务删除] 任务 ID {task_id} 未找到或删除失败")
        return result

    async def pause_task(self, task_id: int) -> SyncTask:
        """暂停任务"""
        logger.info(f"[任务暂停] 尝试暂停任务 ID: {task_id}")
        task = get_sync_task(self.db, task_id)
        if not task:
            error_msg = f"任务 ID {task_id} 在数据库中未找到"
            logger.error(f"[任务暂停] ✗ {error_msg}")
            raise ValueError(error_msg)
        await self.scheduler.pause_task(task_id)
        task.status = "paused"
        self.db.commit()
        logger.info(f"[任务暂停] ✓ 任务 ID {task_id} ({task.task_name}) 已暂停")
        return task

    async def resume_task(self, task_id: int) -> SyncTask:
        """恢复任务"""
        logger.info(f"[任务恢复] 尝试恢复任务 ID: {task_id}")
        task = get_sync_task(self.db, task_id)
        if not task:
            error_msg = f"任务 ID {task_id} 在数据库中未找到"
            logger.error(f"[任务恢复] ✗ {error_msg}")
            raise ValueError(error_msg)
        if task.status != "paused" and task.status != "error":
            error_msg = f"任务 ID {task_id} 未处于暂停或错误状态 (当前状态: {task.status})"
            logger.error(f"[任务恢复] ✗ {error_msg}")
            raise ValueError(error_msg)
        await self.scheduler.resume_task(task_id)
        task.status = "active"
        self.db.commit()
        logger.info(f"[任务恢复] ✓ 任务 ID {task_id} ({task.task_name}) 已恢复")
        return task

    async def trigger_task_manually(self, task_id: int) -> None:
        """手动触发任务执行"""
        logger.info(f"[任务触发] 手动触发任务 ID: {task_id}")
        task = get_sync_task(self.db, task_id)
        if not task:
            error_msg = f"任务 ID {task_id} 在数据库中未找到"
            logger.error(f"[任务触发] ✗ {error_msg}")
            raise ValueError(error_msg)

        task_id_str = str(task_id)
        if task_id_str not in self.scheduler.task_functions:
            logger.info(f"[任务触发] 任务函数未注册，正在注册...")
            self.scheduler.register_task_function(task_id_str, self._execute_task_wrapper(task_id, execution_type="manual"))

        await self.scheduler.trigger_task(task_id)

    def _execute_task_wrapper(self, task_id: int, execution_type: str = "scheduled"):
        """包装任务执行函数供调度器调用"""
        async def wrapper():
            from ..database import SessionLocal
            db = SessionLocal()
            try:
                await self._execute_task(db, task_id, execution_type=execution_type)
            finally:
                db.close()
        return wrapper

    async def _execute_task(self, db: Session, task_id: int, execution_type: str = "scheduled") -> None:
        """执行同步任务的核心逻辑"""
        logger.info(f"[任务执行] ========== 开始执行任务 ID: {task_id} ==========")
        logger.info(f"[任务执行] 执行类型: {execution_type}, 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        task = db.query(SyncTask).filter(SyncTask.id == task_id).first()

        if not task:
            logger.error(f"[任务执行] ✗ 任务 ID {task_id} 在数据库中未找到")
            return

        logger.info(f"[任务执行] 任务名称: {task.task_name}, 任务状态: {task.status}")

        if task.status != "active":
            logger.warning(f"[任务执行] ⚠ 任务 ID {task_id} 未处于活动状态 (当前状态: {task.status})")
            return

        interface = db.query(SyncInterface).filter(
            SyncInterface.id == task.interface_id
        ).first()

        if not interface:
            logger.error(f"[任务执行] ✗ 任务 ID {task_id} 的接口 ID {task.interface_id} 未找到")
            return

        logger.info(f"[任务执行] 接口名称: {interface.interface_name}")

        log = create_sync_execution_log(
            db,
            {
                "task_id": task_id,
                "execution_type": execution_type,
                "status": "running"
            }
        )

        try:
            task.last_run_status = "running"
            db.commit()

            merged_params = {**interface.interface_params, **task.task_params}

            if interface.interface_name == "index_daily":
                logger.info(f"[任务执行] index_daily 接口：检查参数")

                if "ts_code" not in merged_params or not merged_params.get("ts_code"):
                    logger.info(f"[任务执行] index_daily 接口：无 ts_code 参数，从 index_basic 获取综合指数")

                    from ..models.index_basic import IndexBasic
                    indices = db.query(IndexBasic).filter(IndexBasic.category == "综合指数").all()
                    ts_codes = [idx.ts_code for idx in indices if idx.ts_code]

                    if not ts_codes:
                        logger.warning(f"[任务执行] index_daily 接口：index_basic 表中无综合指数，跳过同步")
                        return

                    merged_params["ts_code"] = ",".join(ts_codes)
                    logger.info(f"[任务执行] index_daily 接口：获取到 {len(ts_codes)} 个综合指数代码")
                    logger.info(f"[任务执行] index_daily 接口：指数代码: {merged_params['ts_code']}")

                current_hour = datetime.now().hour
                if "trade_date" not in merged_params or not merged_params.get("trade_date"):
                    logger.info(f"[任务执行] index_daily 接口：无 trade_date 参数，根据当前时间判断")

                    if current_hour >= 16:
                        today = datetime.now().date()
                        merged_params["trade_date"] = today.strftime("%Y%m%d")
                        logger.info(f"[任务执行] index_daily 接口：16点后，同步当天数据: {merged_params['trade_date']}")
                    else:
                        yesterday = (datetime.now() - timedelta(days=1)).date()
                        merged_params["trade_date"] = yesterday.strftime("%Y%m%d")
                        logger.info(f"[任务执行] index_daily 接口：16点前，同步前一天数据: {merged_params['trade_date']}")
                else:
                    logger.info(f"[任务执行] index_daily 接口：使用指定日期: {merged_params.get('trade_date')}")

            elif interface.interface_name == "daily":
                logger.info(f"[任务执行] daily 接口：检查参数")

                if "ts_code" not in merged_params or not merged_params.get("ts_code"):
                    logger.info(f"[任务执行] daily 接口：无 ts_code 参数，从 user_stocks 获取")

                    user_stocks = db.query(UserStock).all()
                    ts_codes = []
                    for us in user_stocks:
                        stock = db.query(Stock).filter(Stock.id == us.stock_id).first()
                        if stock and stock.ts_code:
                            ts_codes.append(stock.ts_code)

                    if not ts_codes:
                        logger.warning(f"[任务执行] daily 接口：user_stocks 表为空，跳过同步")
                        return

                    merged_params["ts_code"] = ",".join(ts_codes)
                    logger.info(f"[任务执行] daily 接口：从 user_stocks 获取到 {len(ts_codes)} 个股票代码")
                    logger.info(f"[任务执行] daily 接口：股票代码: {merged_params['ts_code']}")

                current_hour = datetime.now().hour
                if "trade_date" not in merged_params or not merged_params.get("trade_date"):
                    logger.info(f"[任务执行] daily 接口：无 trade_date 参数，根据当前时间判断")

                    if current_hour >= 16:
                        today = datetime.now().date()
                        merged_params["trade_date"] = today.strftime("%Y%m%d")
                        logger.info(f"[任务执行] daily 接口：16点后，同步当天数据: {merged_params['trade_date']}")
                    else:
                        yesterday = (datetime.now() - timedelta(days=1)).date()
                        merged_params["trade_date"] = yesterday.strftime("%Y%m%d")
                        logger.info(f"[任务执行] daily 接口：16点前，同步前一天数据: {merged_params['trade_date']}")
                else:
                    logger.info(f"[任务执行] daily 接口：使用指定日期: {merged_params.get('trade_date')}")

            logger.info(f"[任务执行] 合并参数: {merged_params}")
            data = await self.tushare_registry.execute(
                interface.interface_name,
                merged_params
            )
            logger.info(f"[任务执行] 数据获取成功，开始保存...")
            print(f"[任务执行] 数据获取成功 {data}")

            self._save_synced_data(db, interface, data)

            log.status = "success"
            log.records_processed = len(data) if isinstance(data, list) else 1
            log.finished_at = datetime.now()
            task.last_run_status = "success"
            task.last_run_at = datetime.now()
            task.last_error_message = None

            logger.info(f"[任务执行] ✓ 任务 ID {task_id} 执行成功，处理记录数: {log.records_processed}")

        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.finished_at = datetime.now()
            task.last_run_status = "failed"
            task.last_error_message = str(e)
            task.status = "error"

            logger.error(f"[任务执行] ✗ 任务 ID {task_id} 执行失败: {str(e)}")
            import traceback
            logger.error(f"[任务执行] 错误堆栈:\n{traceback.format_exc()}")

            if self._should_retry(task):
                logger.info(f"[任务执行] 准备重试任务 ID {task_id}")
                await self._schedule_retry(db, task)

        finally:
            db.commit()
            logger.info(f"[任务执行] ========== 任务 ID {task_id} 执行完成 ==========")

    def _save_synced_data(self, db: Session, interface: SyncInterface, data: Any) -> None:
        """根据接口配置保存同步数据"""
        logger.info(f"[数据保存] 接口类型: {interface.interface_name}")

        if interface.interface_name == "daily":
            logger.info(f"[数据保存] 开始保存日线数据，数据条数: {len(data) if isinstance(data, list) else 1}")
            self._save_daily_data(db, data)
        elif interface.interface_name == "daily_basic":
            logger.info(f"[数据保存] 开始保存每日指标数据，数据条数: {len(data) if isinstance(data, list) else 1}")
            self._save_daily_basic_data(db, data)
        elif interface.interface_name == "moneyflow":
            logger.info(f"[数据保存] 开始保存资金流向数据，数据条数: {len(data) if isinstance(data, list) else 1}")
            self._save_moneyflow_data(db, data)
        elif interface.interface_name == "index_basic":
            logger.info(f"[数据保存] 开始保存指数基本信息，数据条数: {len(data) if isinstance(data, list) else 1}")
            self._save_index_basic_data(db, data)
        elif interface.interface_name == "index_daily":
            logger.info(f"[数据保存] 开始保存指数日线数据，数据条数: {len(data) if isinstance(data, list) else 1}")
            self._save_index_daily_data(db, data)
        else:
            logger.warning(f"[数据保存] ⚠ 接口类型 {interface.interface_name} 未实现数据保存")

    def _save_daily_data(self, db: Session, data: list) -> None:
        """保存日线数据"""
        from ..models.stock_daily import StockDaily
        from datetime import datetime

        logger.info(f"[日线数据保存] 开始处理日线数据，总条数: {len(data)}")

        new_count = 0
        update_count = 0
        error_count = 0

        for item in data:
            ts_code = item.get("ts_code")
            trade_date_str = item.get("trade_date")
            if not ts_code or not trade_date_str:
                logger.debug(f"[日线数据保存] 跳过记录: ts_code={ts_code}, trade_date={trade_date_str}")
                continue

            # Convert string date (YYYYMMDD) to datetime.date object
            try:
                trade_date = datetime.strptime(str(trade_date_str), "%Y%m%d").date()
                item["trade_date"] = trade_date
            except (ValueError, TypeError) as e:
                error_count += 1
                logger.error(f"[日线数据保存] 交易日期格式错误: {trade_date_str}, 错误: {str(e)}")
                continue

            existing = db.query(StockDaily).filter(
                StockDaily.ts_code == ts_code,
                StockDaily.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                update_count += 1
            else:
                db.add(StockDaily(**item))
                new_count += 1

        db.commit()
        logger.info(f"[日线数据保存] ✓ 保存完成: 新增 {new_count} 条, 更新 {update_count} 条, 失败 {error_count} 条")

    def _save_daily_basic_data(self, db: Session, data: list) -> None:
        """保存每日指标数据"""
        from ..models.stock_daily_basic import StockDailyBasic
        from datetime import datetime

        logger.info(f"[每日指标数据保存] 开始处理每日指标数据，总条数: {len(data)}")

        new_count = 0
        update_count = 0
        error_count = 0

        for item in data:
            ts_code = item.get("ts_code")
            trade_date_str = item.get("trade_date")
            if not ts_code or not trade_date_str:
                logger.debug(f"[每日指标数据保存] 跳过记录: ts_code={ts_code}, trade_date={trade_date_str}")
                continue

            # Convert string date (YYYYMMDD) to datetime.date object
            try:
                trade_date = datetime.strptime(str(trade_date_str), "%Y%m%d").date()
                item["trade_date"] = trade_date
            except (ValueError, TypeError) as e:
                error_count += 1
                logger.error(f"[每日指标数据保存] 交易日期格式错误: {trade_date_str}, 错误: {str(e)}")
                continue

            existing = db.query(StockDailyBasic).filter(
                StockDailyBasic.ts_code == ts_code,
                StockDailyBasic.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                update_count += 1
            else:
                db.add(StockDailyBasic(**item))
                new_count += 1

        db.commit()
        logger.info(f"[每日指标数据保存] ✓ 保存完成: 新增 {new_count} 条, 更新 {update_count} 条, 失败 {error_count} 条")

    def _save_moneyflow_data(self, db: Session, data: list) -> None:
        """保存资金流向数据"""
        from ..models.stock_moneyflow import StockMoneyflow
        from datetime import datetime

        logger.info(f"[资金流数据保存] 开始处理资金流向数据，总条数: {len(data)}")

        new_count = 0
        update_count = 0
        error_count = 0

        for item in data:
            ts_code = item.get("ts_code")
            trade_date_str = item.get("trade_date")
            if not ts_code or not trade_date_str:
                logger.debug(f"[资金流数据保存] 跳过记录: ts_code={ts_code}, trade_date={trade_date_str}")
                continue

            # Convert string date (YYYYMMDD) to datetime.date object
            try:
                trade_date = datetime.strptime(str(trade_date_str), "%Y%m%d").date()
                item["trade_date"] = trade_date
            except (ValueError, TypeError) as e:
                error_count += 1
                logger.error(f"[资金流数据保存] 交易日期格式错误: {trade_date_str}, 错误: {str(e)}")
                continue

            existing = db.query(StockMoneyflow).filter(
                StockMoneyflow.ts_code == ts_code,
                StockMoneyflow.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                update_count += 1
            else:
                db.add(StockMoneyflow(**item))
                new_count += 1

        db.commit()
        logger.info(f"[资金流数据保存] ✓ 保存完成: 新增 {new_count} 条, 更新 {update_count} 条, 失败 {error_count} 条")

    def _save_index_basic_data(self, db: Session, data: list) -> None:
        from ..models.index_basic import IndexBasic
        from datetime import datetime

        logger.info(f"[指数基本信息保存] 开始处理指数基本信息，总条数: {len(data)}")

        new_count = 0
        update_count = 0
        error_count = 0

        for item in data:
            ts_code = item.get("ts_code")
            if not ts_code:
                logger.debug(f"[指数基本信息保存] 跳过记录: ts_code={ts_code}")
                continue

            date_fields = ["base_date", "list_date", "exp_date"]
            for date_field in date_fields:
                date_str = item.get(date_field)
                if date_str:
                    try:
                        date_value = datetime.strptime(str(date_str), "%Y%m%d").date() if len(str(date_str)) == 8 else None
                        item[date_field] = date_value
                    except (ValueError, TypeError):
                        item[date_field] = None

            existing = db.query(IndexBasic).filter(IndexBasic.ts_code == ts_code).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                update_count += 1
            else:
                db.add(IndexBasic(**item))
                new_count += 1

        db.commit()
        logger.info(f"[指数基本信息保存] ✓ 保存完成: 新增 {new_count} 条, 更新 {update_count} 条, 失败 {error_count} 条")

    def _save_index_daily_data(self, db: Session, data: list) -> None:
        from ..models.index_daily import IndexDaily
        from datetime import datetime

        logger.info(f"[指数日线数据保存] 开始处理指数日线数据，总条数: {len(data)}")

        new_count = 0
        update_count = 0
        error_count = 0

        for item in data:
            ts_code = item.get("ts_code")
            trade_date_str = item.get("trade_date")
            if not ts_code or not trade_date_str:
                logger.debug(f"[指数日线数据保存] 跳过记录: ts_code={ts_code}, trade_date={trade_date_str}")
                continue

            try:
                trade_date = datetime.strptime(str(trade_date_str), "%Y%m%d").date()
                item["trade_date"] = trade_date
            except (ValueError, TypeError) as e:
                error_count += 1
                logger.error(f"[指数日线数据保存] 交易日期格式错误: {trade_date_str}, 错误: {str(e)}")
                continue

            existing = db.query(IndexDaily).filter(
                IndexDaily.ts_code == ts_code,
                IndexDaily.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                update_count += 1
            else:
                db.add(IndexDaily(**item))
                new_count += 1

        db.commit()
        logger.info(f"[指数日线数据保存] ✓ 保存完成: 新增 {new_count} 条, 更新 {update_count} 条, 失败 {error_count} 条")

    def _should_retry(self, task: SyncTask) -> bool:
        """判断是否应该重试"""
        retry_policy = task.retry_policy or {}
        max_retries = retry_policy.get("max_retries", 3)
        
        recent_failures = self.db.query(SyncExecutionLog).filter(
            SyncExecutionLog.task_id == task.id,
            SyncExecutionLog.status == "failed"
        ).count()

        return recent_failures < max_retries

    async def _schedule_retry(self, db: Session, task: SyncTask) -> None:
        """调度重试"""
        retry_policy = task.retry_policy or {}
        backoff_factor = retry_policy.get("backoff_factor", 2)
        delay_seconds = 60 * backoff_factor

        log = create_sync_execution_log(
            db,
            {
                "task_id": task.id,
                "execution_type": "retry",
                "status": "running"
            }
        )
        db.commit()

        import asyncio
        await asyncio.sleep(delay_seconds)
        await self._execute_task(db, task.id)

    async def load_and_schedule_all_tasks(self) -> None:
        """启动时加载并调度所有活动任务"""
        from ..crud.sync_management import get_sync_tasks

        logger.info(f"[任务加载] 开始加载所有活动任务")
        tasks = get_sync_tasks(self.db, status="active")
        logger.info(f"[任务加载] 找到 {len(tasks)} 个活动任务")

        loaded_count = 0
        error_count = 0

        for task in tasks:
            self.scheduler.register_task_function(task.id, self._execute_task_wrapper(task.id))
            try:
                await self.scheduler.add_task(
                    task.id,
                    task.schedule_type,
                    task.schedule_config
                )
                loaded_count += 1
                logger.info(f"[任务加载] ✓ 任务 ID {task.id} ({task.task_name}) 已成功加载并调度")
            except Exception as e:
                error_count += 1
                logger.error(f"[任务加载] ✗ 任务 ID {task.id} ({task.task_name}) 调度失败: {str(e)}")

        logger.info(f"[任务加载] ========== 任务加载完成: 成功 {loaded_count} 个, 失败 {error_count} 个 ==========")
