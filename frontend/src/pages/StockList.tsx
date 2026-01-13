import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Tag, message, Card, Typography, Row, Col, Statistic } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { stockAPI } from '../services/api';
import { Stock } from '../types';

const { Title, Text } = Typography;
const { Search } = Input;

const StockList: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await stockAPI.getStocks({ skip: 0, limit: 100 });
      setStocks(response.data);
    } catch (error) {
      message.error('获取股票列表失败');
      console.error('获取股票列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const columns = [
    {
      title: '股票代码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '市场',
      dataIndex: 'market',
      key: 'market',
      render: (market: string) => <Tag color="blue">{market}</Tag>,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (industry: string) => <Tag color="cyan">{industry}</Tag>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price?: number) => price ? `¥${price.toFixed(2)}` : '-',
    },
    {
      title: '涨跌幅',
      dataIndex: 'change',
      key: 'change',
      render: (change?: number) => {
        if (!change) return '-';
        const color = change >= 0 ? '#10B981' : '#EF4444';
        return <Text style={{ color, fontWeight: 600 }}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Stock) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/stocks/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const filteredStocks = stocks.filter(stock =>
    stock.code.toLowerCase().includes(searchText.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>股票列表</Title>
        <Text type="secondary" style={{ fontSize: 15, color: '#64748B' }}>查看和管理所有股票信息</Text>
      </div>

      <Card className="glass-card" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic 
              title="股票总数" 
              value={stocks.length}
              valueStyle={{ fontWeight: 700, fontSize: 28, color: '#0F172A' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="今日上涨" 
              value={stocks.filter(s => s.change && s.change > 0).length} 
              valueStyle={{ color: '#10B981', fontWeight: 700, fontSize: 28 }}
              prefix="📈"
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="今日下跌" 
              value={stocks.filter(s => s.change && s.change < 0).length} 
              valueStyle={{ color: '#EF4444', fontWeight: 700, fontSize: 28 }}
              prefix="📉"
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="平盘" 
              value={stocks.filter(s => !s.change || s.change === 0).length}
              valueStyle={{ fontWeight: 700, fontSize: 28, color: '#64748B' }}
              prefix="➖"
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Space style={{ marginBottom: 20, width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="搜索股票代码或名称"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 320 }}
            size="large"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchStocks} 
            loading={loading}
            type="default"
            size="large"
          >
            刷新
          </Button>
        </Space>
        <Table
          columns={columns}
          dataSource={filteredStocks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          bordered={false}
        />
      </Card>
    </div>
  );
};

export default StockList;
