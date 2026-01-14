import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analysisTaskAPI, stockAPI } from '../services/api';
import { AnalysisTask } from '../types';

const AnalysisTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<AnalysisTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchedStocks, setMatchedStocks] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchTask = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [taskRes] = await Promise.all([
        analysisTaskAPI.getAnalysisTask(Number(id)),
      ]);

      setTask(taskRes.data);

      // 如果任务完成且有匹配的股票，获取股票详情
      if (taskRes.data.status === 'completed' && taskRes.data.matched_stock_ids) {
        const stockPromises = taskRes.data.matched_stock_ids.slice(0, 50).map((stockId: number) =>
          stockAPI.getStock(stockId).catch(() => null)
        );
        const stockResults = await Promise.all(stockPromises);
        const validStocks = stockResults.filter(r => r !== null).map(r => r!.data);
        setMatchedStocks(validStocks);
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();

    // 如果任务正在运行，轮询状态
    if (task?.status === 'running' || task?.status === 'pending') {
      const interval = setInterval(fetchTask, 3000); // 每3秒刷新一次
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [id, task?.status]);

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'pending': { text: '等待中', color: 'bg-yellow-50 text-yellow-700' },
      'running': { text: '执行中', color: 'bg-blue-50 text-blue-700' },
      'completed': { text: '已完成', color: 'bg-green-50 text-green-700' },
      'failed': { text: '失败', color: 'bg-red-50 text-red-700' },
    };

    const config = statusMap[status] || { text: status, color: 'bg-gray-50 text-gray-700' };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading && !task) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="card p-6 text-center text-gray-500">
          任务不存在
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary px-3 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </button>
          {getStatusBadge(task.status)}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{task.task_name}</h1>
        <p className="text-gray-500">
          创建时间: {new Date(task.created_at).toLocaleString('zh-CN')}
        </p>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">任务信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">任务 ID</span>
              <span className="font-medium">{task.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">AI 服务</span>
              <span className="font-medium">{task.ai_provider}</span>
            </div>
            {task.started_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">开始时间</span>
                <span className="font-medium">{new Date(task.started_at).toLocaleString('zh-CN')}</span>
              </div>
            )}
            {task.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">完成时间</span>
                <span className="font-medium">{new Date(task.completed_at).toLocaleString('zh-CN')}</span>
              </div>
            )}
            {task.started_at && task.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">执行时长</span>
                <span className="font-medium">
                  {Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000)} 秒
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">分析结果</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">状态</span>
              {getStatusBadge(task.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">匹配股票数</span>
              <span className="font-medium text-2xl text-primary-600">
                {task.matched_stock_ids?.length || 0}
              </span>
            </div>
            {task.error_message && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{task.error_message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      {task.ai_reasoning && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI 推理过程</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{task.ai_reasoning}</pre>
          </div>
        </div>
      )}

      {/* AI Generated Script */}
      {task.ai_generated_script && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI 生成的分析脚本</h3>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-green-400 whitespace-pre-wrap">{task.ai_generated_script}</pre>
          </div>
        </div>
      )}

      {/* Execution Log */}
      {task.execution_log && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">执行日志</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-700">{JSON.stringify(task.execution_log, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Matched Stocks */}
      {matchedStocks.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">匹配的股票</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    股票代码
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    股票名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    价格
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    涨跌幅
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matchedStocks.map((stock) => {
                  const change = stock.change ?? 0;
                  const isPositive = change >= 0;
                  return (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{stock.code}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                        {stock.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                        {stock.price ? `¥${stock.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {stock.change !== undefined ? (
                          <span className={`font-semibold ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/stocks/${stock.id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {task.matched_stock_ids && task.matched_stock_ids.length > matchedStocks.length && (
            <p className="mt-3 text-sm text-gray-500 text-center">
              还有 {task.matched_stock_ids.length - matchedStocks.length} 只股票未显示
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisTaskDetail;
