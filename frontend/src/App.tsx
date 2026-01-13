import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockList from './pages/StockList';
import Watchlist from './pages/Watchlist';
import Notes from './pages/Notes';
import Files from './pages/Files';
import Rules from './pages/Rules';
import Settings from './pages/Settings';
import StockDetail from './pages/StockDetail';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    message.error('请先登录');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/stocks" element={<StockList />} />
                    <Route path="/stocks/:id" element={<StockDetail />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
