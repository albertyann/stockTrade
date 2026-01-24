import React from 'react';
import { QuantStrategy } from '../../../types';

interface StrategyDescriptionTabProps {
  strategy: QuantStrategy;
}

const StrategyDescriptionTab: React.FC<StrategyDescriptionTabProps> = ({ strategy }) => {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">策略描述</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap">
            {strategy.description || '暂无策略描述'}
          </p>
        </div>
      </div>

      {strategy.parameters && Object.keys(strategy.parameters).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">策略参数</h3>
          <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(strategy.parameters, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyDescriptionTab;
