import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiHome, 
  FiRepeat, 
  FiBarChart2, 
  FiTarget, 
  FiCreditCard, 
  FiTag, 
  FiUser, 
  FiSettings, 
  FiMoon, 
  FiSun, 
  FiLogOut 
} from 'react-icons/fi';

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: <FiHome />, label: 'Dashboard' },
  { to: '/app/transactions', icon: <FiRepeat />, label: 'Transactions' },
  { to: '/app/summary', icon: <FiBarChart2 />, label: 'Summary' },
  { to: '/app/budgets', icon: <FiTarget />, label: 'Budgets' },
  { to: '/app/accounts', icon: <FiCreditCard />, label: 'Accounts' },
  { to: '/app/categories', icon: <FiTag />, label: 'Categories' },
];

const BOTTOM_ITEMS = [
  { to: '/app/profile', icon: <FiUser />, label: 'Profile' },
  { to: '/app/settings', icon: <FiSettings />, label: 'Settings' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ color: '#FFFFFF' }}>
          <FiCreditCard size={20} />
        </div>
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

        <div className="switch-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="icon" style={{ fontSize: 18, width: 24, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Dark Mode</span>
          </div>
          <label className="switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <FiLogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
