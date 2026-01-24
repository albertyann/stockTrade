# 量化策略初始化说明

## 概述

本次更新添加了三个量化策略初始化脚本和策略执行配置，用于快速初始化系统的量化交易功能。

## 新增文件

### 1. `backend/script/init_strategies.py`

量化策略初始化脚本，包含三个预定义的量化交易策略：

#### 策略1：双均线策略 (MA_CROSS)
- **类型**: 技术分析 - 趋势跟踪
- **说明**: 当短期均线上穿长期均线时买入，下穿时卖出
- **参数**:
  - `short_period`: 5 (短周期)
  - `long_period`: 20 (长周期)
- **适用场景**: 经典趋势跟踪策略，适合单边行情
- **默认股票**: 000001.SZ, 600000.SH

#### 策略2：RSI超卖策略 (RSI_OVERSOLD)
- **类型**: 技术分析 - 震荡策略
- **说明**: 利用RSI指标识别超卖超买区域，在超卖区域买入，超买区域卖出
- **参数**:
  - `rsi_period`: 14 (RSI周期)
  - `overbought`: 70 (超买阈值)
  - `oversold`: 30 (超卖阈值)
- **适用场景**: 震荡行情
- **默认股票**: 000001.SZ, 600000.SH

#### 策略3：布林带策略 (BOLLINGER_BAND)
- **类型**: 技术分析 - 波动率策略
- **说明**: 利用布林带识别价格波动范围，价格触及下轨买入，触及上轨卖出
- **参数**:
  - `period`: 20 (布林带周期)
  - `std_dev`: 2.0 (标准差倍数)
- **适用场景**: 波动率变化明显的行情
- **默认股票**: 000001.SZ, 600000.SH

### 2. `backend/script/init_strategy_config.py`

策略执行配置初始化脚本，包含16个策略相关配置项：

#### 执行限制配置
- `strategy.max_execution_time`: 策略最大执行时间（秒），默认300秒
- `strategy.max_memory_usage`: 策略最大内存使用量（MB），默认512MB

#### 回测配置
- `strategy.default_commission_rate`: 默认手续费率，默认0.001
- `strategy.default_initial_capital`: 默认初始资金（元），默认100000
- `strategy.enable_backtest_cache`: 启用回测结果缓存，默认true
- `strategy.backtest_parallel_jobs`: 并行回测任务数量，默认3

#### 风险控制配置
- `strategy.max_positions`: 单策略最大持仓数量，默认10
- `strategy.risk_max_drawdown`: 最大回撤限制，默认0.2 (20%)

#### 沙箱与安全配置
- `strategy.enable_sandbox`: 启用策略沙箱执行模式，默认true
- `strategy.allow_custom_imports`: 允许策略脚本导入自定义模块，默认false

#### 自动交易配置
- `strategy.enable_auto_trading`: 启用自动交易功能（生产环境），默认false
- `strategy.auto_trading_interval`: 自动交易执行间隔（分钟），默认60

#### 监控与通知配置
- `strategy.notification_on_signal`: 策略信号生成时发送通知，默认true
- `strategy.log_execution_details`: 记录策略执行详细日志，默认true
- `strategy.enable_performance_tracking`: 启用策略绩效跟踪，默认true
- `strategy.performance_update_interval`: 绩效数据更新间隔（分钟），默认30

## 使用方法

### 1. 初始化量化策略

```bash
cd backend
python script/init_strategies.py
```

**输出示例**:
```
Initializing quant strategies...
Created strategy: 双均线策略 (ID: 1)
Created strategy: RSI超卖策略 (ID: 2)
Created strategy: 布林带策略 (ID: 3)

Successfully initialized 3 quant strategies for user 'admin'!
```

### 2. 初始化策略执行配置

```bash
cd backend
python script/init_strategy_config.py
```

**输出示例**:
```
Created setting: strategy.max_execution_time
Created setting: strategy.max_memory_usage
...
Successfully initialized 16 strategy execution settings!
```

## 验证数据

### 查看策略列表

```bash
cd backend
python -c "
from app.database import SessionLocal
from app.models.quant_strategy import QuantStrategy

db = SessionLocal()
strategies = db.query(QuantStrategy).all()
for s in strategies:
    print(f'ID: {s.id}, Code: {s.strategy_code}, Name: {s.strategy_name}, Type: {s.strategy_type}')
db.close()
"
```

### 查看策略配置

```bash
cd backend
python -c "
from app.database import SessionLocal
from app.models.system_setting import SystemSetting

db = SessionLocal()
settings = db.query(SystemSetting).filter(SystemSetting.key.like('strategy.%')).all()
for s in settings:
    print(f'Key: {s.key}, Value: {s.value}, Type: {s.value_type}')
db.close()
"
```

## 策略执行机制

### 策略脚本执行流程

1. **回测引擎加载策略** (`backend/app/services/backtest_engine.py`)
2. **获取股票数据** 从数据库读取日线数据
3. **执行策略脚本** 使用 `exec()` 在隔离环境中执行
4. **生成交易信号** 策略脚本返回 `signals` 字典
5. **计算回测指标** 包括收益、夏普比率、最大回撤等
6. **保存回测结果** 到数据库

### 策略脚本接口

策略脚本可以访问以下变量和库：

**可用变量**:
- `df`: Pandas DataFrame，包含股票日线数据
  - `date`: 交易日期
  - `open`: 开盘价
  - `high`: 最高价
  - `low`: 最低价
  - `close`: 收盘价
  - `volume`: 成交量
- `strategy`: 策略对象
  - `strategy.parameters`: 策略参数
  - `strategy.indicators`: 策略指标配置

**可用库**:
- `pd`: Pandas
- `np`: NumPy

**输出要求**:
策略脚本必须设置 `signals` 字典，格式为:
```python
signals = {
    datetime.date(2024, 1, 1): 'buy',
    datetime.date(2024, 1, 5): 'sell',
    ...
}
```

支持的信号类型: `'buy'`, `'sell'`, `'hold'`

## 注意事项

1. **前置条件**: 运行初始化脚本前，必须先运行 `create_admin.py` 创建管理员用户

2. **避免重复执行**: 脚本会检查策略是否已存在，避免重复创建

3. **自定义策略**: 用户可以在前端页面中基于这些策略进行修改或创建自定义策略

4. **参数调优**: 策略参数可以通过前端页面进行调整以适应不同市场环境

5. **沙箱模式**: 默认启用沙箱模式，限制用户代码的权限，确保系统安全

## 后续扩展

可以在 `init_strategies.py` 中继续添加更多策略，例如：

- MACD策略
- KDJ策略
- ATR通道策略
- 多因子组合策略
- 机器学习策略

只需按照现有格式添加新的初始化函数即可。
