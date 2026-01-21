from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class DataSourceAdapter(ABC):
    """数据源适配器基类 - 所有数据源必须实现此接口"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    @abstractmethod
    def is_available(self) -> bool:
        """检查数据源是否可用"""
        pass

    @abstractmethod
    async def call_api(self, endpoint: str, params: Dict[str, Any]) -> Any:
        """调用数据源 API"""
        pass

    def normalize_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """标准化参数（可选）"""
        return params

    def normalize_response(self, response: Any) -> Any:
        """标准化响应（可选）"""
        return response
