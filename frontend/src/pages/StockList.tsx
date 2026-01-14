import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockAPI } from '../services/api';
import { Stock } from '../types';

const StockList: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await stockAPI.getStocks({ skip: 0, limit: 100 });
      setStocks(response.data);
    } catch (error) {
      console.error('获取股票列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
  };

  const filteredStocks = stocks.filter(stock =>
    stock.code.toLowerCase().includes(searchText.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalStocks = stocks.length;
  const upStocks = stocks.filter(s => s.change && s.change > 0).length;
  const downStocks = stocks.filter(s => s.change && s.change < 0).length;
  const flatStocks = stocks.filter(s => !s.change || s.change === 0).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">股票列表</h2>
        <p className="text-gray-500">查看和管理所有股票信息</p>
      </div>

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
            onClick={fetchStocks}
            disabled={loading}
            className="btn-secondary px-6 py-2.5 flex items-center justify-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
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
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    暂无股票数据
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{stock.code}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {stock.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                        {stock.market}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded-md">
                        {stock.industry}
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
                      <button
                        onClick={() => navigate(`/stocks/${stock.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredStocks.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>共 {filteredStocks.length} 条</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                上一页
              </button>
              <span className="px-3 py-1.5">1 / 1</span>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
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
