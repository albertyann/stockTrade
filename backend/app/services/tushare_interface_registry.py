import asyncio
import logging
from typing import Dict, Any, Callable, Optional
from .tushare_api import TushareAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TushareInterfaceRegistry:
    """Tushare 接口注册表 - 管理所有支持的 Tushare API 接口"""

    def __init__(self, api_token: Optional[str] = None):
        self.api = TushareAPI(api_token)  # type: ignore[arg-type]
        self.interfaces: Dict[str, Callable] = {}
        logger.info("Initializing TushareInterfaceRegistry")
        self._register_default_interfaces()
        logger.info(f"Registered {len(self.interfaces)} default interfaces: {list(self.interfaces.keys())}")

    def register(self, name: str, func: Callable) -> None:
        """注册一个新的 Tushare 接口"""
        self.interfaces[name] = func
        logger.debug(f"Registered interface: {name}")

    async def execute(self, interface_name: str, params: Dict[str, Any]) -> Any:
        """执行指定的 Tushare 接口"""
        logger.info(f"Executing interface: {interface_name}, params: {params}")

        func = self.interfaces.get(interface_name)

        if not func:
            logger.error(f"Interface '{interface_name}' not registered")
            raise ValueError(f"Interface '{interface_name}' not registered")

        if asyncio.iscoroutinefunction(func):
            logger.debug(f"Executing async function for interface: {interface_name}")
            result = await func(self.api, **params)
            logger.debug(f"Async function completed for interface: {interface_name}")
            return result
        else:
            logger.debug(f"Executing sync function for interface: {interface_name}")
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, func, self.api, params)
            logger.debug(f"Sync function completed for interface: {interface_name}")
            return result

    def _register_default_interfaces(self) -> None:
        """注册默认的 Tushare 接口"""

        def fetch_daily(api, params: Dict[str, Any]):
            logger.info(f"Fetching daily data with params: {params}")

            if not api.pro:
                logger.warning("Tushare API pro interface not available")
                return None

            logger.debug(f"Calling Tushare daily API with params: {params}")
            df = api.pro.daily(**params)
            result = df.to_dict(orient="records") if df is not None and not df.empty else []
            logger.info(f"Retrieved {len(result)} daily records")
            return result

        def fetch_daily_basic(api, ts_code: str = "", trade_date: str = "",
                            start_date: str = "", end_date: str = ""):
            logger.debug(f"Fetching daily_basic data: ts_code={ts_code}, trade_date={trade_date}, start_date={start_date}, end_date={end_date}")

            if not api.pro:
                logger.warning("Tushare API pro interface not available")
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

            logger.debug(f"Calling Tushare daily_basic API with params: {params}")
            df = api.pro.daily_basic(**params)
            result = df.to_dict(orient="records") if df is not None and not df.empty else []
            logger.info(f"Retrieved {len(result)} daily_basic records")
            return result

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

        def fetch_index_basic(api, params: Dict[str, Any]):
            if not api.pro:
                return None
            df = api.pro.index_basic(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        def fetch_index_daily(api, params: Dict[str, Any]):
            if not api.pro:
                return None
            df = api.pro.index_daily(**params)
            return df.to_dict(orient="records") if df is not None and not df.empty else []

        self.register("daily", fetch_daily)
        self.register("daily_basic", fetch_daily_basic)
        self.register("moneyflow", fetch_moneyflow)
        self.register("moneyflow_hsgt", fetch_moneyflow_hsgt)
        self.register("top_list", fetch_top_list)
        self.register("index_basic", fetch_index_basic)
        self.register("index_daily", fetch_index_daily)

    def list_interfaces(self) -> list:
        """列出所有已注册的接口"""
        return list(self.interfaces.keys())
