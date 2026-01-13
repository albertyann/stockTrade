import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Stock } from '../types';

const { Title, Text } = Typography;

interface StockCardProps {
  stock: Stock;
  onClick?: () => void;
  isUserStock?: boolean;
}

const StockCard: React.FC<StockCardProps> = ({ stock, onClick, isUserStock = false }) => {
  // 模拟股票价格和涨跌幅数据
  const price = 100.50;
  const change = 2.5;
  const isPositive = change >= 0;

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ marginBottom: 16, borderRadius: 8 }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{stock.code}</Title>
            <Text type="secondary">{stock.name}</Text>
            {isUserStock && <Tag color="blue">自选</Tag>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Title level={3} style={{ margin: 0 }}>
              ${price.toFixed(2)}
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f', marginLeft: 4 }}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </Text>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            成交量: 1,000,000
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            市值: 100亿
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            PE: 15.5
          </Text>
        </div>
        
        {stock.industry && (
          <div style={{ marginTop: 8 }}>
            <Tag color="cyan">{stock.industry}</Tag>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default StockCard;
