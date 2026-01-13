from sqlalchemy.orm import Session
from models import Stock, UserStock
from services.alpha_vantage_api import AlphaVantageAPI
from datetime import datetime
from typing import List, Dict, Any, Optional


class DataSyncService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.alpha_vantage_api = AlphaVantageAPI()
        
    def sync_stock_data(self, sync_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        同步股票数据
        """
        stock_codes = sync_request.get("stock_codes", [])
        sync_type = sync_request.get("sync_type", "all")
        
        if not stock_codes:
            # 获取所有用户的自选股
            user_stocks = self.get_all_user_stocks()
            stock_codes = [stock.code for stock in user_stocks]
            
        success_count = 0
        failed_count = 0
        failures = []
        
        for code in stock_codes:
            try:
                if sync_type in ["stock", "all"]:
                    self.sync_stock_basic_info(code)
                    self.sync_stock_trading_data(code)
                    
                if sync_type in ["financial", "all"]:
                    self.sync_financial_data(code)
                    
                success_count += 1
            except Exception as e:
                failed_count += 1
                failures.append(f"{code}: {str(e)}")
                
        return {
            "success": True,
            "message": f"同步完成，成功 {success_count} 个，失败 {failed_count} 个",
            "synced_count": success_count,
            "failed_count": failed_count,
            "failures": failures
        }
        
    def sync_stock_basic_info(self, stock_code: str):
        """
        同步股票基础信息
        """
        # 使用Alpha Vantage API获取股票基础信息
        quote_data = self.alpha_vantage_api.get_quote_endpoint(stock_code)
        if quote_data and "Global Quote" in quote_data:
            quote = quote_data["Global Quote"]
            # 查找或创建股票记录
            from models import Stock
            stock = self.db.query(Stock).filter(Stock.code == stock_code).first()
            if not stock:
                stock = Stock(
                    code=stock_code,
                    name=stock_code,  # 暂时使用股票代码作为名称，实际应该从其他API获取
                    market="US"  # 默认设置为美国市场
                )
                self.db.add(stock)
                self.db.commit()
                self.db.refresh(stock)
                
        # 可以添加更多基础信息的同步逻辑
        
    def sync_stock_trading_data(self, stock_code: str):
        """
        同步股票交易数据
        """
        # 使用Alpha Vantage API获取股票交易数据
        daily_data = self.alpha_vantage_api.get_daily_data(stock_code)
        if daily_data and "Time Series (Daily)" in daily_data:
            time_series = daily_data["Time Series (Daily)"]
            # 这里可以将数据保存到InfluxDB或其他时序数据库
            print(f"同步股票 {stock_code} 的交易数据，共 {len(time_series)} 条")
            
        # 可以添加更多交易数据的同步逻辑
        
    def sync_financial_data(self, stock_code: str):
        """
        同步财务数据
        """
        # 使用Alpha Vantage API获取财务数据
        income_statement = self.alpha_vantage_api.get_income_statement(stock_code)
        balance_sheet = self.alpha_vantage_api.get_balance_sheet(stock_code)
        cash_flow = self.alpha_vantage_api.get_cash_flow(stock_code)
        
        if income_statement and "annualReports" in income_statement:
            print(f"同步股票 {stock_code} 的利润表数据，共 {len(income_statement['annualReports'])} 条")
            
        if balance_sheet and "annualReports" in balance_sheet:
            print(f"同步股票 {stock_code} 的资产负债表数据，共 {len(balance_sheet['annualReports'])} 条")
            
        if cash_flow and "annualReports" in cash_flow:
            print(f"同步股票 {stock_code} 的现金流量表数据，共 {len(cash_flow['annualReports'])} 条")
            
        # 可以添加更多财务数据的同步逻辑
        
    def get_all_user_stocks(self) -> List[Dict[str, Any]]:
        """
        获取所有用户的自选股
        """
        user_stocks = self.db.query(UserStock).all()
        stocks = []
        for us in user_stocks:
            stock = self.db.query(Stock).filter(Stock.id == us.stock_id).first()
            if stock:
                stocks.append({
                    "user_id": us.user_id,
                    "stock_id": us.stock_id,
                    "code": stock.code,
                    "name": stock.name
                })
        return stocks
        
    def sync_stock_data_for_user(self, user_id: int, stock_id: int):
        """
        为用户同步特定股票的数据
        """
        user_stock = self.db.query(UserStock).filter(
            UserStock.user_id == user_id,
            UserStock.stock_id == stock_id
        ).first()
        
        if user_stock:
            stock = self.db.query(Stock).filter(Stock.id == user_stock.stock_id).first()
            if stock:
                try:
                    self.sync_stock_basic_info(stock.code)
                    self.sync_stock_trading_data(stock.code)
                    print(f"成功同步用户 {user_id} 股票 {stock.code} 的数据")
                except Exception as e:
                    print(f"同步用户 {user_id} 股票 {stock.code} 的数据失败: {str(e)}")
                    
    def sync_financial_data_for_user(self, user_id: int, stock_id: int):
        """
        为用户同步特定股票的财务数据
        """
        user_stock = self.db.query(UserStock).filter(
            UserStock.user_id == user_id,
            UserStock.stock_id == stock_id
        ).first()
        
        if user_stock:
            stock = self.db.query(Stock).filter(Stock.id == user_stock.stock_id).first()
            if stock:
                try:
                    self.sync_financial_data(stock.code)
                    print(f"成功同步用户 {user_id} 股票 {stock.code} 的财务数据")
                except Exception as e:
                    print(f"同步用户 {user_id} 股票 {stock.code} 的财务数据失败: {str(e)}")
                    
    def get_sync_status(self) -> Dict[str, Any]:
        """
        获取数据同步状态
        """
        # 这里可以从数据库或缓存获取同步状态
        return {
            "last_sync_time": datetime.now(),
            "next_sync_time": datetime.now(),
            "syncing": False,
            "status": "idle"
        }
