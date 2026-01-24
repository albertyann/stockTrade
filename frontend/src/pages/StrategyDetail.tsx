import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import { quantStrategyAPI } from '../services/api';
import { QuantStrategy, BacktestResult, StrategySignal, StrategyPerformance, StrategyPosition, StrategyType } from '../types';

// 导入子组件
import StrategyHeader from '../components/strategy/StrategyHeader';
import StrategyLoadingSkeleton from '../components/strategy/StrategyLoadingSkeleton';
import StrategyOverviewTab from '../components/strategy/tabs/StrategyOverviewTab';
import { getStrategyTypeText } from '../components/strategy/utils/strategyUtils';

const { TabPane } = Tabs;

interface BacktestForm {
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_rate: number;
  slippage: number;
}

const StrategyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [strategy, setStrategy] = useState<QuantStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [performance, setPerformance] = useState<StrategyPerformance[]>([]);
  const [positions, setPositions] = useState<StrategyPosition[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [backtestForm, setBacktestForm] = useState<BacktestForm>({
    start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    initial_capital: 100000,
    commission_rate: 0.0003,
    slippage: 0.001,
  });
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const fetchStrategy = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await quantStrategyAPI.getStrategy(parseInt(id));
      setStrategy(response.data);
    } catch (error) {
      console.error('获取策略详情失败:', error);
      message.error('获取策略详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBacktestResults = useCallback(async () => {
    if (!id) return;
    try {
      const response = await quantStrategyAPI.getBacktestResults(parseInt(id));
      setBacktestResults(response.data);
    } catch (error) {
      console.error('获取回测结果失败:', error);
    }
  }, [id]);

  const fetchSignals = useCallback(async () => {
    if (!id) return;
    setSignalsLoading(true);
    try {
      const response = await quantStrategyAPI.getStrategySignals(parseInt(id), { limit: 100 });
      setSignals(response.data);
    } catch (error) {
      console.error('获取交易信号失败:', error);
    } finally {
      setSignalsLoading(false);
    }
  }, [id]);

  const fetchPerformance = useCallback(async () => {
    if (!id) return;
    setPerformanceLoading(true);
    try {
      const response = await quantStrategyAPI.getStrategyPerformance(parseInt(id), { limit: 50 });
      setPerformance(response.data);
    } finally {
      setPerformanceLoading(false);
    }
  }, [id]);

  const fetchPositions = useCallback(async () => {
    if (!id) return;
    setPositionsLoading(true);
    try {
      const response = await quantStrategyAPI.getStrategyPositions(parseInt(id), { limit: 100 });
      setPositions(response.data);
    } catch (error) {
      console.error('获取策略持仓失败:', error);
    } finally {
      setPositionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  useEffect(() => {
    if (activeTab === 'backtest') {
      fetchBacktestResults();
    }
  }, [activeTab, fetchBacktestResults]);

  useEffect(() => {
    if (activeTab === 'signals') {
      fetchSignals();
    }
  }, [activeTab, fetchSignals]);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab, fetchPerformance]);

  useEffect(() => {
    if (activeTab === 'positions') {
      fetchPositions();
    }
  }, [activeTab, fetchPositions]);

  const handleRunBacktest = async () => {
    setBacktestLoading(true);
    try {
      await quantStrategyAPI.runBacktest(parseInt(id!), backtestForm);
      message.success('回测任务已提交');
      fetchBacktestResults();
    } catch (error) {
      console.error('运行回测失败:', error);
      message.error('运行回测失败');
    } finally {
      setBacktestLoading(false);
    }
  };

  const handleExecuteStrategy = async () => {
    try {
      const response = await quantStrategyAPI.executeStrategy(parseInt(id!), { dry_run: false });
      message.success('策略执行成功');
      
      // 显示执行结果摘要
      if (response.data) {
        const result = response.data;
        message.info(
          `策略执行完成：生成 ${result.signals_generated} 个信号，创建 ${result.orders_created} 个订单`,
          5
        );
      }
      
      // 自动切换到交易信号Tab查看结果
      setActiveTab('signals');
      fetchSignals();
      fetchPositions(); // 同时刷新持仓数据
    } catch (error) {
      console.error('执行策略失败:', error);
      message.error('执行策略失败');
    }
  };

  const getEquityCurveOption = () => {
    const latestResult = backtestResults[0];
    if (!latestResult || !latestResult.equity_curve) {
      return {};
    }

    const equityCurve = JSON.parse(latestResult.equity_curve);
    return {
      title: { text: '资金曲线' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: equityCurve.map((item: any) => item.date),
      },
      yAxis: {
        type: 'value',
        name: '资金',
      },
      series: [
        {
          name: '资金',
          type: 'line',
          data: equityCurve.map((item: any) => item.equity),
          smooth: true,
        },
      ],
    };
  };

  const getPerformanceChartOption = () => {
    return {
      title: { text: '策略表现' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['累计收益', '夏普比率'] },
      xAxis: {
        type: 'category',
        data: performance.map((p) => p.as_of_date),
      },
      yAxis: [
        {
          type: 'value',
          name: '收益 (%)',
          position: 'left',
        },
        {
          type: 'value',
          name: '夏普比率',
          position: 'right',
        },
      ],
      series: [
        {
          name: '累计收益',
          type: 'line',
          yAxisIndex: 0,
          data: performance.map((p) => (p.total_return * 100).toFixed(2)),
        },
        {
          name: '夏普比率',
          type: 'line',
          yAxisIndex: 1,
          data: performance.map((p) => p.sharpe_ratio?.toFixed(2) || 0),
        },
      ],
    };
  };

  if (loading) {
    return <StrategyLoadingSkeleton />;
  }

  if (!strategy) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        策略不存在
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {/* 使用StrategyHeader组件 */}
      <StrategyHeader strategy={strategy} onExecuteStrategy={handleExecuteStrategy} />

      {/* 标签页导航 */}
      <div className="mb-6">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="custom-tabs"
          tabBarStyle={{
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '24px'
          }}
        >
          <TabPane tab="概览" key="overview">
            {/* 使用StrategyOverviewTab组件 */}
            <StrategyOverviewTab strategy={strategy} />
          </TabPane>

          <TabPane tab="回测" key="backtest">
            <div className="space-y-6">
              {/* 新建回测表单 */}
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
                    onClick={handleRunBacktest}
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

              {/* 回测结果 */}
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
          </TabPane>

          <TabPane tab="交易信号" key="signals">
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
          </TabPane>

          <TabPane tab="策略表现" key="performance">
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
          </TabPane>

          <TabPane tab="当前持仓" key="positions">
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
          </TabPane>

          <TabPane tab="文本描述" key="description">
            <div className="card p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">策略描述</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {strategy.description || '暂无策略描述'}
                  </p>
                </div>
              </div>
              
              {strategy.parameters && Object.keys(strategy.parameters).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">策略参数</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-700">
                      {JSON.stringify(strategy.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabPane>

          <TabPane tab="策略代码" key="code">
            <div className="card p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">策略脚本</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm font-mono">
                    {strategy.strategy_script || '# 暂无策略脚本'}
                  </pre>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">策略类型</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    {getStrategyTypeText(strategy.strategy_type)}
                  </p>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default StrategyDetail;