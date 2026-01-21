import asyncio
import logging
from typing import Any, Callable, Dict
from .interface_config import InterfaceConfig

logger = logging.getLogger(__name__)


class InterfaceExecutor:
    """通用接口执行器 - 统一的执行逻辑（重试、日志、异步处理）"""

    def __init__(self, adapter: Any, config: InterfaceConfig):
        self.adapter = adapter
        self.config = config

    async def __call__(self, **params: Dict[str, Any]) -> Any:
        """使实例可调用，委托给 execute 方法"""
        return await self.execute(params)

    async def execute(self, params: Dict[str, Any]) -> Any:
        """执行接口调用，带重试逻辑"""

        logger.info(f"Executing interface: {self.config.interface_name}, params: {params}")

        max_retries = self.config.retry_policy.get("max_retries", 3)
        backoff = self.config.retry_policy.get("backoff", 1)

        for attempt in range(max_retries):
            try:
                result = await self.adapter.call_api(self.config.interface_name, params)
                logger.info(f"Successfully retrieved data from {self.config.interface_name}")
                return result

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = backoff * (2 ** attempt)
                    logger.warning(f"Attempt {attempt + 1} failed for {self.config.interface_name}: {str(e)}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"All {max_retries} attempts failed for {self.config.interface_name}: {str(e)}")
                    raise

        logger.error(f"Interface {self.config.interface_name} is not available")
        raise ValueError(f"Interface {self.config.interface_name} is not available")
