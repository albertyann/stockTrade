import React from 'react';
import { Card, Typography, Space, Tag, Button } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { AnalysisRule } from '../types';

const { Title, Text } = Typography;

interface RuleCardProps {
  rule: AnalysisRule;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onEdit, onDelete, onView }) => {
  const formatConditions = (conditions: any): string => {
    if (!conditions || !conditions.conditions) return '无条件';
    
    const conditionTexts = conditions.conditions.map((condition: any) => {
      const indicatorMap: Record<string, string> = {
        price: '价格',
        volume: '成交量',
        ma20: '20日均线',
        pe: '市盈率',
        roe: '净资产收益率',
        eps: '每股收益',
        dividend_yield: '股息率'
      };
      
      const operatorMap: Record<string, string> = {
        gt: '大于',
        lt: '小于',
        gte: '大于等于',
        lte: '小于等于',
        eq: '等于',
        neq: '不等于'
      };
      
      const indicator = indicatorMap[condition.indicator] || condition.indicator;
      const operator = operatorMap[condition.operator] || condition.operator;
      
      return `${indicator} ${operator} ${condition.value}`;
    });
    
    return conditions.logic === 'AND' 
      ? conditionTexts.join(' 并且 ')
      : conditionTexts.join(' 或者 ');
  };

  return (
    <Card
      hoverable
      style={{ 
        marginBottom: 16, 
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        border: '1px solid #f0f0f0',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{rule.name}</Title>
            <div style={{ marginTop: 8 }}>
              {rule.enabled 
                ? <Tag color="success" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, fontWeight: 500 }}>启用</Tag> 
                : <Tag color="error" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, fontWeight: 500 }}>禁用</Tag>
              }
              <Tag 
                color="orange" 
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, fontWeight: 500 }}
              >
                优先级: {rule.priority}
              </Tag>
            </div>
          </div>
          <div>
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={onView}
                size="small"
                style={{ color: '#1890ff', fontWeight: 500 }}
              >
                查看
              </Button>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={onEdit}
                size="small"
                style={{ color: '#52c41a', fontWeight: 500 }}
              >
                编辑
              </Button>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={onDelete}
                size="small"
                danger
                style={{ fontWeight: 500 }}
              >
                删除
              </Button>
            </Space>
          </div>
        </div>
        
        {rule.description && (
          <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
            {rule.description}
          </Text>
        )}
        
        <div style={{ 
          marginTop: 12, 
          paddingTop: 12, 
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          padding: 12,
          borderRadius: 4
        }}>
          <Text strong style={{ fontSize: 14, color: '#262626' }}>条件:</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8, display: 'block' }}>
            {formatConditions(rule.conditions)}
          </Text>
        </div>
        
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
          创建时间: {new Date(rule.created_at).toLocaleString('zh-CN')}
          <br />
          更新时间: {new Date(rule.updated_at).toLocaleString('zh-CN')}
        </div>
      </Space>
    </Card>
  );
};

export default RuleCard;
