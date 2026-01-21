import asyncio
import logging
from typing import Any, Callable, Dict
from .interface_config import InterfaceConfig

logger = logging.getLogger(__name__)


class InterfaceRegistry:
    """接口注册表 - 管理所有数据接口"""

    def __init__(self):
        self.interfaces: Dict[str, Dict[str, Any]] = {}

    def register(self, config: InterfaceConfig, executor: Any) -> None:
        """注册接口"""
        self.interfaces[config.interface_name] = {
            "config": config,
            "executor": executor,
        }
        logger.debug(f"Registered interface: {config.interface_name} from {config.data_source}")

    def get(self, interface_name: str) -> Dict[str, Any]:
        """获取接口"""
        return self.interfaces.get(interface_name)

    def list(self) -> list:
        """列出所有接口"""
        return list(self.interfaces.keys())
