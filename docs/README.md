# 股票分析系统

## 项目概述

股票深度分析系统是一个基于前后端分离架构的股票分析平台，提供股票数据同步、分析规则引擎、投资笔记管理等功能。

## 技术栈

### 后端
- **框架**: FastAPI 0.104.1
- **数据库**: PostgreSQL / SQLite (默认)
- **缓存**: Redis (可选)
- **对象存储**: MinIO (可选)
- **时序数据库**: InfluxDB (可选)
- **定时任务**: APScheduler
- **第三方API**: Alpha Vantage, Finnhub
- **认证**: JWT (python-jose + passlib)
- **ORM**: SQLAlchemy 2.0.30
- **配置管理**: pydantic-settings

### 前端
- **框架**: React + TypeScript
- **UI组件**: Ant Design
- **样式**: TailwindCSS + styled-components
- **图表库**: ECharts
- **路由**: React Router v6
- **日期处理**: dayjs
- **网络请求**: Axios

## 安装与启动

### 1. 环境准备

- Python 3.10+
- Node.js 18+
- npm/pnpm 8+
- PostgreSQL 12+ (可选，默认使用SQLite)
- Redis 6+ (可选)
- InfluxDB 2.0+ (可选)
- MinIO (可选)

### 2. 后端安装

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库、Redis等连接信息

# 启动开发服务器（自动创建数据库表）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 前端安装

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm start

# 构建生产版本
pnpm build
```

### 4. 访问系统

- 前端: http://localhost:3000
- 后端API文档: http://localhost:8000/docs

## 项目结构

### 后端结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # 主应用入口
│   ├── database.py          # 数据库连接
│   ├── core/                # 核心模块
│   │   ├── config.py        # 配置文件
│   │   └── security.py      # 安全认证
│   ├── models/              # 数据库模型
│   │   ├── user.py          # 用户模型
│   │   ├── stock.py         # 股票模型
│   │   ├── user_stock.py    # 用户自选股模型
│   │   ├── investment_note.py    # 投资笔记模型
│   │   ├── uploaded_file.py      # 文件上传模型
│   │   ├── analysis_rule.py      # 分析规则模型
│   │   └── analysis_result.py    # 分析结果模型
│   ├── schemas/             # Pydantic模式
│   │   ├── user.py
│   │   ├── stock.py
│   │   ├── user_stock.py
│   │   ├── investment_note.py
│   │   ├── uploaded_file.py
│   │   ├── analysis_rule.py
│   │   ├── analysis_result.py
│   │   ├── auth.py
│   │   └── sync.py
│   ├── crud/                # 数据库操作
│   │   ├── user.py
│   │   ├── stock.py
│   │   ├── user_stock.py
│   │   ├── investment_note.py
│   │   ├── uploaded_file.py
│   │   ├── analysis_rule.py
│   │   └── analysis_result.py
│   ├── api/v1/              # API路由
│   │   ├── auth.py          # 认证接口
│   │   ├── users.py         # 用户接口
│   │   ├── stocks.py        # 股票接口
│   │   ├── user_stocks.py   # 用户自选股接口
│   │   ├── investment_notes.py    # 投资笔记接口
│   │   ├── uploaded_files.py      # 文件管理接口
│   │   ├── analysis_rules.py      # 分析规则接口
│   │   ├── analysis_results.py    # 分析结果接口
│   │   └── sync.py          # 数据同步接口
│   └── services/            # 业务服务
│       ├── alpha_vantage_api.py    # Alpha Vantage API集成
│       ├── data_sync_service.py    # 数据同步服务
│       ├── data_sync_scheduler.py  # 定时同步任务
│       └── rule_engine_service.py  # 规则引擎服务
├── requirements.txt         # 项目依赖
├── .env.example             # 环境变量示例
└── .env                     # 环境变量配置
```

### 前端结构
```
frontend/
├── src/
│   ├── components/          # 公共组件 (AppLayout, RuleCard, StockCard)
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── Files.tsx        # 文件管理
│   │   ├── Login.tsx        # 登录页面
│   │   ├── Notes.tsx        # 投资笔记
│   │   ├── Rules.tsx        # 规则管理
│   │   ├── Settings.tsx     # 设置页面
│   │   ├── StockDetail.tsx  # 股票详情
│   │   ├── StockList.tsx    # 股票列表
│   │   └── Watchlist.tsx    # 自选股
│   ├── services/            # API服务 (api.ts)
│   ├── types/               # 类型定义 (index.ts)
│   ├── App.tsx              # 根组件
│   ├── index.css            # 全局样式
│   └── index.tsx            # 应用入口
├── public/                  # 静态资源
├── AGENTS.md                # 开发规范
├── package.json             # 项目配置
├── pnpm-lock.yaml           # 依赖锁定文件
├── postcss.config.js        # PostCSS配置
├── tailwind.config.js       # TailwindCSS配置
└── tsconfig.json            # TypeScript配置
```

## 核心功能

### 1. 用户管理
- 用户注册/登录
- 用户信息管理

### 2. 股票管理
- 股票列表查询
- 股票详情查看
- 用户自选股管理

### 3. 数据同步
- 股票数据同步
- 财务数据同步
- 定时同步任务

### 4. 分析规则引擎
- 规则创建/编辑
- 规则评估
- 分析结果查询

### 5. 投资笔记
- 笔记创建/编辑
- 笔记查询
- 标签管理

### 6. 文件管理
- 文件上传/下载
- 文件查询

## 开发说明

### 1. 数据库配置

项目默认使用 SQLite 数据库，数据库文件位于 `backend/stock_analysis.db`。如果需要使用 PostgreSQL，请修改 `.env` 文件：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/stock_analysis
```

数据库表会在应用启动时自动创建（见 `app/main.py:Base.metadata.create_all(bind=engine)`）。

### 2. 第三方 API 配置

项目支持 Alpha Vantage 和 Finnhub 两个数据源，需要在 `.env` 文件中配置 API Key：

```env
ALPHA_VANTAGE_API_KEY=YOUR_API_KEY
FINNHUB_API_KEY=YOUR_API_KEY
```

### 3. 定时任务

定时任务使用APScheduler实现，主要同步任务如下：
- 每日收盘后同步股票数据
- 每周同步财务数据

同步间隔可通过环境变量配置：
```env
SYNC_INTERVAL=60  # 同步间隔（分钟）
```

## 数据模型

### 用户 (User)
- id: 主键
- username: 用户名 (唯一)
- email: 邮箱 (唯一)
- password_hash: 密码哈希
- created_at: 创建时间
- updated_at: 更新时间

### 股票 (Stock)
- id: 主键
- code: 股票代码 (唯一)
- name: 股票名称
- market: 市场 (如 "US")
- industry: 行业
- description: 描述
- created_at: 创建时间
- updated_at: 更新时间

### 用户自选股 (UserStock)
- id: 主键
- user_id: 用户ID (外键)
- stock_id: 股票ID (外键)

### 投资笔记 (InvestmentNote)
- id: 主键
- user_id: 用户ID (外键)
- stock_id: 股票ID (外键)
- title: 标题
- content: 内容
- tags: 标签 (JSON)
- created_at: 创建时间
- updated_at: 更新时间

### 上传文件 (UploadedFile)
- id: 主键
- user_id: 用户ID (外键)
- stock_id: 股票ID (外键)
- file_name: 文件名
- file_type: 文件类型
- file_path: 文件路径
- file_size: 文件大小
- tags: 标签 (JSON)
- created_at: 创建时间
- updated_at: 更新时间

### 分析规则 (AnalysisRule)
- id: 主键
- user_id: 用户ID (外键)
- name: 规则名称
- description: 描述
- conditions: 条件 (JSON)
- priority: 优先级
- enabled: 是否启用
- created_at: 创建时间
- updated_at: 更新时间

### 分析结果 (AnalysisResult)
- id: 主键
- rule_id: 规则ID (外键)
- stock_id: 股票ID (外键)
- timestamp: 时间戳
- data: 数据 (JSON)
- matched: 是否匹配
- created_at: 创建时间

## 规则引擎

规则引擎支持以下指标：
- 价格 (price)
- 成交量 (volume)
- 20日均线 (ma20)
- PE值 (pe)
- ROE值 (roe)
- EPS值 (eps)
- 股息收益率 (dividend_yield)

支持的操作符：
- gt (大于)
- lt (小于)
- gte (大于等于)
- lte (小于等于)
- eq (等于)
- neq (不等于)

逻辑运算：
- AND (所有条件满足)
- OR (任一条件满足)

## API 端点

#### 认证接口 (POST /api/v1/auth)
- `/register` - 用户注册
- `/login` - 用户登录
- `/me` - 获取当前用户信息

#### 用户管理 (GET/PUT /api/v1/users)
- `/` - 获取用户列表/更新用户信息
- `/{user_id}` - 获取用户详情

#### 股票管理 (GET/POST /api/v1/stocks)
- `/` - 获取股票列表/创建股票
- `/{stock_id}` - 获取股票详情

#### 用户自选股 (GET/POST/DELETE /api/v1/user-stocks)
- `/` - 获取自选股列表/添加自选股
- `/{user_stock_id}` - 删除自选股

#### 投资笔记 (GET/POST/PUT/DELETE /api/v1/investment-notes)
- `/` - 获取笔记列表/创建笔记
- `/{note_id}` - 获取笔记详情/更新笔记/删除笔记

#### 文件管理 (GET/POST/DELETE /api/v1/upload-files)
- `/` - 获取文件列表/上传文件
- `/{file_id}` - 获取文件详情/删除文件
- `/download/{file_id}` - 下载文件

#### 分析规则 (GET/POST/PUT/DELETE /api/v1/analysis-rules)
- `/` - 获取规则列表/创建规则
- `/{rule_id}` - 获取规则详情/更新规则/删除规则

#### 分析结果 (GET /api/v1/analysis-results)
- `/` - 获取分析结果列表
- `/{result_id}` - 获取结果详情

#### 数据同步 (POST/GET /api/v1/sync)
- `/stocks` - 同步股票数据
- `/financials` - 同步财务数据
- `/status` - 获取同步状态

## 部署说明

### 1. 生产环境配置

生产环境需要配置以下环境变量：
- 使用 PostgreSQL 而非 SQLite
- 配置强密码的 SECRET_KEY
- 设置 DEBUG=False
- 配置 InfluxDB 和 MinIO（如需要）
- 配置 Redis 缓存（如需要）

### 2. 启动服务

```bash
# 后端
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 前端
cd frontend
pnpm build
# 使用 nginx 或其他 Web 服务器部署 build 目录
```

## 安全注意事项

1. 永远不要将 `.env` 文件提交到版本控制系统
2. 生产环境必须使用 HTTPS
3. 设置强密码的 SECRET_KEY
4. 定期更新依赖包
5. 限制文件上传大小和类型
6. 配置 CORS 策略，限制允许的来源

## 许可证

MIT License
