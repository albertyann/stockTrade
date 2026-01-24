# 文件上传 Bug 修复说明

## 问题描述
上传文件时出现 `422 Unprocessable Entity` 错误

## 根本原因
后端 API 要求 `stock_id` 为必填字段，但前端可以选择"不关联"选项，导致不发送 `stock_id` 参数，从而产生 422 验证错误。

## 修复内容

### 1. 数据库模型 (`app/models/uploaded_file.py`)
```python
# 修改前
stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)

# 修改后
stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=True)
```

### 2. Pydantic Schema (`app/schemas/uploaded_file.py`)
```python
# 修改前
class UploadedFileBase(BaseModel):
    stock_id: int  # 必填

# 修改后
class UploadedFileBase(BaseModel):
    stock_id: Optional[int]  # 可选
```

### 3. API 端点 (`app/api/v1/uploaded_files.py`)
```python
# 修改前
@router.post("/", response_model=UploadedFileResponse)
async def create_upload_file(
    stock_id: int,  # 必填参数
    tags: str = None,
    file: UploadFile = File(...),
    ...
):

# 修改后
@router.post("/", response_model=UploadedFileResponse)
async def create_upload_file(
    stock_id: int = None,  # 可选参数
    tags: str = None,
    file: UploadFile = File(...),
    ...
):
```

### 4. 类型导入 (`app/api/v1/uploaded_files.py`)
```python
# 添加 Optional 导入
from typing import List, Optional
```

## 影响范围

### 数据库
- 项目使用 `Base.metadata.create_all(bind=engine)` 自动创建表
- 重启后端服务后，数据库 schema 会自动更新
- `stock_id` 字段变为可空，允许上传文件时不关联股票

### 现有数据
- 现有数据不受影响（从 `NOT NULL` 改为 `NULLABLE` 是向后兼容的）
- 现有文件的 `stock_id` 保持原值

### 功能改进
- ✅ 用户可以上传不关联任何股票的文件
- ✅ "不关联" 选项现在正常工作
- ✅ 减少 422 验证错误

## 测试建议

1. **上传不关联股票的文件**
   - 选择"不关联"
   - 选择文件上传
   - 验证：文件上传成功

2. **上传关联股票的文件**
   - 选择一个股票
   - 选择文件上传
   - 验证：文件上传成功并关联正确

3. **带标签上传**
   - 输入多个标签（逗号分隔）
   - 上传文件
   - 验证：标签正确保存

## 部署步骤

1. **停止后端服务**
   ```bash
   # 如果服务正在运行，先停止
   ```

2. **重启后端服务**
   ```bash
   cd backend
   # 激活虚拟环境
   source venv/bin/activate  # Linux/Mac
   # 或
   venv\Scripts\activate  # Windows

   # 重启服务（会自动更新数据库 schema）
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **验证功能**
   - 访问 http://localhost:3000
   - 登录系统
   - 进入"资料管理"页面
   - 测试上传文件（有/无关联股票）

## 注意事项

- ⚠️ **数据库兼容性**：
  - SQLite：自动重建表（保留数据）
  - PostgreSQL：直接修改列属性
  - 其他数据库：需要手动执行 ALTER 语句

- ⚠️ **生产环境部署**：
  - 建议先在测试环境验证
  - 备份数据库后再部署
  - 重启服务会有短暂停机

## 相关文件

修改的文件：
- `/backend/app/models/uploaded_file.py` - 数据库模型
- `/backend/app/schemas/uploaded_file.py` - Pydantic 验证 schema
- `/backend/app/api/v1/uploaded_files.py` - API 端点
