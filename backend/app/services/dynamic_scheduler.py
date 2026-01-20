import asyncio
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger


class DynamicScheduler:
    """动态任务调度器 - 基于 APScheduler 实现"""

    def __init__(self, db_url: str, timezone: str = "Asia/Shanghai"):
        jobstores = {
            'default': SQLAlchemyJobStore(url=db_url)
        }
        executors = {
            'default': ThreadPoolExecutor(20)
        }
        job_defaults = {
            'coalesce': True,
            'max_instances': 1,
            'misfire_grace_time': 300,
            'replace_existing': True
        }
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=timezone
        )
        self.task_functions: Dict[str, Callable] = {}

    def start(self) -> None:
        """启动调度器"""
        if not self.scheduler.running:
            self.scheduler.start()
            print("DynamicScheduler started")

    def shutdown(self, wait: bool = True) -> None:
        """关闭调度器"""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=wait)
            print("DynamicScheduler shutdown")

    def register_task_function(self, task_id: str, func: Callable) -> None:
        """注册任务执行函数"""
        self.task_functions[str(task_id)] = func

    async def add_task(self, task_id: int, schedule_type: str, schedule_config: Dict[str, Any]) -> None:
        """添加新任务到调度器"""
        trigger = self._build_trigger(schedule_type, schedule_config)
        task_id_str = str(task_id)

        if task_id_str not in self.task_functions:
            raise ValueError(f"Task function not registered for task_id={task_id}")

        func = self.task_functions[task_id_str]
        self.scheduler.add_job(
            func,
            trigger=trigger,
            id=task_id_str,
            name=task_id_str,
            replace_existing=True
        )
        print(f"Task {task_id} added with {schedule_type} trigger")

    async def remove_task(self, task_id: int) -> None:
        """从调度器移除任务"""
        task_id_str = str(task_id)
        try:
            self.scheduler.remove_job(task_id_str)
            print(f"Task {task_id} removed")
        except Exception as e:
            print(f"Error removing task {task_id}: {e}")

    async def update_task(self, task_id: int, schedule_type: str, schedule_config: Dict[str, Any]) -> None:
        """更新任务的调度配置"""
        await self.remove_task(task_id)
        await self.add_task(task_id, schedule_type, schedule_config)

    async def pause_task(self, task_id: int) -> None:
        """暂停任务"""
        task_id_str = str(task_id)
        try:
            self.scheduler.pause_job(task_id_str)
            print(f"Task {task_id} paused")
        except Exception as e:
            print(f"Error pausing task {task_id}: {e}")

    async def resume_task(self, task_id: int) -> None:
        """恢复任务"""
        task_id_str = str(task_id)
        try:
            self.scheduler.resume_job(task_id_str)
            print(f"Task {task_id} resumed")
        except Exception as e:
            print(f"Error resuming task {task_id}: {e}")

    async def trigger_task(self, task_id: int) -> None:
        """立即触发任务执行"""
        task_id_str = str(task_id)
        try:
            job = self.scheduler.get_job(task_id_str)
            if job:
                job.modify(next_run_time=datetime.now())
            else:
                raise ValueError(f"Job {task_id} not found")
        except Exception as e:
            print(f"Error triggering task {task_id}: {e}")

    def get_job_info(self, task_id: int) -> Optional[Dict[str, Any]]:
        """获取任务信息"""
        task_id_str = str(task_id)
        try:
            job = self.scheduler.get_job(task_id_str)
            if job:
                return {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time,
                    "trigger": str(job.trigger)
                }
        except Exception as e:
            print(f"Error getting job info for {task_id}: {e}")
        return None

    def _build_trigger(self, schedule_type: str, config: Dict[str, Any]):
        """构建调度触发器"""
        if schedule_type == "cron":
            return CronTrigger(**config)
        elif schedule_type == "interval":
            return IntervalTrigger(**config)
        elif schedule_type == "date":
            return DateTrigger(**config)
        else:
            raise ValueError(f"Unsupported schedule type: {schedule_type}")
