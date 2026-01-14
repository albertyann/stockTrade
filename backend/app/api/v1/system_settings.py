from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...crud.system_setting import (
    get_system_setting, get_all_system_settings, get_system_settings_by_category,
    create_system_setting, update_system_setting, delete_system_setting,
    get_ai_settings, update_ai_settings, get_scheduler_settings, update_scheduler_settings
)
from ...schemas.system_setting import SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse

router = APIRouter()


@router.get("/", response_model=List[SystemSettingResponse])
def read_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有系统设置"""
    settings = get_all_system_settings(db, skip=skip, limit=limit)
    return settings


@router.get("/category/{category}", response_model=List[SystemSettingResponse])
def read_settings_by_category(category: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """按分类获取系统设置"""
    if category not in ['ai', 'scheduler', 'system']:
        raise HTTPException(status_code=400, detail="Invalid category. Must be: ai, scheduler, or system")
    settings = get_system_settings_by_category(db, category=category, skip=skip, limit=limit)
    return settings


@router.get("/{key}", response_model=SystemSettingResponse)
def read_setting(key: str, db: Session = Depends(get_db)):
    """获取单个系统设置"""
    setting = get_system_setting(db, key=key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.post("/", response_model=SystemSettingResponse)
def create_setting(setting: SystemSettingCreate, db: Session = Depends(get_db)):
    """创建系统设置"""
    existing = get_system_setting(db, key=setting.key)
    if existing:
        raise HTTPException(status_code=400, detail="Setting with this key already exists")
    return create_system_setting(db=db, setting=setting)


@router.put("/{key}", response_model=SystemSettingResponse)
def update_setting(key: str, setting: SystemSettingUpdate, db: Session = Depends(get_db)):
    """更新系统设置"""
    updated_setting = update_system_setting(db, key=key, setting=setting)
    if not updated_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return updated_setting


@router.delete("/{key}")
def delete_setting(key: str, db: Session = Depends(get_db)):
    """删除系统设置"""
    success = delete_system_setting(db, key=key)
    if not success:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"message": "Setting deleted successfully"}


@router.get("/ai/config")
def read_ai_settings(db: Session = Depends(get_db)):
    """获取 AI 配置"""
    settings = get_ai_settings(db)
    # 不返回 API Key（为了安全）
    settings['api_key'] = settings['api_key'][:10] + '...' if len(settings['api_key']) > 10 else ''
    return settings


@router.put("/ai/config")
def update_ai_config(settings: dict, db: Session = Depends(get_db)):
    """更新 AI 配置"""
    success = update_ai_settings(db, settings)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update AI settings")
    return {"message": "AI settings updated successfully"}


@router.get("/scheduler/config")
def read_scheduler_settings(db: Session = Depends(get_db)):
    """获取调度器配置"""
    return get_scheduler_settings(db)


@router.put("/scheduler/config")
def update_scheduler_config(settings: dict, db: Session = Depends(get_db)):
    """更新调度器配置"""
    success = update_scheduler_settings(db, settings)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update scheduler settings")
    return {"message": "Scheduler settings updated successfully"}
