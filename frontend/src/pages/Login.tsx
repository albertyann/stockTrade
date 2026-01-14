import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await userAPI.login({
        username: formData.username,
        password: formData.password
      });
      localStorage.setItem('access_token', response.data.access_token);
      navigate('/');
    } catch (error) {
      setErrors({ submit: '登录失败，请检查用户名和密码' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="px-8 pt-10 pb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">📈</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                股票分析系统
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="label">
                  用户名
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input ${errors.username ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-1.5 text-sm text-danger-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="label">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input ${errors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-danger-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  记住我
                </label>
              </div>

              {errors.submit && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-danger-800">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer bg-transparent border-0 p-0"
              >
                忘记密码？
              </button>
            </div>
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
              <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>安全登录 · 数据加密 · 隐私保护</span>
            </div>
            <p className="text-xs text-gray-400">
              © 2026 股票分析系统. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
