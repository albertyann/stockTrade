import tushare as ts
from typing import Optional, Dict, Any, List
from ..core.config import settings


class TushareAPI:
    def __init__(self, api_token: str = None):
        self.api_token = api_token or settings.TUSHARE_API_TOKEN
        if self.api_token:
            ts.set_token(self.api_token)
            self.pro = ts.pro_api()
        else:
            self.pro = None

    def is_available(self) -> bool:
        """Check if Tushare API is properly configured"""
        return self.pro is not None

    def get_stock_basic(
        self,
        ts_code: str = None,
        name: str = None,
        market: str = None,
        list_status: str = "L",
        exchange: str = None,
        is_hs: str = None,
        fields: str = "ts_code,symbol,name,area,industry,fullname,enname,cnspell,market,exchange,curr_type,list_status,list_date,delist_date,is_hs,act_name,act_ent_type"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取股票基础信息

        Args:
            ts_code: TS股票代码
            name: 名称
            market: 市场类别 (主板/创业板/科创板/CDR/北交所)
            list_status: 上市状态 L上市 D退市 P暂停上市，默认L
            exchange: 交易所 SSE上交所 SZSE深交所 BSE北交所
            is_hs: 是否沪深港通标的 N否 H沪股通 S深股通
            fields: 返回字段

        Returns:
            股票基础信息列表
        """
        if not self.pro:
            print("Tushare API not configured")
            return None

        try:
            params = {
                "list_status": list_status,
                "fields": fields
            }

            if ts_code:
                params["ts_code"] = ts_code
            if name:
                params["name"] = name
            if market:
                params["market"] = market
            if exchange:
                params["exchange"] = exchange
            if is_hs:
                params["is_hs"] = is_hs

            df = self.pro.stock_basic(**params)
            if df is not None and not df.empty:
                return df.to_dict(orient="records")
            return []
        except Exception as e:
            print(f"Error fetching stock basic from Tushare: {str(e)}")
            return None

    def get_all_stocks(
        self,
        list_status: str = "L",
        market: str = None,
        exchange: str = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取所有股票列表

        Args:
            list_status: 上市状态 L上市 D退市 P暂停上市，默认L
            market: 市场类别
            exchange: 交易所

        Returns:
            所有股票基础信息列表
        """
        return self.get_stock_basic(
            list_status=list_status,
            market=market,
            exchange=exchange
        )

    def get_stock_by_code(self, ts_code: str) -> Optional[Dict[str, Any]]:
        """
        根据股票代码获取单个股票信息

        Args:
            ts_code: TS股票代码，如 '000001.SZ'

        Returns:
            股票基础信息
        """
        stocks = self.get_stock_basic(ts_code=ts_code)
        if stocks and len(stocks) > 0:
            return stocks[0]
        return None

    def get_market_stocks(
        self,
        market: str,
        list_status: str = "L"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取特定市场的股票列表

        Args:
            market: 市场类别 (主板/创业板/科创板/CDR/北交所)
            list_status: 上市状态

        Returns:
            市场股票列表
        """
        return self.get_stock_basic(market=market, list_status=list_status)

    def get_hs_stocks(self, list_status: str = "L") -> Optional[List[Dict[str, Any]]]:
        """
        获取沪深港通标的列表

        Args:
            list_status: 上市状态

        Returns:
            沪深港通标的列表
        """
        return self.get_stock_basic(is_hs="Y", list_status=list_status)

    def get_exchange_stocks(
        self,
        exchange: str,
        list_status: str = "L"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取特定交易所的股票列表

        Args:
            exchange: 交易所 SSE上交所 SZSE深交所 BSE北交所
            list_status: 上市状态

        Returns:
            交易所股票列表
        """
        return self.get_stock_basic(exchange=exchange, list_status=list_status)
