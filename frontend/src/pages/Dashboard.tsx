import React, { useEffect, useState } from 'react';
import { indexAPI } from '../services/api';
import { IndexDaily } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [indexData, setIndexData] = useState<IndexDaily[]>([]);

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
                ${item.positive ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'}
              `}>
                {item.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(item.change).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
