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
    <Card hoverable style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={4}>{rule.name}</Title>
            <div style={{ marginTop: 8 }}>
              {rule.enabled 
                ? <Tag color="success">启用</Tag> 
                : <Tag>禁用</Tag>
              }
              <Tag color="orange">
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
              >
                查看
              </Button>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={onEdit}
                size="small"
              >
                编辑
              </Button>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={onDelete}
                size="small"
                danger
              >
                删除
              </Button>
            </Space>
          </div>
        </div>
        
        {rule.description && (
          <Text type="secondary">
            {rule.description}
          </Text>
        )}
        
        <div>
          <Text strong>条件:</Text>
          <br />
          <Text type="secondary">
            {formatConditions(rule.conditions)}
          </Text>
        </div>
        
        <div>
          <Text type="secondary">
            创建时间: {new Date(rule.created_at).toLocaleString('zh-CN')}
            <br />
            更新时间: {new Date(rule.updated_at).toLocaleString('zh-CN')}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default RuleCard;
