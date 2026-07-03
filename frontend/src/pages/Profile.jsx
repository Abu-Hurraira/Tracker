import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#6C63FF','#FF6B6B','#4CAF7D','#FF9800','#2196F3','#E91E63','#9C27B0','#00BCD4','#FF5722','#607D8B'];
const CURRENCIES = [
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [currency, setCurrency] = useState(user?.currency || 'PKR');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#6C63FF');
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.updateProfile({ username, currency, currencySymbol: selectedCurrency.symbol, avatarColor });
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.next.length < 6) return toast.error('Min 6 characters');
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success('Password changed!');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setPwLoading(false); }
  };

  const initials = username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 28 }}>Profile</h1>

      {/* Avatar Preview */}
      <motion.div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white', boxShadow: `0 8px 24px ${avatarColor}60` }}>
          {initials}
        </div>
      </motion.div>

      {/* Profile Form */}
      <motion.div className="card" style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="section-title">👤 Personal Info</div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-input form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Avatar Color</label>
            <div className="color-grid">
              {AVATAR_COLORS.map(c => (
                <div key={c} className={`color-dot ${avatarColor === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setAvatarColor(c)} />
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '💾 Save Changes'}
          </button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="section-title">🔒 Change Password</div>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-secondary" disabled={pwLoading}>
            {pwLoading ? <span className="spinner" /> : '🔑 Change Password'}
          </button>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div className="card" style={{ marginTop: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="section-title">ℹ️ Account Info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
            { label: 'Currency', value: `${selectedCurrency.symbol} (${selectedCurrency.code})` },
            { label: 'Email', value: user?.email },
          ].map(i => (
            <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{i.label}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{i.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
