import React from 'react';
import { StrategySignal } from '../../../types';

interface StrategySignalsTabProps {
  signals: StrategySignal[];
  signalsLoading: boolean;
}

const StrategySignalsTab: React.FC<StrategySignalsTabProps> = ({ signals, signalsLoading }) => {
  return (
    <div className="space-y-6">
      {signalsLoading ? (
        <div className="card p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
              <svg className="animate-spin h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">加载中...</h3>
            <p className="text-slate-500">正在获取交易信号数据</p>
          </div>
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无交易信号，请执行策略后查看
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  股票代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  信号类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  价格
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  信心度
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  已执行
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {signals.map((signal) => (
                <tr key={signal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    {new Date(signal.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    {signal.ts_code || '-'}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap font-semibold ${signal.signal_type === 'BUY' ? 'text-success-600' : 'text-danger-600'}`}>
                    {signal.signal_type === 'BUY' ? '买入' : '卖出'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    ¥{signal.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    {(signal.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {signal.executed ? (
                      <span className="text-success-600">是</span>
                    ) : (
                      <span className="text-gray-400">否</span>
                    )}
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

export default StrategySignalsTab;
