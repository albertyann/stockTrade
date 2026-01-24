import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.crud.user import get_user_by_username
from app.crud.quant_strategy import create_quant_strategy
from app.schemas.quant_strategy import QuantStrategyCreate


def init_ma_strategy(db, user):
    """初始化双均线策略"""
    from app.models.quant_strategy import QuantStrategy

    existing = db.query(QuantStrategy).filter(
        QuantStrategy.user_id == user.id,
        QuantStrategy.strategy_code == "MA_CROSS"
    ).first()

    if existing:
        print(f"Strategy 'MA_CROSS' already exists for user '{user.username}'.")
        return

    strategy_script = '''
short_period = strategy.parameters.get('short_period', 5)
long_period = strategy.parameters.get('long_period', 20)

df['ma_short'] = df['close'].rolling(window=short_period).mean()
df['ma_long'] = df['close'].rolling(window=long_period).mean()

signals = {}

for i in range(1, len(df)):
    if df.index[i-1] not in signals:
        prev_short = df['ma_short'].iloc[i-1]
        prev_long = df['ma_long'].iloc[i-1]
        curr_short = df['ma_short'].iloc[i]
        curr_long = df['ma_long'].iloc[i]

        if prev_short <= prev_long and curr_short > curr_long:
            signals[df.index[i]] = 'buy'
        elif prev_short >= prev_long and curr_short < curr_long:
            signals[df.index[i]] = 'sell'
'''

    strategy_data = QuantStrategyCreate(
        strategy_code="MA_CROSS",
        strategy_name="双均线策略",
        strategy_type="technical",
        category="趋势跟踪",
        description="当短期均线上穿长期均线时买入，下穿时卖出。经典趋势跟踪策略，适合单边行情。",
        script=strategy_script,
        parameters={"short_period": 5, "long_period": 20},
        indicators={"stock_codes": ["000001.SZ", "600000.SH"]},
        risk_controls={"max_position_size": 100000, "stop_loss_pct": 0.05, "force_exit_at_end": True},
        enabled=False
    )

    strategy = create_quant_strategy(db, strategy_data, user_id=user.id)
    print(f"Created strategy: {strategy.strategy_name} (ID: {strategy.id})")


def init_rsi_strategy(db, user):
    """初始化RSI策略"""
    from app.models.quant_strategy import QuantStrategy

    existing = db.query(QuantStrategy).filter(
        QuantStrategy.user_id == user.id,
        QuantStrategy.strategy_code == "RSI_OVERSOLD"
    ).first()

    if existing:
        print(f"Strategy 'RSI_OVERSOLD' already exists for user '{user.username}'.")
        return

    strategy_script = '''
period = strategy.parameters.get('rsi_period', 14)
overbought = strategy.parameters.get('overbought', 70)
oversold = strategy.parameters.get('oversold', 30)

delta = df['close'].diff()
gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
rs = gain / loss
df['rsi'] = 100 - (100 / (1 + rs))

signals = {}

for i in range(1, len(df)):
    if df.index[i-1] not in signals:
        prev_rsi = df['rsi'].iloc[i-1]
        curr_rsi = df['rsi'].iloc[i]

        if prev_rsi <= oversold and curr_rsi > oversold:
            signals[df.index[i]] = 'buy'
        elif prev_rsi >= overbought and curr_rsi < overbought:
            signals[df.index[i]] = 'sell'
'''

    strategy_data = QuantStrategyCreate(
        strategy_code="RSI_OVERSOLD",
        strategy_name="RSI超卖策略",
        strategy_type="technical",
        category="震荡策略",
        description="利用RSI指标识别超卖超买区域，在超卖区域买入，超买区域卖出。适合震荡行情。",
        script=strategy_script,
        parameters={"rsi_period": 14, "overbought": 70, "oversold": 30},
        indicators={"stock_codes": ["000001.SZ", "600000.SH"]},
        risk_controls={"max_position_size": 100000, "stop_loss_pct": 0.08, "force_exit_at_end": True},
        enabled=False
    )

    strategy = create_quant_strategy(db, strategy_data, user_id=user.id)
    print(f"Created strategy: {strategy.strategy_name} (ID: {strategy.id})")


def init_bollinger_strategy(db, user):
    """初始化布林带策略"""
    from app.models.quant_strategy import QuantStrategy

    existing = db.query(QuantStrategy).filter(
        QuantStrategy.user_id == user.id,
        QuantStrategy.strategy_code == "BOLLINGER_BAND"
    ).first()

    if existing:
        print(f"Strategy 'BOLLINGER_BAND' already exists for user '{user.username}'.")
        return

    strategy_script = '''
period = strategy.parameters.get('period', 20)
std_dev = strategy.parameters.get('std_dev', 2.0)

df['middle'] = df['close'].rolling(window=period).mean()
std = df['close'].rolling(window=period).std()
df['upper'] = df['middle'] + (std * std_dev)
df['lower'] = df['middle'] - (std * std_dev)
df['pct_b'] = (df['close'] - df['lower']) / (df['upper'] - df['lower'])

signals = {}

for i in range(1, len(df)):
    if df.index[i-1] not in signals:
        prev_pct_b = df['pct_b'].iloc[i-1]
        curr_pct_b = df['pct_b'].iloc[i]

        if prev_pct_b < 0.2 and curr_pct_b >= 0.2:
            signals[df.index[i]] = 'buy'
        elif prev_pct_b > 0.8 and curr_pct_b <= 0.8:
            signals[df.index[i]] = 'sell'
'''

    strategy_data = QuantStrategyCreate(
        strategy_code="BOLLINGER_BAND",
        strategy_name="布林带策略",
        strategy_type="technical",
        category="波动率策略",
        description="利用布林带识别价格波动范围，价格触及下轨买入，触及上轨卖出。适合波动率变化明显的行情。",
        script=strategy_script,
        parameters={"period": 20, "std_dev": 2.0},
        indicators={"stock_codes": ["000001.SZ", "600000.SH"]},
        risk_controls={"max_position_size": 100000, "stop_loss_pct": 0.10, "force_exit_at_end": True},
        enabled=False
    )

    strategy = create_quant_strategy(db, strategy_data, user_id=user.id)
    print(f"Created strategy: {strategy.strategy_name} (ID: {strategy.id})")


def init_all_strategies():
    """初始化所有量化策略"""
    db = SessionLocal()

    try:
        username = "admin"
        user = get_user_by_username(db, username=username)

        if not user:
            print(f"Admin user '{username}' not found. Please run create_admin.py first.")
            return

        print("Initializing quant strategies...\n")

        init_ma_strategy(db, user)
        init_rsi_strategy(db, user)
        init_bollinger_strategy(db, user)

        print(f"\nSuccessfully initialized 3 quant strategies for user '{username}'!")

    except Exception as e:
        print(f"Error initializing quant strategies: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_all_strategies()
