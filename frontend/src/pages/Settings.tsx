import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { User } from '../types';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
      });
    } catch (error) {
      message.error('获取用户信息失败');
      console.error('获取用户信息失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      message.error('请输入用户名');
      return;
    }
    
    if (!formData.email.trim()) {
      message.error('请输入邮箱');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      message.error('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    try {
      await userAPI.updateCurrentUser(formData);
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">设置</h2>
        <p className="text-gray-500">管理您的账户设置</p>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">个人信息</h3>
        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                用户ID: {user.id}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                注册时间: {new Date(user.created_at).toLocaleString('zh-CN')}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                最后更新: {new Date(user.updated_at).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="label">
              用户名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input pl-10"
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input pl-10"
                placeholder="请输入邮箱"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? '更新中...' : '更新信息'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账户操作</h3>
        <div>
          <p className="text-sm text-gray-500 mb-4">退出登录后需要重新登录才能访问系统</p>
          <button
            onClick={handleLogout}
            className="btn-danger flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h3>
        <div className="space-y-2 text-sm text-gray-500">
          <div>版本: 1.0.0</div>
          <div>React: 18.2.0</div>
          <div>Ant Design: 4.21.0</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
