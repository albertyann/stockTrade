import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Lock, Mail, Shield, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="px-8 pt-10 pb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                股票分析系统
              </h1>
              <p className="text-sm text-slate-500">登录以访问您的股票分析数据</p>
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
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.username}</p>
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
                  disabled={loading}
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                  记住我
                </label>
              </div>

              {errors.submit && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg px-4 py-3" role="alert">
                  <p className="text-sm text-danger-800">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/25 transition-shadow"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 animate-spin" />
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors"
              >
                忘记密码？
              </button>
            </div>
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-2">
              <Shield className="w-4 h-4 text-success-500" />
              <span>安全登录 · 数据加密 · 隐私保护</span>
            </div>
            <p className="text-xs text-slate-400">
              © 2026 股票分析系统. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
