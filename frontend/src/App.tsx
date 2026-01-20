import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockList from './pages/StockList';
import Watchlist from './pages/Watchlist';
import Notes from './pages/Notes';
import Files from './pages/Files';
import Rules from './pages/Rules';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import StockDetail from './pages/StockDetail';
import AnalysisTaskDetail from './pages/AnalysisTaskDetail';
import AnalysisTasks from './pages/AnalysisTasks';
import SyncTasks from './pages/SyncTasks';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
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
          <Route path="/analysis-tasks" element={<AnalysisTasks />} />
          <Route path="/analysis-tasks/:id" element={<AnalysisTaskDetail />} />
          <Route path="/sync-tasks" element={<SyncTasks />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
