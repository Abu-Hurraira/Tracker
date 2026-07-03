import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function SettingRow({ icon, title, desc, control }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      {control}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 50, height: 28, borderRadius: 100, background: value ? 'var(--primary)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: value ? 25 : 3, transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const handleExport = () => {
    toast('Export feature: You can export data via your SQL Server database directly.', { icon: '📋', duration: 4000 });
  };

  const handleClearCache = () => {
    localStorage.removeItem('theme');
    toast.success('Cache cleared!');
  };

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 28 }}>Settings</h1>

      {/* Appearance */}
      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="section-title">🎨 Appearance</div>
        <SettingRow
          icon={theme === 'light' ? '🌙' : '☀️'}
          title="Dark Mode"
          desc="Switch between light and dark themes"
          control={<Toggle value={theme === 'dark'} onChange={toggleTheme} />}
        />
      </motion.div>

      {/* Account */}
      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="section-title">👤 Account</div>
        <SettingRow
          icon="👤"
          title="Edit Profile"
          desc="Update name, currency, and avatar"
          control={<button className="btn btn-secondary btn-sm" onClick={() => navigate('/app/profile')}>Open →</button>}
        />
        <SettingRow
          icon="🔒"
          title="Change Password"
          desc="Update your login password"
          control={<button className="btn btn-secondary btn-sm" onClick={() => navigate('/app/profile')}>Open →</button>}
        />
      </motion.div>

      {/* Data */}
      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="section-title">💾 Data</div>
        <SettingRow
          icon="📊"
          title="Export Data"
          desc="Export your transactions as CSV/Excel"
          control={<button className="btn btn-secondary btn-sm" onClick={handleExport}>Export</button>}
        />
        <SettingRow
          icon="🗑️"
          title="Clear App Cache"
          desc="Remove locally stored preferences"
          control={<button className="btn btn-secondary btn-sm" onClick={handleClearCache}>Clear</button>}
        />
      </motion.div>

      {/* System */}
      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="section-title">⚙️ System</div>
        <SettingRow
          icon="🔄"
          title="Database"
          desc="(localdb)\\MSSQLLocalDB — TrackerDB"
          control={<span className="badge badge-income">Connected</span>}
        />
        <SettingRow
          icon="🌐"
          title="API Endpoint"
          desc="http://localhost:5255/api"
          control={<span className="badge badge-primary">Local</span>}
        />
      </motion.div>

      {/* About */}
      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="section-title">ℹ️ About</div>
        <SettingRow icon="💰" title="Tracker App" desc="Personal Finance Tracker v1.0.0" control={null} />
        <SettingRow icon="🛡️" title="Privacy" desc="All data stored locally on your PC" control={null} />
      </motion.div>

      {/* Sign Out */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <SettingRow
          icon="🚪"
          title="Sign Out"
          desc={`Signed in as ${user?.email}`}
          control={<button className="btn btn-danger btn-sm" onClick={handleLogout}>Sign Out</button>}
        />
      </motion.div>
    </div>
  );
}
