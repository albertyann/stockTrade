import asyncio
import logging
from typing import Any, Dict, Optional
from ..tushare_api import TushareAPI
from .base import DataSourceAdapter

logger = logging.getLogger(__name__)


class TushareAdapter(DataSourceAdapter):
    """Tushare 数据源适配器"""

    def __init__(self, api_token: Optional[str] = None):
        super().__init__(api_token)
        self.api = TushareAPI(api_token)

    def is_available(self) -> bool:
        return self.api.pro is not None

    async def call_api(self, endpoint: str, params: Dict[str, Any]) -> Any:
        logger.debug(f"Calling Tushare endpoint: {endpoint}, params: {params}")

        if not self.api.pro:
            logger.warning("Tushare API pro interface not available")
            return None

        method = getattr(self.api.pro, endpoint, None)
        if method is None:
            raise ValueError(f"Unknown endpoint: {endpoint}")

        df = method(**params)
        result = df.to_dict(orient="records") if df is not None and not df.empty else []
        logger.info(f"Retrieved {len(result)} records from {endpoint}")
        return result
