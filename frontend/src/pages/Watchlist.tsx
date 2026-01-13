import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Typography, Popconfirm, Empty } from 'antd';
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userStockAPI } from '../services/api';
import { UserStock } from '../types';

const { Title, Text } = Typography;

const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserStocks = async () => {
    setLoading(true);
    try {
      const response = await userStockAPI.getUserStocks();
      setUserStocks(response.data);
    } catch (error) {
      message.error('获取自选股失败');
      console.error('获取自选股失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStocks();
  }, []);

  const handleAddStock = () => {
    navigate('/stocks');
    message.info('请从股票列表中添加自选股');
  };

  const handleRemoveStock = async (id: number) => {
    try {
      await userStockAPI.deleteUserStock(id);
      message.success('已删除自选股');
      fetchUserStocks();
    } catch (error) {
      message.error('删除失败');
      console.error('删除失败:', error);
    }
  };

  const columns = [
    {
      title: '股票代码',
      dataIndex: ['stock', 'code'],
      key: 'code',
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: '股票名称',
      dataIndex: ['stock', 'name'],
      key: 'name',
    },
    {
      title: '市场',
      dataIndex: ['stock', 'market'],
      key: 'market',
      render: (market: string) => <span style={{ color: '#1890ff' }}>{market}</span>,
    },
    {
      title: '行业',
      dataIndex: ['stock', 'industry'],
      key: 'industry',
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserStock) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/stocks/${record.stock.id}`)}
          >
            查看详情
          </Button>
          <Popconfirm
            title="确定要删除该自选股吗？"
            onConfirm={() => handleRemoveStock(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, fontWeight: 700 }}>自选股管理</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>管理您关注的股票</Text>
      </div>

      <Card>
        <Space style={{ marginBottom: 20, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStock} size="large">
              添加自选股
            </Button>
          </Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchUserStocks} 
            loading={loading}
            size="large"
          >
            刷新
          </Button>
        </Space>

        {userStocks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ fontSize: 15 }}>
                暂无自选股，<Button type="link" onClick={() => navigate('/stocks')} style={{ fontSize: 15, fontWeight: 500 }}>去添加</Button>
              </div>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={userStocks}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 只`,
            }}
            bordered={false}
          />
        )}
      </Card>
    </div>
  );
};

export default Watchlist;
