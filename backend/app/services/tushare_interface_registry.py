import asyncio
from typing import Dict, Any, Callable, Optional
from .tushare_api import TushareAPI


class TushareInterfaceRegistry:
    """Tushare 接口注册表 - 管理所有支持的 Tushare API 接口"""

    def __init__(self, api_token: Optional[str] = None):
        self.api = TushareAPI(api_token)
        self.interfaces: Dict[str, Callable] = {}
        self._register_default_interfaces()

    def register(self, name: str, func: Callable) -> None:
        """注册一个新的 Tushare 接口"""
        self.interfaces[name] = func

    async def execute(self, interface_name: str, params: Dict[str, Any]) -> Any:
        """执行指定的 Tushare 接口"""
        print(f"execute func: {interface_name}, params: {params}")

        func = self.interfaces.get(interface_name)

        if not func:
            raise ValueError(f"Interface '{interface_name}' not registered")
        
        if asyncio.iscoroutinefunction(func):
            print(f"run a")
            return await func(self.api, **params)
        else:
            print(f"run b")
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, func, self.api, params)

    def _register_default_interfaces(self) -> None:
        """注册默认的 Tushare 接口"""

        def fetch_daily(api, params: Dict[str, Any]):
            print(f"fetch daily....")

            if not api.pro:
                return None
            # params = {}
            # if ts_code:
            #     params["ts_code"] = ts_code
            # if trade_date:
            #     params["trade_date"] = trade_date
            # if start_date:
            #     params["start_date"] = start_date
            # if end_date:
            #     params["end_date"] = end_date
 
            print(f"daily params {params}")

            df = api.pro.daily(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        def fetch_daily_basic(api, ts_code: str = "", trade_date: str = "",
                            start_date: str = "", end_date: str = ""):
            if not api.pro:
                return None
            params = {}
            if ts_code:
                params["ts_code"] = ts_code
            if trade_date:
                params["trade_date"] = trade_date
            if start_date:
                params["start_date"] = start_date
            if end_date:
                params["end_date"] = end_date
            df = api.pro.daily_basic(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        def fetch_moneyflow(api, ts_code: str = "", trade_date: str = "",
                          start_date: str = "", end_date: str = ""):
            if not api.pro:
                return None
            params = {}
            if ts_code:
                params["ts_code"] = ts_code
            if trade_date:
                params["trade_date"] = trade_date
            if start_date:
                params["start_date"] = start_date
            if end_date:
                params["end_date"] = end_date
            df = api.pro.moneyflow(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        def fetch_moneyflow_hsgt(api, ts_code: str = "", start_date: str = "",
                                 end_date: str = ""):
            if not api.pro:
                return None
            params = {}
            if ts_code:
                params["ts_code"] = ts_code
            if start_date:
                params["start_date"] = start_date
            if end_date:
                params["end_date"] = end_date
            df = api.pro.moneyflow_hsgt(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        def fetch_top_list(api, trade_date: str = ""):
            if not api.pro:
                return None
            params = {}
            if trade_date:
                params["trade_date"] = trade_date
            df = api.pro.top_list(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        self.register("daily", fetch_daily)
        self.register("daily_basic", fetch_daily_basic)
        self.register("moneyflow", fetch_moneyflow)
        self.register("moneyflow_hsgt", fetch_moneyflow_hsgt)
        self.register("top_list", fetch_top_list)

    def list_interfaces(self) -> list:
        """列出所有已注册的接口"""
        return list(self.interfaces.keys())
