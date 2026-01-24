# 多文件上传功能实现

## 功能说明
为文件管理页面添加多文件上传支持，用户可以一次性选择并上传多个文件。

## 修改内容

### 后端修改 (`backend/app/api/v1/uploaded_files.py`)

#### 1. API 端点修改
```python
# 修改前
@router.post("/", response_model=UploadedFileResponse)
async def create_upload_file(
    stock_id: int = 0,
    tags: str = None,
    file: UploadFile = File(...),  # 单文件
    ...
):

# 修改后
@router.post("/", response_model=List[UploadedFileResponse])
async def create_upload_file(
    stock_id: Optional[int] = None,  # 改为可选，默认 None 而非 0
    tags: str = None,
    files: List[UploadFile] = File(...),  # 多文件列表
    ...
):
```

#### 2. 文件处理逻辑
```python
# 修改后支持遍历多个文件
uploaded_files = []

for file in files:
    # 读取文件内容
    file_content = await file.read()

    # 文件大小验证
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' exceeds maximum size limit"
        )

    # 保存文件
    file_path = os.path.join(settings.UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        f.write(file_content)

    # 创建数据库记录
    file_data = UploadedFileCreate(
        stock_id=stock_id,
        file_name=file.filename,
        file_type=file.content_type,
        tags=tag_list
    )

    uploaded_file = file_crud.create_uploaded_file(
        db=db,
        file=file_data,
        user_id=current_user.id,
        file_path=file_path,
        file_size=len(file_content)
    )
    uploaded_files.append(uploaded_file)

return uploaded_files  # 返回所有上传的文件
```

### 前端修改

#### 1. API 服务 (`frontend/src/services/api.ts`)
```typescript
// 修改前
uploadFile: (data: FormData): Promise<{ data: UploadedFile }> =>
  api.post('/upload-files', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

// 修改后
uploadFile: (data: FormData): Promise<{ data: UploadedFile[] }> =>
  api.post('/upload-files', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
```

#### 2. 文件上传组件 (`frontend/src/pages/Files.tsx`)

**a. 文件输入添加 multiple 属性**
```tsx
<input
  id="file-upload"
  type="file"
  multiple  // 支持多文件选择
  className="sr-only"
  onChange={handleUpload}
  disabled={uploading}
/>
```

**b. 更新提示文本**
```tsx
// 修改前
<p className="text-xs text-gray-500">支持单个文件上传</p>

// 修改后
<p className="text-xs text-slate-500">支持多文件上传</p>
```

**c. 处理多个文件**
```typescript
// 修改前
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];  // 只取第一个文件
  if (!file) return;

  setUploading(true);
  const formData = new FormData();
  formData.append('file', file);
  // ...
};

// 修改后
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = e.target.files;
  if (!selectedFiles || selectedFiles.length === 0) return;

  setUploading(true);
  const formData = new FormData();

  // 遍历所有文件并添加到 FormData
  Array.from(selectedFiles).forEach(file => {
    formData.append('files', file);
  });

  if (selectedStockId) {
    formData.append('stock_id', selectedStockId.toString());
  }
  if (tags) {
    tags.split(',').forEach(tag => formData.append('tags', tag.trim()));
  }

  try {
    await fileAPI.uploadFile(formData);
    setUploadModalVisible(false);
    setSelectedStockId(undefined);
    setTags('');
    fetchFiles();  // 刷新文件列表
  } catch (error) {
    console.error('上传失败:', error);
  } finally {
    setUploading(false);
  }
};
```

#### 3. 样式更新
将所有 `gray-*` 类更新为 `slate-*`，与现代设计保持一致：
- `bg-gray-*` → `bg-slate-*`
- `text-gray-*` → `text-slate-*`
- `border-gray-*` → `border-slate-*`

## 功能特性

### ✅ 已实现
- 支持一次选择多个文件
- 批量上传所有选中的文件
- 每个文件独立验证大小
- 每个文件独立保存到数据库
- 统一返回所有上传的文件列表
- 上传后自动刷新文件列表
- 支持不关联股票的上传

### 🔄 使用流程
1. 点击"上传文件"按钮
2. 在弹窗中可以选择"关联股票"或"不关联"
3. 输入标签（可选，多个标签用逗号分隔）
4. 点击"选择文件"
5. 在文件选择器中选择一个或多个文件
6. 点击"取消"关闭弹窗或点击外部区域关闭

### 📝 注意事项

#### 文件命名
- 多文件上传时，文件会保留原始文件名
- 建议用户在上传前重命名文件，避免覆盖

#### 文件大小限制
- 每个文件独立验证大小限制
- 如果任何一个文件超限，整个上传会失败并返回错误信息
- 错误信息会指出哪个文件超限

#### 标签应用
- 所有文件会应用相同的标签
- 如需不同标签，请分批上传

#### 股票关联
- 所有文件会关联到同一只股票
- 如需关联不同股票，请分批上传

#### 并发处理
- 当前实现为顺序处理（逐个上传）
- 文件按选择顺序依次处理

## 测试建议

### 1. 单文件上传
- 选择单个文件上传
- 验证：文件成功上传并显示在列表中

### 2. 多文件上传
- 选择 2-3 个文件
- 验证：所有文件都成功上传
- 验证：文件按选择顺序显示

### 3. 无股票关联上传
- 选择"不关联"
- 上传文件
- 验证：stock_id 字段为空

### 4. 带股票关联上传
- 选择一只股票
- 上传文件
- 验证：所有文件都正确关联到该股票

### 5. 带标签上传
- 输入多个标签（如："财报,分析,报告"）
- 上传文件
- 验证：所有文件都正确保存了标签

### 6. 文件大小限制测试
- 上传超大文件（超过 MAX_FILE_SIZE）
- 验证：收到错误提示，说明哪个文件超限

### 7. 混合测试
- 选择多个不同类型的文件
- 关联股票
- 添加标签
- 验证：所有文件正确处理

## 部署步骤

### 1. 停止后端服务（如果正在运行）

### 2. 重启后端服务
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

# 重启服务（数据库 schema 自动更新）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 重新构建前端（如果需要）
```bash
cd frontend
pnpm start  # 开发模式自动重载
# 或
pnpm build  # 生产构建
```

### 4. 验证功能
- 访问 http://localhost:3000
- 登录系统
- 进入"资料管理"页面
- 测试多文件上传功能

## 向后兼容性

### 数据库
- 数据库 schema 变化：stock_id 改为可选字段
- 现有数据完全兼容（NOT NULL 改为 NULLABLE）
- 不需要数据迁移（使用自动创建表）

### API
- 单文件上传仍然工作（作为多文件上传的特例）
- 返回类型从单个文件改为文件列表
- 前端已相应适配

## 相关文件

### 后端
- `backend/app/api/v1/uploaded_files.py` - API 端点

### 前端
- `frontend/src/services/api.ts` - API 服务
- `frontend/src/pages/Files.tsx` - 文件管理页面

## 后续优化建议

1. **上传进度显示**
   - 为每个文件显示独立的上传进度
   - 显示整体上传进度

2. **拖拽上传**
   - 支持将多个文件拖拽到上传区域
   - 自动处理拖拽的文件列表

3. **上传队列管理**
   - 将多个文件加入队列
   - 支持取消单个文件的上传
   - 支持重试失败的上传

4. **错误恢复**
   - 如果某个文件上传失败，提示用户
   - 允许重新上传失败的文件
   - 已成功上传的文件不受影响

5. **并发上传**
   - 使用并发上传多个文件
   - 限制并发数量（如 3-5 个）
   - 提升大文件上传体验
