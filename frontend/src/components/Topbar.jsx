import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiBell, FiChevronDown } from 'react-icons/fi';

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

export default function Topbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Tracker';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger Menu Icon (3 lines) for mobile */}
        <button 
          className="topbar-menu-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <div className="menu-bar" />
          <div className="menu-bar" />
          <div className="menu-bar" />
        </button>
        <div>
          <div className="topbar-title">{title}</div>
          <div className="topbar-greeting" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{greeting}, {user?.username || 'Hurriara'}! 👋</div>
        </div>
      </div>

      {/* Search Input in the center */}
      <div className="topbar-search" style={{ margin: '0 auto 0 40px' }}>
        <FiSearch className="topbar-search-icon" />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="topbar-search-input"
        />
      </div>

      <div className="topbar-actions">
        {/* Notification Bell */}
        <div className="notification-bell">
          <FiBell size={20} />
          <span className="notification-badge">3</span>
        </div>

        {/* Profile Details Trigger */}
        <div className="profile-btn" onClick={() => navigate('/app/profile')}>
          <div
            className="avatar"
            style={{ 
              background: user?.avatarColor || 'var(--primary)', 
              overflow: 'hidden', 
              padding: 0,
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: '50%'
            }}
            title="Profile"
          >
            {user?.profilePicture
              ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>
          <span className="profile-name">{user?.username || 'Hurriara'}</span>
          <FiChevronDown className="profile-chevron" />
        </div>
      </div>
    </header>
  );
}
