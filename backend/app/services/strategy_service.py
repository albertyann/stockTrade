from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
import json
import uuid

from ..models.quant_strategy import (
    QuantStrategy,
    StrategyVersion,
    BacktestResult,
    StrategySignal,
    StrategyPerformance,
    StrategyPosition,
    StrategyStatus,
)
from ..models.trading import Order, OrderStatus, OrderSide
from ..models.stock_daily import StockDaily
from ..schemas.quant_strategy import BacktestRequest, ExecuteStrategyRequest
from ..crud.quant_strategy import (
    get_strategy,
    create_strategy_version,
    create_backtest_result,
    update_backtest_result,
    create_strategy_signal,
    update_strategy_signal,
    create_strategy_performance,
    create_strategy_position,
    update_strategy_position,
)
from ..crud.trading import create_order, update_order


class StrategyService:
    def __init__(self, db: Session):
        self.db = db

    def execute_strategy(self, strategy_id: int, dry_run: bool = True) -> Dict:
        strategy = get_strategy(self.db, strategy_id)
        if not strategy:
            raise ValueError(f"Strategy {strategy_id} not found")

        if strategy.status != StrategyStatus.RUNNING:
            raise ValueError(f"Strategy {strategy_id} is not running")

        try:
            signals = self._generate_signals(strategy)
            orders = []

            for signal in signals:
                if dry_run:
                    order = self._create_dry_run_order(signal, strategy)
                else:
                    order = self._execute_signal(signal, strategy)

                orders.append(order)

            return {
                "strategy_id": strategy_id,
                "strategy_name": strategy.name,
                "signals_generated": len(signals),
                "orders_created": len(orders),
                "dry_run": dry_run,
                "signals": signals,
                "orders": orders,
            }
        except Exception as e:
            raise Exception(f"Error executing strategy {strategy_id}: {str(e)}")

    def _generate_signals(self, strategy: QuantStrategy) -> List[Dict]:
        if strategy.strategy_type == "MA_CROSS":
            return self._generate_ma_cross_signals(strategy)
        elif strategy.strategy_type == "RSI_OVERSOLD":
            return self._generate_rsi_oversold_signals(strategy)
        elif strategy.strategy_type == "BOLLINGER_BAND":
            return self._generate_bollinger_band_signals(strategy)
        else:
            return self._execute_custom_strategy(strategy)

    def _generate_ma_cross_signals(self, strategy: QuantStrategy) -> List[Dict]:
        params = strategy.parameters or {}
        short_window = params.get("short_window", 5)
        long_window = params.get("long_window", 20)
        threshold = params.get("threshold", 0.02)

        positions = self._get_strategy_positions(strategy.id)
        stock_ids = [p.stock_id for p in positions]

        signals = []
        for stock_id in stock_ids:
            stock_data = self._get_stock_data(stock_id, days=long_window + 10)
            if len(stock_data) < long_window:
                continue

            df = pd.DataFrame(stock_data)
            df['short_ma'] = df['close'].rolling(window=short_window).mean()
            df['long_ma'] = df['close'].rolling(window=long_window).mean()

            last_row = df.iloc[-1]
            prev_row = df.iloc[-2]

            current_position = next((p for p in positions if p.stock_id == stock_id), None)

            if last_row['short_ma'] > last_row['long_ma'] * (1 + threshold) and \
               prev_row['short_ma'] <= prev_row['long_ma'] * (1 + threshold):
                if not current_position or current_position.quantity == 0:
                    signals.append({
                        "stock_id": stock_id,
                        "signal_type": "BUY",
                        "direction": "LONG",
                        "strength": 0.8,
                        "confidence": 0.7,
                        "price": float(last_row['close']),
                        "suggested_quantity": self._calculate_position_size(strategy, last_row['close']),
                    })

            elif last_row['short_ma'] < last_row['long_ma'] * (1 - threshold) and \
                 prev_row['short_ma'] >= prev_row['long_ma'] * (1 - threshold):
                if current_position and current_position.quantity > 0:
                    signals.append({
                        "stock_id": stock_id,
                        "signal_type": "SELL",
                        "direction": "LONG",
                        "strength": 0.8,
                        "confidence": 0.7,
                        "price": float(last_row['close']),
                        "suggested_quantity": current_position.quantity,
                    })

        return signals

    def _generate_rsi_oversold_signals(self, strategy: QuantStrategy) -> List[Dict]:
        params = strategy.parameters or {}
        rsi_period = params.get("rsi_period", 14)
        oversold_level = params.get("oversold_level", 30)
        overbought_level = params.get("overbought_level", 70)

        positions = self._get_strategy_positions(strategy.id)
        stock_ids = [p.stock_id for p in positions]

        signals = []
        for stock_id in stock_ids:
            stock_data = self._get_stock_data(stock_id, days=rsi_period + 20)
            if len(stock_data) < rsi_period + 1:
                continue

            df = pd.DataFrame(stock_data)
            df['change'] = df['close'].diff()
            df['gain'] = df['change'].apply(lambda x: x if x > 0 else 0)
            df['loss'] = df['change'].apply(lambda x: -x if x < 0 else 0)

            df['avg_gain'] = df['gain'].rolling(window=rsi_period).mean()
            df['avg_loss'] = df['loss'].rolling(window=rsi_period).mean()
            df['rs'] = df['avg_gain'] / df['avg_loss']
            df['rsi'] = 100 - (100 / (1 + df['rs']))

            last_rsi = df.iloc[-1]['rsi']
            prev_rsi = df.iloc[-2]['rsi']

            current_position = next((p for p in positions if p.stock_id == stock_id), None)

            if last_rsi < oversold_level and prev_rsi >= oversold_level:
                if not current_position or current_position.quantity == 0:
                    signals.append({
                        "stock_id": stock_id,
                        "signal_type": "BUY",
                        "direction": "LONG",
                        "strength": 0.7,
                        "confidence": 0.6,
                        "price": float(df.iloc[-1]['close']),
                        "suggested_quantity": self._calculate_position_size(strategy, df.iloc[-1]['close']),
                    })

            elif last_rsi > overbought_level and prev_rsi <= overbought_level:
                if current_position and current_position.quantity > 0:
                    signals.append({
                        "stock_id": stock_id,
                        "signal_type": "SELL",
                        "direction": "LONG",
                        "strength": 0.7,
                        "confidence": 0.6,
                        "price": float(df.iloc[-1]['close']),
                        "suggested_quantity": current_position.quantity,
                    })

        return signals

    def _generate_bollinger_band_signals(self, strategy: QuantStrategy) -> List[Dict]:
        params = strategy.parameters or {}
        window = params.get("window", 20)
        num_std = params.get("num_std", 2)

        positions = self._get_strategy_positions(strategy.id)
        stock_ids = [p.stock_id for p in positions]

        signals = []
        for stock_id in stock_ids:
            stock_data = self._get_stock_data(stock_id, days=window + 10)
            if len(stock_data) < window:
                continue

            df = pd.DataFrame(stock_data)
            df['sma'] = df['close'].rolling(window=window).mean()
            df['std'] = df['close'].rolling(window=window).std()
            df['upper_band'] = df['sma'] + (df['std'] * num_std)
            df['lower_band'] = df['sma'] - (df['std'] * num_std)

            last_row = df.iloc[-1]
            prev_row = df.iloc[-2]

            current_position = next((p for p in positions if p.stock_id == stock_id), None)

            if last_row['close'] <= last_row['lower_band'] and prev_row['close'] > prev_row['lower_band']:
                if not current_position or current_position.quantity == 0:
                    signals.append({
                        "stock_id": stock_id,
                        "signal_type": "BUY",
                        "direction": "LONG",
                        "strength": 0.75,
                        "confidence": 0.65,
                        "price": float(last_row['close']),
                        "suggested_quantity": self._calculate_position_size(strategy, last_row['close']),
                    })

            elif last_row['close'] >= last_row['upper_band'] and prev_row['close'] < prev_row['upper_band']:
                if current_position and current_position.quantity > 0:
                    signals.append({
                        "stock_id": stock_id,
                        "signal_type": "SELL",
                        "direction": "LONG",
                        "strength": 0.75,
                        "confidence": 0.65,
                        "price": float(last_row['close']),
                        "suggested_quantity": current_position.quantity,
                    })

        return signals

    def _execute_custom_strategy(self, strategy: QuantStrategy) -> List[Dict]:
        if not strategy.strategy_script:
            return []

        try:
            exec_globals = {
                "pd": pd,
                "np": np,
                "datetime": datetime,
                "date": date,
                "timedelta": timedelta,
            }

            exec(strategy.strategy_script, exec_globals)

            if "generate_signals" in exec_globals:
                positions = self._get_strategy_positions(strategy.id)
                stock_ids = [p.stock_id for p in positions]

                signals = []
                for stock_id in stock_ids:
                    stock_data = self._get_stock_data(stock_id, days=100)
                    if len(stock_data) < 20:
                        continue

                    df = pd.DataFrame(stock_data)
                    stock_signals = exec_globals["generate_signals"](df, strategy.parameters or {})

                    for signal in stock_signals:
                        signals.append({
                            "stock_id": stock_id,
                            "signal_type": signal.get("signal_type", "BUY"),
                            "direction": signal.get("direction", "LONG"),
                            "strength": signal.get("strength", 0.5),
                            "confidence": signal.get("confidence", 0.5),
                            "price": signal.get("price", float(df.iloc[-1]['close'])),
                            "suggested_quantity": signal.get("suggested_quantity", 100),
                        })

                return signals
        except Exception as e:
            print(f"Error executing custom strategy {strategy.id}: {str(e)}")

        return []

    def _create_dry_run_order(self, signal: Dict, strategy: QuantStrategy) -> Dict:
        return {
            "order_code": f"DRY-{uuid.uuid4().hex[:8]}",
            "stock_id": signal["stock_id"],
            "order_type": "LIMIT",
            "side": signal["signal_type"],
            "quantity": signal["suggested_quantity"],
            "price": signal["price"],
            "status": "PENDING",
            "strategy_id": strategy.id,
            "message": "Dry run order - not executed",
        }

    def _execute_signal(self, signal: Dict, strategy: QuantStrategy) -> Dict:
        order_data = {
            "order_code": f"ORD-{uuid.uuid4().hex[:8]}",
            "stock_id": signal["stock_id"],
            "order_type": "LIMIT",
            "side": signal["signal_type"],
            "quantity": signal["suggested_quantity"],
            "price": signal["price"],
            "strategy_id": strategy.id,
        }

        order = create_order(self.db, order_data, strategy.user_id)

        db_signal = create_strategy_signal(self.db, {
            "strategy_id": strategy.id,
            "stock_id": signal["stock_id"],
            "signal_type": signal["signal_type"],
            "direction": signal.get("direction", "LONG"),
            "strength": signal.get("strength", 0.5),
            "confidence": signal.get("confidence", 0.5),
            "price": signal["price"],
            "suggested_quantity": signal["suggested_quantity"],
            "signal_time": datetime.now(),
        })

        update_strategy_signal(self.db, db_signal.id, {"order_id": order.id})

        return {
            "order_id": order.id,
            "order_code": order.order_code,
            "status": order.status,
            "quantity": order.quantity,
            "price": order.price,
        }

    def _get_strategy_positions(self, strategy_id: int) -> List[StrategyPosition]:
        from ..crud.quant_strategy import get_strategy_positions
        result = get_strategy_positions(self.db, strategy_id, status="OPEN")
        return result["data"]

    def _get_stock_data(self, stock_id: int, days: int = 100) -> List[Dict]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        stock_data = self.db.query(StockDaily).filter(
            StockDaily.stock_id == stock_id,
            StockDaily.trade_date >= start_date,
            StockDaily.trade_date <= end_date
        ).order_by(StockDaily.trade_date).all()

        return [
            {
                "date": sd.trade_date,
                "open": float(sd.open),
                "high": float(sd.high),
                "low": float(sd.low),
                "close": float(sd.close),
                "volume": float(sd.vol),
            }
            for sd in stock_data
        ]

    def _calculate_position_size(self, strategy: QuantStrategy, price: float) -> int:
        if strategy.max_position_value:
            max_shares = int(strategy.max_position_value / price)
            return min(max_shares, 10000)
        return 100

    def run_backtest(self, request: BacktestRequest) -> Dict:
        strategy = get_strategy(self.db, request.strategy_id)
        if not strategy:
            raise ValueError(f"Strategy {request.strategy_id} not found")

        try:
            backtest_result = create_backtest_result(self.db, {
                "strategy_id": request.strategy_id,
                "start_date": request.start_date,
                "end_date": request.end_date,
                "initial_capital": request.initial_capital,
                "commission_rate": request.commission_rate,
                "status": "RUNNING",
            })

            equity_curve, metrics = self._simulate_backtest(strategy, request)

            update_data = {
                "status": "COMPLETED",
                "completed_at": datetime.now(),
                "final_capital": metrics["final_capital"],
                "total_return": metrics["total_return"],
                "annual_return": metrics["annual_return"],
                "sharpe_ratio": metrics["sharpe_ratio"],
                "max_drawdown": metrics["max_drawdown"],
                "max_drawdown_duration": metrics["max_drawdown_duration"],
                "volatility": metrics["volatility"],
                "win_rate": metrics["win_rate"],
                "profit_factor": metrics["profit_factor"],
                "total_trades": metrics["total_trades"],
                "winning_trades": metrics["winning_trades"],
                "losing_trades": metrics["losing_trades"],
                "avg_win": metrics["avg_win"],
                "avg_loss": metrics["avg_loss"],
                "largest_win": metrics["largest_win"],
                "largest_loss": metrics["largest_loss"],
                "equity_curve": equity_curve,
            }

            updated_result = update_backtest_result(self.db, backtest_result.id, update_data)

            return {
                "backtest_id": updated_result.id,
                "status": "COMPLETED",
                "metrics": metrics,
                "equity_curve_points": len(equity_curve),
            }
        except Exception as e:
            error_result = create_backtest_result(self.db, {
                "strategy_id": request.strategy_id,
                "start_date": request.start_date,
                "end_date": request.end_date,
                "initial_capital": request.initial_capital,
                "commission_rate": request.commission_rate,
                "status": "FAILED",
                "error_message": str(e),
            })
            raise Exception(f"Backtest failed: {str(e)}")

    def _simulate_backtest(self, strategy: QuantStrategy, request: BacktestRequest) -> Tuple[List[Dict], Dict]:
        capital = request.initial_capital
        positions = {}
        equity_curve = []
        trades = []

        current_date = request.start_date
        while current_date <= request.end_date:
            signals = self._generate_historical_signals(strategy, current_date)

            for signal in signals:
                if signal["signal_type"] == "BUY":
                    cost = signal["price"] * signal["suggested_quantity"]
                    commission = cost * request.commission_rate
                    total_cost = cost + commission

                    if capital >= total_cost:
                        capital -= total_cost
                        if signal["stock_id"] not in positions:
                            positions[signal["stock_id"]] = {
                                "quantity": signal["suggested_quantity"],
                                "avg_cost": signal["price"],
                                "total_cost": total_cost,
                            }
                        else:
                            pos = positions[signal["stock_id"]]
                            total_quantity = pos["quantity"] + signal["suggested_quantity"]
                            new_avg_cost = ((pos["avg_cost"] * pos["quantity"]) + 
                                          (signal["price"] * signal["suggested_quantity"])) / total_quantity
                            pos["quantity"] = total_quantity
                            pos["avg_cost"] = new_avg_cost
                            pos["total_cost"] += total_cost

                        trades.append({
                            "date": current_date,
                            "type": "BUY",
                            "stock_id": signal["stock_id"],
                            "quantity": signal["suggested_quantity"],
                            "price": signal["price"],
                            "commission": commission,
                            "pnl": 0,
                        })

                elif signal["signal_type"] == "SELL":
                    if signal["stock_id"] in positions:
                        pos = positions[signal["stock_id"]]
                        if pos["quantity"] >= signal["suggested_quantity"]:
                            revenue = signal["price"] * signal["suggested_quantity"]
                            commission = revenue * request.commission_rate
                            net_revenue = revenue - commission
                            cost = pos["avg_cost"] * signal["suggested_quantity"]
                            pnl = net_revenue - cost

                            capital += net_revenue
                            pos["quantity"] -= signal["suggested_quantity"]

                            if pos["quantity"] == 0:
                                del positions[signal["stock_id"]]

                            trades.append({
                                "date": current_date,
                                "type": "SELL",
                                "stock_id": signal["stock_id"],
                                "quantity": signal["suggested_quantity"],
                                "price": signal["price"],
                                "commission": commission,
                                "pnl": pnl,
                            })

            position_value = sum(
                self._get_historical_price(stock_id, current_date) * pos["quantity"]
                for stock_id, pos in positions.items()
            )

            total_value = capital + position_value
            equity_curve.append({
                "date": current_date.isoformat(),
                "equity": total_value,
                "cash": capital,
                "position_value": position_value,
            })

            current_date += timedelta(days=1)

        final_capital = capital + sum(
            self._get_historical_price(stock_id, request.end_date) * pos["quantity"]
            for stock_id, pos in positions.items()
        )

        metrics = self._calculate_backtest_metrics(equity_curve, trades, request.initial_capital, final_capital)

        return equity_curve, metrics

    def _generate_historical_signals(self, strategy: QuantStrategy, date: date) -> List[Dict]:
        return []

    def _get_historical_price(self, stock_id: int, date: date) -> float:
        price_data = self.db.query(StockDaily).filter(
            StockDaily.stock_id == stock_id,
            StockDaily.trade_date <= date
        ).order_by(StockDaily.trade_date.desc()).first()

        return float(price_data.close) if price_data else 0.0

    def _calculate_backtest_metrics(self, equity_curve: List[Dict], trades: List[Dict], 
                                   initial_capital: float, final_capital: float) -> Dict:
        if not equity_curve:
            return {
                "final_capital": initial_capital,
                "total_return": 0.0,
                "annual_return": 0.0,
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.0,
                "max_drawdown_duration": 0,
                "volatility": 0.0,
                "win_rate": 0.0,
                "profit_factor": 0.0,
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "avg_win": 0.0,
                "avg_loss": 0.0,
                "largest_win": 0.0,
                "largest_loss": 0.0,
            }

        equities = [point["equity"] for point in equity_curve]
        returns = [(equities[i] - equities[i-1]) / equities[i-1] if i > 0 else 0 for i in range(len(equities))]

        total_return = (final_capital - initial_capital) / initial_capital
        days = len(equity_curve)
        annual_return = (1 + total_return) ** (365.25 / days) - 1 if days > 0 else 0

        returns_array = np.array(returns[1:])
        volatility = np.std(returns_array) * np.sqrt(252) if len(returns_array) > 0 else 0
        sharpe_ratio = (annual_return - 0.02) / volatility if volatility > 0 else 0

        drawdowns = []
        peak = equities[0]
        drawdown_duration = 0
        max_drawdown_duration = 0

        for equity in equities:
            if equity > peak:
                peak = equity
                drawdown_duration = 0
            else:
                drawdown = (peak - equity) / peak
                drawdowns.append(drawdown)
                drawdown_duration += 1
                max_drawdown_duration = max(max_drawdown_duration, drawdown_duration)

        max_drawdown = max(drawdowns) if drawdowns else 0

        winning_trades = [t for t in trades if t["pnl"] > 0]
        losing_trades = [t for t in trades if t["pnl"] < 0]

        total_trades = len(trades)
        winning_trades_count = len(winning_trades)
        losing_trades_count = len(losing_trades)

        win_rate = winning_trades_count / total_trades if total_trades > 0 else 0

        total_profit = sum(t["pnl"] for t in winning_trades)
        total_loss = abs(sum(t["pnl"] for t in losing_trades))
        profit_factor = total_profit / total_loss if total_loss > 0 else float('inf')

        avg_win = np.mean([t["pnl"] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t["pnl"] for t in losing_trades]) if losing_trades else 0

        largest_win = max([t["pnl"] for t in winning_trades], default=0)
        largest_loss = min([t["pnl"] for t in losing_trades], default=0)

        return {
            "final_capital": final_capital,
            "total_return": total_return,
            "annual_return": annual_return,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown,
            "max_drawdown_duration": max_drawdown_duration,
            "volatility": volatility,
            "win_rate": win_rate,
            "profit_factor": profit_factor,
            "total_trades": total_trades,
            "winning_trades": winning_trades_count,
            "losing_trades": losing_trades_count,
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "largest_win": largest_win,
            "largest_loss": largest_loss,
        }
