from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import asyncio

from ...database import get_db
from ...services.analysis_task_service import AnalysisTaskService, scheduler
from ...schemas.analysis_result import AnalysisTaskCreate, AnalysisTaskResponse, AnalysisTaskExecuteResponse

router = APIRouter()


@router.post("/", response_model=AnalysisTaskResponse)
async def create_analysis_task(
    task_data: AnalysisTaskCreate,
    db: Session = Depends(get_db)
):
    """创建分析任务"""
    try:
        service = AnalysisTaskService(db)
        task = await service.create_analysis_task(
            user_id=1,  # TODO: 从 JWT token 获取用户 ID
            task_name=task_data.task_name,
            rule_ids=task_data.rule_ids
        )
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{task_id}/execute")
async def execute_analysis_task(
    task_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """执行分析任务"""
    try:
        # 调度任务
        await scheduler.schedule_task(db, task_id)
        return AnalysisTaskExecuteResponse(
            task_id=task_id,
            status="scheduled",
            message="任务已开始执行"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}", response_model=AnalysisTaskResponse)
async def get_analysis_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """获取分析任务详情"""
    service = AnalysisTaskService(db)
    task = service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/", response_model=List[AnalysisTaskResponse])
async def get_analysis_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取分析任务列表"""
    try:
        service = AnalysisTaskService(db)
        tasks = service.get_user_tasks(user_id=1, skip=skip, limit=limit)  # TODO: 从 JWT token 获取用户 ID
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}/status")
async def get_task_status(
    task_id: int,
    db: Session = Depends(get_db)
):
    """获取任务执行状态"""
    try:
        service = AnalysisTaskService(db)
        status = service.get_task_status(task_id)
        if status["status"] == "not_found":
            raise HTTPException(status_code=404, detail="Task not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """取消任务执行"""
    try:
        success = await scheduler.cancel_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found or not running")
        return {"message": "Task cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
