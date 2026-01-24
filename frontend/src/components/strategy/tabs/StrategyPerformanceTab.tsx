import React from 'react';
import ReactECharts from 'echarts-for-react';
import { StrategyPerformance } from '../../../types';

interface StrategyPerformanceTabProps {
  performance: StrategyPerformance[];
  performanceLoading: boolean;
  getPerformanceChartOption: () => any;
}

const StrategyPerformanceTab: React.FC<StrategyPerformanceTabProps> = ({
  performance,
  performanceLoading,
  getPerformanceChartOption,
}) => {
  return (
    <div className="card p-6">
      {performanceLoading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : performance.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无表现数据</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    累计收益
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    年化收益
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    最大回撤
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    夏普比率
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    胜率
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    交易次数
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performance.map((perf) => (
                  <tr key={perf.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {new Date(perf.as_of_date).toLocaleDateString('zh-CN')}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap font-semibold ${perf.total_return >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {perf.total_return >= 0 ? '+' : ''}{(perf.total_return * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {perf.annualized_return ? `${(perf.annualized_return * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap font-semibold ${perf.max_drawdown < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      {perf.max_drawdown ? `${(perf.max_drawdown * 100).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {perf.sharpe_ratio ? perf.sharpe_ratio.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {(perf.win_rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {perf.total_trades}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <ReactECharts option={getPerformanceChartOption()} style={{ height: '400px' }} />
          </div>
        </>
      )}
    </div>
  );
};

export default StrategyPerformanceTab;
