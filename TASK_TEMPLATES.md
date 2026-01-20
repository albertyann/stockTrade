# Tushare 同步任务示例模板

本文件提供了常见同步任务的配置示例，可作为参考创建新任务。

## 示例任务

### 1. 每日收盘后同步所有股票日线数据

```json
{
  "task_name": "每日收盘后同步日线数据",
  "interface_id": 1,
  "schedule_type": "cron",
  "schedule_config": {
    "hour": 15,
    "minute": 30,
    "day_of_week": "mon-fri"
  },
  "task_params": {},
  "retry_policy": {
    "max_retries": 3,
    "backoff_factor": 2
  }
}
```

### 2. 每小时同步资金流向数据

```json
{
  "task_name": "每小时同步资金流向",
  "interface_id": 3,
  "schedule_type": "interval",
  "schedule_config": {
    "hours": 1
  },
  "task_params": {},
  "retry_policy": {
    "max_retries": 3,
    "backoff_factor": 2
  }
}
```

### 3. 每周同步每日指标数据

```json
{
  "task_name": "每周同步每日指标",
  "interface_id": 2,
  "schedule_type": "interval",
  "schedule_config": {
    "weeks": 1
  },
  "task_params": {},
  "retry_policy": {
    "max_retries": 5,
    "backoff_factor": 2
  }
}
```

### 4. 每日同步特定股票的日线数据

```json
{
  "task_name": "同步000001.SZ日线数据",
  "interface_id": 1,
  "schedule_type": "cron",
  "schedule_config": {
    "hour": 15,
    "minute": 30,
    "day_of_week": "mon-fri"
  },
  "task_params": {
    "ts_code": "000001.SZ",
    "start_date": "20250101"
  },
  "retry_policy": {
    "max_retries": 3,
    "backoff_factor": 2
  }
}
```

### 5. 定时一次性同步任务

```json
{
  "task_name": "一次性历史数据补全",
  "interface_id": 1,
  "schedule_type": "date",
  "schedule_config": {
    "run_date": "2025-01-20T16:00:00"
  },
  "task_params": {
    "ts_code": "000001.SZ",
    "start_date": "20240101",
    "end_date": "20250101"
  },
  "retry_policy": {
    "max_retries": 3,
    "backoff_factor": 2
  }
}
```

## 调度类型说明

### Cron 表达式

支持 cron 风格的调度，配置字段：
- `second`: 秒 (0-59)
- `minute`: 分钟 (0-59)
- `hour`: 小时 (0-23)
- `day`: 日期 (1-31)
- `month`: 月份 (1-12)
- `day_of_week`: 星期 (0-6 或 mon-sun)
- `year`: 年份

常见示例：
- 每天下午3点30分: `{"hour": 15, "minute": 30}`
- 每工作日下午3点30分: `{"hour": 15, "minute": 30, "day_of_week": "mon-fri"}`
- 每周一上午9点: `{"hour": 9, "day_of_week": "mon"}`

### Interval 间隔调度

按时间间隔执行任务，配置字段：
- `weeks`: 周数
- `days`: 天数
- `hours`: 小时数
- `minutes`: 分钟数
- `seconds`: 秒数

常见示例：
- 每1小时: `{"hours": 1}`
- 每30分钟: `{"minutes": 30}`
- 每1天: `{"days": 1}`
- 每1周: `{"weeks": 1}`

### Date 日期调度

在指定日期执行一次任务，配置字段：
- `run_date`: 运行日期时间 (ISO 8601 格式)

示例：
- 在指定时间执行: `{"run_date": "2025-01-20T16:00:00"}`

## API 使用方法

### 创建任务

```bash
curl -X POST "http://localhost:8000/api/v1/sync-management/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "每日收盘后同步日线数据",
    "interface_id": 1,
    "schedule_type": "cron",
    "schedule_config": {
      "hour": 15,
      "minute": 30,
      "day_of_week": "mon-fri"
    }
  }'
```

### 查看任务列表

```bash
curl "http://localhost:8000/api/v1/sync-management/tasks"
```

### 暂停任务

```bash
curl -X POST "http://localhost:8000/api/v1/sync-management/tasks/1/pause"
```

### 恢复任务

```bash
curl -X POST "http://localhost:8000/api/v1/sync-management/tasks/1/resume"
```

### 手动触发任务

```bash
curl -X POST "http://localhost:8000/api/v1/sync-management/tasks/1/trigger"
```

### 查看执行日志

```bash
curl "http://localhost:8000/api/v1/sync-management/tasks/1/logs?skip=0&limit=10"
```

### 查看可用接口

```bash
curl "http://localhost:8000/api/v1/sync-management/interfaces"
```

## 接口ID映射

初始化脚本会自动创建以下接口：

| ID | 接口名称 | 描述 | 数据表 |
|----|---------|------|--------|
| 1  | daily     | 日线行情数据 | StockDaily |
| 2  | daily_basic | 每日指标 | StockDailyBasic |
| 3  | moneyflow | 资金流向 | StockMoneyflow |
| 4  | moneyflow_hsgt | 沪深港通资金流向 | - |
| 5  | top_list  | 龙虎榜 | - |

## 初始化步骤

1. 启动应用后，新表会自动创建
2. 运行初始化脚本：

```bash
cd backend
python script/init_sync_interfaces.py
```

3. 访问 API 文档查看所有可用的端点：http://localhost:8000/docs

## 注意事项

1. **API Token**: 确保在 `.env` 文件中配置了正确的 `TUSHARE_API_TOKEN`
2. **任务状态**: 只有 `status=active` 的任务会按计划执行
3. **接口启用**: 只有 `enabled=true` 的接口可以用于创建任务
4. **数据存储**: 不同接口的数据会保存到对应的数据表中
5. **时区**: 默认使用 `Asia/Shanghai` 时区，可根据需要调整
