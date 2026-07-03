import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accountApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ACCOUNT_ICONS = ['🏦', '💵', '💳', '🏧', '💰', '🪙', '📱', '💼'];
const ACCOUNT_TYPES = ['bank', 'cash', 'card', 'savings', 'investment'];
const COLORS = ['#6C63FF', '#4CAF7D', '#FF6B6B', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#00BCD4'];

function AccountModal({ open, onClose, onSaved, edit }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#6C63FF');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (edit) { setName(edit.name); setType(edit.type); setIcon(edit.icon); setColor(edit.color); setBalance(String(edit.balance)); }
    else { setName(''); setType('bank'); setIcon('🏦'); setColor('#6C63FF'); setBalance('0'); }
  }, [edit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (edit) await accountApi.update(edit.id, { name, icon, color, balance: parseFloat(balance) });
      else await accountApi.create({ name, type, icon, color, balance: parseFloat(balance) });
      toast.success(edit ? 'Account updated!' : 'Account created!');
      onSaved(); onClose();
    } catch { toast.error('Failed to save account'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div className="modal-overlay center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{edit ? '✏️ Edit Account' : '🏦 Add Account'}</span>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="My Bank Account" required autoFocus />
            </div>
            {!edit && (
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select className="form-input form-select" value={type} onChange={e => setType(e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div className="emoji-grid">
                {ACCOUNT_ICONS.map(ic => (
                  <button type="button" key={ic} className={`emoji-btn ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-grid">
                {COLORS.map(c => (
                  <div key={c} className={`color-dot ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Current Balance (Rs)</label>
              <input className="form-input" type="number" value={balance} onChange={e => setBalance(e.target.value)} step="0.01" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : (edit ? '✓ Update' : '✓ Add Account')}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Accounts() {
  const { user } = useAuth();
  const sym = user?.currencySymbol || 'Rs';
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);

  const load = async () => { const r = await accountApi.getAll(); setAccounts(r.data); };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    await accountApi.delete(id);
    toast.success('Account deleted');
    load();
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Accounts</h1>
        <button className="btn btn-primary" onClick={() => { setEditAcc(null); setShowModal(true); }}>+ Add Account</button>
      </div>

      {/* Total Balance */}
      <motion.div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', textAlign: 'center' }}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total Balance</div>
        <div style={{ fontSize: 40, fontWeight: 900 }}>{sym}{totalBalance.toLocaleString()}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{accounts.length} accounts</div>
      </motion.div>

      {accounts.length === 0 && (
        <div className="empty-state card">
          <div className="emoji">🏦</div>
          <h3>No accounts yet</h3>
          <p>Add your bank, cash, or card accounts</p>
        </div>
      )}

      <div className="grid-2">
        {accounts.map((a, i) => (
          <motion.div key={a.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} layout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="cat-icon" style={{ background: a.color + '20', width: 52, height: 52, fontSize: 24 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{a.name}</div>
                <div className="badge badge-primary" style={{ marginTop: 4, textTransform: 'capitalize' }}>{a.type}</div>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: a.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: 12 }}>
              {a.balance < 0 ? '-' : ''}{sym}{Math.abs(a.balance).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm flex-1" onClick={() => { setEditAcc(a); setShowModal(true); }}>✏️ Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>🗑️</button>
            </div>
          </motion.div>
        ))}
      </div>

      <AccountModal open={showModal} onClose={() => setShowModal(false)} onSaved={load} edit={editAcc} />
    </div>
  );
}
