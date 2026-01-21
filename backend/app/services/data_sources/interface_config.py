from typing import Dict, Any


class InterfaceConfig:
    """接口配置定义 - 从数据库或配置文件加载"""

    def __init__(
        self,
        interface_name: str,
        data_source: str,
        description: str = "",
        params_schema: Dict[str, Any] = None,
        retry_policy: Dict[str, Any] = None,
        enabled: bool = True
    ):
        self.interface_name = interface_name
        self.data_source = data_source
        self.description = description
        self.params_schema = params_schema or {}
        self.retry_policy = retry_policy or {"max_retries": 3, "backoff": 1}
        self.enabled = enabled

    def to_dict(self) -> Dict[str, Any]:
        return {
            "interface_name": self.interface_name,
            "data_source": self.data_source,
            "description": self.description,
            "params_schema": self.params_schema,
            "retry_policy": self.retry_policy,
            "enabled": self.enabled,
        }
