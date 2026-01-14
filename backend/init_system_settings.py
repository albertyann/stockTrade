from app.database import SessionLocal
from app.crud.system_setting import set_setting_value


def init_system_settings():
    db = SessionLocal()
    
    try:
        # AI 设置
        set_setting_value(db, 'ai_provider', 'openai', 'string', 'ai', 'AI 服务提供商 (openai, anthropic, local)')
        set_setting_value(db, 'ai_api_key', '', 'string', 'ai', 'AI API 密钥')
        set_setting_value(db, 'ai_model', 'gpt-4', 'string', 'ai', 'AI 模型名称')
        set_setting_value(db, 'ai_temperature', '70', 'integer', 'ai', 'AI 温度参数 (0-100)')
        set_setting_value(db, 'ai_max_tokens', '2000', 'integer', 'ai', 'AI 最大 Token 数')
        set_setting_value(db, 'ai_timeout', '60', 'integer', 'ai', 'AI 请求超时时间（秒）')
        
        # 调度器设置
        set_setting_value(db, 'scheduler_enabled', 'true', 'boolean', 'scheduler', '启用任务调度器')
        set_setting_value(db, 'scheduler_max_workers', '4', 'integer', 'scheduler', '最大工作线程数')
        set_setting_value(db, 'scheduler_task_timeout', '300', 'integer', 'scheduler', '任务超时时间（秒）')
        
        # 系统设置
        set_setting_value(db, 'system_name', '股票深度分析系统', 'string', 'system', '系统名称')
        set_setting_value(db, 'system_version', '1.0.0', 'string', 'system', '系统版本')
        
        print("Successfully initialized system settings!")
        
    except Exception as e:
        print(f"Error initializing system settings: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_system_settings()
