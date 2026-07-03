import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/app/dashboard': 'Dashboard',
  '/app/transactions': 'Transactions',
  '/app/summary': 'Summary',
  '/app/budgets': 'Budgets',
  '/app/accounts': 'Accounts',
  '/app/categories': 'Categories',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Tracker';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{greeting}, {user?.username || 'User'}!</div>
      </div>
      <div className="topbar-actions">
        <div
          className="avatar"
          style={{ background: user?.avatarColor || '#6C63FF' }}
          onClick={() => navigate('/app/profile')}
          title="Profile"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
