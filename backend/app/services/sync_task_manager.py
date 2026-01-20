from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime
from ..models.sync_interface import SyncInterface
from ..models.sync_task import SyncTask
from ..models.sync_execution_log import SyncExecutionLog
from ..crud.sync_management import (
    create_sync_task,
    update_sync_task,
    delete_sync_task,
    get_sync_task,
    create_sync_execution_log,
    update_sync_execution_log
)
from ..services.tushare_interface_registry import TushareInterfaceRegistry
from ..services.dynamic_scheduler import DynamicScheduler
from ..core.config import settings


class SyncTaskManager:
    """同步任务管理器 - 管理任务生命周期"""

    def __init__(self, db: Session, scheduler: DynamicScheduler):
        self.db = db
        self.scheduler = scheduler
        self.tushare_registry = TushareInterfaceRegistry(settings.TUSHARE_API_TOKEN)

    async def create_and_schedule_task(self, task_data: Dict[str, Any]) -> SyncTask:
        """创建新任务并添加到调度器"""
        db_task = create_sync_task(self.db, task_data)
        self.scheduler.register_task_function(db_task.id, self._execute_task_wrapper(db_task.id))
        await self.scheduler.add_task(
            db_task.id,
            db_task.schedule_type,
            db_task.schedule_config
        )
        return db_task

    async def update_and_reschedule_task(self, task_id: int, task_data: Dict[str, Any]) -> SyncTask:
        """更新任务配置并重新调度"""
        db_task = update_sync_task(self.db, task_id, task_data)
        await self.scheduler.update_task(
            db_task.id,
            db_task.schedule_type,
            db_task.schedule_config
        )
        return db_task

    async def delete_and_unschedule_task(self, task_id: int) -> bool:
        """删除任务并从调度器移除"""
        await self.scheduler.remove_task(task_id)
        return delete_sync_task(self.db, task_id)

    async def pause_task(self, task_id: int) -> SyncTask:
        """暂停任务"""
        task = get_sync_task(self.db, task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found in database")
        await self.scheduler.pause_task(task_id)
        task.status = "paused"
        self.db.commit()
        return task

    async def resume_task(self, task_id: int) -> SyncTask:
        """恢复任务"""
        task = get_sync_task(self.db, task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found in database")
        if task.status != "paused":
            raise ValueError(f"Task {task_id} is not paused")
        await self.scheduler.resume_task(task_id)
        task.status = "active"
        self.db.commit()
        return task

    async def trigger_task_manually(self, task_id: int) -> None:
        """手动触发任务执行"""
        task = get_sync_task(self.db, task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found in database")
        await self.scheduler.trigger_task(task_id)

    def _execute_task_wrapper(self, task_id: int):
        """包装任务执行函数供调度器调用"""
        async def wrapper():
            from ..database import SessionLocal
            db = SessionLocal()
            try:
                await self._execute_task(db, task_id)
            finally:
                db.close()
        return wrapper

    async def _execute_task(self, db: Session, task_id: int) -> None:
        """执行同步任务的核心逻辑"""
        task = db.query(SyncTask).filter(SyncTask.id == task_id).first()
        if not task:
            print(f"Task {task_id} not found")
            return

        if task.status != "active":
            print(f"Task {task_id} is not active (status: {task.status})")
            return

        interface = db.query(SyncInterface).filter(
            SyncInterface.id == task.interface_id
        ).first()

        if not interface:
            print(f"Interface {task.interface_id} not found for task {task_id}")
            return

        log = create_sync_execution_log(
            db,
            {
                "task_id": task_id,
                "execution_type": "scheduled",
                "status": "running"
            }
        )

        try:
            task.last_run_status = "running"
            db.commit()

            merged_params = {**interface.interface_params, **task.task_params}
            data = await self.tushare_registry.execute(
                interface.interface_name,
                merged_params
            )

            self._save_synced_data(db, interface, data)

            log.status = "success"
            log.records_processed = len(data) if isinstance(data, list) else 1
            log.finished_at = datetime.now()
            task.last_run_status = "success"
            task.last_run_at = datetime.now()
            task.last_error_message = None

            print(f"Task {task_id} completed successfully, processed {log.records_processed} records")

        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.finished_at = datetime.now()
            task.last_run_status = "failed"
            task.last_error_message = str(e)
            task.status = "error"

            print(f"Task {task_id} failed: {e}")

            if self._should_retry(task):
                await self._schedule_retry(db, task)

        finally:
            db.commit()

    def _save_synced_data(self, db: Session, interface: SyncInterface, data: Any) -> None:
        """根据接口配置保存同步数据"""
        if interface.interface_name == "daily":
            self._save_daily_data(db, data)
        elif interface.interface_name == "daily_basic":
            self._save_daily_basic_data(db, data)
        elif interface.interface_name == "moneyflow":
            self._save_moneyflow_data(db, data)
        else:
            print(f"Data saving not implemented for interface: {interface.interface_name}")

    def _save_daily_data(self, db: Session, data: list) -> None:
        """保存日线数据"""
        from ..models.stock_daily import StockDaily

        for item in data:
            ts_code = item.get("ts_code")
            trade_date = item.get("trade_date")
            if not ts_code or not trade_date:
                continue

            existing = db.query(StockDaily).filter(
                StockDaily.ts_code == ts_code,
                StockDaily.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                db.add(StockDaily(**item))

        db.commit()

    def _save_daily_basic_data(self, db: Session, data: list) -> None:
        """保存每日指标数据"""
        from ..models.stock_daily_basic import StockDailyBasic

        for item in data:
            ts_code = item.get("ts_code")
            trade_date = item.get("trade_date")
            if not ts_code or not trade_date:
                continue

            existing = db.query(StockDailyBasic).filter(
                StockDailyBasic.ts_code == ts_code,
                StockDailyBasic.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                db.add(StockDailyBasic(**item))

        db.commit()

    def _save_moneyflow_data(self, db: Session, data: list) -> None:
        """保存资金流向数据"""
        from ..models.stock_moneyflow import StockMoneyflow

        for item in data:
            ts_code = item.get("ts_code")
            trade_date = item.get("trade_date")
            if not ts_code or not trade_date:
                continue

            existing = db.query(StockMoneyflow).filter(
                StockMoneyflow.ts_code == ts_code,
                StockMoneyflow.trade_date == trade_date
            ).first()

            if existing:
                for key, value in item.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                db.add(StockMoneyflow(**item))

        db.commit()

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

        tasks = get_sync_tasks(self.db, status="active")
        for task in tasks:
            self.scheduler.register_task_function(task.id, self._execute_task_wrapper(task.id))
            try:
                await self.scheduler.add_task(
                    task.id,
                    task.schedule_type,
                    task.schedule_config
                )
                print(f"Loaded and scheduled task: {task.task_name}")
            except Exception as e:
                print(f"Error scheduling task {task.task_name}: {e}")
