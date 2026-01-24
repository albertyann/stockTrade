#!/usr/bin/env python3
"""
Initialize quantitative trading system with sample data.
This script creates initial users, strategies, and trading data.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import (
    User, QuantStrategy, StrategyVersion, BacktestResult,
    StrategySignal, StrategyPerformance, StrategyPosition,
    Order, Position, Portfolio, Transaction,
    StrategyType, StrategyFrequency, StrategyStatus,
    OrderType, OrderSide, OrderStatus, TransactionType
)
from app.crud.user import get_user_by_username, create_user
from app.crud.quant_strategy import create_strategy
from app.crud.trading import create_order, create_position, create_portfolio, create_transaction
from app.schemas.user import UserCreate
from app.schemas.quant_strategy import QuantStrategyCreate
from app.schemas.trading import (
    OrderCreate, PositionCreate, PortfolioCreate, TransactionCreate
)
from datetime import datetime, date, timedelta
import uuid


def init_users(db: Session):
    """Initialize admin user."""
    admin = get_user_by_username(db, username="admin")
    if not admin:
        user_data = UserCreate(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
        admin = create_user(db, user_data)
        print(f"Created admin user: {admin.username}")
    else:
        print(f"Admin user already exists: {admin.username}")
    
    return admin


def init_strategies(db: Session, user):
    """Initialize sample strategies."""
    strategies = [
        {
            "strategy_code": "MA_CROSS",
            "name": "双均线策略",
            "description": "基于短期和长期移动平均线交叉的交易策略",
            "strategy_type": StrategyType.MA_CROSS,
            "frequency": StrategyFrequency.DAY_1,
            "parameters": {
                "short_window": 5,
                "long_window": 20,
                "threshold": 0.02,
                "position_size": 1000
            },
            "status": StrategyStatus.RUNNING,
            "is_active": 1,
            "max_position_value": 100000,
            "max_single_stock_ratio": 0.2,
            "stop_loss_ratio": 0.1,
            "take_profit_ratio": 0.15,
            "strategy_script": """
def generate_signals(df, params):
    signals = []
    short_window = params.get('short_window', 5)
    long_window = params.get('long_window', 20)
    threshold = params.get('threshold', 0.02)
    
    if len(df) < long_window:
        return signals
    
    df['short_ma'] = df['close'].rolling(window=short_window).mean()
    df['long_ma'] = df['close'].rolling(window=long_window).mean()
    
    last_row = df.iloc[-1]
    prev_row = df.iloc[-2]
    
    if last_row['short_ma'] > last_row['long_ma'] * (1 + threshold) and \
       prev_row['short_ma'] <= prev_row['long_ma'] * (1 + threshold):
        signals.append({
            'signal_type': 'BUY',
            'direction': 'LONG',
            'strength': 0.8,
            'confidence': 0.7,
            'price': float(last_row['close']),
        })
    elif last_row['short_ma'] < last_row['long_ma'] * (1 - threshold) and \
         prev_row['short_ma'] >= prev_row['long_ma'] * (1 - threshold):
        signals.append({
            'signal_type': 'SELL',
            'direction': 'LONG',
            'strength': 0.8,
            'confidence': 0.7,
            'price': float(last_row['close']),
        })
    
    return signals
"""
        },
        {
            "strategy_code": "RSI_OVERSOLD",
            "name": "RSI超卖策略",
            "description": "基于RSI指标超卖超买的交易策略",
            "strategy_type": StrategyType.RSI_OVERSOLD,
            "frequency": StrategyFrequency.DAY_1,
            "parameters": {
                "rsi_period": 14,
                "oversold_level": 30,
                "overbought_level": 70,
                "position_size": 800
            },
            "status": StrategyStatus.RUNNING,
            "is_active": 1,
            "max_position_value": 80000,
            "max_single_stock_ratio": 0.15,
            "stop_loss_ratio": 0.08,
            "take_profit_ratio": 0.12,
            "strategy_script": """
def generate_signals(df, params):
    signals = []
    rsi_period = params.get('rsi_period', 14)
    oversold_level = params.get('oversold_level', 30)
    overbought_level = params.get('overbought_level', 70)
    
    if len(df) < rsi_period + 1:
        return signals
    
    df['change'] = df['close'].diff()
    df['gain'] = df['change'].apply(lambda x: x if x > 0 else 0)
    df['loss'] = df['change'].apply(lambda x: -x if x < 0 else 0)
    
    df['avg_gain'] = df['gain'].rolling(window=rsi_period).mean()
    df['avg_loss'] = df['loss'].rolling(window=rsi_period).mean()
    df['rs'] = df['avg_gain'] / df['avg_loss']
    df['rsi'] = 100 - (100 / (1 + df['rs']))
    
    last_rsi = df.iloc[-1]['rsi']
    prev_rsi = df.iloc[-2]['rsi']
    
    if last_rsi < oversold_level and prev_rsi >= oversold_level:
        signals.append({
            'signal_type': 'BUY',
            'direction': 'LONG',
            'strength': 0.7,
            'confidence': 0.6,
            'price': float(df.iloc[-1]['close']),
        })
    elif last_rsi > overbought_level and prev_rsi <= overbought_level:
        signals.append({
            'signal_type': 'SELL',
            'direction': 'LONG',
            'strength': 0.7,
            'confidence': 0.6,
            'price': float(df.iloc[-1]['close']),
        })
    
    return signals
"""
        },
        {
            "strategy_code": "BOLLINGER_BAND",
            "name": "布林带策略",
            "description": "基于布林带突破的交易策略",
            "strategy_type": StrategyType.BOLLINGER_BAND,
            "frequency": StrategyFrequency.DAY_1,
            "parameters": {
                "window": 20,
                "num_std": 2,
                "position_size": 1200
            },
            "status": StrategyStatus.TESTING,
            "is_active": 1,
            "max_position_value": 120000,
            "max_single_stock_ratio": 0.25,
            "stop_loss_ratio": 0.12,
            "take_profit_ratio": 0.18,
            "strategy_script": """
def generate_signals(df, params):
    signals = []
    window = params.get('window', 20)
    num_std = params.get('num_std', 2)
    
    if len(df) < window:
        return signals
    
    df['sma'] = df['close'].rolling(window=window).mean()
    df['std'] = df['close'].rolling(window=window).std()
    df['upper_band'] = df['sma'] + (df['std'] * num_std)
    df['lower_band'] = df['sma'] - (df['std'] * num_std)
    
    last_row = df.iloc[-1]
    prev_row = df.iloc[-2]
    
    if last_row['close'] <= last_row['lower_band'] and prev_row['close'] > prev_row['lower_band']:
        signals.append({
            'signal_type': 'BUY',
            'direction': 'LONG',
            'strength': 0.75,
            'confidence': 0.65,
            'price': float(last_row['close']),
        })
    elif last_row['close'] >= last_row['upper_band'] and prev_row['close'] < prev_row['upper_band']:
        signals.append({
            'signal_type': 'SELL',
            'direction': 'LONG',
            'strength': 0.75,
            'confidence': 0.65,
            'price': float(last_row['close']),
        })
    
    return signals
"""
        },
    ]
    
    for strategy_data in strategies:
        existing = db.query(QuantStrategy).filter(
            QuantStrategy.strategy_code == strategy_data["strategy_code"],
            QuantStrategy.user_id == user.id
        ).first()
        
        if existing:
            print(f"Strategy '{strategy_data['strategy_code']}' already exists")
            continue
        
        strategy_create = QuantStrategyCreate(
            strategy_code=strategy_data["strategy_code"],
            name=strategy_data["name"],
            description=strategy_data["description"],
            strategy_type=strategy_data["strategy_type"],
            frequency=strategy_data["frequency"],
            parameters=strategy_data["parameters"],
            status=strategy_data["status"],
            is_active=strategy_data["is_active"],
            max_position_value=strategy_data["max_position_value"],
            max_single_stock_ratio=strategy_data["max_single_stock_ratio"],
            stop_loss_ratio=strategy_data["stop_loss_ratio"],
            take_profit_ratio=strategy_data["take_profit_ratio"],
            strategy_script=strategy_data["strategy_script"],
        )
        
        strategy = create_strategy(db, strategy=strategy_create, user_id=user.id)
        print(f"Created strategy: {strategy.name} ({strategy.strategy_code})")


def init_trading_data(db: Session, user):
    """Initialize sample trading data."""
    
    # Create initial portfolio
    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user.id
    ).first()
    
    if not portfolio:
        portfolio_create = PortfolioCreate(
            initial_capital=1000000,
            as_of_date=date.today(),
        )
        portfolio = create_portfolio(db, portfolio_create, user.id)
        print(f"Created portfolio with initial capital: {portfolio.initial_capital}")
    
    # Create sample orders
    sample_orders = [
        {
            "order_code": f"ORD-{uuid.uuid4().hex[:8]}",
            "stock_id": 1,  # Assuming stock_id 1 exists
            "order_type": OrderType.LIMIT,
            "side": OrderSide.BUY,
            "quantity": 100,
            "price": 50.25,
            "status": OrderStatus.FILLED,
        },
        {
            "order_code": f"ORD-{uuid.uuid4().hex[:8]}",
            "stock_id": 2,  # Assuming stock_id 2 exists
            "order_type": OrderType.LIMIT,
            "side": OrderSide.SELL,
            "quantity": 50,
            "price": 120.75,
            "status": OrderStatus.FILLED,
        },
    ]
    
    for order_data in sample_orders:
        existing = db.query(Order).filter(
            Order.order_code == order_data["order_code"]
        ).first()
        
        if not existing:
            order_create = OrderCreate(
                order_code=order_data["order_code"],
                stock_id=order_data["stock_id"],
                order_type=order_data["order_type"],
                side=order_data["side"],
                quantity=order_data["quantity"],
                price=order_data["price"],
            )
            
            order = create_order(db, order_create, user.id)
            
            order.status = order_data["status"]
            order.filled_quantity = order_data["quantity"]
            order.filled_at = datetime.now()
            order.order_value = order_data["price"] * order_data["quantity"]
            order.commission = order.order_value * 0.0003
            
            db.commit()
            print(f"Created order: {order.order_code} ({order.side} {order.quantity} shares @ {order.price})")
    
    # Create sample positions
    sample_positions = [
        {
            "stock_id": 1,
            "quantity": 500,
            "avg_cost": 48.50,
            "current_price": 52.30,
        },
        {
            "stock_id": 3,
            "quantity": 300,
            "avg_cost": 85.20,
            "current_price": 92.10,
        },
    ]
    
    for position_data in sample_positions:
        existing = db.query(Position).filter(
            Position.user_id == user.id,
            Position.stock_id == position_data["stock_id"]
        ).first()
        
        if not existing:
            position_create = PositionCreate(
                stock_id=position_data["stock_id"],
                quantity=position_data["quantity"],
            )
            
            position = create_position(db, position_create, user.id)
            
            position.avg_cost = position_data["avg_cost"]
            position.total_cost = position_data["avg_cost"] * position_data["quantity"]
            position.current_price = position_data["current_price"]
            position.current_value = position_data["current_price"] * position_data["quantity"]
            position.market_value = position.current_value
            position.unrealized_pnl = position.current_value - position.total_cost
            position.unrealized_pnl_ratio = position.unrealized_pnl / position.total_cost if position.total_cost > 0 else 0
            
            db.commit()
            print(f"Created position: Stock {position.stock_id}, {position.quantity} shares")


def main():
    """Main initialization function."""
    db = SessionLocal()
    
    try:
        print("Initializing quantitative trading system...")
        print("=" * 50)
        
        # Initialize users
        print("\n1. Initializing users...")
        user = init_users(db)
        
        # Initialize strategies
        print("\n2. Initializing strategies...")
        init_strategies(db, user)
        
        # Initialize trading data
        print("\n3. Initializing trading data...")
        init_trading_data(db, user)
        
        print("\n" + "=" * 50)
        print("Initialization completed successfully!")
        
    except Exception as e:
        print(f"Error during initialization: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()