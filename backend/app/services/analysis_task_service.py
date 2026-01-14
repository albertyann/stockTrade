import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import traceback

from app.models.analysis_result import AnalysisTask, AnalysisResult
from app.models.analysis_rule import AnalysisRule
from app.models.stock import Stock
from app.crud.analysis_rule import get_enabled_analysis_rules_by_user
from app.crud.stock import get_stocks
from app.services.ai_service import get_ai_service
from app.services.script_sandbox import sandbox
from app.schemas.analysis_result import AnalysisTaskResponse
from app.crud.system_setting import get_ai_settings


class AnalysisTaskService:
    """分析任务服务"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_config = get_ai_settings(db)

    async def create_analysis_task(
        self,
        user_id: int,
        task_name: str,
        rule_ids: Optional[List[int]] = None
    ) -> AnalysisTask:
        """创建分析任务"""
        task = AnalysisTask(
            user_id=user_id,
            task_name=task_name,
            ai_provider=self.ai_config['provider'],
            status='pending',
            created_at=datetime.now()
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    async def execute_task(self, task_id: int) -> AnalysisTask:
        """执行分析任务"""
        task = self.db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        # 更新状态为运行中
        task.status = 'running'
        task.started_at = datetime.now()
        self.db.commit()

        try:
            # 1. 获取启用的规则
            rules = get_enabled_analysis_rules_by_user(self.db, user_id=task.user_id)
            if not rules:
                raise ValueError("No enabled analysis rules found")

            # 2. 获取股票数据
            stocks = get_stocks(self.db, skip=0, limit=1000)
            if not stocks:
                raise ValueError("No stock data found")

            # 转换为字典列表
            stock_data = []
            for stock in stocks:
                stock_dict = {
                    'id': stock.id,
                    'code': stock.code,
                    'name': stock.name,
                    'price': float(stock.price) if stock.price else 0,
                    'change': float(stock.change) if stock.change is not None else 0,
                    'market': stock.market,
                    'industry': stock.industry,
                }
                stock_data.append(stock_dict)

            # 3. 调用 AI 生成脚本和推理
            rules_data = []
            for rule in rules:
                rule_dict = {
                    'id': rule.id,
                    'name': rule.name,
                    'description': rule.description,
                    'conditions': rule.conditions if isinstance(rule.conditions, dict) else {},
                }
                rules_data.append(rule_dict)

            ai_service = get_ai_service(self.ai_config)
            script, reasoning = await ai_service.generate_script(rules_data, stock_data)

            if not script:
                raise ValueError("AI failed to generate analysis script")

            # 4. 保存 AI 生成的脚本和推理
            task.ai_generated_script = script
            task.ai_reasoning = reasoning
            self.db.commit()

            # 5. 在沙箱中执行脚本
            success, matched_ids, exec_log = await sandbox.execute_script(script, stock_data)

            # 6. 保存执行结果
            task.execution_log = exec_log
            task.matched_stock_ids = matched_ids if success else []

            if success:
                task.status = 'completed'
                task.completed_at = datetime.now()

                # 7. 创建分析结果记录
                for stock_id in matched_ids:
                    for rule in rules:
                        result = AnalysisResult(
                            rule_id=rule.id,
                            stock_id=stock_id,
                            matched=True,
                            timestamp=datetime.now(),
                            data={'task_id': task.id}
                        )
                        self.db.add(result)
                self.db.commit()

            else:
                task.status = 'failed'
                task.error_message = exec_log.get('error', 'Unknown error')
                task.completed_at = datetime.now()

        except Exception as e:
            task.status = 'failed'
            task.error_message = str(e)
            task.execution_log = {
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            task.completed_at = datetime.now()
            self.db.commit()

        self.db.refresh(task)
        return task

    def get_task(self, task_id: int) -> Optional[AnalysisTask]:
        """获取分析任务"""
        return self.db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()

    def get_user_tasks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[AnalysisTask]:
        """获取用户的分析任务列表"""
        return self.db.query(AnalysisTask)\
            .filter(AnalysisTask.user_id == user_id)\
            .order_by(AnalysisTask.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()

    def get_task_status(self, task_id: int) -> dict:
        """获取任务状态"""
        task = self.get_task(task_id)
        if not task:
            return {"status": "not_found"}

        return {
            "status": task.status,
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "error_message": task.error_message,
            "matched_count": len(task.matched_stock_ids) if task.matched_stock_ids else 0,
        }


class AnalysisTaskScheduler:
    """分析任务调度器（简化版）"""

    def __init__(self):
        self.tasks: dict = {}  # task_id -> asyncio.Task
        self.running = False

    async def schedule_task(
        self,
        db: Session,
        task_id: int
    ) -> str:
        """调度任务执行"""
        if task_id in self.tasks:
            return "Task already scheduled or running"

        async def run_task():
            service = AnalysisTaskService(db)
            try:
                await service.execute_task(task_id)
            except Exception as e:
                print(f"Task {task_id} failed: {e}")
            finally:
                if task_id in self.tasks:
                    del self.tasks[task_id]

        self.tasks[task_id] = asyncio.create_task(run_task())
        return "Task scheduled"

    def get_task_info(self, task_id: int) -> dict:
        """获取任务信息"""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            return {
                "status": "running",
                "done": task.done(),
                "cancelled": task.cancelled()
            }
        return {"status": "not_running"}

    async def cancel_task(self, task_id: int) -> bool:
        """取消任务"""
        if task_id in self.tasks:
            self.tasks[task_id].cancel()
            del self.tasks[task_id]
            return True
        return False


# 全局调度器实例
scheduler = AnalysisTaskScheduler()
