import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Form, Input, Button, message, Space, Divider } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { User } from '../types';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchUser = useCallback(async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
      form.setFieldsValue({
        username: response.data.username,
        email: response.data.email,
      });
    } catch (error) {
      message.error('获取用户信息失败');
      console.error('获取用户信息失败:', error);
    }
  }, [form]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      await userAPI.updateCurrentUser(values);
      message.success('更新成功');
      fetchUser();
    } catch (error) {
      message.error('更新失败');
      console.error('更新失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    message.success('已退出登录');
    navigate('/login');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>设置</Title>
        <Text type="secondary" style={{ fontSize: 15, color: '#64748B' }}>管理您的账户设置</Text>
      </div>

      <Card className="glass-card" style={{ marginBottom: 24 }}>
        <Title level={4} style={{ fontSize: 18, fontWeight: 600, color: '#0F172A' }}>个人信息</Title>
        {user && (
          <div style={{ marginBottom: 24, padding: '16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <Space direction="vertical" size={12}>
              <Text style={{ fontSize: 14, color: '#475569' }}><UserOutlined style={{ marginRight: 8, color: '#64748B' }} /> 用户ID: {user.id}</Text>
              <Text style={{ fontSize: 14, color: '#475569' }}>注册时间: {new Date(user.created_at).toLocaleString('zh-CN')}</Text>
              <Text style={{ fontSize: 14, color: '#475569' }}>最后更新: {new Date(user.updated_at).toLocaleString('zh-CN')}</Text>
            </Space>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94A3B8', fontSize: 16 }} />}
              placeholder="请输入用户名"
              size="large"
              style={{
                borderRadius: 10,
                height: 44,
                border: '1.5px solid #E2E8F0',
                transition: 'all 0.2s ease'
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#94A3B8', fontSize: 16 }} />}
              placeholder="请输入邮箱"
              size="large"
              style={{
                borderRadius: 10,
                height: 44,
                border: '1.5px solid #E2E8F0',
                transition: 'all 0.2s ease'
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                minWidth: 120,
                height: 44,
                borderRadius: 10,
                fontWeight: 600
              }}
            >
              更新信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="glass-card">
        <Title level={4} style={{ fontSize: 18, fontWeight: 600, color: '#0F172A' }}>账户操作</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 14, color: '#64748B' }}>退出登录后需要重新登录才能访问系统</Text>
            <div style={{ marginTop: 12 }}>
              <Button
                onClick={handleLogout}
                danger
                size="large"
                style={{
                  minWidth: 120,
                  height: 44,
                  borderRadius: 10,
                  fontWeight: 600
                }}
              >
                退出登录
              </Button>
            </div>
          </div>

          <Divider />

          <div>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>系统信息</Text>
            <div style={{ marginTop: 12, fontSize: 13, color: '#94A3B8', lineHeight: 2 }}>
              <div>版本: 1.0.0</div>
              <div>React: 18.2.0</div>
              <div>Ant Design: 4.21.0</div>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Settings;
