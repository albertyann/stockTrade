import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import StockCard from '../components/StockCard';
import { userStockAPI, indexAPI } from '../services/api';
import { UserStock, IndexDaily } from '../types';
import { RefreshCw, Bell, TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [, setUserStocks] = useState<UserStock[]>([]);
  const [indexData, setIndexData] = useState<IndexDaily[]>([]);
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

  const fetchLatestIndexData = async () => {
    try {
      const response = await indexAPI.getLatestIndices();
      console.log(response)
      setIndexData(response.data);
    } catch (error) {
      console.error('获取指数数据失败:', error);
    }
  };

  useEffect(() => {
    fetchUserStocks();
    fetchLatestIndexData();
  }, []);

  const marketOverview = indexData.map(item => ({
    title: item.name || item.ts_code,
    tsCode: item.ts_code,
    value: item.close?.toFixed(2) || '0.00',
    change: item.pct_chg || 0,
    positive: (item.pct_chg || 0) >= 0,
    tradeDate: item.trade_date,
  }));

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
          <div key={index} className="card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-slate-500 mb-1">{item.title}</p>
                <p className="text-xs text-slate-400 mb-1">{item.tsCode}</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                  {item.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  日期: {item.tradeDate}
                </p>
              </div>
              <span className={`
                px-2.5 py-1 text-sm font-semibold rounded-full flex items-center gap-1
                ${item.positive ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}
              `}>
                {item.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(item.change).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">规则分析结果</h3>
            <p className="text-sm text-slate-500">实时监控的股票分析规则匹配情况</p>
          </div>
          <button className="btn-secondary px-4 py-2 flex items-center gap-2 hover:shadow-md transition-shadow" aria-label="查看通知">
            <Bell className="w-4 h-4" />
            通知
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  股票代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  匹配规则
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  匹配结果
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analysisResults.map((result) => (
                <tr key={result.key} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900">{result.stockCode}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                    {result.ruleName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full
                      ${result.matched
                        ? 'bg-success-50 text-success-700'
                        : 'bg-danger-50 text-danger-700'
                      }
                    `}>
                      {result.matched ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {result.matched ? '匹配成功' : '未匹配'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">
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
