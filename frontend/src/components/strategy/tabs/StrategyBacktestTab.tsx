import React from 'react';
import ReactECharts from 'echarts-for-react';
import { BacktestResult } from '../../../types';

interface BacktestForm {
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_rate: number;
  slippage: number;
}

interface StrategyBacktestTabProps {
  backtestForm: BacktestForm;
  setBacktestForm: React.Dispatch<React.SetStateAction<BacktestForm>>;
  backtestLoading: boolean;
  backtestResults: BacktestResult[];
  onRunBacktest: () => void;
  getEquityCurveOption: () => any;
}

const StrategyBacktestTab: React.FC<StrategyBacktestTabProps> = ({
  backtestForm,
  setBacktestForm,
  backtestLoading,
  backtestResults,
  onRunBacktest,
  getEquityCurveOption,
}) => {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">新建回测</h3>
            <p className="text-sm text-slate-500">配置回测参数并运行策略回测</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={backtestForm.start_date}
                onChange={(e) => setBacktestForm({ ...backtestForm, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={backtestForm.end_date}
                onChange={(e) => setBacktestForm({ ...backtestForm, end_date: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">初始资金</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">¥</span>
                <input
                  type="number"
                  value={backtestForm.initial_capital}
                  onChange={(e) => setBacktestForm({ ...backtestForm, initial_capital: parseFloat(e.target.value) })}
                  className="input pl-8"
                  min="1000"
                  step="1000"
                />
              </div>
            </div>
            <div>
              <label className="label">手续费率</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={backtestForm.commission_rate}
                  onChange={(e) => setBacktestForm({ ...backtestForm, commission_rate: parseFloat(e.target.value) })}
                  className="input pr-8"
                  min="0"
                  max="0.1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onRunBacktest}
            disabled={backtestLoading}
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            {backtestLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                运行中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                运行回测
              </>
            )}
          </button>
        </div>
      </div>

      {backtestResults.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">回测结果</h3>
              <p className="text-sm text-slate-500">历史回测记录和表现指标</p>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>开始日期</th>
                  <th>结束日期</th>
                  <th>总收益</th>
                  <th>年化收益</th>
                  <th>最大回撤</th>
                  <th>夏普比率</th>
                  <th>胜率</th>
                  <th>交易次数</th>
                </tr>
              </thead>
              <tbody>
                {backtestResults.map((result) => (
                  <tr key={result.id}>
                    <td className="font-medium text-slate-900">
                      {new Date(result.start_date).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="text-slate-700">
                      {new Date(result.end_date).toLocaleDateString('zh-CN')}
                    </td>
                    <td>
                      <div className={`font-semibold ${result.total_return >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {result.total_return >= 0 ? '+' : ''}{(result.total_return * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td>
                      <div className={`font-semibold ${result.annualized_return >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {result.annualized_return >= 0 ? '+' : ''}{(result.annualized_return * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td>
                      <div className={`font-semibold ${result.max_drawdown < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                        {(result.max_drawdown * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td className="font-medium text-slate-900">
                      {result.sharpe_ratio.toFixed(2)}
                    </td>
                    <td className="text-slate-700">
                      {(result.win_rate * 100).toFixed(1)}%
                    </td>
                    <td className="text-slate-700">
                      {result.total_trades}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {backtestResults[0] && (
            <div className="mt-8">
              <div className="mb-4">
                <h4 className="font-semibold text-slate-900">资金曲线</h4>
                <p className="text-sm text-slate-500">策略资金随时间变化情况</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <ReactECharts option={getEquityCurveOption()} style={{ height: '400px' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StrategyBacktestTab;
