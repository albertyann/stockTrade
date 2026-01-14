from sqlalchemy.orm import Session
from ..models.stock import Stock
from ..models.user_stock import UserStock
from .tushare_api import TushareAPI
from .alpha_vantage_api import AlphaVantageAPI
from datetime import datetime
from typing import List, Dict, Any
from dateutil.parser import parse as parse_date


class DataSyncService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.tushare_api = TushareAPI()
        self.alpha_vantage_api = AlphaVantageAPI()
        
    def sync_stock_data(self, sync_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        同步股票数据
        """
        stock_codes = sync_request.get("stock_codes", [])
        sync_type = sync_request.get("sync_type", "all")
        
        if not stock_codes:
            user_stocks = self.get_all_user_stocks()
            stock_codes = [stock["code"] for stock in user_stocks]
            
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
        
    def sync_stock_basic_info(self, ts_code: str):
        """
        同步股票基础信息 - 使用Tushare API
        """
        if self.tushare_api.is_available():
            stock_data = self.tushare_api.get_stock_by_code(ts_code)
            if stock_data:
                self._save_stock_data(stock_data)
        else:
            print("Tushare API not available, using Alpha Vantage")
            quote_data = self.alpha_vantage_api.get_quote_endpoint(ts_code)
            if quote_data and "Global Quote" in quote_data:
                quote = quote_data["Global Quote"]
                self._save_stock_data_from_alpha_vantage(ts_code, quote)
                
    def _save_stock_data(self, stock_data: Dict[str, Any]):
        """
        保存从Tushare获取的股票数据
        """
        ts_code = stock_data.get("ts_code")
        if not ts_code:
            return
            
        stock = self.db.query(Stock).filter(Stock.ts_code == ts_code).first()
        if not stock:
            stock = Stock(ts_code=ts_code)
            self.db.add(stock)
        
        stock.symbol = stock_data.get("symbol") or ""
        stock.name = stock_data.get("name") or ""
        stock.area = stock_data.get("area")
        stock.industry = stock_data.get("industry")
        stock.fullname = stock_data.get("fullname")
        stock.enname = stock_data.get("enname")
        stock.cnspell = stock_data.get("cnspell")
        stock.market = stock_data.get("market")
        stock.exchange = stock_data.get("exchange")
        stock.curr_type = stock_data.get("curr_type")
        stock.list_status = stock_data.get("list_status")
        
        if stock_data.get("list_date"):
            try:
                stock.list_date = parse_date(stock_data["list_date"]).date()
            except:
                pass
                
        if stock_data.get("delist_date"):
            try:
                stock.delist_date = parse_date(stock_data["delist_date"]).date()
            except:
                pass
                
        stock.is_hs = stock_data.get("is_hs")
        stock.act_name = stock_data.get("act_name")
        stock.act_ent_type = stock_data.get("act_ent_type")
        
        self.db.commit()
        self.db.refresh(stock)
        
    def _save_stock_data_from_alpha_vantage(self, symbol: str, quote: Dict[str, Any]):
        """
        保存从Alpha Vantage获取的股票数据（兼容性处理）
        """
        ts_code = symbol
        stock = self.db.query(Stock).filter(Stock.ts_code == ts_code).first()
        if not stock:
            stock = Stock(
                ts_code=ts_code,
                symbol=symbol,
                name=symbol,
                market="US"
            )
            self.db.add(stock)
            self.db.commit()
            self.db.refresh(stock)
        
    def sync_stock_trading_data(self, stock_code: str):
        """
        同步股票交易数据
        """
        daily_data = self.alpha_vantage_api.get_daily_data(stock_code)
        if daily_data and "Time Series (Daily)" in daily_data:
            time_series = daily_data["Time Series (Daily)"]
            print(f"同步股票 {stock_code} 的交易数据，共 {len(time_series)} 条")
            
    def sync_financial_data(self, stock_code: str):
        """
        同步财务数据
        """
        income_statement = self.alpha_vantage_api.get_income_statement(stock_code)
        balance_sheet = self.alpha_vantage_api.get_balance_sheet(stock_code)
        cash_flow = self.alpha_vantage_api.get_cash_flow(stock_code)
        
        if income_statement and "annualReports" in income_statement:
            print(f"同步股票 {stock_code} 的利润表数据，共 {len(income_statement['annualReports'])} 条")
            
        if balance_sheet and "annualReports" in balance_sheet:
            print(f"同步股票 {stock_code} 的资产负债表数据，共 {len(balance_sheet['annualReports'])} 条")
            
        if cash_flow and "annualReports" in cash_flow:
            print(f"同步股票 {stock_code} 的现金流量表数据，共 {len(cash_flow['annualReports'])} 条")
            
    def sync_all_chinese_stocks(self, list_status: str = "L", market: str = None) -> Dict[str, Any]:
        """
        同步所有中国股票（使用Tushare API）
        """
        if not self.tushare_api.is_available():
            return {
                "success": False,
                "message": "Tushare API未配置",
                "synced_count": 0,
                "failed_count": 0,
                "failures": []
            }
            
        stocks = self.tushare_api.get_all_stocks(list_status=list_status, market=market)
        if stocks is None:
            return {
                "success": False,
                "message": "获取股票列表失败",
                "synced_count": 0,
                "failed_count": 0,
                "failures": []
            }
            
        success_count = 0
        failed_count = 0
        failures = []
        
        for stock_data in stocks:
            try:
                self._save_stock_data(stock_data)
                success_count += 1
            except Exception as e:
                failed_count += 1
                failures.append(f"{stock_data.get('ts_code', 'unknown')}: {str(e)}")
                
        return {
            "success": True,
            "message": f"同步完成，成功 {success_count} 个，失败 {failed_count} 个",
            "synced_count": success_count,
            "failed_count": failed_count,
            "failures": failures
        }
        
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
                    "code": stock.ts_code if stock.ts_code else stock.symbol,
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
                    ts_code = getattr(stock, 'ts_code', None) or getattr(stock, 'symbol', None)
                    if ts_code:
                        self.sync_stock_basic_info(ts_code)
                        self.sync_stock_trading_data(ts_code)
                        print(f"成功同步用户 {user_id} 股票 {ts_code} 的数据")
                except Exception as e:
                    print(f"同步用户 {user_id} 股票 {getattr(stock, 'symbol', 'unknown')} 的数据失败: {str(e)}")
                    
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
                    ts_code = getattr(stock, 'ts_code', None) or getattr(stock, 'symbol', None)
                    if ts_code:
                        self.sync_financial_data(ts_code)
                        print(f"成功同步用户 {user_id} 股票 {ts_code} 的财务数据")
                except Exception as e:
                    print(f"同步用户 {user_id} 股票 {getattr(stock, 'symbol', 'unknown')} 的财务数据失败: {str(e)}")
                    
    def get_sync_status(self) -> Dict[str, Any]:
        """
        获取数据同步状态
        """
        return {
            "last_sync_time": datetime.now(),
            "next_sync_time": datetime.now(),
            "syncing": False,
            "status": "idle",
            "tushare_available": self.tushare_api.is_available()
        }
