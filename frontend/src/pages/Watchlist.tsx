import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStockAPI } from '../services/api';
import { UserStock } from '../types';

const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchUserStocks = async () => {
    setLoading(true);
    try {
      const response = await userStockAPI.getUserStocks();
      setUserStocks(response.data);
    } catch (error) {
      console.error('获取自选股失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStocks();
  }, []);

  const handleAddStock = () => {
    navigate('/stocks');
  };

  const handleRemoveStock = async (id: number) => {
    try {
      await userStockAPI.deleteUserStock(id);
      fetchUserStocks();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div>
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleAddStock}
            className="btn-primary px-4 py-2.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加自选股
          </button>
          <button
            onClick={fetchUserStocks}
            disabled={loading}
            className="btn-secondary px-4 py-2.5 flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            加载中...
          </div>
        ) : userStocks.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mb-3">暂无自选股</p>
            <button
              onClick={() => navigate('/stocks')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              去添加
            </button>
          </div>
        ) : (
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
                    添加时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userStocks.map((userStock) => (
                  <tr key={userStock.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{userStock.stock.code}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {userStock.stock.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                        {userStock.stock.market}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded-md">
                        {userStock.stock.industry}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {new Date(userStock.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/stocks/${userStock.stock.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {deleteConfirm === userStock.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemoveStock(userStock.id)}
                              className="px-3 py-1.5 text-sm font-medium text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(userStock.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {userStocks.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>共 {userStocks.length} 只</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
