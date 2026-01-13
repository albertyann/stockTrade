import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Typography, Upload, Modal, Form, Input, Tag, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { fileAPI, stockAPI } from '../services/api';
import { UploadedFile, Stock } from '../types';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const Files: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<number | undefined>();
  const [fileList, setFileList] = useState<any[]>([]);
  const [tags, setTags] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const [filesRes, stocksRes] = await Promise.all([
        fileAPI.getUploadedFiles(),
        stockAPI.getStocks({ skip: 0, limit: 100 }),
      ]);
      setFiles(filesRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      message.error('获取文件列表失败');
      console.error('获取文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    if (selectedStockId) {
      formData.append('stock_id', selectedStockId.toString());
    }
    if (tags) {
      tags.split(',').forEach(tag => formData.append('tags', tag.trim()));
    }

    try {
      await fileAPI.uploadFile(formData);
      message.success('上传成功');
      setUploadModalVisible(false);
      fetchFiles();
    } catch (error) {
      message.error('上传失败');
      console.error('上传失败:', error);
    }
    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      await fileAPI.deleteUploadedFile(id);
      message.success('删除成功');
      fetchFiles();
    } catch (error) {
      message.error('删除失败');
      console.error('删除失败:', error);
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '文件类型',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => <Tag className="tag-modern blue">{type}</Tag>,
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => {
        const mb = size / (1024 * 1024);
        return mb < 1 ? `${(size / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
      },
    },
    {
      title: '股票',
      dataIndex: 'stock_id',
      key: 'stock_id',
      render: (stockId?: number) => {
        if (!stockId) return '-';
        const stock = stocks.find(s => s.id === stockId);
        return stock ? <Tag className="tag-modern cyan">{stock.code}</Tag> : '-';
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space size={4}>
          {tags.map(tag => <Tag key={tag} className="tag-modern green">{tag}</Tag>)}
        </Space>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UploadedFile) => (
        <Space>
          <Popconfirm
            title="确定要删除这个文件吗？"
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
        <Title level={2} style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>文件管理</Title>
        <Text type="secondary" style={{ fontSize: 15, color: '#64748B' }}>管理和上传股票相关文件</Text>
      </div>

      <Card className="glass-card">
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalVisible(true)}>
            上传文件
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchFiles} loading={loading}>
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个文件`,
          }}
        />
      </Card>

      <Modal
        title="上传文件"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          setTags('');
          setSelectedStockId(undefined);
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="关联股票">
            <select
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                fontSize: 14,
                background: 'white',
                transition: 'all 0.2s ease'
              }}
              value={selectedStockId}
              onChange={(e) => setSelectedStockId(Number(e.target.value))}
            >
              <option value="">不关联</option>
              {stocks.map(stock => (
                <option key={stock.id} value={stock.id}>
                  {stock.code} - {stock.name}
                </option>
              ))}
            </select>
          </Form.Item>
          <Form.Item label="标签">
            <Input
              placeholder="多个标签用逗号分隔"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="文件">
            <Dragger
              fileList={fileList}
              beforeUpload={handleUpload}
              onChange={(info) => {
                if (info.file.status === 'removed') {
                  setFileList([]);
                }
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持单个文件上传</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Files;
