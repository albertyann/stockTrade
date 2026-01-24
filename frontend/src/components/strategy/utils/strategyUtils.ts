import { StrategyType } from '../../../types';

/**
 * 获取策略类型文本
 */
export const getStrategyTypeText = (type: StrategyType): string => {
  switch (type) {
    case StrategyType.MA_CROSS:
      return '双均线策略';
    case StrategyType.RSI_OVERSOLD:
      return 'RSI超卖策略';
    case StrategyType.BOLLINGER_BAND:
      return '布林带策略';
    default:
      return '自定义策略';
  }
};

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('zh-CN');
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('zh-CN');
};

/**
 * 格式化货币
 */
export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 获取颜色类名基于数值（正负）
 */
export const getColorClass = (value: number): string => {
  return value >= 0 ? 'text-success-600' : 'text-danger-600';
};

/**
 * 获取符号（正负号）
 */
export const getSign = (value: number): string => {
  return value >= 0 ? '+' : '';
};