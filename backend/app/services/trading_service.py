from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple
import uuid

from ..models.trading import Order, Position, Portfolio, Transaction, OrderStatus, OrderSide, TransactionType
from ..models.stock import Stock
from ..schemas.trading import PlaceOrderRequest, CancelOrderRequest
from ..crud.trading import (
    get_order,
    update_order,
    get_positions,
    create_position,
    update_position,
    get_portfolios,
    create_portfolio,
    update_portfolio,
    create_transaction,
)
from ..crud.stock import get_stock


class TradingService:
    def __init__(self, db: Session):
        self.db = db

    def place_order(self, request: PlaceOrderRequest, user_id: int) -> Dict:
        stock = get_stock(self.db, request.stock_id)
        if not stock:
            raise ValueError(f"Stock {request.stock_id} not found")

        order_data = {
            "order_code": f"ORD-{uuid.uuid4().hex[:8]}",
            "stock_id": request.stock_id,
            "ts_code": stock.ts_code,
            "order_type": request.order_type,
            "side": request.side,
            "quantity": request.quantity,
            "price": request.price,
            "stop_price": request.stop_price,
            "strategy_id": request.strategy_id,
        }

        from ..crud.trading import create_order
        order = create_order(self.db, order_data, user_id)

        if request.order_type == "MARKET":
            self._execute_market_order(order)
        elif request.order_type == "LIMIT":
            self._queue_limit_order(order)
        elif request.order_type == "STOP":
            self._queue_stop_order(order)
        elif request.order_type == "STOP_LIMIT":
            self._queue_stop_limit_order(order)

        return {
            "order_id": order.id,
            "order_code": order.order_code,
            "status": order.status,
            "message": "Order placed successfully",
        }

    def _execute_market_order(self, order: Order):
        stock = get_stock(self.db, order.stock_id)
        if not stock:
            update_order(self.db, order.id, {
                "status": OrderStatus.REJECTED,
                "message": "Stock not found",
            })
            return

        latest_price = self._get_latest_price(order.stock_id)
        if not latest_price:
            update_order(self.db, order.id, {
                "status": OrderStatus.REJECTED,
                "message": "No price data available",
            })
            return

        commission = latest_price * order.quantity * 0.0003
        order_value = latest_price * order.quantity

        update_order(self.db, order.id, {
            "status": OrderStatus.FILLED,
            "filled_quantity": order.quantity,
            "price": latest_price,
            "order_value": order_value,
            "commission": commission,
            "filled_at": datetime.now(),
            "message": "Market order executed",
        })

        self._create_transaction_for_order(order, latest_price, commission)
        self._update_position(order, latest_price)

    def _queue_limit_order(self, order: Order):
        update_order(self.db, order.id, {
            "status": OrderStatus.SUBMITTED,
            "submitted_at": datetime.now(),
            "message": "Limit order queued",
        })

    def _queue_stop_order(self, order: Order):
        update_order(self.db, order.id, {
            "status": OrderStatus.SUBMITTED,
            "submitted_at": datetime.now(),
            "message": "Stop order queued",
        })

    def _queue_stop_limit_order(self, order: Order):
        update_order(self.db, order.id, {
            "status": OrderStatus.SUBMITTED,
            "submitted_at": datetime.now(),
            "message": "Stop-limit order queued",
        })

    def cancel_order(self, order_id: int, request: CancelOrderRequest) -> Dict:
        order = get_order(self.db, order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")

        if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.REJECTED]:
            raise ValueError(f"Cannot cancel order in status {order.status}")

        update_order(self.db, order.id, {
            "status": OrderStatus.CANCELLED,
            "cancelled_at": datetime.now(),
            "message": request.reason or "Order cancelled by user",
        })

        return {
            "order_id": order.id,
            "status": OrderStatus.CANCELLED,
            "message": "Order cancelled successfully",
        }

    def _create_transaction_for_order(self, order: Order, price: float, commission: float):
        stock = get_stock(self.db, order.stock_id)
        if not stock:
            return

        transaction_type = TransactionType.BUY if order.side == OrderSide.BUY else TransactionType.SELL

        portfolio = self._get_user_portfolio(order.user_id)
        before_balance = portfolio.current_capital if portfolio else 0

        if order.side == OrderSide.BUY:
            amount = -(price * order.quantity + commission)
            after_balance = before_balance + amount
        else:
            amount = price * order.quantity - commission
            after_balance = before_balance + amount

        transaction_data = {
            "transaction_code": f"TRX-{uuid.uuid4().hex[:8]}",
            "transaction_type": transaction_type,
            "side": order.side.value,
            "quantity": order.quantity,
            "price": price,
            "amount": amount,
            "commission": commission,
            "before_balance": before_balance,
            "after_balance": after_balance,
            "stock_id": order.stock_id,
            "ts_code": stock.ts_code,
            "order_id": order.id,
            "strategy_id": order.strategy_id,
            "transaction_date": datetime.now(),
        }

        create_transaction(self.db, transaction_data, order.user_id)

        if portfolio:
            self._update_portfolio_after_transaction(portfolio, order, amount, commission)

    def _update_position(self, order: Order, price: float):
        positions = get_positions(self.db, user_id=order.user_id, stock_id=order.stock_id)
        existing_position = positions["data"][0] if positions["data"] else None

        if order.side == OrderSide.BUY:
            if existing_position:
                total_quantity = existing_position.quantity + order.quantity
                total_cost = existing_position.total_cost + (price * order.quantity)
                avg_cost = total_cost / total_quantity

                update_position(self.db, existing_position.id, {
                    "quantity": total_quantity,
                    "avg_cost": avg_cost,
                    "total_cost": total_cost,
                    "current_price": price,
                    "current_value": price * total_quantity,
                    "market_value": price * total_quantity,
                    "last_trade_date": datetime.now(),
                })
            else:
                position_data = {
                    "stock_id": order.stock_id,
                    "ts_code": order.ts_code,
                    "quantity": order.quantity,
                    "avg_cost": price,
                    "total_cost": price * order.quantity,
                    "current_price": price,
                    "current_value": price * order.quantity,
                    "market_value": price * order.quantity,
                    "strategy_id": order.strategy_id,
                }
                create_position(self.db, position_data, order.user_id)

        elif order.side == OrderSide.SELL:
            if existing_position and existing_position.quantity >= order.quantity:
                remaining_quantity = existing_position.quantity - order.quantity
                realized_pnl = (price - existing_position.avg_cost) * order.quantity

                if remaining_quantity > 0:
                    update_position(self.db, existing_position.id, {
                        "quantity": remaining_quantity,
                        "current_price": price,
                        "current_value": price * remaining_quantity,
                        "market_value": price * remaining_quantity,
                        "realized_pnl": existing_position.realized_pnl + realized_pnl,
                        "last_trade_date": datetime.now(),
                    })
                else:
                    update_position(self.db, existing_position.id, {
                        "quantity": 0,
                        "closed_quantity": existing_position.closed_quantity + order.quantity,
                        "realized_pnl": existing_position.realized_pnl + realized_pnl,
                        "last_trade_date": datetime.now(),
                    })

    def _get_latest_price(self, stock_id: int) -> Optional[float]:
        from ..models.stock import StockDaily
        latest = self.db.query(StockDaily).filter(
            StockDaily.stock_id == stock_id
        ).order_by(StockDaily.trade_date.desc()).first()

        return float(latest.close) if latest else None

    def _get_user_portfolio(self, user_id: int) -> Optional[Portfolio]:
        portfolios = get_portfolios(self.db, user_id=user_id, limit=1)
        return portfolios["data"][0] if portfolios["data"] else None

    def _update_portfolio_after_transaction(self, portfolio: Portfolio, order: Order, amount: float, commission: float):
        positions = get_positions(self.db, user_id=order.user_id)
        position_value = sum(p.current_value or 0 for p in positions["data"])

        total_pnl = sum(p.realized_pnl or 0 for p in positions["data"])
        total_value = portfolio.cash_balance + position_value + amount
        total_pnl_ratio = total_pnl / portfolio.initial_capital if portfolio.initial_capital > 0 else 0

        update_portfolio(self.db, portfolio.id, {
            "current_capital": portfolio.cash_balance + amount,
            "total_value": total_value,
            "cash_balance": portfolio.cash_balance + amount,
            "position_value": position_value,
            "total_pnl": total_pnl,
            "total_pnl_ratio": total_pnl_ratio,
            "updated_at": datetime.now(),
        })

    def get_portfolio_summary(self, user_id: int) -> Dict:
        portfolio = self._get_user_portfolio(user_id)
        if not portfolio:
            portfolio_data = {
                "initial_capital": 1000000,
                "as_of_date": date.today(),
            }
            portfolio = create_portfolio(self.db, portfolio_data, user_id)

        positions = get_positions(self.db, user_id=user_id)
        position_value = sum(p.current_value or 0 for p in positions["data"])
        unrealized_pnl = sum(p.unrealized_pnl or 0 for p in positions["data"])
        realized_pnl = sum(p.realized_pnl or 0 for p in positions["data"])

        total_value = portfolio.cash_balance + position_value
        total_pnl = realized_pnl + unrealized_pnl
        total_pnl_ratio = total_pnl / portfolio.initial_capital if portfolio.initial_capital > 0 else 0

        risk_exposure = position_value / total_value if total_value > 0 else 0
        leverage = position_value / portfolio.cash_balance if portfolio.cash_balance > 0 else 0

        return {
            "total_value": total_value,
            "cash_balance": portfolio.cash_balance,
            "position_value": position_value,
            "total_pnl": total_pnl,
            "total_pnl_ratio": total_pnl_ratio,
            "realized_pnl": realized_pnl,
            "unrealized_pnl": unrealized_pnl,
            "risk_exposure": risk_exposure,
            "leverage": leverage,
            "as_of_date": portfolio.as_of_date,
        }

    def update_positions_prices(self, user_id: int):
        positions = get_positions(self.db, user_id=user_id)
        
        for position in positions["data"]:
            latest_price = self._get_latest_price(position.stock_id)
            if latest_price:
                current_value = latest_price * position.quantity
                unrealized_pnl = current_value - position.total_cost
                unrealized_pnl_ratio = unrealized_pnl / position.total_cost if position.total_cost > 0 else 0

                update_position(self.db, position.id, {
                    "current_price": latest_price,
                    "current_value": current_value,
                    "market_value": current_value,
                    "unrealized_pnl": unrealized_pnl,
                    "unrealized_pnl_ratio": unrealized_pnl_ratio,
                    "updated_at": datetime.now(),
                })

    def get_position_breakdown(self, user_id: int) -> List[Dict]:
        positions = get_positions(self.db, user_id=user_id)
        
        breakdown = []
        for position in positions["data"]:
            stock = get_stock(self.db, position.stock_id)
            if stock:
                breakdown.append({
                    "stock_id": position.stock_id,
                    "ts_code": position.ts_code,
                    "name": stock.name,
                    "quantity": position.quantity,
                    "avg_cost": position.avg_cost,
                    "current_price": position.current_price,
                    "current_value": position.current_value,
                    "unrealized_pnl": position.unrealized_pnl,
                    "unrealized_pnl_ratio": position.unrealized_pnl_ratio,
                    "weight": position.current_value / sum(p.current_value or 0 for p in positions["data"]) if positions["data"] else 0,
                })
        
        return breakdown
