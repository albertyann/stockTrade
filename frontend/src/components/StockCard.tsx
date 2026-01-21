import React from 'react';
import { Stock } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
  onClick?: () => void;
  isUserStock?: boolean;
}

const StockCard: React.FC<StockCardProps> = ({ stock, onClick, isUserStock = false }) => {
  const price = stock.price ?? 100.50;
  const change = stock.change ?? 2.5;
  const isPositive = change >= 0;
  const volume = (Math.random() * 10 + 1).toFixed(1);
  const marketCap = (Math.random() * 1000 + 100).toFixed(0);
  const pe = (Math.random() * 30 + 5).toFixed(1);

  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 hover:-translate-y-0.5 group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{stock.code}</h3>
            {isUserStock && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                自选
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{stock.name}</p>
        </div>
        <div className="text-right ml-3">
          <div className="text-xl font-bold text-slate-900">
            ¥{price.toFixed(2)}
          </div>
          <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${
            isPositive ? 'text-success-600' : 'text-danger-600'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 my-3" />

      <div className="flex justify-between text-xs text-slate-500">
        <div className="text-center flex-1">
          <div className="text-[10px] text-slate-400 mb-0.5">成交量</div>
          <div className="font-medium text-slate-700">{volume}亿</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-[10px] text-slate-400 mb-0.5">市值</div>
          <div className="font-medium text-slate-700">{marketCap}亿</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-[10px] text-slate-400 mb-0.5">PE</div>
          <div className="font-medium text-slate-700">{pe}</div>
        </div>
      </div>

      {stock.industry && (
        <div className="mt-3">
          <span className="inline-block px-2.5 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded-md">
            {stock.industry}
          </span>
        </div>
      )}
    </div>
  );
};

export default StockCard;
