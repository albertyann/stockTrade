# 股票深度分析系统

## 项目概述

股票深度分析系统是一个基于前后端分离架构的股票分析平台，提供股票数据同步、分析规则引擎、投资笔记管理等功能。

## 技术栈

### 后端
- **框架**: FastAPI
- **数据库**: PostgreSQL
- **缓存**: Redis
- **对象存储**: MinIO/AWS S3
- **时序数据库**: InfluxDB/TDengine
- **定时任务**: APScheduler
- **第三方API**: Alpha Vantage
- **认证**: JWT

### 前端
- **框架**: React + TypeScript
- **UI组件**: Ant Design
- **图表库**: ECharts
- **状态管理**: Context API
- **网络请求**: Axios

## 安装与启动

### 1. 环境准备

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
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

# 创建数据库表
python -m app.main --create-tables

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 前端安装

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
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
│   ├── main.py              # 主应用
│   ├── config.py            # 配置文件
│   ├── database.py          # 数据库连接
│   ├── models.py            # 数据库模型
│   ├── schemas.py           # Pydantic模式
│   ├── crud.py              # 数据库操作
│   ├── dependencies.py      # 依赖注入
│   └── services/            # 业务服务
│       ├── alpha_vantage_api.py    # Alpha Vantage API集成
│       ├── data_sync_service.py    # 数据同步服务
│       ├── data_sync_scheduler.py  # 定时同步任务
│       └── rule_engine_service.py  # 规则引擎服务
├── requirements.txt         # 项目依赖
└── .env                     # 环境变量配置
```

### 前端结构
```
frontend/
├── src/
│   ├── components/          # 公共组件
│   ├── pages/               # 页面组件
│   ├── services/            # API服务
│   ├── types/               # 类型定义
│   └── index.tsx            # 应用入口
├── public/                  # 静态资源
├── package.json             # 项目配置
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

### 1. 数据库迁移

```bash
# 创建迁移文件
alembic revision --autogenerate -m "迁移说明"

# 执行迁移
alembic upgrade head
```

### 2. 定时任务

定时任务使用APScheduler实现，主要同步任务如下：
- 每日收盘后同步股票数据
- 每周同步财务数据

### 3. 规则引擎

规则引擎支持以下指标：
- 价格
- 成交量
- 20日均线
- PE值
- ROE值
- EPS值
- 股息收益率

## 部署说明

### 1. Docker部署

```bash
# 构建Docker镜像
docker build -t stock-analysis-system .

# 启动容器
docker run -d -p 8000:8000 --name stock-analysis-system stock-analysis-system
```

### 2. Kubernetes部署

```bash
# 部署后端
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 部署前端
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 部署数据库
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# 部署Redis
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系：
- 邮箱: support@example.com
- 文档: https://example.com/docs
