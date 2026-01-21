import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { stockAPI, syncAPI, userStockAPI } from '../services/api';
import { Stock } from '../types';

const StockList: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncIndexLoading, setSyncIndexLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchStocks = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await stockAPI.getStocks({ skip, limit: pageSize, search: searchText });
      setStocks(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('获取股票列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchText, currentPage]);

  useEffect(() => {
    fetchStocks(currentPage);
  }, [currentPage, pageSize, searchText, fetchStocks]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStocks(1);
  };

  const handleSyncAllStocks = async () => {
    setSyncLoading(true);
    try {
      const response = await syncAPI.syncAllStocks({ list_status: 'L' });
      if (response.data.success) {
        message.success(response.data.message);
        fetchStocks();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('同步股票数据失败');
      console.error('同步失败:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncIndexBasic = async () => {
    setSyncIndexLoading(true);
    try {
      const response = await syncAPI.syncIndexBasic();
      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('同步指数基础数据失败');
      console.error('同步失败:', error);
    } finally {
      setSyncIndexLoading(false);
    }
  };

  const handleAddToWatchlist = async (stockId: number) => {
    try {
      await userStockAPI.createUserStock({ stock_id: stockId });
      message.success('已添加到自选股');
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.detail) {
        message.error(error.response.data.detail === 'Stock already in user\'s portfolio' ? '该股票已在自选股中' : error.response.data.detail);
      } else {
        message.error('添加自选股失败');
      }
      console.error('添加失败:', error);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchStocks(page);
    }
  };

  const totalStocks = stocks.length;
  const upStocks = stocks.filter(s => s.change && s.change > 0).length;
  const downStocks = stocks.filter(s => s.change && s.change < 0).length;
  const flatStocks = stocks.filter(s => !s.change || s.change === 0).length;

  return (
    <div>
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalStocks}</div>
            <div className="text-sm text-gray-500">股票总数</div>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-3xl font-bold text-success-600 mb-1">{upStocks}</div>
            <div className="text-sm text-gray-600">今日上涨</div>
          </div>
          <div className="text-center p-4 bg-danger-50 rounded-lg">
            <div className="text-3xl font-bold text-danger-600 mb-1">{downStocks}</div>
            <div className="text-sm text-gray-600">今日下跌</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600 mb-1">{flatStocks}</div>
            <div className="text-sm text-gray-500">平盘</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索股票代码或名称"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>
          <button
            onClick={() => fetchStocks(currentPage)}
            disabled={loading}
            className="btn-secondary px-6 py-2.5 flex items-center justify-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
          <button
            onClick={handleSyncAllStocks}
            disabled={syncLoading}
            className="btn-primary px-6 py-2.5 flex items-center justify-center gap-2"
          >
            <svg className={`w-5 h-5 ${syncLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {syncLoading ? '同步中...' : '同步所有股票'}
          </button>
          <button
            onClick={handleSyncIndexBasic}
            disabled={syncIndexLoading}
            className="btn-primary px-6 py-2.5 flex items-center justify-center gap-2"
          >
            <svg className={`w-5 h-5 ${syncIndexLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncIndexLoading ? '同步中...' : '同步指数'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  股票代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  股票名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  市场
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  行业
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  涨跌幅
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    暂无股票数据
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => {
                  const code = stock.code || stock.ts_code || stock.symbol || '-';
                  return (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{code}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                        {stock.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                          {stock.market || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded-md">
                          {stock.industry || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                        {stock.price ? `¥${stock.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {stock.change !== undefined ? (
                          <span className={`font-semibold ${
                            stock.change >= 0 ? 'text-success-600' : 'text-danger-600'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddToWatchlist(stock.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-warning-600 hover:text-warning-700 hover:bg-warning-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate(`/stocks/${stock.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {stocks.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>共 {total} 条，第 {currentPage} / {totalPages} 页</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-3 py-1.5">{currentPage} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockList;
