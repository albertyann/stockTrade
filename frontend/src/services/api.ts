import axios from 'axios';
import { User, Stock, UserStock, InvestmentNote, UploadedFile, AnalysisRule, SyncRequest, SyncResult, SyncStatus, LoginRequest, LoginResponse, AnalysisResult, AnalysisTask, AISettings, SchedulerSettings, SyncInterface, SyncTask, SyncExecutionLog, IndexDaily, StockDaily, StockIncomeStatement, StockBalanceSheet, StockCashFlow, QuantStrategy, QuantStrategyCreate, QuantStrategyUpdate, StrategyVersion, BacktestResult, StrategySignal, StrategyPerformance, StrategyPosition, Order, OrderCreate, OrderUpdate, Position, Portfolio, Transaction, BacktestRequest, ExecuteStrategyRequest, StrategyExecutionResult, PaginatedResponse } from '../types';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理认证失败
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('access_token');
      // 重定向到登录页面
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 用户相关API
export const userAPI = {
  login: (data: LoginRequest): Promise<{ data: LoginResponse }> => 
    api.post('/auth/token', new URLSearchParams({
      grant_type: 'password',
      username: data.username,
      password: data.password,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
  
  getCurrentUser: (): Promise<{ data: User }> => 
    api.get('/users/me'),
  
  updateCurrentUser: (data: Partial<User>): Promise<{ data: User }> => 
    api.put('/users/me', data),
  
  deleteCurrentUser: (): Promise<void> => 
    api.delete('/users/me'),
};

// 股票相关API
export const stockAPI = {
  getStocks: (params: { skip?: number; limit?: number; search?: string } = {}): Promise<{ data: Stock[]; total: number }> =>
    api.get('/stocks', { params }).then(res => res.data),

  getStock: (id: number): Promise<{ data: Stock }> =>
    api.get(`/stocks/${id}`),

  createStock: (data: Omit<Stock, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Stock }> =>
    api.post('/stocks', data),

  updateStock: (id: number, data: Partial<Stock>): Promise<{ data: Stock }> =>
    api.put(`/stocks/${id}`, data),

  deleteStock: (id: number): Promise<void> =>
    api.delete(`/stocks/${id}`),
};

// 用户自选股相关API
export const userStockAPI = {
  getUserStocks: (params: { skip?: number; limit?: number } = {}): Promise<{ data: UserStock[]; total: number }> => 
    api.get('/user-stocks', { params }).then(res => res.data),
  
  createUserStock: (data: { stock_id: number }): Promise<{ data: UserStock }> => 
    api.post('/user-stocks', data),
  
  deleteUserStock: (id: number): Promise<void> => 
    api.delete(`/user-stocks/${id}`),
};

// 投资笔记相关API
export const investmentNoteAPI = {
  getInvestmentNotes: (params: { skip?: number; limit?: number } = {}): Promise<{ data: InvestmentNote[]; total: number }> => 
    api.get('/investment-notes', { params }).then(res => res.data),
  
  getInvestmentNote: (id: number): Promise<{ data: InvestmentNote }> => 
    api.get(`/investment-notes/${id}`),
  
  createInvestmentNote: (data: Omit<InvestmentNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data: InvestmentNote }> => 
    api.post('/investment-notes', data),
  
  updateInvestmentNote: (id: number, data: Partial<InvestmentNote>): Promise<{ data: InvestmentNote }> => 
    api.put(`/investment-notes/${id}`, data),
  
  deleteInvestmentNote: (id: number): Promise<void> => 
    api.delete(`/investment-notes/${id}`),
};

// 文件上传相关API
export const fileAPI = {
  getUploadedFiles: (params: { skip?: number; limit?: number } = {}): Promise<{ data: UploadedFile[] }> => 
    api.get('/upload-files', { params }),
  
  getUploadedFile: (id: number): Promise<{ data: UploadedFile }> => 
    api.get(`/upload-files/${id}`),
  
  uploadFile: (data: FormData): Promise<{ data: UploadedFile[] }> =>
    api.post('/upload-files', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  updateUploadedFile: (id: number, data: Partial<UploadedFile>): Promise<{ data: UploadedFile }> => 
    api.put(`/upload-files/${id}`, data),
  
  deleteUploadedFile: (id: number): Promise<void> => 
    api.delete(`/upload-files/${id}`),
};

// 分析规则相关API
export const analysisRuleAPI = {
  getAnalysisRules: (params: { skip?: number; limit?: number } = {}): Promise<{ data: AnalysisRule[] }> => 
    api.get('/analysis-rules', { params }),
  
  getAnalysisRule: (id: number): Promise<{ data: AnalysisRule }> => 
    api.get(`/analysis-rules/${id}`),
  
  createAnalysisRule: (data: Omit<AnalysisRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data: AnalysisRule }> => 
    api.post('/analysis-rules', data),
  
  updateAnalysisRule: (id: number, data: Partial<AnalysisRule>): Promise<{ data: AnalysisRule }> => 
    api.put(`/analysis-rules/${id}`, data),
  
  deleteAnalysisRule: (id: number): Promise<void> => 
    api.delete(`/analysis-rules/${id}`),
};

// 数据同步相关API
export const syncAPI = {
  syncStockData: (data: SyncRequest): Promise<{ data: SyncResult }> =>
    api.post('/sync/stocks', data),

  syncFinancialData: (data: SyncRequest): Promise<{ data: SyncResult }> =>
    api.post('/sync/financials', data),

  syncAllStocks: (params?: { list_status?: string; market?: string }): Promise<{ data: SyncResult }> =>
    api.post('/sync/all-stocks', {}, { params }),

  getSyncStatus: (): Promise<{ data: SyncStatus }> =>
    api.get('/sync/status'),

  syncIndexBasic: (): Promise<{ data: { success: boolean; message: string } }> =>
    api.post('/sync-management/sync-index-basic'),
};

// 规则引擎相关API
export const ruleEngineAPI = {
  evaluateRules: (): Promise<{ data: { success: boolean; message: string; results: AnalysisResult[] } }> => 
    api.post('/rules/evaluate'),
};

// 分析结果相关API
export const analysisResultAPI = {
  getAnalysisResults: (params: { skip?: number; limit?: number } = {}): Promise<{ data: AnalysisResult[] }> =>
    api.get('/analysis-results', { params }),

  getAnalysisResult: (id: number): Promise<{ data: AnalysisResult }> =>
    api.get(`/analysis-results/${id}`),

  deleteAnalysisResult: (id: number): Promise<void> =>
    api.delete(`/analysis-results/${id}`),
};

// 分析任务相关API
export const analysisTaskAPI = {
  getAnalysisTasks: (params: { skip?: number; limit?: number } = {}): Promise<{ data: AnalysisTask[] }> =>
    api.get('/analysis-tasks', { params }),

  getAnalysisTask: (id: number): Promise<{ data: AnalysisTask }> =>
    api.get(`/analysis-tasks/${id}`),

  createAnalysisTask: (data: { task_name: string; rule_ids?: number[] }): Promise<{ data: AnalysisTask }> =>
    api.post('/analysis-tasks', data),

  executeAnalysisTask: (id: number): Promise<{ data: { task_id: number; status: string; message: string } }> =>
    api.post(`/analysis-tasks/${id}/execute`),

  getTaskStatus: (id: number): Promise<{ data: { status: string; started_at: string; completed_at: string; error_message: string; matched_count: number } }> =>
    api.get(`/analysis-tasks/${id}/status`),

  cancelTask: (id: number): Promise<{ data: { message: string } }> =>
    api.post(`/analysis-tasks/${id}/cancel`),
};

// 系统设置相关API
export const systemSettingAPI = {
  getSystemSettings: (params: { skip?: number; limit?: number } = {}): Promise<{ data: any[] }> =>
    api.get('/system-settings', { params }),

  getSettingsByCategory: (category: string): Promise<{ data: any[] }> =>
    api.get(`/system-settings/category/${category}`),

  getSetting: (key: string): Promise<{ data: any }> =>
    api.get(`/system-settings/${key}`),

  createSetting: (data: any): Promise<{ data: any }> =>
    api.post('/system-settings', data),

  updateSetting: (key: string, data: any): Promise<{ data: any }> =>
    api.put(`/system-settings/${key}`, data),

  deleteSetting: (key: string): Promise<void> =>
    api.delete(`/system-settings/${key}`),

  // AI 配置
  getAISettings: (): Promise<{ data: any }> =>
    api.get('/system-settings/ai/config'),

  updateAISettings: (data: AISettings): Promise<{ data: { message: string } }> =>
    api.put('/system-settings/ai/config', data),

  // 调度器配置
  getSchedulerSettings: (): Promise<{ data: SchedulerSettings }> =>
    api.get('/system-settings/scheduler/config'),

  updateSchedulerSettings: (data: SchedulerSettings): Promise<{ data: { message: string } }> =>
    api.put('/system-settings/scheduler/config', data),
};

// 同步任务管理相关API
export const syncTaskAPI = {
  // 同步接口管理
  getInterfaces: (): Promise<{ data: SyncInterface[] }> =>
    api.get('/sync-management/interfaces'),

  getInterface: (id: number): Promise<{ data: SyncInterface }> =>
    api.get(`/sync-management/interfaces/${id}`),

  createInterface: (data: { interface_name: string; description?: string; interface_params?: Record<string, any>; data_model?: string; enabled?: boolean }): Promise<{ data: SyncInterface }> =>
    api.post('/sync-management/interfaces', data),

  updateInterface: (id: number, data: Partial<SyncInterface>): Promise<{ data: SyncInterface }> =>
    api.put(`/sync-management/interfaces/${id}`, data),

  deleteInterface: (id: number): Promise<{ data: { message: string } }> =>
    api.delete(`/sync-management/interfaces/${id}`),

  // 同步任务管理
  getTasks: (status?: string): Promise<{ data: SyncTask[] }> =>
    api.get('/sync-management/tasks', { params: { status } }),

  getTask: (id: number): Promise<{ data: SyncTask }> =>
    api.get(`/sync-management/tasks/${id}`),

  createTask: (data: { task_name: string; interface_id: number; schedule_type: string; schedule_config: Record<string, any>; task_params?: Record<string, any>; retry_policy?: Record<string, any> }): Promise<{ data: SyncTask }> =>
    api.post('/sync-management/tasks', data),

  updateTask: (id: number, data: Partial<SyncTask>): Promise<{ data: SyncTask }> =>
    api.put(`/sync-management/tasks/${id}`, data),

  deleteTask: (id: number): Promise<{ data: { message: string } }> =>
    api.delete(`/sync-management/tasks/${id}`),

  pauseTask: (id: number): Promise<{ data: { message: string } }> =>
    api.post(`/sync-management/tasks/${id}/pause`),

  resumeTask: (id: number): Promise<{ data: { message: string } }> =>
    api.post(`/sync-management/tasks/${id}/resume`),

  triggerTask: (id: number): Promise<{ data: { message: string } }> =>
    api.post(`/sync-management/tasks/${id}/trigger`),

  // 执行日志
  getTaskLogs: (taskId: number, skip?: number, limit?: number): Promise<{ data: SyncExecutionLog[] }> =>
    api.get(`/sync-management/tasks/${taskId}/logs`, { params: { skip, limit } }),

  // 初始化数据
  initData: (): Promise<{ data: { message: string } }> =>
    api.post('/sync-management/init-data'),

  syncIndexBasic: (): Promise<{ data: { success: boolean; message: string } }> =>
    api.post('/sync-management/sync-index-basic'),
};

export const indexAPI = {
  getLatestIndices: (): Promise<{ data: IndexDaily[] }> =>
    api.get('/indices/latest'),

  getIndexDaily: (ts_code: string, skip?: number, limit?: number): Promise<{ data: IndexDaily[] }> =>
    api.get(`/indices/${ts_code}`, { params: { skip, limit } }),
};

export const stockDailyAPI = {
  getStockDaily: (ts_code: string, skip?: number, limit?: number): Promise<{ data: StockDaily[] }> =>
    api.get(`/stock-daily/${ts_code}`, { params: { skip, limit } }),

  getLatestStockDaily: (ts_code: string): Promise<{ data: StockDaily }> =>
    api.get(`/stock-daily/${ts_code}/latest`),

  getStockDailyByRange: (ts_code: string, start_date: string, end_date: string): Promise<{ data: StockDaily[] }> =>
    api.get(`/stock-daily/${ts_code}/range`, { params: { start_date, end_date } }),
};

export const financialAPI = {
  getIncomeStatements: (stock_id: number, skip?: number, limit?: number): Promise<{ data: StockIncomeStatement[] }> =>
    api.get(`/financials/${stock_id}/income`, { params: { skip, limit } }),

  getBalanceSheets: (stock_id: number, skip?: number, limit?: number): Promise<{ data: StockBalanceSheet[] }> =>
    api.get(`/financials/${stock_id}/balance`, { params: { skip, limit } }),

  getCashFlows: (stock_id: number, skip?: number, limit?: number): Promise<{ data: StockCashFlow[] }> =>
    api.get(`/financials/${stock_id}/cashflow`, { params: { skip, limit } }),
};

export const quantStrategyAPI = {
  getStrategies: (params: { skip?: number; limit?: number; user_id?: number; status?: string; search?: string } = {}): Promise<PaginatedResponse<QuantStrategy>> =>
    api.get('/quant-strategies/', { params }).then(res => res.data),

  getStrategy: (strategy_id: number): Promise<{ data: QuantStrategy }> =>
    api.get(`/quant-strategies/${strategy_id}`),

  createStrategy: (data: QuantStrategyCreate): Promise<{ data: QuantStrategy }> =>
    api.post('/quant-strategies/', data),

  updateStrategy: (strategy_id: number, data: QuantStrategyUpdate): Promise<{ data: QuantStrategy }> =>
    api.put(`/quant-strategies/${strategy_id}`, data),

  deleteStrategy: (strategy_id: number): Promise<void> =>
    api.delete(`/quant-strategies/${strategy_id}`),

  runBacktest: (strategy_id: number, data: BacktestRequest): Promise<{ data: { message: string; backtest_id: number } }> =>
    api.post(`/quant-strategies/${strategy_id}/backtest`, data),

  getBacktestResults: (strategy_id: number, params: { skip?: number; limit?: number } = {}): Promise<PaginatedResponse<BacktestResult>> =>
    api.get(`/quant-strategies/${strategy_id}/backtest-results`, { params }).then(res => res.data),

  getBacktestResult: (backtest_id: number): Promise<{ data: BacktestResult }> =>
    api.get(`/quant-strategies/backtest-results/${backtest_id}`),

  executeStrategy: (strategy_id: number, data: ExecuteStrategyRequest): Promise<{ data: StrategyExecutionResult }> =>
    api.post(`/quant-strategies/${strategy_id}/execute`, data),

  getStrategyVersions: (strategy_id: number, params: { skip?: number; limit?: number } = {}): Promise<PaginatedResponse<StrategyVersion>> =>
    api.get(`/quant-strategies/${strategy_id}/versions`, { params }).then(res => res.data),

  createVersion: (strategy_id: number, data: { version: string; parameters?: Record<string, any>; description?: string }): Promise<{ data: StrategyVersion }> =>
    api.post(`/quant-strategies/${strategy_id}/versions`, data),

  getStrategySignals: (strategy_id: number, params: { skip?: number; limit?: number; executed?: number } = {}): Promise<PaginatedResponse<StrategySignal>> =>
    api.get(`/quant-strategies/${strategy_id}/signals`, { params }).then(res => res.data),

  getStrategyPerformance: (strategy_id: number, params: { skip?: number; limit?: number } = {}): Promise<PaginatedResponse<StrategyPerformance>> =>
    api.get(`/quant-strategies/${strategy_id}/performance`, { params }).then(res => res.data),

  getStrategyPositions: (strategy_id: number, params: { skip?: number; limit?: number } = {}): Promise<PaginatedResponse<StrategyPosition>> =>
    api.get(`/quant-strategies/${strategy_id}/positions`, { params }).then(res => res.data),
};

export const tradingAPI = {
  getOrders: (params: { skip?: number; limit?: number; user_id?: number; strategy_id?: number; status?: string; side?: string; stock_id?: number } = {}): Promise<PaginatedResponse<Order>> =>
    api.get('/trading/orders', { params }).then(res => res.data),

  getOrder: (order_id: number): Promise<{ data: Order }> =>
    api.get(`/trading/orders/${order_id}`),

  createOrder: (data: OrderCreate): Promise<{ data: Order }> =>
    api.post('/trading/orders', data),

  updateOrder: (order_id: number, data: OrderUpdate): Promise<{ data: Order }> =>
    api.put(`/trading/orders/${order_id}`, data),

  cancelOrder: (order_id: number): Promise<{ data: { message: string } }> =>
    api.post(`/trading/orders/${order_id}/cancel`),

  getPositions: (params: { skip?: number; limit?: number; user_id?: number; strategy_id?: number; stock_id?: number } = {}): Promise<PaginatedResponse<Position>> =>
    api.get('/trading/positions', { params }).then(res => res.data),

  getPosition: (position_id: number): Promise<{ data: Position }> =>
    api.get(`/trading/positions/${position_id}`),

  closePosition: (position_id: number, data: { quantity?: number }): Promise<{ data: { message: string } }> =>
    api.post(`/trading/positions/${position_id}/close`, data),

  getPortfolios: (params: { skip?: number; limit?: number; user_id?: number; strategy_id?: number; as_of_date?: string } = {}): Promise<PaginatedResponse<Portfolio>> =>
    api.get('/trading/portfolios', { params }).then(res => res.data),

  getPortfolioSummary: (params: { user_id?: number; strategy_id?: number } = {}): Promise<{ data: any }> =>
    api.get('/trading/portfolios/summary', { params }),

  getPortfolioBreakdown: (params: { user_id?: number; strategy_id?: number } = {}): Promise<{ data: any }> =>
    api.get('/trading/portfolios/breakdown', { params }),

  getTransactions: (params: { skip?: number; limit?: number; user_id?: number; strategy_id?: number; order_id?: number; stock_id?: number; transaction_type?: string; start_date?: string; end_date?: string } = {}): Promise<PaginatedResponse<Transaction>> =>
    api.get('/trading/transactions', { params }).then(res => res.data),

  getTransaction: (transaction_id: number): Promise<{ data: Transaction }> =>
    api.get(`/trading/transactions/${transaction_id}`),

  getDashboard: (params: { user_id?: number; days?: number } = {}): Promise<{ data: any }> =>
    api.get('/trading/dashboard', { params }),
};

const apiServices = {
  user: userAPI,
  stock: stockAPI,
  userStock: userStockAPI,
  investmentNote: investmentNoteAPI,
  file: fileAPI,
  analysisRule: analysisRuleAPI,
  sync: syncAPI,
  ruleEngine: ruleEngineAPI,
  analysisResult: analysisResultAPI,
  analysisTask: analysisTaskAPI,
  systemSetting: systemSettingAPI,
  syncTask: syncTaskAPI,
  index: indexAPI,
  stockDaily: stockDailyAPI,
  financial: financialAPI,
  quantStrategy: quantStrategyAPI,
  trading: tradingAPI,
};

export default apiServices;
