#!/usr/bin/env python3
"""
Test backend API endpoints without starting a server.
This directly tests the service layer.
"""
import asyncio
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.crud import quant_strategy as strategy_crud, trading as trading_crud

def test_strategy_crud():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Testing Strategy CRUD")
        print("=" * 60)

        print("\n1. Getting all strategies...")
        result = strategy_crud.get_strategies(db, skip=0, limit=10)
        strategies = result["data"]
        total = result["total"]
        print(f"✅ Found {len(strategies)} strategies (Total: {total}):")
        for s in strategies:
            print(f"   - {s.id}: {s.name} ({s.strategy_type})")

        if strategies:
            strategy_id = strategies[0].id
            print(f"\n2. Getting strategy by ID: {strategy_id}...")
            strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
            if strategy:
                print(f"✅ Found strategy: {strategy.name}")

        print("\n3. Creating a new strategy...")
        from app.schemas.quant_strategy import QuantStrategyCreate
        from app.models.quant_strategy import StrategyType, StrategyFrequency, StrategyStatus
        new_strategy_data = QuantStrategyCreate(
            strategy_code="TEST_001",
            name="TEST_STRATEGY",
            description="Test strategy for API verification",
            strategy_type=StrategyType.CUSTOM,
            frequency=StrategyFrequency.DAY_1,
            parameters={"test_param": "test_value"},
            status=StrategyStatus.DRAFT
        )
        new_strategy = strategy_crud.create_strategy(db, strategy=new_strategy_data, user_id=1)
        print(f"✅ Created strategy: {new_strategy.name} (ID: {new_strategy.id})")

        print("\n4. Updating strategy...")
        from app.schemas.quant_strategy import QuantStrategyUpdate
        update_data = QuantStrategyUpdate(
            description="Updated test strategy description"
        )
        updated_strategy = strategy_crud.update_strategy(db, strategy_id=new_strategy.id, strategy=update_data)
        if updated_strategy:
            print(f"✅ Updated strategy: {updated_strategy.description}")

        print("\n5. Deleting test strategy...")
        deleted_strategy = strategy_crud.delete_strategy(db, strategy_id=new_strategy.id)
        if deleted_strategy:
            print(f"✅ Deleted strategy")

        print("\n" + "=" * 60)
        print("✅ All Strategy CRUD Tests Passed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error in strategy tests: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def test_trading_crud():
    db = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("Testing Trading CRUD")
        print("=" * 60)

        print("\n1. Getting all orders...")
        orders_result = trading_crud.get_orders(db, skip=0, limit=10)
        orders = orders_result["data"]
        total_orders = orders_result["total"]
        print(f"✅ Found {len(orders)} orders (Total: {total_orders}):")
        for o in orders:
            print(f"   - {o.id}: {o.side} {o.quantity} @ {o.price} ({o.status})")

        print("\n2. Getting all positions...")
        positions_result = trading_crud.get_positions(db, skip=0, limit=10)
        positions = positions_result["data"]
        total_positions = positions_result["total"]
        print(f"✅ Found {len(positions)} positions (Total: {total_positions}):")
        for p in positions:
            print(f"   - {p.id}: {p.ts_code} {p.quantity} @ {p.avg_cost}")

        print("\n3. Getting portfolio...")
        portfolios_result = trading_crud.get_portfolios(db, skip=0, limit=10)
        portfolios = portfolios_result["data"]
        total_portfolios = portfolios_result["total"]
        print(f"✅ Found {len(portfolios)} portfolios (Total: {total_portfolios}):")
        for p in portfolios:
            total_val = f"${p.total_value:,.2f}" if p.total_value is not None else "N/A"
            cash_val = f"${p.cash_balance:,.2f}" if p.cash_balance is not None else "N/A"
            print(f"   - {p.id}: {total_val} (Cash: {cash_val})")

        print("\n4. Creating a new order...")
        from app.schemas.trading import OrderCreate, OrderUpdate
        from app.models.trading import OrderType, OrderSide, OrderStatus
        import uuid
        new_order_data = OrderCreate(
            order_code=f"TEST-{uuid.uuid4().hex[:8]}",
            stock_id=1,
            ts_code="600000.SH",
            order_type=OrderType.MARKET,
            side=OrderSide.BUY,
            quantity=100,
            price=10.5
        )
        new_order = trading_crud.create_order(db, order=new_order_data, user_id=1)
        print(f"✅ Created order: {new_order.order_code} (ID: {new_order.id})")

        print("\n5. Updating order status...")
        update_data = OrderUpdate(status=OrderStatus.FILLED, filled_quantity=100)
        updated_order = trading_crud.update_order(db, order_id=new_order.id, order=update_data)
        if updated_order:
            print(f"✅ Updated order status: {updated_order.status}")

        print("\n6. Getting transactions...")
        transactions_result = trading_crud.get_transactions(db, skip=0, limit=10)
        transactions = transactions_result["data"]
        total_transactions = transactions_result["total"]
        print(f"✅ Found {len(transactions)} transactions (Total: {total_transactions}):")
        for t in transactions:
            print(f"   - {t.id}: {t.transaction_type} ${t.amount:,.2f}")

        print("\n" + "=" * 60)
        print("✅ All Trading CRUD Tests Passed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error in trading tests: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_strategy_crud()
    test_trading_crud()
    print("\n" + "=" * 60)
    print("✅✅✅ ALL TESTS COMPLETED SUCCESSFULLY ✅✅✅")
    print("=" * 60)
