import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar automatically on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (loading) return (
    <div className="loading-screen">
      <div style={{ fontSize: 48 }}>💰</div>
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your finances...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Outlet />
      </div>
    </div>
  );
}
