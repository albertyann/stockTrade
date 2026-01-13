import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  StockOutlined,
  StarOutlined,
  FileTextOutlined,
  FolderOutlined,
  SettingOutlined,
  FundOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/stocks',
      icon: <StockOutlined />,
      label: '股票列表',
    },
    {
      key: '/watchlist',
      icon: <StarOutlined />,
      label: '自选股',
    },
    {
      key: '/notes',
      icon: <FileTextOutlined />,
      label: '投资笔记',
    },
    {
      key: '/files',
      icon: <FolderOutlined />,
      label: '文件管理',
    },
    {
      key: '/rules',
      icon: <FundOutlined />,
      label: '分析规则',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={70}
        trigger={null}
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div style={{
          height: 64,
          margin: '16px 12px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.15))',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: collapsed ? 20 : 16,
          letterSpacing: collapsed ? 0 : 0.5,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          {collapsed ? '📊' : '股票分析系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 'none',
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 70 : 220, transition: 'margin-left 0.2s ease' }}>
        <Header style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        }}>
          <Space size="large">
            <Text strong style={{ fontSize: 18, color: '#0F172A', fontWeight: 700 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || '仪表盘'}
            </Text>
          </Space>
          <Space size="middle">
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Avatar 
                icon={<UserOutlined />} 
                style={{ 
                  cursor: 'pointer', 
                  background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                }} 
              />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          minHeight: 'calc(100vh - 88px)',
          borderRadius: 12,
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
