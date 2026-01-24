import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuantStrategy, StrategyType } from '../../types';
import { getStrategyTypeText } from './utils/strategyUtils';

interface StrategyHeaderProps {
  strategy: QuantStrategy;
  onExecuteStrategy: () => void;
}

const StrategyHeader: React.FC<StrategyHeaderProps> = ({ strategy, onExecuteStrategy }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <button
              onClick={() => navigate('/strategies')}
              className="icon-btn text-slate-500 hover:text-slate-700 flex-shrink-0"
              aria-label="返回策略列表"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">{strategy.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 truncate">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{strategy.strategy_code}</span>
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="badge badge-primary text-xs">
              {getStrategyTypeText(strategy.strategy_type)}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className={`inline-flex items-center gap-1 sm:gap-1.5 ${strategy.is_active ? 'text-success-600' : 'text-slate-500'}`}>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{strategy.is_active ? '已激活' : '未激活'}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-0">
          <button
            onClick={onExecuteStrategy}
            className="btn-primary px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">执行策略</span>
          </button>
          <button
            onClick={() => navigate('/strategies')}
            className="btn-secondary px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="truncate">返回列表</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyHeader;