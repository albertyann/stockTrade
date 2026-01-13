import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Typography, Modal, Form, Input, InputNumber, Switch, Popconfirm, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { analysisRuleAPI, ruleEngineAPI } from '../services/api';
import { AnalysisRule } from '../types';

const { Title, Text } = Typography;

const Rules: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState<AnalysisRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AnalysisRule | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [form] = Form.useForm();

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await analysisRuleAPI.getAnalysisRules();
      setRules(response.data);
    } catch (error) {
      message.error('获取分析规则失败');
      console.error('获取分析规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({
      conditions: {
        conditions: [{ indicator: 'price', operator: 'gt', value: 100 }],
        logic: 'AND',
      },
    });
    setModalVisible(true);
  };

  const handleEdit = (rule: AnalysisRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      description: rule.description,
      conditions: rule.conditions,
      priority: rule.priority,
      enabled: rule.enabled,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        name: values.name,
        description: values.description,
        conditions: values.conditions,
        priority: values.priority,
        enabled: values.enabled,
      };

      if (editingRule) {
        await analysisRuleAPI.updateAnalysisRule(editingRule.id, data);
        message.success('更新成功');
      } else {
        await analysisRuleAPI.createAnalysisRule(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchRules();
    } catch (error) {
      message.error(editingRule ? '更新失败' : '创建失败');
      console.error('操作失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await analysisRuleAPI.deleteAnalysisRule(id);
      message.success('删除成功');
      fetchRules();
    } catch (error) {
      message.error('删除失败');
      console.error('删除失败:', error);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const response = await ruleEngineAPI.evaluateRules();
      message.success(`规则评估完成，匹配到 ${response.data.results.filter((r: any) => r.matched).length} 个结果`);
      navigate('/analysis-results');
    } catch (error) {
      message.error('规则评估失败');
      console.error('规则评估失败:', error);
    } finally {
      setEvaluating(false);
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => <Tag color="processing">{priority}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'} style={{ fontWeight: 500 }}>{enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AnalysisRule) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDelete(record.id)}
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
        <Title level={2} style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>分析规则</Title>
        <Text type="secondary" style={{ fontSize: 15, color: '#64748B' }}>配置和管理股票分析规则</Text>
      </div>

      <Card className="glass-card">
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建规则
            </Button>
            <Button icon={<PlayCircleOutlined />} onClick={handleEvaluate} loading={evaluating}>
              执行规则分析
            </Button>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRules} loading={loading}>
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条规则`,
          }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请输入优先级' }]}
            initialValue={1}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item label="条件配置">
            <div style={{ background: '#F1F5F9', padding: 16, borderRadius: 8, border: '1px dashed #CBD5E1' }}>
              <Text type="secondary">条件配置功能正在开发中，请在创建后使用API进行配置</Text>
            </div>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rules;
