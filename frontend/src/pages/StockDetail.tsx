import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { stockAPI, userStockAPI, stockDailyAPI, financialAPI, syncAPI } from '../services/api';
import { Stock, StockDaily, StockIncomeStatement, StockBalanceSheet, StockCashFlow } from '../types';

const StockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<Stock | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStockId, setUserStockId] = useState<number | null>(null);

  const [dailyData, setDailyData] = useState<StockDaily[]>([]);
  const [incomeData, setIncomeData] = useState<StockIncomeStatement[]>([]);
  const [balanceData, setBalanceData] = useState<StockBalanceSheet[]>([]);
  const [cashflowData, setCashflowData] = useState<StockCashFlow[]>([]);

  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingCashflow, setLoadingCashflow] = useState(false);

  const fetchStock = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [stockRes, userStocksRes] = await Promise.all([
        stockAPI.getStock(Number(id)),
        userStockAPI.getUserStocks(),
      ]);

      setStock(stockRes.data);

      const watched = userStocksRes.data.find(us => us.stock_id === Number(id));
      setIsWatched(!!watched);
      if (watched) {
        setUserStockId(watched.id);
      }
    } catch (error) {
      message.error('获取股票详情失败');
      console.error('获取股票详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleToggleWatch = async () => {
    if (!stock) return;

    try {
      if (isWatched) {
        if (userStockId) {
          await userStockAPI.deleteUserStock(userStockId);
          message.success('已从自选股中移除');
        }
      } else {
        await userStockAPI.createUserStock({ stock_id: stock.id });
        message.success('已添加到自选股');
      }
      fetchStock();
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.detail) {
        message.error(error.response.data.detail === 'Stock already in user\'s portfolio' ? '该股票已在自选股中' : error.response.data.detail);
      } else {
        message.error(isWatched ? '移除失败' : '添加失败');
      }
      console.error('操作失败:', error);
    }
  };

  const handleFetchDaily = async () => {
    if (!stock) return;
    setLoadingDaily(true);
    try {
      const ts_code = stock.ts_code || stock.symbol || stock.code || '';
      if (!ts_code) {
        message.error('无法获取股票代码');
        return;
      }
      const response = await stockDailyAPI.getStockDaily(ts_code, 0, 30);
      setDailyData(response.data);
      message.success(`获取到 ${response.data.length} 条K线数据`);
    } catch (error) {
      message.error('获取K线数据失败');
      console.error('获取K线数据失败:', error);
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    const fetchLatestDaily = async () => {
      if (!stock) return;
      try {
        const ts_code = stock.ts_code || stock.symbol || stock.code || '';
        if (!ts_code) return;

        const response = await stockDailyAPI.getStockDaily(ts_code, 0, 30);
        if (response.data) {
          setDailyData(response.data);
        }
      } catch (error) {
        console.error('获取最新K线数据失败:', error);
      }
    };

    fetchLatestDaily();
  }, [stock]);

  const handleFetchIncome = async () => {
    if (!stock) return;
    setLoadingIncome(true);
    try {
      const response = await financialAPI.getIncomeStatements(stock.id);
      setIncomeData(response.data);
      message.success(`获取到 ${response.data.length} 条利润表数据`);
    } catch (error) {
      message.error('获取利润表数据失败');
      console.error('获取利润表数据失败:', error);
    } finally {
      setLoadingIncome(false);
    }
  };

  const handleFetchBalance = async () => {
    if (!stock) return;
    setLoadingBalance(true);
    try {
      const response = await financialAPI.getBalanceSheets(stock.id);
      setBalanceData(response.data);
      message.success(`获取到 ${response.data.length} 条资产负债表数据`);
    } catch (error) {
      message.error('获取资产负债表数据失败');
      console.error('获取资产负债表数据失败:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleFetchCashflow = async () => {
    if (!stock) return;
    setLoadingCashflow(true);
    try {
      const response = await financialAPI.getCashFlows(stock.id);
      setCashflowData(response.data);
      message.success(`获取到 ${response.data.length} 条现金流量表数据`);
    } catch (error) {
      message.error('获取现金流量表数据失败');
      console.error('获取现金流量表数据失败:', error);
    } finally {
      setLoadingCashflow(false);
    }
  };

  const handleSyncFinancials = async () => {
    if (!stock) return;
    const ts_code = stock.ts_code || stock.symbol || stock.code || '';
    if (!ts_code) {
      message.error('无法获取股票代码');
      return;
    }
    setLoading(true);
    try {
      const response = await syncAPI.syncFinancialData({ stock_codes: [ts_code], sync_type: 'financial' });
      if (response.data.success) {
        message.success('财务数据同步成功');
        await Promise.all([
          handleFetchIncome(),
          handleFetchBalance(),
          handleFetchCashflow(),
        ]);
      } else {
        message.error(response.data.message || '财务数据同步失败');
      }
    } catch (error) {
      message.error('财务数据同步失败');
      console.error('财务数据同步失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="card p-6 text-center text-gray-500">
        股票不存在
      </div>
    );
  }

  const change = stock.change ?? 0;
  const isPositive = change >= 0;
  const price = stock.price ?? 0;

  const chartOption = {
    title: {
      text: '价格走势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        if (param) {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${param.name}</div>
              <div>开盘价: ¥${param.data?.open?.toFixed(2)}</div>
              <div>最高价: ¥${param.data?.high?.toFixed(2)}</div>
              <div>最低价: ¥${param.data?.low?.toFixed(2)}</div>
              <div>收盘价: ¥${param.data?.close?.toFixed(2)}</div>
              <div style="color: ${param.data?.pct_chg >= 0 ? '#ef4444' : '#22c55e'}">
                涨跌幅: ${param.data?.pct_chg >= 0 ? '+' : ''}${param.data?.pct_chg?.toFixed(2)}%
              </div>
            </div>
          `;
        }
        return '';
      }
    },
    legend: {
      data: ['收盘价']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dailyData.map(item => {
        const date = new Date(item.trade_date);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }).reverse(),
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: (value: number) => `¥${value.toFixed(2)}`
      }
    },
    series: [
      {
        name: '收盘价',
        data: dailyData.map(item => ({
          value: item.close,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          pct_chg: item.pct_chg
        })).reverse(),
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: '#3b82f6'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        }
      },
    ],
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary px-4 py-2.5 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </button>
        <button
          onClick={fetchStock}
          disabled={loading}
          className="btn-secondary px-4 py-2.5 flex items-center gap-2"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
        <button
          onClick={handleFetchDaily}
          disabled={loadingDaily}
          className="btn-secondary px-4 py-2.5 flex items-center gap-2"
        >
          {loadingDaily ? '加载中...' : '同步交易数据'}
        </button>
        <button
          onClick={handleSyncFinancials}
          disabled={loading}
          className="btn-secondary px-4 py-2.5 flex items-center gap-2"
        >
          {loading ? '同步中...' : '同步财务数据'}
        </button>
        <button
          onClick={handleToggleWatch}
          className={`px-4 py-2.5 flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${
            isWatched
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'btn-primary'
          }`}
        >
          {isWatched ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538 1.118l1.518 4.674c.3.922.755-1.688 1.538-1.118l-3.976 2.888a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          {isWatched ? '已关注' : '添加自选'}
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{stock.name}({stock.ts_code})</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">市场:</span>
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                  {stock.market}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">行业:</span>
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded-md">
                  {stock.industry}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold mb-1 ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
              ¥{price.toFixed(2)}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              isPositive ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            }`}>
              {isPositive ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-2">开盘价</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{(price * 0.98).toFixed(2)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-2">最高价</div>
          <div className="text-2xl font-bold text-success-600">
            ¥{(price * 1.02).toFixed(2)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-2">最低价</div>
          <div className="text-2xl font-bold text-danger-600">
            ¥{(price * 0.99).toFixed(2)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-2">成交量</div>
          <div className="text-2xl font-bold text-gray-900">
            {(Math.random() * 10 + 1).toFixed(2)} 亿
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="h-[400px]">
          <ReactECharts option={chartOption} style={{ height: '100%' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">公司简介</h3>
          <p className="text-gray-700 leading-relaxed">
            {stock.description || '暂无公司简介信息'}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">财务指标</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">市盈率(PE)</div>
              <div className="text-xl font-bold text-gray-900">
                {(Math.random() * 30 + 5).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">市净率(PB)</div>
              <div className="text-xl font-bold text-gray-900">
                {(Math.random() * 5 + 1).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">净资产收益率(ROE)</div>
              <div className="text-xl font-bold text-gray-900">
                {(Math.random() * 20 + 5).toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">每股收益(EPS)</div>
              <div className="text-xl font-bold text-gray-900">
                {(Math.random() * 5 + 0.5).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">股息率</div>
              <div className="text-xl font-bold text-gray-900">
                {(Math.random() * 5 + 0.5).toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">总市值</div>
              <div className="text-xl font-bold text-gray-900">
                {(Math.random() * 1000 + 100).toFixed(0)}亿
              </div>
            </div>
          </div>
        </div>
      </div>

      {dailyData.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">K线数据 (最近{Math.min(dailyData.length, 1000)}条)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开盘价</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最高价</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最低价</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收盘价</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">涨跌幅</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成交量</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyData.slice(0, 50).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.trade_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">¥{item.open?.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">¥{item.high?.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">¥{item.low?.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">¥{item.close?.toFixed(2)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${item.pct_chg && item.pct_chg >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {item.pct_chg ? `${item.pct_chg >= 0 ? '+' : ''}${item.pct_chg.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{(item.vol || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dailyData.length > 50 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              显示前50条数据，共{dailyData.length}条
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">利润表数据</h3>
            <button
              onClick={handleFetchIncome}
              disabled={loadingIncome}
              className="btn-secondary px-3 py-2 flex items-center gap-2 text-sm"
            >
              <svg className={`w-4 h-4 ${loadingIncome ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loadingIncome ? '加载中...' : '获取数据'}
            </button>
          </div>
          {incomeData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">财年</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">总营收</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">净利润</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">EBITDA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomeData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.fiscal_date_ending}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.total_revenue ? `¥${(item.total_revenue / 1000000).toFixed(2)}M` : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.net_income ? `¥${(item.net_income / 1000000).toFixed(2)}M` : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.ebitda ? `¥${(item.ebitda / 1000000).toFixed(2)}M` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">暂无数据</div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">资产负债表</h3>
            <button
              onClick={handleFetchBalance}
              disabled={loadingBalance}
              className="btn-secondary px-3 py-2 flex items-center gap-2 text-sm"
            >
              <svg className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loadingBalance ? '加载中...' : '获取数据'}
            </button>
          </div>
          {balanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">财年</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">总资产</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">总负债</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">股东权益</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balanceData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.fiscal_date_ending}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.total_assets ? `¥${(item.total_assets / 1000000).toFixed(2)}M` : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.total_liabilities ? `¥${(item.total_liabilities / 1000000).toFixed(2)}M` : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.total_shareholder_equity ? `¥${(item.total_shareholder_equity / 1000000).toFixed(2)}M` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">暂无数据</div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">现金流量表</h3>
            <button
              onClick={handleFetchCashflow}
              disabled={loadingCashflow}
              className="btn-secondary px-3 py-2 flex items-center gap-2 text-sm"
            >
              <svg className={`w-4 h-4 ${loadingCashflow ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loadingCashflow ? '加载中...' : '获取数据'}
            </button>
          </div>
          {cashflowData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">财年</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">经营现金流</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">资本支出</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">自由现金流</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashflowData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.fiscal_date_ending}</td>
                      <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${item.operating_cashflow && item.operating_cashflow >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {item.operating_cashflow ? `¥${(item.operating_cashflow / 1000000).toFixed(2)}M` : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.capital_expenditures ? `¥${(item.capital_expenditures / 1000000).toFixed(2)}M` : '-'}</td>
                      <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${item.free_cash_flow && item.free_cash_flow >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {item.free_cash_flow ? `¥${(item.free_cash_flow / 1000000).toFixed(2)}M` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
