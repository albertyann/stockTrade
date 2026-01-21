import React, { useEffect, useState, useCallback } from 'react';
import { syncTaskAPI } from '../services/api';
import { SyncTask, SyncExecutionLog } from '../types';
import { Play, Pause, RefreshCw, Clock, FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2, Database } from 'lucide-react';

const mockTasks: SyncTask[] = [
  {
    id: 1,
    task_name: '每日股票行情同步',
    interface_id: 1,
    interface: {
      id: 1,
      interface_name: 'daily',
      description: '日线行情数据',
      interface_params: {},
      data_model: 'StockDaily',
      enabled: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    schedule_type: 'cron',
    schedule_config: {
      cron: '0 15 * * 1-5',
    },
    task_params: {
      trade_date: '',
    },
    retry_policy: {
      max_retries: 3,
      backoff_factor: 2,
    },
    status: 'active',
    last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    last_run_status: 'success',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    task_name: '每日基础数据同步',
    interface_id: 2,
    interface: {
      id: 2,
      interface_name: 'daily_basic',
      description: '每日基础指标',
      interface_params: {},
      data_model: 'StockDailyBasic',
      enabled: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    schedule_type: 'cron',
    schedule_config: {
      cron: '0 18 * * 1-5',
    },
    task_params: {},
    retry_policy: {
      max_retries: 3,
      backoff_factor: 2,
    },
    status: 'active',
    last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    last_run_status: 'success',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    task_name: '财务数据同步',
    interface_id: 3,
    interface: {
      id: 3,
      interface_name: 'income',
      description: '利润表数据',
      interface_params: {},
      data_model: 'FinancialStatement',
      enabled: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    schedule_type: 'date',
    schedule_config: {
      run_date: '2024-01-01 00:00:00',
    },
    task_params: {},
    retry_policy: {
      max_retries: 3,
      backoff_factor: 2,
    },
    status: 'paused',
    last_run_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_run_status: 'success',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    task_name: '实时行情同步',
    interface_id: 4,
    interface: {
      id: 4,
      interface_name: 'realtime',
      description: '实时行情数据',
      interface_params: {},
      data_model: 'StockRealtime',
      enabled: true,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    schedule_type: 'interval',
    schedule_config: {
      seconds: 30,
    },
    task_params: {},
    retry_policy: {
      max_retries: 5,
      backoff_factor: 1.5,
    },
    status: 'error',
    last_run_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    last_run_status: 'failed',
    last_error_message: 'API 请求超时: 连接 tushare 接口失败，网络响应时间超过 30 秒',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    task_name: '现金流数据同步',
    interface_id: 5,
    interface: {
      id: 5,
      interface_name: 'cashflow',
      description: '现金流量表数据',
      interface_params: {},
      data_model: 'CashFlowStatement',
      enabled: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    schedule_type: 'cron',
    schedule_config: {
      cron: '0 2 1 * *',
    },
    task_params: {},
    retry_policy: {
      max_retries: 3,
      backoff_factor: 2,
    },
    status: 'active',
    last_run_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    last_run_status: 'success',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockTaskLogs: Record<number, SyncExecutionLog[]> = {
  1: [
    {
      id: 1,
      task_id: 1,
      execution_type: 'scheduled',
      started_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 1 * 60 * 60 * 1000 + 45 * 1000).toISOString(),
      status: 'success',
      records_processed: 5234,
      error_message: undefined,
      output_summary: {
        total_stocks: 5234,
        success_count: 5234,
        failed_count: 0,
      },
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      task_id: 1,
      execution_type: 'scheduled',
      started_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 25 * 60 * 60 * 1000 + 42 * 1000).toISOString(),
      status: 'success',
      records_processed: 5189,
      error_message: undefined,
      output_summary: {
        total_stocks: 5189,
        success_count: 5189,
        failed_count: 0,
      },
      created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      task_id: 1,
      execution_type: 'manual',
      started_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 30 * 60 * 60 * 1000 + 48 * 1000).toISOString(),
      status: 'success',
      records_processed: 5156,
      error_message: undefined,
      output_summary: {
        total_stocks: 5156,
        success_count: 5156,
        failed_count: 0,
      },
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    },
  ],
  2: [
    {
      id: 4,
      task_id: 2,
      execution_type: 'scheduled',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 38 * 1000).toISOString(),
      status: 'success',
      records_processed: 5234,
      error_message: undefined,
      output_summary: {
        total_stocks: 5234,
        success_count: 5234,
        failed_count: 0,
      },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  4: [
    {
      id: 5,
      task_id: 4,
      execution_type: 'retry',
      started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 30 * 60 * 1000 + 31 * 1000).toISOString(),
      status: 'failed',
      records_processed: 0,
      error_message: 'API 请求超时: 连接 tushare 接口失败，网络响应时间超过 30 秒',
      output_summary: {
        error: 'timeout',
        retry_count: 2,
      },
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 6,
      task_id: 4,
      execution_type: 'retry',
      started_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 32 * 60 * 1000 + 29 * 1000).toISOString(),
      status: 'failed',
      records_processed: 0,
      error_message: 'API 请求超时: 连接 tushare 接口失败，网络响应时间超过 30 秒',
      output_summary: {
        error: 'timeout',
        retry_count: 1,
      },
      created_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    },
  ],
  5: [
    {
      id: 7,
      task_id: 5,
      execution_type: 'scheduled',
      started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 15 * 1000).toISOString(),
      status: 'success',
      records_processed: 4892,
      error_message: undefined,
      output_summary: {
        total_stocks: 4892,
        success_count: 4892,
        failed_count: 0,
      },
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const SyncTasks: React.FC = () => {
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [taskLogs, setTaskLogs] = useState<Record<number, SyncExecutionLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<number, boolean>>({});

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await syncTaskAPI.getTasks();
      if (response.data && response.data.length > 0) {
        setTasks(response.data);
      } else {
        setTasks(mockTasks);
      }
    } catch (error) {
      console.error('获取同步任务失败:', error);
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setTimeout(() => setRefreshing(false), 500);
  };

  const fetchTaskLogs = async (taskId: number) => {
    if (taskLogs[taskId] && taskLogs[taskId].length > 0) {
      return;
    }

    setLoadingLogs(prev => ({ ...prev, [taskId]: true }));
    try {
      const response = await syncTaskAPI.getTaskLogs(taskId, 0, 10);
      if (response.data && response.data.length > 0) {
        setTaskLogs(prev => ({ ...prev, [taskId]: response.data }));
      } else {
        setTaskLogs(prev => ({ ...prev, [taskId]: mockTaskLogs[taskId] || [] }));
      }
    } catch (error) {
      console.error('获取任务日志失败:', error);
      setTaskLogs(prev => ({ ...prev, [taskId]: mockTaskLogs[taskId] || [] }));
    } finally {
      setLoadingLogs(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handlePauseTask = async (taskId: number) => {
    try {
      await syncTaskAPI.pauseTask(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('暂停任务失败:', error);
    }
  };

  const handleResumeTask = async (taskId: number) => {
    try {
      await syncTaskAPI.resumeTask(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('恢复任务失败:', error);
    }
  };

  const handleTriggerTask = async (taskId: number) => {
    try {
      await syncTaskAPI.triggerTask(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('触发任务失败:', error);
    }
  };

  const handleExpandTask = async (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      await fetchTaskLogs(taskId);
    }
  };

  const handleInitData = async () => {
    setLoading(true);
    try {
      await syncTaskAPI.initData();
      await fetchTasks();
    } catch (error) {
      console.error('初始化数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string; icon: React.ReactNode } } = {
      'active': { text: '运行中', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
      'paused': { text: '已暂停', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Pause className="w-3.5 h-3.5" /> },
      'error': { text: '错误', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    };

    const config = statusMap[status] || { text: status, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: <Clock className="w-3.5 h-3.5" /> };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getRunStatusBadge = (status?: string) => {
    if (!status) return '-';

    const statusMap: { [key: string]: { text: string; color: string } } = {
      'success': { text: '成功', color: 'bg-green-50 text-green-700' },
      'failed': { text: '失败', color: 'bg-red-50 text-red-700' },
      'running': { text: '执行中', color: 'bg-blue-50 text-blue-700' },
    };

    const config = statusMap[status] || { text: status, color: 'bg-gray-50 text-gray-700' };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getScheduleDisplay = (task: SyncTask) => {
    const { schedule_type, schedule_config } = task;
    if (schedule_type === 'cron') {
      return schedule_config.cron || '-';
    } else if (schedule_type === 'interval') {
      return `每 ${schedule_config.seconds || schedule_config.minutes || schedule_config.hours} 秒/分/时`;
    } else if (schedule_type === 'date') {
      return schedule_config.run_date || '-';
    }
    return '-';
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">总任务数</p>
              <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">运行中</p>
              <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">已暂停</p>
              <p className="text-2xl font-bold text-yellow-600">{tasks.filter(t => t.status === 'paused').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Pause className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">错误</p>
              <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'error').length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">同步任务列表</h3>
          <div className="flex items-center gap-2">
            {tasks.length === 0 && (
              <button
                onClick={handleInitData}
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                title="初始化演示数据"
              >
                <Database className="w-4 h-4" />
                初始化数据
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-3" />
            加载中...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="mb-3">暂无同步任务</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-slate-200 rounded-lg overflow-hidden hover:border-primary-300 transition-colors"
              >
                <div className="p-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-slate-900">
                            #{task.id} {task.task_name}
                          </h4>
                          {getStatusBadge(task.status)}
                          {task.last_run_status && getRunStatusBadge(task.last_run_status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getScheduleDisplay(task)}
                          </span>
                          {task.next_run_at && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-4 h-4" />
                              下次运行: {new Date(task.next_run_at).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'active' ? (
                          <button
                            onClick={() => handlePauseTask(task.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="暂停任务"
                          >
                            <Pause className="w-4 h-4" />
                            暂停
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResumeTask(task.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="恢复任务"
                          >
                            <Play className="w-4 h-4" />
                            恢复
                          </button>
                        )}
                        <button
                          onClick={() => handleTriggerTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="手动触发"
                        >
                          <RefreshCw className="w-4 h-4" />
                          触发
                        </button>
                        <button
                          onClick={() => handleExpandTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="查看日志"
                        >
                          {expandedTaskId === task.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {expandedTaskId === task.id ? '收起' : '日志'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedTaskId === task.id && (
                  <div className="p-4 bg-white border-t border-slate-200">
                    {task.last_error_message && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900 mb-1">错误信息</p>
                            <p className="text-sm text-red-700">{task.last_error_message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <h5 className="text-sm font-semibold text-slate-900 mb-3">执行日志</h5>
                    {loadingLogs[task.id] ? (
                      <div className="py-6 text-center text-slate-500">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                        加载日志中...
                      </div>
                    ) : taskLogs[task.id]?.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-sm">
                        暂无执行日志
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                执行时间
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                类型
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                状态
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                处理记录数
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                耗时
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {taskLogs[task.id]?.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600">
                                  {new Date(log.started_at).toLocaleString('zh-CN')}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm">
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                                    log.execution_type === 'manual' ? 'bg-blue-50 text-blue-700' :
                                    log.execution_type === 'scheduled' ? 'bg-green-50 text-green-700' :
                                    'bg-yellow-50 text-yellow-700'
                                  }`}>
                                    {log.execution_type === 'manual' ? '手动' :
                                     log.execution_type === 'scheduled' ? '定时' : '重试'}
                                  </span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {getRunStatusBadge(log.status)}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-900 font-medium">
                                  {log.records_processed}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600">
                                  {log.finished_at
                                    ? `${Math.floor((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)} 秒`
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>共 {tasks.length} 条任务</span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              每30秒自动刷新
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncTasks;
