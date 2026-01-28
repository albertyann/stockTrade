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

export interface StockDaily {
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
  created_at: string;
}

export interface StockIncomeStatement {
  id: number;
  stock_id: number;
  ts_code: string;
  fiscal_date_ending: string;
  reported_currency: string;
  total_revenue: number;
  cost_of_revenue: number;
  gross_profit: number;
  total_operating_expenses: number;
  operating_income: number;
  interest_expense: number;
  income_before_tax: number;
  income_tax_expense: number;
  net_income: number;
  ebit: number;
  ebitda: number;
  net_income_from_continuing_operations: number;
  comprehensive_income_net_of_tax: number;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export interface StockBalanceSheet {
  id: number;
  stock_id: number;
  ts_code: string;
  fiscal_date_ending: string;
  reported_currency: string;
  total_assets: number;
  total_current_assets: number;
  cash_and_cash_equivalents_at_carrying_value: number;
  cash_and_short_term_investments: number;
  total_non_current_assets: number;
  property_plant_equipment: number;
  total_liabilities: number;
  total_current_liabilities: number;
  current_long_term_debt: number;
  long_term_debt: number;
  total_non_current_liabilities: number;
  total_shareholder_equity: number;
  treasury_stock: number;
  retained_earnings: number;
  common_shares_outstanding: number;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export interface StockCashFlow {
  id: number;
  stock_id: number;
  ts_code: string;
  fiscal_date_ending: string;
  reported_currency: string;
  operating_cashflow: number;
  payments_for_operating_activities: number;
  proceeds_from_operating_activities: number;
  depreciation_amortization: number;
  stock_based_compensation: number;
  operating_cashflow_continuing: number;
  capital_expenditures: number;
  capital_expenditure_for_property_plant_equipment: number;
  proceeds_from_sale_of_property_plant_equipment: number;
  investment_purchase_and_sale: number;
  sale_purchase_of_investment: number;
  net_borrowings: number;
  other_financing_activities: number;
  cash_flow_from_financing: number;
  dividends_paid: number;
  free_cash_flow: number;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export enum StrategyType {
  MA_CROSS = 'MA_CROSS',
  RSI_OVERSOLD = 'RSI_OVERSOLD',
  BOLLINGER_BAND = 'BOLLINGER_BAND',
  CUSTOM = 'CUSTOM'
}

export enum StrategyFrequency {
  MIN_5 = 'MIN_5',
  MIN_15 = 'MIN_15',
  MIN_30 = 'MIN_30',
  HOUR_1 = 'HOUR_1',
  DAY_1 = 'DAY_1',
  WEEK_1 = 'WEEK_1'
}

export enum StrategyStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ARCHIVED = 'ARCHIVED'
}

export interface QuantStrategy {
  id: number;
  user_id: number;
  strategy_code: string;
  name: string;
  description?: string;
  strategy_type: StrategyType;
  frequency: StrategyFrequency;
  parameters?: Record<string, any>;
  status: StrategyStatus;
  is_active: number;
  max_position_value?: number;
  max_single_stock_ratio?: number;
  stop_loss_ratio?: number;
  take_profit_ratio?: number;
  strategy_script?: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  versions?: StrategyVersion[];
  signals?: StrategySignal[];
  positions?: StrategyPosition[];
}

export interface StrategyVersion {
  id: number;
  strategy_id: number;
  version: string;
  parameters?: Record<string, any>;
  description?: string;
  created_at: string;
  strategy?: QuantStrategy;
  backtest_results?: BacktestResult[];
}

export interface BacktestResult {
  id: number;
  strategy_id: number;
  version_id?: number;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
  profit_trades: number;
  loss_trades: number;
  equity_curve?: string;
  trade_details?: string;
  created_at: string;
  strategy?: QuantStrategy;
  version?: StrategyVersion;
}

export interface StrategySignal {
  id: number;
  strategy_id: number;
  stock_id: number;
  ts_code?: string;
  signal_type: 'BUY' | 'SELL';
  direction: 'LONG' | 'SHORT';
  strength: number;
  confidence: number;
  price: number;
  suggested_quantity?: number;
  executed: number;
  executed_at?: string;
  created_at: string;
  strategy?: QuantStrategy;
}

export interface StrategyPerformance {
  id: number;
  strategy_id: number;
  as_of_date: string;
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  volatility?: number;
  win_rate: number;
  profit_factor: number;
  avg_return_per_trade: number;
  total_trades: number;
  active_positions: number;
  created_at: string;
  strategy?: QuantStrategy;
}

export interface StrategyPosition {
  id: number;
  strategy_id: number;
  stock_id: number;
  ts_code?: string;
  quantity: number;
  avg_cost: number;
  total_cost: number;
  current_price?: number;
  current_value?: number;
  market_value?: number;
  realized_pnl: number;
  unrealized_pnl: number;
  unrealized_pnl_ratio: number;
  open_quantity?: number;
  closed_quantity?: number;
  last_trade_date?: string;
  created_at: string;
  updated_at?: string;
  strategy?: QuantStrategy;
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  PARTIAL_FILLED = 'PARTIAL_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface Order {
  id: number;
  order_code: string;
  user_id: number;
  strategy_id?: number;
  stock_id: number;
  ts_code?: string;
  order_type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  quantity: number;
  filled_quantity: number;
  price?: number;
  stop_price?: number;
  order_value?: number;
  commission?: number;
  slippage?: number;
  message?: string;
  submitted_at?: string;
  filled_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  strategy?: QuantStrategy;
  transactions?: Transaction[];
}

export interface Position {
  id: number;
  user_id: number;
  strategy_id?: number;
  stock_id: number;
  ts_code?: string;
  quantity: number;
  avg_cost?: number;
  total_cost?: number;
  current_price?: number;
  current_value?: number;
  market_value?: number;
  realized_pnl: number;
  unrealized_pnl: number;
  unrealized_pnl_ratio: number;
  open_quantity?: number;
  closed_quantity?: number;
  last_trade_date?: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  strategy?: QuantStrategy;
}

export interface Portfolio {
  id: number;
  user_id: number;
  strategy_id?: number;
  initial_capital: number;
  current_capital?: number;
  total_value?: number;
  cash_balance?: number;
  position_value?: number;
  total_pnl: number;
  total_pnl_ratio: number;
  daily_return?: number;
  daily_pnl?: number;
  risk_exposure?: number;
  leverage: number;
  as_of_date: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  strategy?: QuantStrategy;
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  DIVIDEND = 'DIVIDEND',
  COMMISSION = 'COMMISSION',
  FEE = 'FEE'
}

export interface Transaction {
  id: number;
  transaction_code: string;
  user_id: number;
  strategy_id?: number;
  order_id?: number;
  stock_id?: number;
  ts_code?: string;
  transaction_type: TransactionType;
  side?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  commission: number;
  tax: number;
  slippage: number;
  before_balance?: number;
  after_balance?: number;
  transaction_date: string;
  settlement_date?: string;
  notes?: string;
  created_at: string;
  user?: User;
  strategy?: QuantStrategy;
  order?: Order;
}

export interface QuantStrategyCreate {
  strategy_code: string;
  name: string;
  description?: string;
  strategy_type: StrategyType;
  frequency?: StrategyFrequency;
  parameters?: Record<string, any>;
  status?: StrategyStatus;
  is_active?: number;
  max_position_value?: number;
  max_single_stock_ratio?: number;
  stop_loss_ratio?: number;
  take_profit_ratio?: number;
  strategy_script?: string;
}

export interface QuantStrategyUpdate {
  name?: string;
  description?: string;
  frequency?: StrategyFrequency;
  parameters?: Record<string, any>;
  status?: StrategyStatus;
  is_active?: number;
  max_position_value?: number;
  max_single_stock_ratio?: number;
  stop_loss_ratio?: number;
  take_profit_ratio?: number;
  strategy_script?: string;
}

export interface OrderCreate {
  order_code: string;
  stock_id: number;
  ts_code?: string;
  order_type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stop_price?: number;
  strategy_id?: number;
}

export interface OrderUpdate {
  status?: OrderStatus;
  filled_quantity?: number;
  price?: number;
  stop_price?: number;
  message?: string;
}

export interface BacktestRequest {
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_rate?: number;
  slippage?: number;
}

export interface ExecuteStrategyRequest {
  dry_run: boolean;
}

export interface StrategyExecutionResult {
  strategy_id: number;
  strategy_name: string;
  signals_generated: number;
  orders_created: number;
  dry_run: boolean;
  signals: any[];
  orders: Order[];
}

// 最强板块统计类型
export interface LimitConceptSector {
  ts_code: string;
  name: string;
  trade_date: string;
  days: number;
  up_stat: string;
  cons_nums: number;
  up_nums: string;
  pct_chg: number;
  rank: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

