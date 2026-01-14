import requests
from typing import Optional, Dict, Any
from ..core.config import settings


class AlphaVantageAPI:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.ALPHA_VANTAGE_API_KEY
        self.base_url = "https://www.alphavantage.co/query"
        
    def get_daily_data(self, symbol: str, outputsize: str = "compact") -> Optional[Dict[str, Any]]:
        """
        获取股票每日数据
        """
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": outputsize,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching daily data for {symbol}: {str(e)}")
            return None
            
    def get_quote_endpoint(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取股票实时报价
        """
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching quote for {symbol}: {str(e)}")
            return None
            
    def get_income_statement(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取利润表数据
        """
        params = {
            "function": "INCOME_STATEMENT",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching income statement for {symbol}: {str(e)}")
            return None
            
    def get_balance_sheet(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取资产负债表数据
        """
        params = {
            "function": "BALANCE_SHEET",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching balance sheet for {symbol}: {str(e)}")
            return None
            
    def get_cash_flow(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取现金流量表数据
        """
        params = {
            "function": "CASH_FLOW",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching cash flow for {symbol}: {str(e)}")
            return None
            
    def get_technical_indicators(self, symbol: str, indicator: str, interval: str = "daily", time_period: int = 20) -> Optional[Dict[str, Any]]:
        """
        获取技术指标数据
        """
        params = {
            "function": indicator,
            "symbol": symbol,
            "interval": interval,
            "time_period": time_period,
            "series_type": "close",
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching {indicator} for {symbol}: {str(e)}")
            return None
