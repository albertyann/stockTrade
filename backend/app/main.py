from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .api.v1 import auth, users, stocks, user_stocks, investment_notes, uploaded_files, analysis_rules, analysis_results, sync, system_settings, analysis_tasks, sync_management, index_daily, stock_daily, financials
from .core.config import settings
from .services.data_sync_scheduler import run_scheduler
import os
import threading

Base.metadata.create_all(bind=engine)

app = FastAPI(title="股票深度分析系统API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(stocks.router, prefix="/api/v1/stocks", tags=["stocks"])
app.include_router(user_stocks.router, prefix="/api/v1/user-stocks", tags=["user-stocks"])
app.include_router(investment_notes.router, prefix="/api/v1/investment-notes", tags=["investment-notes"])
app.include_router(uploaded_files.router, prefix="/api/v1/upload-files", tags=["uploaded-files"])
app.include_router(analysis_rules.router, prefix="/api/v1/analysis-rules", tags=["analysis-rules"])
app.include_router(analysis_results.router, prefix="/api/v1/analysis-results", tags=["analysis-results"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["sync"])
app.include_router(sync_management.router, prefix="/api/v1/sync-management", tags=["sync-management"])
app.include_router(system_settings.router, prefix="/api/v1/system-settings", tags=["system-settings"])
app.include_router(analysis_tasks.router, prefix="/api/v1/analysis-tasks", tags=["analysis-tasks"])
app.include_router(index_daily.router, prefix="/api/v1/indices", tags=["indices"])
app.include_router(stock_daily.router, prefix="/api/v1/stock-daily", tags=["stock-daily"])
app.include_router(financials.router, prefix="/api/v1/financials", tags=["financials"])


@app.on_event("startup")
def startup_event():
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    print("Data sync scheduler started")
