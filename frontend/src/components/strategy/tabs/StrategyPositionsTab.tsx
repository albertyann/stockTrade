import React from 'react';
import { StrategyPosition } from '../../../types';

interface StrategyPositionsTabProps {
  positions: StrategyPosition[];
  positionsLoading: boolean;
}

const StrategyPositionsTab: React.FC<StrategyPositionsTabProps> = ({ positions, positionsLoading }) => {
  return (
    <div className="card p-6">
      {positionsLoading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无持仓</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  股票代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  持仓数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  成本价
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  当前价
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  市值
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  浮动盈亏
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  浮动盈亏率
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    {position.ts_code || '-'}
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
                  <td className={`px-4 py-4 whitespace-nowrap font-semibold ${position.unrealized_pnl_ratio >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {position.unrealized_pnl_ratio >= 0 ? '+' : ''}{(position.unrealized_pnl_ratio * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StrategyPositionsTab;
