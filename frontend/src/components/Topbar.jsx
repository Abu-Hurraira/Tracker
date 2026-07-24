import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportApi } from '../services/api';
import { FiSearch, FiBell, FiChevronDown, FiAlertTriangle, FiTrendingDown, FiInfo, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';

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
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tracker_notif_read') || '[]'); } catch { return []; }
  });
  const panelRef = useRef(null);

  const title = Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Tracker';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const sym = user?.currencySymbol || 'Rs';

  const loadNotifications = async () => {
    try {
      const res = await reportApi.getDashboard();
      const d = res.data;
      const items = [];

      if ((d.activeBudgetRemaining ?? 0) < 0 && (d.activeBudgetTotal ?? 0) > 0) {
        items.push({
          id: 'budget-over',
          type: 'warning',
          title: 'Budget exceeded',
          body: `You've gone ${sym}${Math.abs(d.activeBudgetRemaining).toLocaleString()} over your budget.`,
          to: '/app/budgets',
        });
      } else if ((d.activeBudgetTotal ?? 0) > 0) {
        const pct = Math.round(((d.activeBudgetSpent || 0) / d.activeBudgetTotal) * 100);
        if (pct >= 80) {
          items.push({
            id: 'budget-high',
            type: 'info',
            title: 'Budget almost used',
            body: `${pct}% of your budget is spent this period.`,
            to: '/app/budgets',
          });
        }
      }

      const negative = (d.accounts || []).filter(a => (a.balance ?? 0) < 0);
      negative.forEach(a => {
        items.push({
          id: `neg-${a.id}`,
          type: 'warning',
          title: `${a.name} is overdrawn`,
          body: `Available balance ${sym}${a.balance.toLocaleString()}.`,
          to: '/app/accounts',
        });
      });

      if (d.mainAccount && (d.mainAccount.initialDeposit || 0) > 0) {
        items.push({
          id: `main-deposit-${d.mainAccount.id}`,
          type: 'info',
          title: 'Main savings deposit',
          body: `${sym}${d.mainAccount.initialDeposit.toLocaleString()} counted in Income (not a transaction). Balance ${sym}${(d.mainAccount.balance || 0).toLocaleString()}.`,
          to: '/app/accounts',
        });
      } else if (d.mainAccount) {
        items.push({
          id: `main-${d.mainAccount.id}`,
          type: 'info',
          title: 'Main savings',
          body: `${d.mainAccount.name} has ${sym}${(d.mainAccount.balance || 0).toLocaleString()} available to transfer.`,
          to: '/app/accounts',
        });
      }

      const recent = (d.recentTransactions || []).slice(0, 3);
      recent.forEach(t => {
        items.push({
          id: `tx-${t.id}`,
          type: t.type === 'expense' ? 'expense' : 'info',
          title: t.title || t.category?.name || 'Transaction',
          body: `${t.type === 'expense' ? '−' : t.type === 'transfer' ? '↔' : '+'}${sym}${(t.amount || 0).toLocaleString()} · ${format(new Date(t.date), 'd MMM')}`,
          to: '/app/transactions',
        });
      });

      if (items.length === 0) {
        items.push({
          id: 'empty',
          type: 'ok',
          title: 'All clear',
          body: 'No new alerts right now.',
          to: '/app/dashboard',
        });
      }

      setNotifications(items);
    } catch {
      setNotifications([{
        id: 'err',
        type: 'info',
        title: 'Notifications',
        body: 'Could not load alerts. Try again shortly.',
        to: '/app/dashboard',
      }]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);

  useEffect(() => {
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const unread = notifications.filter(n => n.id !== 'empty' && n.id !== 'err' && !readIds.includes(n.id));
  const badgeCount = unread.length;

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    setReadIds(ids);
    localStorage.setItem('tracker_notif_read', JSON.stringify(ids));
  };

  const openItem = (n) => {
    const next = [...new Set([...readIds, n.id])];
    setReadIds(next);
    localStorage.setItem('tracker_notif_read', JSON.stringify(next));
    setOpen(false);
    if (n.to) navigate(n.to);
  };

  const iconFor = (type) => {
    if (type === 'warning') return <FiAlertTriangle size={16} />;
    if (type === 'expense') return <FiTrendingDown size={16} />;
    if (type === 'ok') return <FiCheck size={16} />;
    return <FiInfo size={16} />;
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

      <div className="topbar-search" style={{ margin: '0 auto 0 40px' }}>
        <FiSearch className="topbar-search-icon" />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="topbar-search-input"
        />
      </div>

      <div className="topbar-actions">
        <div className="notification-bell-wrap" ref={panelRef}>
          <button
            type="button"
            className="notification-bell"
            aria-label="Notifications"
            onClick={() => {
              const next = !open;
              setOpen(next);
              if (next) loadNotifications();
            }}
          >
            <FiBell size={20} />
            {badgeCount > 0 && (
              <span className="notification-badge">{badgeCount > 9 ? '9+' : badgeCount}</span>
            )}
          </button>

          {open && (
            <div className="notification-panel">
              <div className="notification-panel-header">
                <strong>Notifications</strong>
                {badgeCount > 0 && (
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notification-panel-list">
                {notifications.map(n => {
                  const isRead = readIds.includes(n.id) || n.id === 'empty';
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`notification-item ${isRead ? 'read' : 'unread'}`}
                      onClick={() => openItem(n)}
                    >
                      <div className={`notification-item-icon ${n.type}`}>{iconFor(n.type)}</div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-body">{n.body}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
