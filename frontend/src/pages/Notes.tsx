import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Typography, Modal, Form, Input, Tag, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { investmentNoteAPI, stockAPI } from '../services/api';
import { InvestmentNote, Stock } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<InvestmentNote[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<InvestmentNote | null>(null);
  const [form] = Form.useForm();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const [notesRes, stocksRes] = await Promise.all([
        investmentNoteAPI.getInvestmentNotes(),
        stockAPI.getStocks({ skip: 0, limit: 100 }),
      ]);
      setNotes(notesRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      message.error('获取投资笔记失败');
      console.error('获取投资笔记失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAdd = () => {
    setEditingNote(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (note: InvestmentNote) => {
    setEditingNote(note);
    form.setFieldsValue({
      stock_id: note.stock_id,
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        stock_id: values.stock_id,
        title: values.title,
        content: values.content,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
      };

      if (editingNote) {
        await investmentNoteAPI.updateInvestmentNote(editingNote.id, data);
        message.success('更新成功');
      } else {
        await investmentNoteAPI.createInvestmentNote(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchNotes();
    } catch (error) {
      message.error(editingNote ? '更新失败' : '创建失败');
      console.error('操作失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await investmentNoteAPI.deleteInvestmentNote(id);
      message.success('删除成功');
      fetchNotes();
    } catch (error) {
      message.error('删除失败');
      console.error('删除失败:', error);
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: '股票',
      dataIndex: 'stock_id',
      key: 'stock_id',
      render: (stockId: number) => {
        const stock = stocks.find(s => s.id === stockId);
        return stock ? <Tag color="blue">{stock.code} - {stock.name}</Tag> : '-';
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space size={4}>
          {tags.map(tag => <Tag key={tag} color="cyan">{tag}</Tag>)}
        </Space>
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
      render: (_: any, record: InvestmentNote) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条笔记吗？"
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
        <Title level={2} style={{ fontSize: 28, fontWeight: 700 }}>投资笔记</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>记录您的投资思考和策略</Text>
      </div>

      <Card>
        <Space style={{ marginBottom: 20, width: '100%', justifyContent: 'space-between' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            新建笔记
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchNotes} loading={loading} size="large">
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={notes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
          }}
          bordered={false}
        />
      </Card>

      <Modal
        title={editingNote ? '编辑笔记' : '新建笔记'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="stock_id"
            label="股票"
            rules={[{ required: true, message: '请选择股票' }]}
          >
            <select
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #d9d9d9',
                fontSize: 14,
                background: 'white'
              }}
            >
              {stocks.map(stock => (
                <option key={stock.id} value={stock.id}>
                  {stock.code} - {stock.name}
                </option>
              ))}
            </select>
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入笔记标题" size="large" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="请输入笔记内容" />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
          >
            <Input placeholder="多个标签用逗号分隔" size="large" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)} size="large">取消</Button>
              <Button type="primary" htmlType="submit" size="large">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Notes;
