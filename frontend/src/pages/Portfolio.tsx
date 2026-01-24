import React, { useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { message } from 'antd';
import { tradingAPI } from '../services/api';
import { Portfolio } from '../types';

const PortfolioPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tradingAPI.getPortfolios({ limit: 50 });
      setPortfolios(response.data);
    } catch (error) {
      console.error('获取投资组合失败:', error);
      message.error('获取投资组合失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await tradingAPI.getPortfolioSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('获取投资组合摘要失败:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchBreakdown = useCallback(async () => {
    setBreakdownLoading(true);
    try {
      const response = await tradingAPI.getPortfolioBreakdown();
      setBreakdown(response.data);
    } catch (error) {
      console.error('获取投资组合分布失败:', error);
    } finally {
      setBreakdownLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
    fetchSummary();
    fetchBreakdown();
  }, [fetchPortfolios, fetchSummary, fetchBreakdown]);

  const getPieChartOption = () => {
    if (!breakdown || !breakdown.by_stock) {
      return {};
    }

    const data = breakdown.by_stock.map((item: any) => ({
      name: item.ts_code || '未知',
      value: item.market_value || 0,
    }));

    return {
      title: { text: '持仓分布', left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
      },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '持仓',
          type: 'pie',
          radius: '50%',
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            formatter: '{b}: {d}%',
          },
        },
      ],
    };
  };

  const getEquityCurveOption = () => {
    if (!breakdown || !breakdown.equity_curve) {
      return {};
    }

    const equityCurve = breakdown.equity_curve;
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

  if (loading || summaryLoading || breakdownLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const latestPortfolio = portfolios[0];

  return (
    <div>
      {summary && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">投资组合摘要</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ¥{summary.total_value?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">总资产</div>
            </div>
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600 mb-1">
                ¥{summary.cash_balance?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">现金余额</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${summary.total_pnl >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
              <div className={`text-2xl font-bold mb-1 ${summary.total_pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {summary.total_pnl >= 0 ? '+' : ''}¥{summary.total_pnl?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">总盈亏</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${summary.total_pnl_ratio >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
              <div className={`text-2xl font-bold mb-1 ${summary.total_pnl_ratio >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {summary.total_pnl_ratio >= 0 ? '+' : ''}{(summary.total_pnl_ratio * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">收益率</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {breakdown && breakdown.by_stock && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">持仓分布</h3>
            <ReactECharts option={getPieChartOption()} style={{ height: '400px' }} />
          </div>
        )}

        {breakdown && breakdown.equity_curve && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">资金曲线</h3>
            <ReactECharts option={getEquityCurveOption()} style={{ height: '400px' }} />
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">投资组合历史</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  截止日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  初始资金
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  当前资金
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  总资产
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  现金余额
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  持仓市值
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  总盈亏
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  收益率
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {portfolios.map((portfolio) => (
                <tr key={portfolio.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    {new Date(portfolio.as_of_date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    ¥{portfolio.initial_capital.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    ¥{portfolio.current_capital?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    ¥{portfolio.total_value?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    ¥{portfolio.cash_balance?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    ¥{portfolio.position_value?.toLocaleString() || '-'}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap font-semibold ${portfolio.total_pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {portfolio.total_pnl >= 0 ? '+' : ''}¥{portfolio.total_pnl.toFixed(2)}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap font-semibold ${portfolio.total_pnl_ratio >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {portfolio.total_pnl_ratio >= 0 ? '+' : ''}{(portfolio.total_pnl_ratio * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
