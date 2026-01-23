import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { stockAPI, userStockAPI, stockDailyAPI, financialAPI, syncAPI } from '../services/api';
import { Stock, StockDaily, StockIncomeStatement, StockBalanceSheet, StockCashFlow } from '../types';

const calculateMA = (dayCount: number, data: StockDaily[]): (string | number)[] => {
  const result: (string | number)[] = [];
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount) {
      result.push('-');
      continue;
    }
    let sum = 0;
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j].close;
    }
    result.push(parseFloat((sum / dayCount).toFixed(2)));
  }
  return result;
};

const calculateEMA = (dayCount: number, data: StockDaily[]): (string | number)[] => {
  const result: (string | number)[] = [];
  const k = 2 / (dayCount + 1);

  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount - 1) {
      result.push('-');
      continue;
    }
    if (i === dayCount - 1) {
      let sum = 0;
      for (let j = 0; j < dayCount; j++) {
        sum += data[i - j].close;
      }
      result.push(parseFloat((sum / dayCount).toFixed(2)));
    } else {
      const prevEMA = result[i - 1];
      const currentEMA = typeof prevEMA === 'number'
        ? (data[i].close - prevEMA) * k + prevEMA
        : data[i].close;
      result.push(parseFloat(currentEMA.toFixed(2)));
    }
  }
  return result;
};

const calculateMACD = (data: StockDaily[]) => {
  const ema12 = calculateEMA(12, data);
  const ema26 = calculateEMA(26, data);

  const dif: (string | number)[] = [];
  const dea: (string | number)[] = [];
  const macd: (string | number)[] = [];

  for (let i = 0, len = data.length; i < len; i++) {
    const e12 = ema12[i];
    const e26 = ema26[i];

    if (typeof e12 !== 'number' || typeof e26 !== 'number') {
      dif.push('-');
      dea.push('-');
      macd.push('-');
      continue;
    }

    const difValue = e12 - e26;
    dif.push(parseFloat(difValue.toFixed(2)));

    if (i < 26 + 8) {
      dea.push('-');
      macd.push('-');
    } else if (i === 26 + 8) {
      let sum = 0;
      for (let j = 0; j < 9; j++) {
        const val = dif[i - j];
        if (typeof val === 'number') {
          sum += val;
        }
      }
      const deaValue = sum / 9;
      dea.push(parseFloat(deaValue.toFixed(2)));
      const macdValue = 2 * (difValue - deaValue);
      macd.push(parseFloat(macdValue.toFixed(2)));
    } else {
      const k = 2 / 10;
      const prevDEA = dea[i - 1];
      const deaValue = typeof prevDEA === 'number'
        ? (difValue - prevDEA) * k + prevDEA
        : difValue;
      dea.push(parseFloat(deaValue.toFixed(2)));
      const macdValue = 2 * (difValue - deaValue);
      macd.push(parseFloat(macdValue.toFixed(2)));
    }
  }

  return { dif, dea, macd };
};

const colorList = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae'];
const labelFont = 'bold 12px Sans-serif';

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

  const [showMA5, setShowMA5] = useState(true);
  const [showMA10, setShowMA10] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA30, setShowMA30] = useState(true);
  const [showMA60, setShowMA60] = useState(true);

  const [selectedIndicator, setSelectedIndicator] = useState<'MACD' | 'KDJ'>('MACD');
  const [timePeriod, setTimePeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');

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
      const response = await stockDailyAPI.getStockDaily(ts_code, 0, 100);
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

        const response = await stockDailyAPI.getStockDaily(ts_code, 0, 100);
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

  const dataReversed = [...dailyData].reverse();
  const dates = dataReversed.map(item => {
    const date = new Date(item.trade_date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const volumes = dataReversed.map(item => item.vol);
  const candlestickData = dataReversed.map(item => [item.open, item.close, item.low, item.high]);

  const dataMA5 = calculateMA(5, dataReversed);
  const dataMA10 = calculateMA(10, dataReversed);
  const dataMA20 = calculateMA(20, dataReversed);
  const dataMA30 = calculateMA(30, dataReversed);
  const dataMA60 = calculateMA(60, dataReversed);

  const macdData = calculateMACD(dataReversed);
  const dataDIF = macdData.dif;
  const dataDEA = macdData.dea;
  const dataMACD = macdData.macd;

  const chartOption = {
    animation: false,
    color: colorList,
    backgroundColor: '#ffffff',
    title: {
      left: 'center',
      text: `${stock.name} (${stock.ts_code})`,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b'
      },
      top: 10
    },
    legend: {
      top: 45,
      data: ['日K', 'MA5', 'MA10', 'MA20', 'MA30', 'MA60', 'MACD', 'DIF', 'DEA'],
      textStyle: {
        fontSize: 12,
        color: '#64748b'
      },
      itemGap: 20,
      selectedMode: true,
      type: 'scroll'
    },
    height: 600,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#3b82f6',
          width: 1,
          type: 'dashed'
        },
        crossStyle: {
          color: '#3b82f6',
          width: 1
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        fontSize: 12,
        color: '#334155'
      },
      padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 6px;',
      formatter: function (params: any) {
        const date = params[0].axisValue;
        const dateObj = new Date(date);
        const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        let result = `<div style="font-weight: bold; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${formattedDate}</div>`;
        
        params.forEach((param: any) => {
          if (param.seriesName === '日K') {
            const data = param.data;
            const isUp = data[1] >= data[0];
            const color = isUp ? '#ef232a' : '#14b143';
            
            result += `
              <div style="margin: 8px 0;">
                <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">K线数据</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                  <div style="color: #64748b;">开盘:</div>
                  <div style="font-weight: bold; text-align: right;">¥${data[0]?.toFixed(2) || '-'}</div>
                  <div style="color: #64748b;">收盘:</div>
                  <div style="font-weight: bold; text-align: right; color: ${color};">¥${data[1]?.toFixed(2) || '-'}</div>
                  <div style="color: #64748b;">最低:</div>
                  <div style="font-weight: bold; text-align: right;">¥${data[2]?.toFixed(2) || '-'}</div>
                  <div style="color: #64748b;">最高:</div>
                  <div style="font-weight: bold; text-align: right;">¥${data[3]?.toFixed(2) || '-'}</div>
                </div>
              </div>
            `;
          } else if (param.seriesName === 'Volume') {
            const volume = param.data;
            const volumeInMillion = (volume / 1000000).toFixed(2);
            result += `
              <div style="margin: 8px 0; padding-top: 8px; border-top: 1px solid #f1f5f9;">
                <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">成交量</div>
                <div style="font-weight: bold; font-size: 14px;">${volumeInMillion}M</div>
              </div>
            `;
          } else if (param.seriesName === 'MACD') {
            if (typeof param.data === 'object' && param.data.value !== '-') {
              const value = param.data.value;
              const color = value >= 0 ? '#ef232a' : '#14b143';
              result += `
                <div style="margin: 8px 0;">
                  <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">MACD</div>
                  <div style="font-weight: bold; font-size: 14px; color: ${color};">${value.toFixed(2)}</div>
                </div>
              `;
            }
          } else if (param.seriesName === 'DIF' || param.seriesName === 'DEA') {
            if (param.data !== '-') {
              const color = param.seriesName === 'DIF' ? '#da70d6' : '#ff8c00';
              result += `
                <div style="margin: 4px 0;">
                  <span style="color: ${color}; font-weight: bold;">●</span>
                  <span style="color: #64748b; margin-left: 4px;">${param.seriesName}:</span>
                  <span style="font-weight: bold; margin-left: 8px;">${param.data.toFixed(2)}</span>
                </div>
              `;
            }
          } else if (param.data !== '-') {
            const color = param.color || '#64748b';
            result += `
              <div style="margin: 4px 0;">
                <span style="color: ${color}; font-weight: bold;">●</span>
                <span style="color: #64748b; margin-left: 4px;">${param.seriesName}:</span>
                <span style="font-weight: bold; margin-left: 8px;">${param.data.toFixed(2)}</span>
              </div>
            `;
          }
        });
        
        return result;
      }
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: [0, 1, 2]
        }
      ]
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: [0, 1, 2],
        realtime: true,
        start: 30,
        end: 100,
        top: 85,
        height: 20,
        handleIcon:
          'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '120%',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#3b82f6',
          borderWidth: 1
        },
        textStyle: {
          color: '#64748b'
        },
        fillerColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        dataBackground: {
          lineStyle: {
            color: '#cbd5e1',
            width: 1
          },
          areaStyle: {
            color: '#e2e8f0'
          }
        },
        selectedDataBackground: {
          lineStyle: {
            color: '#3b82f6',
            width: 1
          },
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.1)'
          }
        }
      },
      {
        type: 'inside',
        xAxisIndex: [0, 1, 2],
        start: 30,
        end: 100,
        top: 85,
        height: 20,
        zoomOnMouseWheel: false,
        // moveOnMouseMove: false,
        // moveOnMouseWheel: false
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { 
          lineStyle: { 
            color: '#cbd5e1',
            width: 1
          } 
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#cbd5e1'
          },
          alignWithLabel: true
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          margin: 8,
          formatter: function (value: string) {
            const date = new Date(value);
            return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f1f5f9'
          }
        },
        min: 'dataMin',
        max: 'dataMax',
        splitNumber: 10
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      },
      {
        type: 'category',
        gridIndex: 2,
        data: dates,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      }
    ],
    yAxis: [
      {
        scale: true,
        splitNumber: 5,
        position: 'right',
        axisLine: { 
          show: true,
          lineStyle: { 
            color: '#cbd5e1',
            width: 1
          } 
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#cbd5e1'
          }
        },
        splitLine: { 
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f1f5f9'
          }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          margin: 4,
          formatter: function (value: number) {
            return '¥' + value.toFixed(2);
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(248, 250, 252, 0.5)', 'rgba(255, 255, 255, 0.5)']
          }
        }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      {
        scale: true,
        gridIndex: 2,
        splitNumber: 3,
        position: 'right',
        axisLine: { 
          show: true,
          lineStyle: { 
            color: '#cbd5e1',
            width: 1
          } 
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#cbd5e1'
          }
        },
        splitLine: { 
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f1f5f9'
          }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          margin: 4
        }
      }
    ],
    grid: [
      {
        left: 70,
        right: 70,
        top: 120,
        height: 220,
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: 1
      },
      {
        left: 70,
        right: 70,
        height: 60,
        top: 360,
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: 1
      },
      {
        left: 70,
        right: 70,
        height: 80,
        top: 440,
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: 1
      }
    ],
    series: [
      {
        name: 'Volume',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        barWidth: '80%',
        itemStyle: {
          borderRadius: [2, 2, 0, 0],
          color: function (params: any) {
            const data = candlestickData[params.dataIndex];
            if (data && data[1] >= data[0]) {
              return 'rgba(239, 35, 42, 0.7)'; // Red for up days
            } else {
              return 'rgba(20, 177, 67, 0.7)'; // Green for down days
            }
          }
        },
        emphasis: {
          itemStyle: {
            opacity: 0.9,
            shadowBlur: 4,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: volumes
      },
      {
        type: 'candlestick',
        name: '日K',
        data: candlestickData,
        itemStyle: {
          color: '#ef232a',
          color0: '#14b143',
          borderColor: '#ef232a',
          borderColor0: '#14b143',
          borderWidth: 1,
          opacity: 0.9
        },
        emphasis: {
          itemStyle: {
            borderWidth: 2,
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            opacity: 1
          }
        }
      },
      {
        name: 'MA5',
        type: 'line',
        data: dataMA5,
        smooth: true,
        showSymbol: false,
        visible: showMA5,
        lineStyle: {
          width: 1.5,
          color: colorList[0],
          opacity: 0.8
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      },
      {
        name: 'MA10',
        type: 'line',
        data: dataMA10,
        smooth: true,
        showSymbol: false,
        visible: showMA10,
        lineStyle: {
          width: 1.5,
          color: colorList[1],
          opacity: 0.8
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      },
      {
        name: 'MA20',
        type: 'line',
        data: dataMA20,
        smooth: true,
        showSymbol: false,
        visible: showMA20,
        lineStyle: {
          width: 1.5,
          color: colorList[2],
          opacity: 0.8
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      },
      {
        name: 'MA30',
        type: 'line',
        data: dataMA30,
        smooth: true,
        showSymbol: false,
        visible: showMA30,
        lineStyle: {
          width: 1.5,
          color: colorList[3],
          opacity: 0.8
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      },
      {
        name: 'MA60',
        type: 'line',
        data: dataMA60,
        smooth: true,
        showSymbol: false,
        visible: showMA60,
        lineStyle: {
          width: 1.5,
          color: colorList[4],
          opacity: 0.8
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      },
      {
        name: 'MACD',
        type: 'bar',
        xAxisIndex: 2,
        yAxisIndex: 2,
        barWidth: '70%',
        itemStyle: {
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: [1, 1, 0, 0]
        },
        data: dataMACD.map((val) => {
          if (typeof val !== 'number') return { value: '-', itemStyle: { color: 'transparent' } };
          return { 
            value: val, 
            itemStyle: { 
              color: val >= 0 ? 'rgba(239, 35, 42, 0.7)' : 'rgba(20, 177, 67, 0.7)'
            } 
          };
        }),
        emphasis: {
          itemStyle: {
            opacity: 0.9
          }
        }
      },
      {
        name: 'DIF',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: dataDIF,
        showSymbol: false,
        lineStyle: {
          width: 1.5,
          color: '#da70d6',
          opacity: 0.9
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      },
      {
        name: 'DEA',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: dataDEA,
        showSymbol: false,
        lineStyle: {
          width: 1.5,
          color: '#ff8c00',
          opacity: 0.9
        },
        symbol: 'none',
        emphasis: {
          lineStyle: {
            width: 2,
            opacity: 1
          }
        }
      }
    ]
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

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">均线:</span>
            {[
              { label: 'MA5', state: showMA5, setter: setShowMA5 },
              { label: 'MA10', state: showMA10, setter: setShowMA10 },
              { label: 'MA20', state: showMA20, setter: setShowMA20 },
              { label: 'MA30', state: showMA30, setter: setShowMA30 },
              { label: 'MA60', state: showMA60, setter: setShowMA60 },
            ].map((ma) => (
              <button
                key={ma.label}
                onClick={() => ma.setter(!ma.state)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  ma.state
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {ma.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">技术指标:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setSelectedIndicator('MACD')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedIndicator === 'MACD'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                MACD
              </button>
              <button
                onClick={() => setSelectedIndicator('KDJ')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedIndicator === 'KDJ'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                KDJ
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">时间:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
              {['1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period as '1M' | '3M' | '6M' | '1Y')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timePeriod === period
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="h-[600px]">
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

      <div className="p-6"></div>

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
