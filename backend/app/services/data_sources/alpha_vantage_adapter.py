import logging
from typing import Any, Dict
from .base import DataSourceAdapter

logger = logging.getLogger(__name__)


class AlphaVantageAdapter(DataSourceAdapter):
    """Alpha Vantage 数据源适配器（待实现）"""

    def is_available(self) -> bool:
        return self.api_key is not None

    async def call_api(self, endpoint: str, params: Dict[str, Any]) -> Any:
        logger.warning("Alpha Vantage adapter not fully implemented yet")
        raise NotImplementedError("Alpha Vantage adapter is not implemented yet")
