import React, { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Row, Col, Statistic, Button, Space, Spin, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { stockAPI, userStockAPI } from '../services/api';
import { Stock } from '../types';

const { Title, Text } = Typography;

const StockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<Stock | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStockId, setUserStockId] = useState<number | null>(null);

  const fetchStock = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [stockRes, userStocksRes] = await Promise.all([
        stockAPI.getStock(Number(id)),
        userStockAPI.getUserStocks(),
      ]);

      setStock(stockRes.data);

      const watched = userStocksRes.data.find(us => us.stock_id === Number(id));
      setIsWatched(!!watched);
      if (watched) {
        setUserStockId(watched.id);
      }
    } catch (error) {
      message.error('获取股票详情失败');
      console.error('获取股票详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleToggleWatch = async () => {
    if (!stock) return;

    try {
      if (isWatched) {
        if (userStockId) {
          await userStockAPI.deleteUserStock(userStockId);
          message.success('已从自选股中移除');
        }
      } else {
        await userStockAPI.createUserStock({ stock_id: stock.id });
        message.success('已添加到自选股');
      }
      fetchStock();
    } catch (error) {
      message.error(isWatched ? '移除失败' : '添加失败');
      console.error('操作失败:', error);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!stock) {
    return (
      <Card>
        <Text>股票不存在</Text>
      </Card>
    );
  }

  const change = stock.change ?? 0;
  const isPositive = change >= 0;
  const price = stock.price ?? 0;

  const chartOption = {
    title: {
      text: '价格走势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: Array.from({ length: 12 }, () => price * (0.9 + Math.random() * 0.2)),
        type: 'line',
        smooth: true,
        showSymbol: false
      },
    ],
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button onClick={() => navigate(-1)}>
          返回
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchStock}
          loading={loading}
        >
          刷新
        </Button>
        <Button
          type={isWatched ? 'default' : 'primary'}
          icon={isWatched ? <StarFilled /> : <StarOutlined />}
          onClick={handleToggleWatch}
        >
          {isWatched ? '已关注' : '添加自选'}
        </Button>
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} sm={16}>
            <Title level={2}>{stock.code} - {stock.name}</Title>
            <Space size={24}>
              <Text type="secondary">市场: {stock.market}</Text>
              <Text type="secondary">行业: {stock.industry}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Title level={2} type={isPositive ? 'success' : 'danger'}>
              ¥{price.toFixed(2)}
            </Title>
            <Text type={isPositive ? 'success' : 'danger'}>
              {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="开盘价" value={price * 0.98} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="最高价" value={price * 1.02} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="最低价" value={price * 0.99} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="成交量" value={(Math.random() * 10 + 1).toFixed(2)} suffix="亿" />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 16 }}>价格走势</Title>
        <ReactECharts option={chartOption} style={{ height: 400 }} />
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="公司简介" style={{ height: '100%' }}>
            <Text>{stock.description || '暂无公司简介信息'}</Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="财务指标" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="市盈率(PE)" value={(Math.random() * 30 + 5).toFixed(2)} />
              </Col>
              <Col span={12}>
                <Statistic title="市净率(PB)" value={(Math.random() * 5 + 1).toFixed(2)} />
              </Col>
              <Col span={12}>
                <Statistic title="净资产收益率(ROE)" value={(Math.random() * 20 + 5).toFixed(2)} suffix="%" />
              </Col>
              <Col span={12}>
                <Statistic title="每股收益(EPS)" value={(Math.random() * 5 + 0.5).toFixed(2)} />
              </Col>
              <Col span={12}>
                <Statistic title="股息率" value={(Math.random() * 5 + 0.5).toFixed(2)} suffix="%" />
              </Col>
              <Col span={12}>
                <Statistic title="总市值" value={`${(Math.random() * 1000 + 100).toFixed(0)}亿`} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StockDetail;
