import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Row, Col, Statistic, Button, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SyncOutlined, BellOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import StockCard from '../components/StockCard';
import { userStockAPI } from '../services/api';
import { UserStock } from '../types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchUserStocks();
  }, []);

  const marketOverview = [
    { title: '上证指数', value: '3200.50', change: 1.2, positive: true },
    { title: '深证成指', value: '11500.80', change: -0.8, positive: false },
    { title: '创业板指', value: '2450.30', change: 2.5, positive: true },
    { title: '科创50', value: '1050.20', change: -1.5, positive: false },
  ];

  const hotStocks = [
    { code: 'AAPL', name: '苹果公司', price: 150.20, change: 1.8, volume: 25000000 },
    { code: 'TSLA', name: '特斯拉', price: 230.50, change: -2.3, volume: 32000000 },
    { code: 'MSFT', name: '微软', price: 380.10, change: 0.9, volume: 18000000 },
    { code: 'AMZN', name: '亚马逊', price: 135.80, change: -0.5, volume: 20000000 },
  ];

  const analysisResults = [
    { key: '1', stockCode: 'AAPL', ruleName: '价格突破20日均线', matched: true, time: '2023-06-15 10:30' },
    { key: '2', stockCode: 'TSLA', ruleName: '成交量放大', matched: false, time: '2023-06-15 09:45' },
    { key: '3', stockCode: 'MSFT', ruleName: 'RSI超卖', matched: true, time: '2023-06-14 14:20' },
    { key: '4', stockCode: 'AMZN', ruleName: 'MACD金叉', matched: true, time: '2023-06-14 11:15' },
  ];

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

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      textStyle: {
        color: '#262626'
      }
    },
    legend: {
      data: ['AAPL', 'TSLA', 'MSFT', 'AMZN'],
      bottom: 10,
      padding: [20, 0, 0, 0],
      itemGap: 30,
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
        color: '#595959'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
      axisLine: {
        lineStyle: {
          color: '#d9d9d9'
        }
      },
      axisLabel: {
        color: '#595959',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      min: 130,
      max: 400,
      axisLine: {
        lineStyle: {
          color: '#d9d9d9'
        }
      },
      axisLabel: {
        color: '#595959',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'AAPL',
        type: 'line',
        smooth: true,
        data: [148.5, 149.2, 149.8, 150.5, 151.2, 150.8, 151.5, 152.0, 151.8, 152.2],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(24, 144, 255, 0.5)'
        },
        itemStyle: {
          color: '#1890ff',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(24, 144, 255, 0.3)'
            }, {
              offset: 1, color: 'rgba(24, 144, 255, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
      {
        name: 'TSLA',
        type: 'line',
        smooth: true,
        data: [232.5, 233.2, 234.0, 233.5, 233.0, 232.8, 232.5, 232.0, 231.5, 231.8],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(250, 173, 20, 0.5)'
        },
        itemStyle: {
          color: '#faad14',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(250, 173, 20, 0.3)'
            }, {
              offset: 1, color: 'rgba(250, 173, 20, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
      {
        name: 'MSFT',
        type: 'line',
        smooth: true,
        data: [378.5, 379.0, 379.5, 380.0, 380.5, 381.0, 381.5, 382.0, 381.8, 382.2],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(82, 196, 26, 0.5)'
        },
        itemStyle: {
          color: '#52c41a',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(82, 196, 26, 0.3)'
            }, {
              offset: 1, color: 'rgba(82, 196, 26, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
      {
        name: 'AMZN',
        type: 'line',
        smooth: true,
        data: [135.0, 135.2, 135.5, 135.8, 136.0, 135.8, 135.5, 135.2, 135.0, 134.8],
        lineStyle: { 
          width: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(19, 194, 194, 0.5)'
        },
        itemStyle: {
          color: '#13c2c2',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(19, 194, 194, 0.3)'
            }, {
              offset: 1, color: 'rgba(19, 194, 194, 0.05)'
            }]
          }
        },
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          scale: true
        }
      },
    ],
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, fontWeight: 700 }}>仪表盘</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>股票数据概览和实时分析</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {marketOverview.map((item, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <Card className="statistic-card" hoverable>
              <Statistic
                title={item.title}
                value={parseFloat(item.value)}
                precision={2}
                valueStyle={{ 
                  color: item.positive ? '#52c41a' : '#ff4d4f',
                  fontWeight: 700,
                  fontSize: 32,
                }}
                prefix={item.positive 
                  ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> 
                  : <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                }
                suffix={
                  <Tag 
                    color={item.positive ? 'success' : 'error'}
                    style={{ 
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    {item.positive ? '+' : ''}{item.change.toFixed(1)}%
                  </Tag>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="chart-card" style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>股票价格走势</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>实时追踪主要股票价格变化</Text>
          </div>
          <Button 
            icon={<SyncOutlined />} 
            onClick={fetchUserStocks} 
            loading={loading}
            type="primary"
          >
            刷新数据
          </Button>
        </Space>
        <ReactECharts option={chartOption} style={{ height: 420 }} />
      </Card>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} className="section-title">热门股票</Title>
        <Row gutter={[16, 16]}>
          {hotStocks.map((stock, index) => (
            <Col key={index} xs={24} sm={12} lg={6}>
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
                  price: stock.price,
                  change: stock.change,
                }}
                onClick={() => console.log('查看股票详情:', stock.code)}
              />
            </Col>
          ))}
        </Row>
      </div>

      <Card className="table-card">
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>规则分析结果</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>实时监控的股票分析规则匹配情况</Text>
          </div>
          <Button icon={<BellOutlined />} type="default">通知</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={analysisResults}
          pagination={{ pageSize: 5, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          bordered={false}
          size="middle"
          rowKey="key"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
