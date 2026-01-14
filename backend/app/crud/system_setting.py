from sqlalchemy.orm import Session
from ..models.system_setting import SystemSetting
from ..schemas.system_setting import SystemSettingCreate, SystemSettingUpdate
from typing import Optional
import json


def get_system_setting(db: Session, key: str) -> Optional[SystemSetting]:
    return db.query(SystemSetting).filter(SystemSetting.key == key).first()


def get_system_settings_by_category(db: Session, category: str, skip: int = 0, limit: int = 100):
    return db.query(SystemSetting).filter(
        SystemSetting.category == category
    ).offset(skip).limit(limit).all()


def get_all_system_settings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(SystemSetting).offset(skip).limit(limit).all()


def create_system_setting(db: Session, setting: SystemSettingCreate) -> SystemSetting:
    db_setting = SystemSetting(**setting.model_dump())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


def update_system_setting(db: Session, key: str, setting: SystemSettingUpdate) -> Optional[SystemSetting]:
    db_setting = get_system_setting(db, key)
    if db_setting:
        db_setting.value = setting.value
        if setting.description is not None:
            db_setting.description = setting.description
        db.commit()
        db.refresh(db_setting)
    return db_setting


def delete_system_setting(db: Session, key: str) -> bool:
    db_setting = get_system_setting(db, key)
    if db_setting:
        db.delete(db_setting)
        db.commit()
        return True
    return False


def get_setting_value(db: Session, key: str, default: str = '') -> str:
    setting = get_system_setting(db, key)
    if setting:
        if setting.value_type == 'boolean':
            return 'true' if setting.value.lower() in ['true', '1', 'yes'] else 'false'
        return setting.value
    return default


def get_setting_value_as_int(db: Session, key: str, default: int = 0) -> int:
    value = get_setting_value(db, key, str(default))
    try:
        return int(value)
    except ValueError:
        return default


def get_setting_value_as_bool(db: Session, key: str, default: bool = False) -> bool:
    value = get_setting_value(db, key, str(default))
    return value.lower() in ['true', '1', 'yes']


def get_setting_value_as_json(db: Session, key: str, default: dict = None) -> dict:
    setting = get_system_setting(db, key)
    if setting and setting.value_type == 'json':
        try:
            return json.loads(setting.value)
        except json.JSONDecodeError:
            pass
    return default or {}


def set_setting_value(db: Session, key: str, value: str, value_type: str = 'string', 
                     category: str = 'system', description: str = None) -> SystemSetting:
    setting = get_system_setting(db, key)
    if setting:
        setting.value = value
        setting.value_type = value_type
        setting.category = category
        if description:
            setting.description = description
        db.commit()
        db.refresh(setting)
        return setting
    else:
        setting_data = SystemSettingCreate(
            key=key,
            value=value,
            value_type=value_type,
            category=category,
            description=description
        )
        return create_system_setting(db, setting_data)


def get_ai_settings(db: Session) -> dict:
    return {
        'provider': get_setting_value(db, 'ai_provider', 'openai'),
        'api_key': get_setting_value(db, 'ai_api_key', ''),
        'model': get_setting_value(db, 'ai_model', 'gpt-4'),
        'temperature': get_setting_value_as_int(db, 'ai_temperature', 70) / 100,
        'max_tokens': get_setting_value_as_int(db, 'ai_max_tokens', 2000),
        'timeout': get_setting_value_as_int(db, 'ai_timeout', 60),
    }


def update_ai_settings(db: Session, settings: dict) -> bool:
    try:
        set_setting_value(db, 'ai_provider', settings.get('provider', 'openai'), 'string', 'ai', 'AI 服务提供商')
        set_setting_value(db, 'ai_api_key', settings.get('api_key', ''), 'string', 'ai', 'AI API 密钥')
        set_setting_value(db, 'ai_model', settings.get('model', 'gpt-4'), 'string', 'ai', 'AI 模型')
        set_setting_value(db, 'ai_temperature', str(int(settings.get('temperature', 0.7) * 100)), 'integer', 'ai', 'AI 温度参数')
        set_setting_value(db, 'ai_max_tokens', str(settings.get('max_tokens', 2000)), 'integer', 'ai', 'AI 最大 Token 数')
        set_setting_value(db, 'ai_timeout', str(settings.get('timeout', 60)), 'integer', 'ai', 'AI 请求超时时间')
        return True
    except Exception as e:
        db.rollback()
        return False


def get_scheduler_settings(db: Session) -> dict:
    return {
        'enabled': get_setting_value_as_bool(db, 'scheduler_enabled', True),
        'max_workers': get_setting_value_as_int(db, 'scheduler_max_workers', 4),
        'task_timeout': get_setting_value_as_int(db, 'scheduler_task_timeout', 300),
    }


def update_scheduler_settings(db: Session, settings: dict) -> bool:
    try:
        set_setting_value(db, 'scheduler_enabled', str(settings.get('enabled', True)), 'boolean', 'scheduler', '启用任务调度器')
        set_setting_value(db, 'scheduler_max_workers', str(settings.get('max_workers', 4)), 'integer', 'scheduler', '最大工作线程数')
        set_setting_value(db, 'scheduler_task_timeout', str(settings.get('task_timeout', 300)), 'integer', 'scheduler', '任务超时时间')
        return True
    except Exception as e:
        db.rollback()
        return False
