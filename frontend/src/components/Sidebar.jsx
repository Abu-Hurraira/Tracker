import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/app/transactions', icon: '💸', label: 'Transactions' },
  { to: '/app/summary', icon: '📊', label: 'Summary' },
  { to: '/app/budgets', icon: '🎯', label: 'Budgets' },
  { to: '/app/accounts', icon: '🏦', label: 'Accounts' },
  { to: '/app/categories', icon: '🏷️', label: 'Categories' },
];

const BOTTOM_ITEMS = [
  { to: '/app/profile', icon: '👤', label: 'Profile' },
  { to: '/app/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <span className="sidebar-logo-text">Tracker</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {BOTTOM_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <button className="sidebar-link" onClick={toggleTheme}>
          <span className="icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>

        <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--accent-red)' }}>
          <span className="icon">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
