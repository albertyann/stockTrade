import React from 'react';
import { QuantStrategy } from '../../../types';
import { getStrategyTypeText, formatDateTime } from '../utils/strategyUtils';

interface StrategyOverviewTabProps {
  strategy: QuantStrategy;
}

const StrategyOverviewTab: React.FC<StrategyOverviewTabProps> = ({ strategy }) => {
  return (
    <div className="space-y-6">
      {/* 基本信息卡片 */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">基本信息</h3>
            <p className="text-sm text-slate-500">策略配置和状态信息</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-slate-500">策略代码</div>
                <div className="font-medium text-slate-900">{strategy.strategy_code}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">策略类型</div>
                <div className="font-medium text-slate-900">{getStrategyTypeText(strategy.strategy_type)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">运行频率</div>
                <div className="font-medium text-slate-900">{strategy.frequency}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">策略状态</div>
                <div className="font-medium text-slate-900">{strategy.status}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">是否激活</div>
                <div className={`font-medium ${strategy.is_active ? 'text-success-600' : 'text-slate-900'}`}>
                  {strategy.is_active ? '是' : '否'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">创建时间</div>
                <div className="font-medium text-slate-900">
                  {formatDateTime(strategy.created_at)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-900">风险参数</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {strategy.max_position_value !== undefined && (
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">最大持仓金额</div>
                  <div className="font-medium text-slate-900">¥{strategy.max_position_value.toLocaleString()}</div>
                </div>
              )}
              {strategy.max_single_stock_ratio !== undefined && (
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">单股最大比例</div>
                  <div className="font-medium text-slate-900">{(strategy.max_single_stock_ratio * 100).toFixed(1)}%</div>
                </div>
              )}
              {strategy.stop_loss_ratio !== undefined && (
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">止损比例</div>
                  <div className="font-medium text-slate-900">{(strategy.stop_loss_ratio * 100).toFixed(1)}%</div>
                </div>
              )}
              {strategy.take_profit_ratio !== undefined && (
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">止盈比例</div>
                  <div className="font-medium text-slate-900">{(strategy.take_profit_ratio * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 策略描述 */}
      {strategy.description && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">策略描述</h3>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{strategy.description}</p>
          </div>
        </div>
      )}

      {/* 策略参数 */}
      {strategy.parameters && Object.keys(strategy.parameters).length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">策略参数</h3>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-700 font-mono leading-relaxed">
              {JSON.stringify(strategy.parameters, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyOverviewTab;