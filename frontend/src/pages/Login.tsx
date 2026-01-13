import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Checkbox, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const { Title, Text, Link } = Typography;

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '100%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        transform: 'rotate(15deg)',
        opacity: 0.3
      }} />
      
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1)',
          border: 'none',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: 40 }}
      >
        {/* 卡片装饰条 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)'
        }} />
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64,
            height: 64,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: '#fff',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
          }}>
            📈
          </div>
          <Title level={2} style={{ 
            margin: 0, 
            fontSize: 28, 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            股票分析系统
          </Title>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label={<span style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>用户名</span>}
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8C8C8C', fontSize: 16 }} />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>密码</span>}
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
            style={{ marginTop: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8C8C8C', fontSize: 16 }} />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: 14, color: '#666' }}>
                  记住我
                </Checkbox>
              </Form.Item>
              
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 24, marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Link
                href="#"
                className="login-link"
              >
                忘记密码？
              </Link>
          <Text type="secondary" style={{ fontSize: 14, color: '#666' }}>
            还没有账号？
          </Text>
          <Link
            href="#"
            className="login-link"
            style={{ marginLeft: 6 }}
          >
            立即注册
          </Link>
          
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid #F0F0F0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 8,
            marginBottom: 8
          }}>
            <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 14 }} />
            <Text type="secondary" style={{ fontSize: 12, color: '#8C8C8C' }}>
              安全登录 · 数据加密 · 隐私保护
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12, color: '#8C8C8C' }}>
            © 2026 股票分析系统. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;