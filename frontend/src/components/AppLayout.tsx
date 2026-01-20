import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  FileText,
  Folder,
  Search,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    key: '/',
    icon: LayoutDashboard,
    label: '仪表盘',
  },
  {
    key: '/stocks',
    icon: TrendingUp,
    label: '股票列表',
  },
  {
    key: '/watchlist',
    icon: Star,
    label: '自选股票',
  },
  {
    key: '/notes',
    icon: FileText,
    label: '投资笔记',
  },
  {
    key: '/files',
    icon: Folder,
    label: '资料管理',
  },
  {
    key: '/rules',
    icon: Search,
    label: '分析规则',
  },
  {
    key: '/analysis-tasks',
    icon: ClipboardList,
    label: '分析任务',
  },
  {
    key: '/sync-tasks',
    icon: RefreshCw,
    label: '同步任务',
  },
  {
    key: '/settings',
    icon: Settings,
    label: '系统设置',
  },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUserMenuOpen(false);
    navigate('/login');
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const currentPage = menuItems.find(item => item.key === location.pathname);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside
        className={`
          ${collapsed ? 'w-20' : 'w-64'}
          bg-slate-900 text-white transition-all duration-300 flex flex-col
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          {collapsed ? (
            <LayoutDashboard className="w-6 h-6 text-primary-400" />
          ) : (
            <span className="text-lg font-semibold">股票分析系统</span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleMenuClick(item.key)}
                  aria-label={item.label}
                  aria-current={location.pathname === item.key ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${location.pathname === item.key
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          className="mx-3 mb-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-slate-900">
            {currentPage?.label || '仪表盘'}
          </h1>

          <div className="flex items-center gap-6">
            <time className="text-sm text-slate-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </time>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="用户菜单"
                aria-expanded={userMenuOpen}
                className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <User className="w-5 h-5" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                    <button
                      onClick={handleProfile}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <User className="w-4 h-4" />
                      用户设置
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors text-danger-600 hover:text-danger-700"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
