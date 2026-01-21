import logging
from typing import Dict, Any
from .interface_registry import InterfaceRegistry
from .tushare_adapter import TushareAdapter
from .interface_config import InterfaceConfig
from .interface_executor import InterfaceExecutor

logger = logging.getLogger(__name__)


tushare_config = [
    {"interface_name": "daily", "description": "股票日线数据"},
    {"interface_name": "daily_basic", "description": "每日指标数据"},
    {"interface_name": "moneyflow", "description": "资金流向数据"},
    {"interface_name": "moneyflow_hsgt", "description": "沪深港通资金流向"},
    {"interface_name": "top_list", "description": "龙虎榜数据"},
    {"interface_name": "index_basic", "description": "指数基本信息"},
    {"interface_name": "index_daily", "description": "指数日线数据"},
]


def register_tushare_interfaces(registry: InterfaceRegistry, adapter: TushareAdapter):
    logger.info(f"Registering {len(tushare_config)} Tushare interfaces")

    for interface_info in tushare_config:
        config = InterfaceConfig(
            interface_name=interface_info["interface_name"],
            data_source="tushare",
            description=interface_info["description"]
        )

        executor = InterfaceExecutor(adapter, config)
        registry.register(config, executor)
        logger.debug(f"Registered interface: {interface_info['interface_name']}")
