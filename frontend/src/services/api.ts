import axios from 'axios';
import { User, Stock, UserStock, InvestmentNote, UploadedFile, AnalysisRule, SyncRequest, SyncResult, SyncStatus, LoginRequest, LoginResponse, AnalysisResult } from '../types';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

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
    api.post('/token', new URLSearchParams({
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
  getStocks: (params: { skip?: number; limit?: number } = {}): Promise<{ data: Stock[] }> => 
    api.get('/stocks', { params }),
  
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
  getUserStocks: (params: { skip?: number; limit?: number } = {}): Promise<{ data: UserStock[] }> => 
    api.get('/user-stocks', { params }),
  
  createUserStock: (data: { stock_id: number }): Promise<{ data: UserStock }> => 
    api.post('/user-stocks', data),
  
  deleteUserStock: (id: number): Promise<void> => 
    api.delete(`/user-stocks/${id}`),
};

// 投资笔记相关API
export const investmentNoteAPI = {
  getInvestmentNotes: (params: { skip?: number; limit?: number } = {}): Promise<{ data: InvestmentNote[] }> => 
    api.get('/investment-notes', { params }),
  
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
  
  uploadFile: (data: FormData): Promise<{ data: UploadedFile }> => 
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
  
  getSyncStatus: (): Promise<{ data: SyncStatus }> => 
    api.get('/sync/status'),
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
};

export default apiServices;
