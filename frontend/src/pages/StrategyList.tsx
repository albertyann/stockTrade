import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { quantStrategyAPI } from '../services/api';
import { QuantStrategy, QuantStrategyCreate, QuantStrategyUpdate, StrategyType, StrategyFrequency, StrategyStatus } from '../types';

const StrategyList: React.FC = () => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<QuantStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<QuantStrategy | null>(null);
  const [formData, setFormData] = useState<QuantStrategyCreate>({
    strategy_code: '',
    name: '',
    description: '',
    strategy_type: StrategyType.CUSTOM,
    frequency: StrategyFrequency.DAY_1,
    status: StrategyStatus.DRAFT,
    is_active: 0,
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchStrategies = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await quantStrategyAPI.getStrategies({
        skip,
        limit: pageSize,
        search: searchText,
        status: statusFilter || undefined,
      });
      setStrategies(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('获取策略列表失败:', error);
      message.error('获取策略列表失败');
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchText, statusFilter, currentPage]);

  useEffect(() => {
    fetchStrategies(currentPage);
  }, [currentPage, pageSize, searchText, statusFilter, fetchStrategies]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStrategies(1);
  };

  const handleCreate = () => {
    setEditingStrategy(null);
    setFormData({
      strategy_code: `STRATEGY_${Date.now()}`,
      name: '',
      description: '',
      strategy_type: StrategyType.CUSTOM,
      frequency: StrategyFrequency.DAY_1,
      status: StrategyStatus.DRAFT,
      is_active: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (strategy: QuantStrategy) => {
    setEditingStrategy(strategy);
    setFormData({
      strategy_code: strategy.strategy_code,
      name: strategy.name,
      description: strategy.description,
      strategy_type: strategy.strategy_type,
      frequency: strategy.frequency,
      status: strategy.status,
      is_active: strategy.is_active,
      max_position_value: strategy.max_position_value,
      max_single_stock_ratio: strategy.max_single_stock_ratio,
      stop_loss_ratio: strategy.stop_loss_ratio,
      take_profit_ratio: strategy.take_profit_ratio,
    });
    setModalVisible(true);
  };

  const handleDelete = async (strategyId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个策略吗？此操作无法撤销。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await quantStrategyAPI.deleteStrategy(strategyId);
          message.success('策略删除成功');
          fetchStrategies(currentPage);
        } catch (error) {
          console.error('删除策略失败:', error);
          message.error('删除策略失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      message.error('请输入策略名称');
      return;
    }
    if (!formData.strategy_code.trim()) {
      message.error('请输入策略代码');
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingStrategy) {
        await quantStrategyAPI.updateStrategy(editingStrategy.id, formData);
        message.success('策略更新成功');
      } else {
        await quantStrategyAPI.createStrategy(formData);
        message.success('策略创建成功');
      }
      setModalVisible(false);
      fetchStrategies(currentPage);
    } catch (error) {
      console.error('保存策略失败:', error);
      message.error('保存策略失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExecute = async (strategyId: number) => {
    try {
      await quantStrategyAPI.executeStrategy(strategyId, { dry_run: true });
      message.success('策略执行成功（模拟运行）');
      fetchStrategies(currentPage);
    } catch (error) {
      console.error('执行策略失败:', error);
      message.error('执行策略失败');
    }
  };

  const getStatusColor = (status: StrategyStatus) => {
    switch (status) {
      case StrategyStatus.RUNNING:
        return 'text-success-600 bg-success-50';
      case StrategyStatus.PAUSED:
        return 'text-warning-600 bg-warning-50';
      case StrategyStatus.STOPPED:
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: StrategyStatus) => {
    switch (status) {
      case StrategyStatus.RUNNING:
        return '运行中';
      case StrategyStatus.PAUSED:
        return '已暂停';
      case StrategyStatus.STOPPED:
        return '已停止';
      case StrategyStatus.ARCHIVED:
        return '已归档';
      default:
        return '草稿';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchStrategies(page);
    }
  };

  const activeStrategies = strategies.filter(s => s.status === StrategyStatus.RUNNING).length;
  const pausedStrategies = strategies.filter(s => s.status === StrategyStatus.PAUSED).length;
  const draftStrategies = strategies.filter(s => s.status === StrategyStatus.DRAFT).length;

  return (
    <div>
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-1">{strategies.length}</div>
            <div className="text-sm text-gray-600">策略总数</div>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-3xl font-bold text-success-600 mb-1">{activeStrategies}</div>
            <div className="text-sm text-gray-600">运行中</div>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-3xl font-bold text-warning-600 mb-1">{pausedStrategies}</div>
            <div className="text-sm text-gray-600">已暂停</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600 mb-1">{draftStrategies}</div>
            <div className="text-sm text-gray-500">草稿</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索策略代码或名称"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">所有状态</option>
            <option value={StrategyStatus.DRAFT}>草稿</option>
            <option value={StrategyStatus.RUNNING}>运行中</option>
            <option value={StrategyStatus.PAUSED}>已暂停</option>
            <option value={StrategyStatus.STOPPED}>已停止</option>
            <option value={StrategyStatus.ARCHIVED}>已归档</option>
          </select>
          <button
            onClick={() => fetchStrategies(currentPage)}
            disabled={loading}
            className="btn-secondary px-6 py-2.5"
          >
            刷新
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary px-6 py-2.5"
          >
            创建策略
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  策略代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  策略名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  频率
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  激活
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </td>
                </tr>
              ) : strategies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    暂无策略数据
                  </td>
                </tr>
              ) : (
                strategies.map((strategy) => (
                  <tr key={strategy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{strategy.strategy_code}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {strategy.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                        {strategy.strategy_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {strategy.frequency}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${getStatusColor(strategy.status)}`}>
                        {getStatusText(strategy.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {strategy.is_active ? (
                        <span className="inline-flex items-center gap-1 text-success-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          是
                        </span>
                      ) : (
                        <span className="text-gray-400">否</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {new Date(strategy.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExecute(strategy.id)}
                          disabled={strategy.status !== StrategyStatus.RUNNING}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          执行
                        </button>
                        <button
                          onClick={() => navigate(`/strategies/${strategy.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          详情
                        </button>
                        <button
                          onClick={() => handleEdit(strategy)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-warning-600 hover:text-warning-700 hover:bg-warning-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(strategy.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {strategies.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>共 {total} 条，第 {currentPage} / {totalPages} 页</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-3 py-1.5">{currentPage} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={editingStrategy ? '编辑策略' : '创建策略'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略代码</label>
            <input
              type="text"
              value={formData.strategy_code}
              onChange={(e) => setFormData({ ...formData, strategy_code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="STRATEGY_001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="双均线策略"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="策略说明..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略类型</label>
            <select
              value={formData.strategy_type}
              onChange={(e) => setFormData({ ...formData, strategy_type: e.target.value as StrategyType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={StrategyType.MA_CROSS}>双均线策略</option>
              <option value={StrategyType.RSI_OVERSOLD}>RSI超卖策略</option>
              <option value={StrategyType.BOLLINGER_BAND}>布林带策略</option>
              <option value={StrategyType.CUSTOM}>自定义策略</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">运行频率</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as StrategyFrequency })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={StrategyFrequency.MIN_5}>5分钟</option>
              <option value={StrategyFrequency.MIN_15}>15分钟</option>
              <option value={StrategyFrequency.MIN_30}>30分钟</option>
              <option value={StrategyFrequency.HOUR_1}>1小时</option>
              <option value={StrategyFrequency.DAY_1}>1天</option>
              <option value={StrategyFrequency.WEEK_1}>1周</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">初始状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StrategyStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={StrategyStatus.DRAFT}>草稿</option>
              <option value={StrategyStatus.RUNNING}>运行中</option>
              <option value={StrategyStatus.PAUSED}>已暂停</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">是否激活</label>
            <select
              value={(formData.is_active ?? 0).toString()}
              onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="0">否</option>
              <option value="1">是</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StrategyList;
