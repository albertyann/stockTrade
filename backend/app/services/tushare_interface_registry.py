import asyncio
import logging
from typing import Dict, Any, Optional
from ..core.config import settings
from .data_sources import (
    InterfaceRegistry,
    TushareAdapter,
    register_tushare_interfaces,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TushareInterfaceRegistry:
    """Tushare 接口注册表 - 管理所有支持的 Tushare API 接口"""

    def __init__(self, api_token: Optional[str] = None):
        token = api_token or settings.TUSHARE_API_TOKEN
        self.adapter = TushareAdapter(token)
        self.registry = InterfaceRegistry()
        logger.info("Initializing TushareInterfaceRegistry")

        register_tushare_interfaces(self.registry, self.adapter)
        logger.info(f"Registered {len(self.registry.list())} interfaces: {self.registry.list()}")

    async def execute(self, interface_name: str, params: Dict[str, Any]) -> Any:
        """执行指定的 Tushare 接口"""
        logger.info(f"Executing interface: {interface_name}, params: {params}")

        interface_data = self.registry.get(interface_name)
        if not interface_data:
            logger.error(f"Interface '{interface_name}' not registered")
            raise ValueError(f"Interface '{interface_name}' not registered")

        executor = interface_data["executor"]
        config = interface_data["config"]

        logger.debug(f"Executing interface from data source: {config.data_source}")

        import inspect
        call_method = getattr(executor, '__call__', None)

        if asyncio.iscoroutinefunction(executor) or (call_method and asyncio.iscoroutinefunction(call_method)):
            logger.debug(f"Executing async executor for interface: {interface_name}")
            result = await executor(**params)
            logger.debug(f"Async executor completed for interface: {interface_name}")
            return result
        else:
            logger.debug(f"Executing sync executor for interface: {interface_name}")
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, lambda: executor(**params))
            logger.debug(f"Sync executor completed for interface: {interface_name}")
            return result

    def list_interfaces(self) -> list:
        """列出所有已注册的接口"""
        interfaces = self.registry.list()
        logger.debug(f"Listing {len(interfaces)} registered interfaces: {interfaces}")
        return interfaces
