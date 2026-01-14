import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import StockCard from '../components/StockCard';
import { userStockAPI } from '../services/api';
import { UserStock } from '../types';

const Dashboard: React.FC = () => {
  const [, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserStocks = async () => {
    setLoading(true);
    try {
      const response = await userStockAPI.getUserStocks();
      setUserStocks(response.data);
    } catch (error) {
      console.error('获取用户自选股失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStocks();
  }, []);

  const marketOverview = [
    { title: '上证指数', value: '3200.50', change: 1.2, positive: true },
    { title: '深证成指', value: '11500.80', change: -0.8, positive: false },
    { title: '创业板指', value: '2450.30', change: 2.5, positive: true },
    { title: '科创50', value: '1050.20', change: -1.5, positive: false },
  ];

  const hotStocks = [
    { code: 'AAPL', name: '苹果公司', price: 150.20, change: 1.8 },
    { code: 'TSLA', name: '特斯拉', price: 230.50, change: -2.3 },
    { code: 'MSFT', name: '微软', price: 380.10, change: 0.9 },
    { code: 'AMZN', name: '亚马逊', price: 135.80, change: -0.5 },
  ];

  const analysisResults = [
    { key: '1', stockCode: 'AAPL', ruleName: '价格突破20日均线', matched: true, time: '2023-06-15 10:30' },
    { key: '2', stockCode: 'TSLA', ruleName: '成交量放大', matched: false, time: '2023-06-15 09:45' },
    { key: '3', stockCode: 'MSFT', ruleName: 'RSI超卖', matched: true, time: '2023-06-14 14:20' },
    { key: '4', stockCode: 'AMZN', ruleName: 'MACD金叉', matched: true, time: '2023-06-14 11:15' },
  ];

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937'
      }
    },
    legend: {
      data: ['AAPL', 'TSLA', 'MSFT', 'AMZN'],
      bottom: 10,
      padding: [20, 0, 0, 0],
      itemGap: 30,
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
        color: '#6b7280'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      min: 130,
      max: 400,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'AAPL',
        type: 'line',
        smooth: true,
        data: [148.5, 149.2, 149.8, 150.5, 151.2, 150.8, 151.5, 152.0, 151.8, 152.2],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(59, 130, 246, 0.5)'
        },
        itemStyle: {
          color: '#3B82F6',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(59, 130, 246, 0.3)'
            }, {
              offset: 1, color: 'rgba(59, 130, 246, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
      {
        name: 'TSLA',
        type: 'line',
        smooth: true,
        data: [232.5, 233.2, 234.0, 233.5, 233.0, 232.8, 232.5, 232.0, 231.5, 231.8],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(249, 115, 22, 0.5)'
        },
        itemStyle: {
          color: '#F97316',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(249, 115, 22, 0.3)'
            }, {
              offset: 1, color: 'rgba(249, 115, 22, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
      {
        name: 'MSFT',
        type: 'line',
        smooth: true,
        data: [378.5, 379.0, 379.5, 380.0, 380.5, 381.0, 381.5, 382.0, 381.8, 382.2],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(99, 102, 241, 0.5)'
        },
        itemStyle: {
          color: '#6366F1',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(99, 102, 241, 0.3)'
            }, {
              offset: 1, color: 'rgba(99, 102, 241, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
      {
        name: 'AMZN',
        type: 'line',
        smooth: true,
        data: [135.0, 135.2, 135.5, 135.8, 136.0, 135.8, 135.5, 135.2, 135.0, 134.8],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(16, 185, 129, 0.5)'
        },
        itemStyle: {
          color: '#10B981',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(16, 185, 129, 0.3)'
            }, {
              offset: 1, color: 'rgba(16, 185, 129, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
    ],
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {marketOverview.map((item, index) => (
          <div key={index} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {parseFloat(item.value).toFixed(2)}
                </p>
              </div>
              <span className={`
                px-2.5 py-1 text-sm font-semibold rounded-full
                ${item.positive ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}
              `}>
                {item.positive ? '↑' : '↓'} {Math.abs(item.change).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">股票价格走势</h3>
            <p className="text-sm text-gray-500">实时追踪主要股票价格变化</p>
          </div>
          <button
            onClick={fetchUserStocks}
            disabled={loading}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新数据
          </button>
        </div>
        <ReactECharts option={chartOption} style={{ height: 400 }} />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门股票</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotStocks.map((stock, index) => (
            <div key={index}>
              <StockCard
                stock={{
                  id: index,
                  code: stock.code,
                  name: stock.name,
                  market: 'US',
                  industry: '科技',
                  description: '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  price: stock.price,
                  change: stock.change,
                }}
                onClick={() => console.log('查看股票详情:', stock.code)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">规则分析结果</h3>
            <p className="text-sm text-gray-500">实时监控的股票分析规则匹配情况</p>
          </div>
          <button className="btn-secondary px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            通知
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
                  匹配规则
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  匹配结果
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysisResults.map((result) => (
                <tr key={result.key} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{result.stockCode}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                    {result.ruleName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2.5 py-1 text-xs font-semibold rounded-full
                      ${result.matched 
                        ? 'bg-success-50 text-success-700' 
                        : 'bg-danger-50 text-danger-700'
                      }
                    `}>
                      {result.matched ? '匹配成功' : '未匹配'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    {result.time}
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

export default Dashboard;
