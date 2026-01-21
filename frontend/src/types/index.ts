// 通用类型定义

// 用户信息类型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// 股票信息类型
export interface Stock {
  id: number;
  ts_code?: string;
  symbol?: string;
  name: string;
  area?: string;
  industry?: string;
  fullname?: string;
  enname?: string;
  cnspell?: string;
  market?: string;
  exchange?: string;
  curr_type?: string;
  list_status?: string;
  list_date?: string;
  delist_date?: string;
  is_hs?: string;
  act_name?: string;
  act_ent_type?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  price?: number;
  change?: number;
  code?: string;
}

// 用户自选股类型
export interface UserStock {
  id: number;
  user_id: number;
  stock_id: number;
  created_at: string;
  stock: Stock;
}

// 投资笔记类型
export interface InvestmentNote {
  id: number;
  user_id: number;
  stock_id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// 上传文件类型
export interface UploadedFile {
  id: number;
  user_id: number;
  stock_id: number;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// 分析规则类型
export interface AnalysisRule {
  id: number;
  user_id: number;
  name: string;
  description: string;
  conditions: any;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 分析结果类型
export interface AnalysisResult {
  id: number;
  rule_id: number;
  stock_id: number;
  timestamp: string;
  data: any;
  matched: boolean;
}

// 数据同步请求类型
export interface SyncRequest {
  stock_codes?: string[];
  sync_type: 'stock' | 'financial' | 'all';
}

// 数据同步结果类型
export interface SyncResult {
  success: boolean;
  message: string;
  synced_count: number;
  failed_count: number;
  failures?: string[];
}

// 数据同步状态类型
export interface SyncStatus {
  last_sync_time?: string;
  next_sync_time?: string;
  syncing: boolean;
  status: string;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应类型
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// 股票数据类型
export interface StockData {
  price: number;
  volume: number;
  ma20: number;
  pe: number;
  roe: number;
  eps: number;
  dividend_yield: number;
}

// 财务数据类型
export interface FinancialData {
  income_statement: any;
  balance_sheet: any;
  cash_flow: any;
}

// 分析条件类型
export interface AnalysisCondition {
  indicator: string;
  operator: string;
  value: number;
}

// 分析规则条件类型
export interface RuleConditions {
  conditions: AnalysisCondition[];
  logic: 'AND' | 'OR';
}

// 分析任务类型
export interface AnalysisTask {
  id: number;
  user_id: number;
  task_name: string;
  ai_provider: string;
  ai_generated_script?: string;
  ai_reasoning?: string;
  execution_log?: any;
  matched_stock_ids?: number[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

// 系统设置类型
export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  value_type: 'string' | 'integer' | 'boolean' | 'json';
  description?: string;
  category: 'ai' | 'scheduler' | 'system';
  is_encrypted: boolean;
  created_at: string;
  updated_at?: string;
}

// AI 设置类型
export interface AISettings {
  provider: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  timeout: number;
}

// 调度器设置类型
export interface SchedulerSettings {
  enabled: boolean;
  max_workers: number;
  task_timeout: number;
}

// 同步接口类型
export interface SyncInterface {
  id: number;
  interface_name: string;
  description?: string;
  interface_params: Record<string, any>;
  data_model?: string;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

// 同步任务类型
export interface SyncTask {
  id: number;
  task_name: string;
  interface_id: number;
  interface?: SyncInterface;
  schedule_type: 'cron' | 'interval' | 'date';
  schedule_config: Record<string, any>;
  task_params: Record<string, any>;
  retry_policy: Record<string, any>;
  status: 'active' | 'paused' | 'error';
  last_run_at?: string;
  next_run_at?: string;
  last_run_status?: string;
  last_error_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface SyncExecutionLog {
  id: number;
  task_id: number;
  execution_type: 'manual' | 'scheduled' | 'retry';
  started_at: string;
  finished_at?: string;
  status: string;
  records_processed: number;
  error_message?: string;
  output_summary: Record<string, any>;
  created_at: string;
}

export interface IndexDaily {
  ts_code: string;
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  pre_close: number;
  change: number;
  pct_chg: number;
  vol: number;
  amount: number;
  name?: string;
}
