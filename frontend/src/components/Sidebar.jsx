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

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 199,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="36" height="36" style={{ flexShrink: 0 }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--primary)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0px 0px 4px var(--primary))' }} />
              <path d="M15,15 L25,15 L25,25 Z" fill="var(--primary)" />
            </svg>
            <span className="sidebar-logo-text">CarryUp</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
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
          <span className="icon">
            <FiLogOut />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  </>
);
}
