# 多数据源适配器架构方案

## 问题

当前的 `tushare_interface_registry.py` 存在以下问题：

1. **硬编码接口定义**：所有接口都写死在 `_register_default_interfaces` 方法中
2. **逻辑重复**：每个接口的实现逻辑相似（检查 API、调用、转换结果）
3. **扩展困难**：添加新数据源（如 Alpha Vantage）需要重复代码
4. **耦合度高**：业务逻辑与 Tushare API 紧密耦合

## 解决方案

基于适配器模式、工厂模式和注册表模式的多数据源架构：

### 核心设计原则

1. **适配器模式**：每个数据源实现统一的适配器接口
2. **接口配置化**：接口定义从代码中抽离到配置/数据库
3. **通用执行器**：统一的执行逻辑（重试、日志、异步处理）
4. **运行时注册**：支持运行时动态注册新接口

### 文件结构

```
backend/app/services/data_sources/
├── __init__.py                    # 模块导出
├── base.py                         # 数据源适配器基类
├── tushare_adapter.py              # Tushare 适配器实现
├── alpha_vantage_adapter.py         # Alpha Vantage 适配器（待实现）
├── interface_config.py              # 接口配置类
├── interface_registry.py            # 接口注册表
├── tushare_interfaces.py           # Tushare 接口定义
└── README.md                      # 本文档
```

## 使用方式

### 1. 创建数据源适配器

每个数据源继承 `DataSourceAdapter` 基类：

```python
from .base import DataSourceAdapter

class TushareAdapter(DataSourceAdapter):
    def __init__(self, api_token: str = None):
        super().__init__(api_token)
        self.api = TushareAPI(api_token)

    def is_available(self) -> bool:
        return self.api.pro is not None

    async def call_api(self, endpoint: str, params: Dict[str, Any]) -> Any:
        method = getattr(self.api.pro, endpoint, None)
        if method is None:
            raise ValueError(f"Unknown endpoint: {endpoint}")
        df = method(**params)
        return df.to_dict(orient="records") if df is not None and not df.empty else []
```

### 2. 定义接口配置

在独立的文件中定义所有接口：

```python
tushare_config = [
    {"interface_name": "daily", "description": "股票日线数据"},
    {"interface_name": "daily_basic", "description": "每日指标数据"},
    {"interface_name": "index_daily", "description": "指数日线数据"},
]
```

### 3. 注册接口

```python
from .interface_registry import InterfaceRegistry
from .tushare_adapter import TushareAdapter
from .tushare_interfaces import register_tushare_interfaces

registry = InterfaceRegistry()
adapter = TushareAdapter(api_token="your_token")

register_tushare_interfaces(registry, adapter)
```

### 4. 执行接口

```python
interface_data = registry.get("daily")
config = interface_data["config"]
executor = interface_data["executor"]

result = await executor(ts_code="000001.SZ", trade_date="20240101")
```

## 优势

1. **扩展简单**：添加新数据源只需实现适配器接口
2. **配置分离**：接口定义与代码逻辑解耦
3. **统一执行**：所有接口共享统一的日志、重试逻辑
4. **易于测试**：可以模拟适配器进行单元测试
5. **运行时管理**：支持从数据库动态加载接口配置

## 迁移步骤

### 第一阶段：保持兼容性

1. 保留现有 `tushare_interface_registry.py`
2. 创建新的 `data_sources` 模块
3. 逐步将现有功能迁移到新架构

### 第二阶段：完全迁移

1. 重构 `sync_task_manager.py` 使用新架构
2. 删除旧的 `tushare_interface_registry.py`
3. 测试所有功能正常

## 未来扩展

添加新数据源（例如 Alpha Vantage）：

1. 创建 `alpha_vantage_adapter.py`
2. 定义接口配置
3. 注册到接口注册表
4. 无需修改任何现有代码
