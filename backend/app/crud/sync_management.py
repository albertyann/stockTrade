from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.sync_interface import SyncInterface
from ..models.sync_task import SyncTask
from ..models.sync_execution_log import SyncExecutionLog
from ..schemas.sync_management import (
    SyncInterfaceCreate,
    SyncInterfaceUpdate,
    SyncTaskCreate,
    SyncTaskUpdate,
    SyncExecutionLogCreate
)


def get_sync_interface(db: Session, interface_id: int) -> Optional[SyncInterface]:
    return db.query(SyncInterface).filter(SyncInterface.id == interface_id).first()


def get_sync_interface_by_name(db: Session, interface_name: str) -> Optional[SyncInterface]:
    return db.query(SyncInterface).filter(SyncInterface.interface_name == interface_name).first()


def get_sync_interfaces(db: Session, skip: int = 0, limit: int = 100) -> List[SyncInterface]:
    return db.query(SyncInterface).offset(skip).limit(limit).all()


def create_sync_interface(db: Session, interface: SyncInterfaceCreate) -> SyncInterface:
    db_interface = SyncInterface(**interface.dict())
    db.add(db_interface)
    db.commit()
    db.refresh(db_interface)
    return db_interface


def update_sync_interface(db: Session, interface_id: int, interface: SyncInterfaceUpdate) -> Optional[SyncInterface]:
    db_interface = get_sync_interface(db, interface_id)
    if not db_interface:
        return None

    update_data = interface.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_interface, key, value)

    db.commit()
    db.refresh(db_interface)
    return db_interface


def delete_sync_interface(db: Session, interface_id: int) -> bool:
    db_interface = get_sync_interface(db, interface_id)
    if not db_interface:
        return False

    db.delete(db_interface)
    db.commit()
    return True


def get_sync_task(db: Session, task_id: int) -> Optional[SyncTask]:
    return db.query(SyncTask).filter(SyncTask.id == task_id).first()


def get_sync_tasks(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[SyncTask]:
    query = db.query(SyncTask)
    if status:
        query = query.filter(SyncTask.status == status)
    return query.offset(skip).limit(limit).all()


def create_sync_task(db: Session, task: SyncTaskCreate) -> SyncTask:
    db_task = SyncTask(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_sync_task(db: Session, task_id: int, task: SyncTaskUpdate) -> Optional[SyncTask]:
    db_task = get_sync_task(db, task_id)
    if not db_task:
        return None

    update_data = task.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


def delete_sync_task(db: Session, task_id: int) -> bool:
    db_task = get_sync_task(db, task_id)
    if not db_task:
        return False

    db.delete(db_task)
    db.commit()
    return True


def get_sync_execution_log(db: Session, log_id: int) -> Optional[SyncExecutionLog]:
    return db.query(SyncExecutionLog).filter(SyncExecutionLog.id == log_id).first()


def get_sync_execution_logs(db: Session, task_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[SyncExecutionLog]:
    query = db.query(SyncExecutionLog)
    if task_id:
        query = query.filter(SyncExecutionLog.task_id == task_id)
    return query.order_by(SyncExecutionLog.started_at.desc()).offset(skip).limit(limit).all()


def create_sync_execution_log(db: Session, log: SyncExecutionLogCreate) -> SyncExecutionLog:
    db_log = SyncExecutionLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def update_sync_execution_log(db: Session, log_id: int, **kwargs) -> Optional[SyncExecutionLog]:
    db_log = get_sync_execution_log(db, log_id)
    if not db_log:
        return None

    for key, value in kwargs.items():
        setattr(db_log, key, value)

    db.commit()
    db.refresh(db_log)
    return db_log
