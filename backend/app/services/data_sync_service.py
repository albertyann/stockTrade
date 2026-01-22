from sqlalchemy.orm import Session
from ..models.stock import Stock
from ..models.user_stock import UserStock
from ..models.stock_daily import StockDaily
from .tushare_api import TushareAPI
from .alpha_vantage_api import AlphaVantageAPI
from datetime import datetime
from typing import List, Dict, Any
from dateutil.parser import parse as parse_date
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        logger.info(f"[基础信息] 开始同步股票: {ts_code}")

        if self.tushare_api.is_available():
            stock_data = self.tushare_api.get_stock_by_code(ts_code)
            if stock_data:
                self._save_stock_data(stock_data)
                logger.info(f"[基础信息] 从 Tushare 更新股票: {ts_code}")
            else:
                logger.warning(f"[基础信息] Tushare 未找到股票: {ts_code}")
        else:
            logger.info("[基础信息] Tushare API 不可用，使用 Alpha Vantage")
            quote_data = self.alpha_vantage_api.get_quote_endpoint(ts_code)
            if quote_data and "Global Quote" in quote_data:
                quote = quote_data["Global Quote"]
                self._save_stock_data_from_alpha_vantage(ts_code, quote)
                logger.info(f"[基础信息] 从 Alpha Vantage 更新股票: {ts_code}")
            else:
                logger.warning(f"[基础信息] Alpha Vantage 未找到股票: {ts_code}")
                
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
        同步股票交易数据 - 优先使用 Tushare API，如果 Tushare 不可用则使用 Alpha Vantage
        """
        logger.info(f"========== 开始同步股票 {stock_code} 的日线数据 ==========")
        logger.info(f"同步时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        daily_data = None

        if self.tushare_api.is_available():
            logger.info("使用 Tushare API 获取数据")
            daily_data = self.tushare_api.get_daily_data(ts_code=stock_code)

            if daily_data and len(daily_data) > 0:
                logger.info(f"从 Tushare 获取到 {len(daily_data)} 条交易数据")
                dates = [item.get("trade_date") for item in daily_data if item.get("trade_date")]
                if dates:
                    logger.info(f"数据范围: {max(dates)} 至 {min(dates)}")

                new_count = 0
                update_count = 0
                error_count = 0

                for item in daily_data:
                    try:
                        trade_date_str = item.get("trade_date")
                        if not trade_date_str:
                            continue

                        trade_date = parse_date(trade_date_str).date()
                        open_price = item.get("open")
                        high_price = item.get("high")
                        low_price = item.get("low")
                        close_price = item.get("close")
                        pre_close = item.get("pre_close")
                        change = item.get("change")
                        pct_chg = item.get("pct_chg")
                        vol = item.get("vol")
                        amount = item.get("amount")

                        existing = self.db.query(StockDaily).filter(
                            StockDaily.ts_code == stock_code,
                            StockDaily.trade_date == trade_date
                        ).first()

                        if existing:
                            existing.open = open_price
                            existing.high = high_price
                            existing.low = low_price
                            existing.close = close_price
                            existing.pre_close = pre_close
                            existing.change = change
                            existing.pct_chg = pct_chg
                            existing.vol = vol
                            existing.amount = amount
                            update_count += 1
                        else:
                            new_daily = StockDaily(
                                ts_code=stock_code,
                                trade_date=trade_date,
                                open=open_price,
                                high=high_price,
                                low=low_price,
                                close=close_price,
                                pre_close=pre_close,
                                change=change,
                                pct_chg=pct_chg,
                                vol=vol,
                                amount=amount
                            )
                            self.db.add(new_daily)
                            new_count += 1
                    except Exception as e:
                        logger.error(f"处理交易数据失败 {item.get('trade_date')}: {str(e)}")
                        error_count += 1

                try:
                    self.db.commit()
                    logger.info(f"✓ 股票 {stock_code} 的交易数据保存成功")
                    logger.info(f"新增: {new_count} 条, 更新: {update_count} 条, 失败: {error_count} 条")
                except Exception as e:
                    self.db.rollback()
                    logger.error(f"✗ 提交股票 {stock_code} 的交易数据失败: {str(e)}")
                    raise
            else:
                logger.warning(f"Tushare 未获取到有效数据")
                logger.info(f"API响应: {daily_data if daily_data else '无响应'}")
        else:
            logger.info("Tushare API 不可用，使用 Alpha Vantage")
            daily_data = self.alpha_vantage_api.get_daily_data(stock_code)

            if daily_data and "Time Series (Daily)" in daily_data:
                time_series = daily_data["Time Series (Daily)"]
                dates = sorted(time_series.keys())
                logger.info(f"从 Alpha Vantage 获取到 {len(time_series)} 条交易数据")
                logger.info(f"数据范围: {dates[-1]} 至 {dates[0]} (最新至最旧)")

                new_count = 0
                update_count = 0
                error_count = 0

                for trade_date_str, data in time_series.items():
                    try:
                        trade_date = parse_date(trade_date_str).date()
                        open_price = float(data.get("1. open", 0))
                        high_price = float(data.get("2. high", 0))
                        low_price = float(data.get("3. low", 0))
                        close_price = float(data.get("4. close", 0))
                        volume = float(data.get("5. volume", 0))

                        existing = self.db.query(StockDaily).filter(
                            StockDaily.ts_code == stock_code,
                            StockDaily.trade_date == trade_date
                        ).first()

                        if existing:
                            existing.open = open_price
                            existing.high = high_price
                            existing.low = low_price
                            existing.close = close_price
                            existing.pre_close = float(data.get("4. close", 0))
                            existing.change = float(data.get("5. volume", 0))
                            existing.pct_chg = float(data.get("6. volume", 0))
                            existing.vol = volume
                            existing.amount = float(data.get("6. volume", 0))
                            update_count += 1
                        else:
                            new_daily = StockDaily(
                                ts_code=stock_code,
                                trade_date=trade_date,
                                open=open_price,
                                high=high_price,
                                low=low_price,
                                close=close_price,
                                pre_close=float(data.get("4. close", 0)),
                                change=float(data.get("5. volume", 0)),
                                pct_chg=float(data.get("6. volume", 0)),
                                vol=volume,
                                amount=float(data.get("6. volume", 0))
                            )
                            self.db.add(new_daily)
                            new_count += 1
                    except Exception as e:
                        logger.error(f"处理交易数据失败 {trade_date_str}: {str(e)}")
                        error_count += 1

                try:
                    self.db.commit()
                    logger.info(f"✓ 股票 {stock_code} 的交易数据保存成功")
                    logger.info(f"新增: {new_count} 条, 更新: {update_count} 条, 失败: {error_count} 条")
                except Exception as e:
                    self.db.rollback()
                    logger.error(f"✗ 提交股票 {stock_code} 的交易数据失败: {str(e)}")
                    raise
            else:
                logger.warning(f"股票 {stock_code} 未获取到有效数据")
                logger.info(f"API响应: {daily_data if daily_data else '无响应'}")

        logger.info(f"========== 股票 {stock_code} 同步完成 ==========")
            
    def sync_financial_data(self, stock_code: str):
        from ..crud.stock_income_statement import upsert_income_statements
        from ..crud.stock_balance_sheet import upsert_balance_sheets
        from ..crud.stock_cash_flow import upsert_cash_flows
        from ..models.stock import Stock

        stock = self.db.query(Stock).filter(Stock.ts_code == stock_code).first()
        if not stock:
            logger.warning(f"股票 {stock_code} 不存在，跳过财务数据同步")
            return

        stock_id = stock.id
        ts_code = stock.ts_code

        income_statement = self.alpha_vantage_api.get_income_statement(stock_code)
        balance_sheet = self.alpha_vantage_api.get_balance_sheet(stock_code)
        cash_flow = self.alpha_vantage_api.get_cash_flow(stock_code)

        if income_statement and "annualReports" in income_statement:
            reports = income_statement["annualReports"]
            income_data = []
            for report in reports:
                income_data.append({
                    "ts_code": ts_code,
                    "fiscal_date_ending": parse_date(report.get("fiscalDateEnding")),
                    "reported_currency": report.get("reportedCurrency"),
                    "total_revenue": report.get("totalRevenue"),
                    "cost_of_revenue": report.get("costOfRevenue"),
                    "gross_profit": report.get("grossProfit"),
                    "total_operating_expenses": report.get("totalOperatingExpenses"),
                    "operating_income": report.get("operatingIncome"),
                    "interest_expense": report.get("interestExpense"),
                    "income_before_tax": report.get("incomeBeforeTax"),
                    "income_tax_expense": report.get("incomeTaxExpense"),
                    "net_income": report.get("netIncome"),
                    "ebit": report.get("ebit"),
                    "ebitda": report.get("ebitda"),
                    "net_income_from_continuing_operations": report.get("netIncomeFromContinuingOperations"),
                    "comprehensive_income_net_of_tax": report.get("comprehensiveIncomeNetOfTax"),
                    "raw_data": report
                })

            try:
                count = upsert_income_statements(self.db, stock_id, income_data)
                logger.info(f"同步股票 {stock_code} 的利润表数据，共 {count} 条")
            except Exception as e:
                logger.error(f"保存利润表数据失败: {str(e)}")
                self.db.rollback()
        else:
            logger.warning(f"股票 {stock_code} 无利润表数据")

        if balance_sheet and "annualReports" in balance_sheet:
            reports = balance_sheet["annualReports"]
            balance_data = []
            for report in reports:
                balance_data.append({
                    "ts_code": ts_code,
                    "fiscal_date_ending": parse_date(report.get("fiscalDateEnding")),
                    "reported_currency": report.get("reportedCurrency"),
                    "total_assets": report.get("totalAssets"),
                    "total_current_assets": report.get("totalCurrentAssets"),
                    "cash_and_cash_equivalents_at_carrying_value": report.get("cashAndCashEquivalentsAtCarryingValue"),
                    "cash_and_short_term_investments": report.get("cashAndShortTermInvestments"),
                    "total_non_current_assets": report.get("totalNonCurrentAssets"),
                    "property_plant_equipment": report.get("propertyPlantEquipment"),
                    "total_liabilities": report.get("totalLiabilities"),
                    "total_current_liabilities": report.get("totalCurrentLiabilities"),
                    "current_long_term_debt": report.get("currentLongTermDebt"),
                    "long_term_debt": report.get("longTermDebt"),
                    "total_non_current_liabilities": report.get("totalNonCurrentLiabilities"),
                    "total_shareholder_equity": report.get("totalShareholderEquity"),
                    "treasury_stock": report.get("treasuryStock"),
                    "retained_earnings": report.get("retainedEarnings"),
                    "common_shares_outstanding": report.get("commonSharesOutstanding"),
                    "raw_data": report
                })

            try:
                count = upsert_balance_sheets(self.db, stock_id, balance_data)
                logger.info(f"同步股票 {stock_code} 的资产负债表数据，共 {count} 条")
            except Exception as e:
                logger.error(f"保存资产负债表数据失败: {str(e)}")
                self.db.rollback()
        else:
            logger.warning(f"股票 {stock_code} 无资产负债表数据")

        if cash_flow and "annualReports" in cash_flow:
            reports = cash_flow["annualReports"]
            cashflow_data = []
            for report in reports:
                cashflow_data.append({
                    "ts_code": ts_code,
                    "fiscal_date_ending": parse_date(report.get("fiscalDateEnding")),
                    "reported_currency": report.get("reportedCurrency"),
                    "operating_cashflow": report.get("operatingCashflow"),
                    "payments_for_operating_activities": report.get("paymentsForOperatingActivities"),
                    "proceeds_from_operating_activities": report.get("proceedsFromOperatingActivities"),
                    "depreciation_amortization": report.get("depreciationAndAmortization"),
                    "stock_based_compensation": report.get("stockBasedCompensation"),
                    "operating_cashflow_continuing": report.get("operatingCashflowContinuing"),
                    "capital_expenditures": report.get("capitalExpenditures"),
                    "capital_expenditure_for_property_plant_equipment": report.get("capitalExpenditureForPropertyPlantEquipment"),
                    "proceeds_from_sale_of_property_plant_equipment": report.get("proceedsFromSaleOfPropertyPlantEquipment"),
                    "investment_purchase_and_sale": report.get("investmentPurchaseAndSale"),
                    "sale_purchase_of_investment": report.get("salePurchaseOfInvestment"),
                    "net_borrowings": report.get("netBorrowings"),
                    "other_financing_activities": report.get("otherFinancingActivities"),
                    "cash_flow_from_financing": report.get("cashFlowFromFinancing"),
                    "dividends_paid": report.get("dividendsPaid"),
                    "free_cash_flow": report.get("freeCashFlow"),
                    "raw_data": report
                })

            try:
                count = upsert_cash_flows(self.db, stock_id, cashflow_data)
                logger.info(f"同步股票 {stock_code} 的现金流量表数据，共 {count} 条")
            except Exception as e:
                logger.error(f"保存现金流量表数据失败: {str(e)}")
                self.db.rollback()
        else:
            logger.warning(f"股票 {stock_code} 无现金流量表数据")
            
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
                ts_code = getattr(stock, 'ts_code', None) or getattr(stock, 'symbol', None)
                stock_name = getattr(stock, 'name', 'unknown')
                if ts_code:
                    logger.info(f"[用户 {user_id}] 开始同步股票: {ts_code} ({stock_name})")
                    try:
                        self.sync_stock_basic_info(ts_code)
                        self.sync_stock_trading_data(ts_code)
                        logger.info(f"[用户 {user_id}] ✓ 股票 {ts_code} 同步成功")
                    except Exception as e:
                        logger.error(f"[用户 {user_id}] ✗ 股票 {ts_code} 同步失败: {str(e)}")
                        raise
                    
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
