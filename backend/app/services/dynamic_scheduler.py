import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
            logger.info(f"========== 调度器已启动 ==========")
            logger.info(f"启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(f"时区: {self.scheduler.timezone}")
        else:
            logger.warning("调度器已经在运行中")

    def shutdown(self, wait: bool = True) -> None:
        """关闭调度器"""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=wait)
            logger.info(f"========== 调度器已关闭 ==========")
            logger.info(f"关闭时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            logger.warning("调度器未运行")

    def register_task_function(self, task_id: str, func: Callable) -> None:
        """注册任务执行函数"""
        self.task_functions[str(task_id)] = func
        logger.info(f"[任务注册] 任务 ID {task_id} 已注册执行函数")

    async def add_task(self, task_id: int, schedule_type: str, schedule_config: Dict[str, Any]) -> None:
        """添加新任务到调度器"""
        logger.info(f"[任务添加] 开始添加任务 ID: {task_id}")

        trigger = self._build_trigger(schedule_type, schedule_config)
        task_id_str = str(task_id)

        if task_id_str not in self.task_functions:
            error_msg = f"任务 ID {task_id} 未注册执行函数"
            logger.error(f"[任务添加] {error_msg}")
            raise ValueError(error_msg)

        func = self.task_functions[task_id_str]
        self.scheduler.add_job(
            func,
            trigger=trigger,
            id=task_id_str,
            name=task_id_str,
            replace_existing=True
        )
        logger.info(f"[任务添加] ✓ 任务 ID {task_id} 已添加，触发器类型: {schedule_type}, 配置: {schedule_config}")

    async def remove_task(self, task_id: int) -> None:
        """从调度器移除任务"""
        task_id_str = str(task_id)
        logger.info(f"[任务移除] 尝试移除任务 ID: {task_id}")
        try:
            self.scheduler.remove_job(task_id_str)
            logger.info(f"[任务移除] ✓ 任务 ID {task_id} 已成功移除")
        except Exception as e:
            logger.error(f"[任务移除] ✗ 移除任务 ID {task_id} 失败: {str(e)}")

    async def update_task(self, task_id: int, schedule_type: str, schedule_config: Dict[str, Any]) -> None:
        """更新任务的调度配置"""
        logger.info(f"[任务更新] 开始更新任务 ID: {task_id}")
        await self.remove_task(task_id)
        await self.add_task(task_id, schedule_type, schedule_config)
        logger.info(f"[任务更新] ✓ 任务 ID {task_id} 更新完成")

    async def pause_task(self, task_id: int) -> None:
        """暂停任务"""
        task_id_str = str(task_id)
        logger.info(f"[任务暂停] 尝试暂停任务 ID: {task_id}")
        try:
            self.scheduler.pause_job(task_id_str)
            logger.info(f"[任务暂停] ✓ 任务 ID {task_id} 已成功暂停")
        except Exception as e:
            logger.error(f"[任务暂停] ✗ 暂停任务 ID {task_id} 失败: {str(e)}")

    async def resume_task(self, task_id: int) -> None:
        """恢复任务"""
        task_id_str = str(task_id)
        logger.info(f"[任务恢复] 尝试恢复任务 ID: {task_id}")
        try:
            self.scheduler.resume_job(task_id_str)
            logger.info(f"[任务恢复] ✓ 任务 ID {task_id} 已成功恢复")
        except Exception as e:
            logger.error(f"[任务恢复] ✗ 恢复任务 ID {task_id} 失败: {str(e)}")

    async def trigger_task(self, task_id: int) -> None:
        """立即触发任务执行"""
        task_id_str = str(task_id)
        logger.info(f"[任务触发] 手动触发任务 ID: {task_id}, 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        try:
            if task_id_str in self.task_functions:
                func = self.task_functions[task_id_str]
                logger.info(f"[任务触发] 任务 ID {task_id} 开始执行...")
                await func()
                logger.info(f"[任务触发] ✓ 任务 ID {task_id} 执行成功")
            else:
                error_msg = f"任务 ID {task_id} 未注册执行函数"
                logger.error(f"[任务触发] ✗ {error_msg}")
                raise ValueError(error_msg)
        except Exception as e:
            import traceback
            logger.error(f"[任务触发] ✗ 任务 ID {task_id} 执行失败: {str(e)}")
            logger.error(f"[任务触发] 详细错误堆栈:\n{traceback.format_exc()}")

    def get_job_info(self, task_id: int) -> Optional[Dict[str, Any]]:
        """获取任务信息"""
        task_id_str = str(task_id)
        logger.debug(f"[任务信息] 查询任务 ID: {task_id}")
        try:
            job = self.scheduler.get_job(task_id_str)
            if job:
                job_info = {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time,
                    "trigger": str(job.trigger)
                }
                logger.info(f"[任务信息] 任务 ID {task_id}: 下次执行时间 {job.next_run_time}, 触发器 {str(job.trigger)}")
                return job_info
            else:
                logger.warning(f"[任务信息] 任务 ID {task_id} 未找到")
        except Exception as e:
            logger.error(f"[任务信息] 获取任务 ID {task_id} 信息失败: {str(e)}")
        return None

    def _build_trigger(self, schedule_type: str, config: Dict[str, Any]):
        """构建调度触发器"""
        logger.debug(f"[触发器构建] 类型: {schedule_type}, 配置: {config}")

        if schedule_type == "cron":
            trigger = CronTrigger(**config)
            logger.info(f"[触发器构建] ✓ 创建 CRON 触发器: {config}")
            return trigger
        elif schedule_type == "interval":
            trigger = IntervalTrigger(**config)
            logger.info(f"[触发器构建] ✓ 创建 INTERVAL 触发器: {config}")
            return trigger
        elif schedule_type == "date":
            trigger = DateTrigger(**config)
            logger.info(f"[触发器构建] ✓ 创建 DATE 触发器: {config}")
            return trigger
        else:
            error_msg = f"不支持的调度类型: {schedule_type}"
            logger.error(f"[触发器构建] ✗ {error_msg}")
            raise ValueError(error_msg)
