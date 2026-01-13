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
  const price = stock.price ?? 100.50;
  const change = stock.change ?? 2.5;
  const isPositive = change >= 0;

  return (
    <Card
      hoverable
      onClick={onClick}
      className="stock-card"
      style={{ marginBottom: 16, borderRadius: 8, height: '100%' }}
      bodyStyle={{ padding: 20 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{stock.code}</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>{stock.name}</Text>
            {isUserStock && <Tag color="blue" style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, borderRadius: 4 }}>自选</Tag>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Title level={3} style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              ¥{price.toFixed(2)}
            </Title>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
              {isPositive 
                ? <ArrowUpOutlined style={{ color: '#52c41a', fontWeight: 600 }} /> 
                : <ArrowDownOutlined style={{ color: '#ff4d4f', fontWeight: 600 }} />
              }
              <span style={{ 
                color: isPositive ? '#52c41a' : '#ff4d4f', 
                marginLeft: 4, 
                fontWeight: 700,
                fontSize: 15
              }}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </Text>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 12, 
          paddingTop: 12, 
          borderTop: '1px solid #f0f0f0' 
        }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
            成交量: {(Math.random() * 10 + 1).toFixed(2)}亿
          </Text>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
            市值: {(Math.random() * 1000 + 100).toFixed(0)}亿
          </Text>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
            PE: {(Math.random() * 30 + 5).toFixed(1)}
          </Text>
        </div>
        
        {stock.industry && (
          <div style={{ marginTop: 8 }}>
            <Tag 
              color="cyan" 
              style={{ 
                fontSize: 12, 
                padding: '2px 10px', 
                borderRadius: 4, 
                fontWeight: 500 
              }}
            >
              {stock.industry}
            </Tag>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default StockCard;
