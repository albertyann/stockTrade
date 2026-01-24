import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { tradingAPI } from '../services/api';
import { Order, OrderStatus, OrderSide } from '../types';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sideFilter, setSideFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async (page: number = currentPage) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await tradingAPI.getOrders({
        skip,
        limit: pageSize,
        status: statusFilter || undefined,
        side: sideFilter || undefined,
      });
      setOrders(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [pageSize, statusFilter, sideFilter, currentPage]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, pageSize, statusFilter, sideFilter, fetchOrders]);

  const handleCancelOrder = async (orderId: number) => {
    try {
      await tradingAPI.cancelOrder(orderId);
      message.success('订单已取消');
      fetchOrders(currentPage);
    } catch (error) {
      console.error('取消订单失败:', error);
      message.error('取消订单失败');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.FILLED:
        return 'text-success-600 bg-success-50';
      case OrderStatus.PARTIAL_FILLED:
        return 'text-primary-600 bg-primary-50';
      case OrderStatus.PENDING:
      case OrderStatus.SUBMITTED:
        return 'text-warning-600 bg-warning-50';
      case OrderStatus.CANCELLED:
        return 'text-gray-600 bg-gray-100';
      case OrderStatus.REJECTED:
      case OrderStatus.EXPIRED:
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.FILLED:
        return '已成交';
      case OrderStatus.PARTIAL_FILLED:
        return '部分成交';
      case OrderStatus.PENDING:
        return '待处理';
      case OrderStatus.SUBMITTED:
        return '已提交';
      case OrderStatus.CANCELLED:
        return '已取消';
      case OrderStatus.REJECTED:
        return '已拒绝';
      case OrderStatus.EXPIRED:
        return '已过期';
      default:
        return status;
    }
  };

  const getSideText = (side: OrderSide) => {
    return side === OrderSide.BUY ? '买入' : '卖出';
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchOrders(page);
    }
  };

  const filledOrders = orders.filter(o => o.status === OrderStatus.FILLED).length;
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.SUBMITTED).length;
  const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED).length;

  return (
    <div>
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">{orders.length}</div>
            <div className="text-sm text-gray-500">订单总数</div>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-3xl font-bold text-success-600 mb-1">{filledOrders}</div>
            <div className="text-sm text-gray-600">已成交</div>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-3xl font-bold text-warning-600 mb-1">{pendingOrders}</div>
            <div className="text-sm text-gray-600">待处理</div>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <div className="text-3xl font-bold text-gray-600 mb-1">{cancelledOrders}</div>
            <div className="text-sm text-gray-500">已取消</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">所有状态</option>
            <option value={OrderStatus.PENDING}>待处理</option>
            <option value={OrderStatus.SUBMITTED}>已提交</option>
            <option value={OrderStatus.PARTIAL_FILLED}>部分成交</option>
            <option value={OrderStatus.FILLED}>已成交</option>
            <option value={OrderStatus.CANCELLED}>已取消</option>
            <option value={OrderStatus.REJECTED}>已拒绝</option>
            <option value={OrderStatus.EXPIRED}>已过期</option>
          </select>
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">所有方向</option>
            <option value={OrderSide.BUY}>买入</option>
            <option value={OrderSide.SELL}>卖出</option>
          </select>
          <button
            onClick={() => fetchOrders(currentPage)}
            disabled={loading}
            className="btn-secondary px-6 py-2.5"
          >
            刷新
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  订单编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  股票代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  方向
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  成交数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
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
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{order.order_code}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {order.ts_code || '-'}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap font-semibold ${order.side === OrderSide.BUY ? 'text-success-600' : 'text-danger-600'}`}>
                      {getSideText(order.side)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {order.price ? `¥${order.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {order.filled_quantity} / {order.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(order.status === OrderStatus.PENDING || order.status === OrderStatus.SUBMITTED) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {orders.length > 0 && (
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
    </div>
  );
};

export default OrderList;
