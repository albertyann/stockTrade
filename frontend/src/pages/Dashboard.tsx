import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Row, Col, Statistic, Button, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SyncOutlined, BellOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import StockCard from '../components/StockCard';
import { userStockAPI } from '../services/api';
import { UserStock } from '../types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchUserStocks();
  }, []);
  
  const fetchUserStocks = async () => {
    setLoading(true);
    try {
      const response = await userStockAPI.getUserStocks();
      setUserStocks(response.data);
    } catch (error) {
      console.error('获取用户自选股失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 模拟市场概览数据
  const marketOverview = [
    { title: '上证指数', value: '3200.50', change: 1.2, positive: true },
    { title: '深证成指', value: '11500.80', change: -0.8, positive: false },
    { title: '创业板指', value: '2450.30', change: 2.5, positive: true },
    { title: '科创50', value: '1050.20', change: -1.5, positive: false },
  ];
  
  // 模拟热门股票数据
  const hotStocks = [
    { code: 'AAPL', name: '苹果公司', price: 150.20, change: 1.8, volume: 25000000 },
    { code: 'TSLA', name: '特斯拉', price: 230.50, change: -2.3, volume: 32000000 },
    { code: 'MSFT', name: '微软', price: 380.10, change: 0.9, volume: 18000000 },
    { code: 'AMZN', name: '亚马逊', price: 135.80, change: -0.5, volume: 20000000 },
  ];
  
  // 模拟分析结果数据
  const analysisResults = [
    { key: '1', stockCode: 'AAPL', ruleName: '价格突破20日均线', matched: true, time: '2023-06-15 10:30' },
    { key: '2', stockCode: 'TSLA', ruleName: '成交量放大', matched: false, time: '2023-06-15 09:45' },
    { key: '3', stockCode: 'MSFT', ruleName: 'RSI超卖', matched: true, time: '2023-06-14 14:20' },
    { key: '4', stockCode: 'AMZN', ruleName: 'MACD金叉', matched: true, time: '2023-06-14 11:15' },
  ];
  
  // 表格列配置
  const columns = [
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '匹配规则',
      dataIndex: 'ruleName',
      key: 'ruleName',
    },
    {
      title: '匹配结果',
      dataIndex: 'matched',
      key: 'matched',
      render: (matched: boolean) => (
        <Tag color={matched ? 'green' : 'red'}>
          {matched ? '匹配成功' : '未匹配'}
        </Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
  ];
  
  // 图表配置
  const chartOption = {
    title: {
      text: '股票价格走势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['AAPL', 'TSLA', 'MSFT', 'AMZN'],
      bottom: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
    },
    yAxis: {
      type: 'value',
      min: 130,
      max: 400,
    },
    series: [
      {
        name: 'AAPL',
        type: 'line',
        smooth: true,
        data: [148.5, 149.2, 149.8, 150.5, 151.2, 150.8, 151.5, 152.0, 151.8, 152.2],
      },
      {
        name: 'TSLA',
        type: 'line',
        smooth: true,
        data: [232.5, 233.2, 234.0, 233.5, 233.0, 232.8, 232.5, 232.0, 231.5, 231.8],
      },
      {
        name: 'MSFT',
        type: 'line',
        smooth: true,
        data: [378.5, 379.0, 379.5, 380.0, 380.5, 381.0, 381.5, 382.0, 381.8, 382.2],
      },
      {
        name: 'AMZN',
        type: 'line',
        smooth: true,
        data: [135.0, 135.2, 135.5, 135.8, 136.0, 135.8, 135.5, 135.2, 135.0, 134.8],
      },
    ],
  };
  
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>仪表盘</Title>
        <Space>
          <Button icon={<SyncOutlined />} onClick={fetchUserStocks} loading={loading}>
            刷新数据
          </Button>
          <Button icon={<BellOutlined />}>通知</Button>
        </Space>
      </div>
      
      {/* 市场概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {marketOverview.map((item, index) => (
          <Col key={index} xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={item.title}
                value={parseFloat(item.value)}
                precision={2}
                valueStyle={{ color: item.positive ? '#52c41a' : '#ff4d4f' }}
                prefix={item.positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix={
                  <Tag color={item.positive ? 'green' : 'red'}>
                    {item.positive ? '+' : ''}{item.change.toFixed(1)}%
                  </Tag>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* 图表区域 */}
      <Card style={{ marginBottom: 24 }}>
        <ReactECharts option={chartOption} style={{ height: 400 }} />
      </Card>
      
      {/* 热门股票 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 16 }}>热门股票</Title>
        <Row gutter={16}>
          {hotStocks.map((stock, index) => (
            <Col key={index} xs={24} sm={12} md={6}>
              <StockCard
                stock={{
                  id: index,
                  code: stock.code,
                  name: stock.name,
                  market: 'US',
                  industry: '科技',
                  description: '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
                onClick={() => console.log('查看股票详情:', stock.code)}
              />
            </Col>
          ))}
        </Row>
      </div>
      
      {/* 规则分析结果 */}
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>规则分析结果</Title>
        <Table
          columns={columns}
          dataSource={analysisResults}
          pagination={{ pageSize: 5 }}
          bordered={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
