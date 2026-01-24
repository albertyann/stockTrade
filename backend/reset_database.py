#!/usr/bin/env python3
"""
Database reset script for quantitative trading system.
This script drops all existing tables and recreates them with the new schema.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import Base, engine
from app.models import (
    User, Stock, UserStock, InvestmentNote, UploadedFile,
    AnalysisRule, AnalysisResult, SystemSetting, SyncInterface,
    SyncTask, SyncExecutionLog, StockDaily, StockDailyBasic,
    StockMoneyflow, IndexBasic, IndexDaily,
    QuantStrategy, StrategyVersion, BacktestResult, StrategySignal,
    StrategyPerformance, StrategyPosition,
    Order, Position, Portfolio, Transaction
)
from app.models.stock_balance_sheet import StockBalanceSheet
from app.models.stock_income_statement import StockIncomeStatement
from app.models.stock_cash_flow import StockCashFlow

def reset_database():
    """Drop all tables and recreate them with the new schema."""
    print("Dropping all existing tables...")
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables with new schema...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database reset completed successfully!")
    print(f"Created tables: {[table.name for table in Base.metadata.tables.values()]}")

if __name__ == "__main__":
    print("=" * 60)
    print("Quantitative Trading System Database Reset")
    print("=" * 60)
    print()
    print("WARNING: This will delete ALL existing data!")
    print()
    
    response = input("Are you sure you want to continue? (yes/no): ")
    
    if response.lower() == "yes":
        reset_database()
    else:
        print("Database reset cancelled.")