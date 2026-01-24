import React from 'react';

const StrategyLoadingSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 头部骨架屏 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-6 bg-slate-200 rounded-md w-32 animate-pulse"></div>
              <div className="h-6 bg-slate-200 rounded-md w-24 animate-pulse"></div>
              <div className="h-6 bg-slate-200 rounded-md w-20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded-lg w-28 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 标签页骨架屏 */}
      <div className="mb-6">
        <div className="flex space-x-6 border-b border-slate-200">
          {['概览', '回测', '交易信号', '策略表现', '当前持仓', '文本描述', '策略代码'].map((tab) => (
            <div key={tab} className="pb-3">
              <div className="h-6 bg-slate-200 rounded-md w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 内容骨架屏 */}
      <div className="space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded-md w-32 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-48 animate-pulse"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-20 animate-pulse"></div>
                    <div className="h-5 bg-slate-200 rounded-md w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-5 bg-slate-200 rounded-md w-24 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-24 animate-pulse"></div>
                    <div className="h-5 bg-slate-200 rounded-md w-28 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyLoadingSkeleton;