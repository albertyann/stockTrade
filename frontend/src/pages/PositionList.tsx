import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { tradingAPI } from '../services/api';
import { Position } from '../types';

const PositionList: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPositions = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await tradingAPI.getPositions({ skip, limit: pageSize });
      setPositions(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('获取持仓列表失败:', error);
      message.error('获取持仓列表失败');
    } finally {
      setLoading(false);
    }
  }, [pageSize, currentPage]);

  useEffect(() => {
    fetchPositions(currentPage);
  }, [currentPage, pageSize, fetchPositions]);

  const handleClosePosition = async (positionId: number) => {
    try {
      await tradingAPI.closePosition(positionId, {});
      message.success('平仓成功');
      fetchPositions(currentPage);
    } catch (error) {
      console.error('平仓失败:', error);
      message.error('平仓失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchPositions(page);
    }
  };

  const totalValue = positions.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalCost = positions.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);

  return (
    <div>
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">{positions.length}</div>
            <div className="text-sm text-gray-500">持仓数量</div>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-1">¥{totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">持仓市值</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${totalUnrealizedPnl >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
            <div className={`text-3xl font-bold mb-1 ${totalUnrealizedPnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}¥{totalUnrealizedPnl.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">浮动盈亏</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${totalUnrealizedPnl >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
            <div className={`text-3xl font-bold mb-1 ${totalUnrealizedPnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{((totalUnrealizedPnl / totalCost) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">总盈亏率</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">持仓明细</h3>
          <button
            onClick={() => fetchPositions(currentPage)}
            disabled={loading}
            className="btn-secondary px-6 py-2.5"
          >
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
                  持仓数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  成本价
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  当前价
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  市值
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  浮动盈亏
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  盈亏率
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  最后交易
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    暂无持仓数据
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{position.ts_code || '-'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {position.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      ¥{position.avg_cost?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      ¥{position.current_price?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      ¥{position.market_value?.toFixed(2) || '-'}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap font-semibold ${position.unrealized_pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {position.unrealized_pnl >= 0 ? '+' : ''}¥{position.unrealized_pnl.toFixed(2)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap font-semibold ${position.unrealized_pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {position.unrealized_pnl >= 0 ? '+' : ''}{(position.unrealized_pnl_ratio * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {position.last_trade_date ? new Date(position.last_trade_date).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleClosePosition(position.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        平仓
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {positions.length > 0 && (
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

export default PositionList;
