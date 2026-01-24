import React from 'react';
import { QuantStrategy } from '../../../types';
import { getStrategyTypeText } from '../utils/strategyUtils';

interface StrategyCodeTabProps {
  strategy: QuantStrategy;
}

const StrategyCodeTab: React.FC<StrategyCodeTabProps> = ({ strategy }) => {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">策略脚本</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm font-mono">
            {strategy.strategy_script || '# 暂无策略脚本'}
          </pre>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">策略类型</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">
            {getStrategyTypeText(strategy.strategy_type)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyCodeTab;
