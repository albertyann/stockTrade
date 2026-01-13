import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await userAPI.login(values);
      localStorage.setItem('access_token', response.data.access_token);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <Title level={2} style={{ margin: 0 }}>股票分析系统</Title>
          <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginTop: 12, marginBottom: 0, fontSize: 15 }}>
            欢迎回来，请登录您的账户
          </p>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          className="login-form"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} 
              placeholder="请输入用户名" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block 
              size="large"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)'
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>
          <Text type="secondary">还没有账号？</Text>
          <Button type="link" style={{ padding: 0, marginLeft: 4, fontWeight: 500 }}>
            立即注册
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
