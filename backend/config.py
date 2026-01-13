from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./stock_analysis.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: str = "your-influxdb-token"
    INFLUXDB_ORG: str = "your-org"
    INFLUXDB_BUCKET: str = "stock_data"
    
    # 认证配置
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API配置
    ALPHA_VANTAGE_API_KEY: str = "your-alpha-vantage-api-key"
    FINNHUB_API_KEY: str = "your-finnhub-api-key"
    
    # 文件存储配置
    UPLOAD_FOLDER: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760
    
    # 系统配置
    DEBUG: bool = True
    HOST: str = "localhost"
    PORT: int = 8000
    
    # 定时任务配置
    SYNC_INTERVAL: int = 60
    
    # 对象存储配置
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "YOUR_ACCESS_KEY"
    MINIO_SECRET_KEY: str = "YOUR_SECRET_KEY"
    MINIO_BUCKET: str = "YOUR_BUCKET"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


settings = Settings()
