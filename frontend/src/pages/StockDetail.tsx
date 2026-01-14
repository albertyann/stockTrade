import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { stockAPI, userStockAPI } from '../services/api';
import { Stock } from '../types';

const StockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<Stock | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStockId, setUserStockId] = useState<number | null>(null);

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
    } catch (error) {
      message.error(isWatched ? '移除失败' : '添加失败');
      console.error('操作失败:', error);
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
      trigger: 'axis'
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: Array.from({ length: 12 }, () => price * (0.9 + Math.random() * 0.2)),
        type: 'line',
        smooth: true,
        showSymbol: false
      },
    ],
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">股票详情</h2>
        <p className="text-gray-500">查看股票的详细信息和走势</p>
      </div>

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          {isWatched ? '已关注' : '添加自选'}
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{stock.code} - {stock.name}</h3>
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">价格走势</h3>
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
    </div>
  );
};

export default StockDetail;
