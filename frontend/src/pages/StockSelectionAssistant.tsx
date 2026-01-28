import React, { useEffect, useState } from 'react';
import { DatePicker } from 'antd';
import { limitCptAPI } from '../services/api';
import { LimitConceptSector } from '../types';
import { Calendar, TrendingUp, Loader2 } from 'lucide-react';
import moment from 'moment';

const StockSelectionAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('strongest-sector');
  const [limitSectors, setLimitSectors] = useState<LimitConceptSector[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchLatestTradeDate = async () => {
    setLoading(true);
    try {
      const response = await limitCptAPI.getLimitConceptSectors({});
      if (response.data && response.data.length > 0) {
        const latestDate = response.data[0].trade_date;
        setSelectedDate(latestDate);
      }
    } catch (error) {
      console.error('获取最新交易日期失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLimitSectors = async (date?: string) => {
    setLoading(true);
    try {
      const params = date ? { trade_date: date } : {};
      const response = await limitCptAPI.getLimitConceptSectors(params);
      setLimitSectors(response.data || []);
    } catch (error) {
      console.error('获取最强板块数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestTradeDate();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchLimitSectors(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (date: moment.Moment | null, dateString: string) => {
    if (date) {
      const formattedDate = date.format('YYYYMMDD');
      setSelectedDate(formattedDate);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr && dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}年${month}月${day}日`;
    }
    return dateStr;
  };

  const formatRankColor = (rank: string) => {
    const rankNum = parseInt(rank);
    if (rankNum <= 3) return 'text-yellow-600 font-bold';
    if (rankNum <= 10) return 'text-orange-600';
    return 'text-slate-600';
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('strongest-sector')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'strongest-sector'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            最强板块
          </button>
          <button
            onClick={() => setActiveTab('hot-stocks')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'hot-stocks'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            热门股票
          </button>
          <button
            onClick={() => setActiveTab('fund-flow')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'fund-flow'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            资金流向
          </button>
        </div>
      </div>

      {activeTab === 'strongest-sector' && (
        <div>
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <label className="font-medium text-slate-700">选择交易日期:</label>
              </div>
              <DatePicker
                value={selectedDate ? moment(selectedDate, 'YYYYMMDD') : null}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                placeholder="选择日期"
                className="w-64"
                allowClear={false}
              />
              {loading && <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />}
            </div>

            {selectedDate && (
              <div className="text-sm text-slate-500">
                当前显示日期: <span className="font-medium text-slate-700">{formatDateDisplay(selectedDate)}</span>
              </div>
            )}
          </div>

          {loading && limitSectors.length === 0 ? (
            <div className="card p-8 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <span className="ml-3 text-slate-600">加载中...</span>
            </div>
          ) : limitSectors.length > 0 ? (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">排名</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">板块名称</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">板块代码</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">涨停家数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">连板家数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">上榜天数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">连板高度</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">涨跌幅</th>
                  </tr>
                </thead>
                <tbody>
                  {limitSectors.map((sector, index) => (
                    <tr
                      key={`${sector.ts_code}-${sector.trade_date}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className={`px-6 py-4 ${formatRankColor(sector.rank)}`}>
                        #{sector.rank}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {sector.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {sector.ts_code}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-danger-500" />
                          <span className="font-semibold text-danger-600">{sector.up_nums}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {sector.cons_nums}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {sector.days} 天
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {sector.up_stat}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${
                        sector.pct_chg >= 0 ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {sector.pct_chg.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-500">
              暂无数据
            </div>
          )}
        </div>
      )}

      {activeTab === 'hot-stocks' && (
        <div className="card p-8 text-center text-slate-500">
          热门股票功能开发中...
        </div>
      )}

      {activeTab === 'fund-flow' && (
        <div className="card p-8 text-center text-slate-500">
          资金流向功能开发中...
        </div>
      )}
    </div>
  );
};

export default StockSelectionAssistant;
