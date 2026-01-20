from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.sync_management import (
    SyncInterfaceCreate,
    SyncInterfaceUpdate,
    SyncInterfaceResponse,
    SyncTaskCreate,
    SyncTaskUpdate,
    SyncTaskResponse,
    SyncExecutionLogResponse
)
from ...crud.sync_management import (
    get_sync_interface,
    get_sync_interfaces,
    create_sync_interface,
    update_sync_interface,
    delete_sync_interface,
    get_sync_task,
    get_sync_tasks,
    create_sync_task,
    update_sync_task,
    delete_sync_task,
    get_sync_execution_logs
)
from ...services.sync_task_manager import SyncTaskManager
from ...services.dynamic_scheduler import DynamicScheduler

router = APIRouter()

scheduler_instance = None


@router.on_event("startup")
async def startup_event():
    global scheduler_instance
    from ...core.config import settings
    scheduler_instance = DynamicScheduler(settings.DATABASE_URL)
    scheduler_instance.start()


@router.on_event("shutdown")
async def shutdown_event():
    global scheduler_instance
    if scheduler_instance:
        scheduler_instance.shutdown()


def get_scheduler():
    return scheduler_instance


@router.post("/interfaces", response_model=SyncInterfaceResponse)
async def create_interface(
    interface: SyncInterfaceCreate,
    db: Session = Depends(get_db)
):
    return create_sync_interface(db, interface)


@router.get("/interfaces", response_model=List[SyncInterfaceResponse])
async def list_interfaces(db: Session = Depends(get_db)):
    return get_sync_interfaces(db)


@router.get("/interfaces/{interface_id}", response_model=SyncInterfaceResponse)
async def get_interface(
    interface_id: int,
    db: Session = Depends(get_db)
):
    interface = get_sync_interface(db, interface_id)
    if not interface:
        raise HTTPException(status_code=404, detail="Interface not found")
    return interface


@router.put("/interfaces/{interface_id}", response_model=SyncInterfaceResponse)
async def update_interface(
    interface_id: int,
    interface: SyncInterfaceUpdate,
    db: Session = Depends(get_db)
):
    updated = update_sync_interface(db, interface_id, interface)
    if not updated:
        raise HTTPException(status_code=404, detail="Interface not found")
    return updated


@router.delete("/interfaces/{interface_id}")
async def delete_interface(
    interface_id: int,
    db: Session = Depends(get_db)
):
    success = delete_sync_interface(db, interface_id)
    if not success:
        raise HTTPException(status_code=404, detail="Interface not found")
    return {"message": "Interface deleted successfully"}


@router.post("/tasks", response_model=SyncTaskResponse)
async def create_task(
    task: SyncTaskCreate,
    db: Session = Depends(get_db),
    scheduler = Depends(get_scheduler)
):
    manager = SyncTaskManager(db, scheduler)
    created_task = await manager.create_and_schedule_task(task.dict())
    return created_task


@router.get("/tasks", response_model=List[SyncTaskResponse])
async def list_tasks(
    status: str = None,
    db: Session = Depends(get_db)
):
    return get_sync_tasks(db, status=status)


@router.get("/tasks/{task_id}", response_model=SyncTaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    task = get_sync_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/tasks/{task_id}", response_model=SyncTaskResponse)
async def update_task(
    task_id: int,
    task: SyncTaskUpdate,
    db: Session = Depends(get_db),
    scheduler = Depends(get_scheduler)
):
    manager = SyncTaskManager(db, scheduler)
    updated_task = await manager.update_and_reschedule_task(task_id, task.dict(exclude_unset=True))
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated_task


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    scheduler = Depends(get_scheduler)
):
    manager = SyncTaskManager(db, scheduler)
    success = await manager.delete_and_unschedule_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


@router.post("/tasks/{task_id}/pause")
async def pause_task(
    task_id: int,
    db: Session = Depends(get_db),
    scheduler = Depends(get_scheduler)
):
    manager = SyncTaskManager(db, scheduler)
    task = await manager.pause_task(task_id)
    return {"message": f"Task {task_id} paused"}


@router.post("/tasks/{task_id}/resume")
async def resume_task(
    task_id: int,
    db: Session = Depends(get_db),
    scheduler = Depends(get_scheduler)
):
    manager = SyncTaskManager(db, scheduler)
    task = await manager.resume_task(task_id)
    return {"message": f"Task {task_id} resumed"}


@router.post("/tasks/{task_id}/trigger")
async def trigger_task(
    task_id: int,
    db: Session = Depends(get_db),
    scheduler = Depends(get_scheduler)
):
    manager = SyncTaskManager(db, scheduler)
    await manager.trigger_task_manually(task_id)
    return {"message": f"Task {task_id} triggered manually"}


@router.get("/tasks/{task_id}/logs", response_model=List[SyncExecutionLogResponse])
async def get_task_logs(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_sync_execution_logs(db, task_id=task_id, skip=skip, limit=limit)
