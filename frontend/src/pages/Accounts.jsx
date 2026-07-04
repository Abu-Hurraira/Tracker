import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accountApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiMoreVertical, 
  FiEdit2, 
  FiTrash2, 
  FiCreditCard, 
  FiActivity 
} from 'react-icons/fi';

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
    if (edit) { 
      setName(edit.name); 
      setType(edit.type); 
      setIcon(edit.icon); 
      setColor(edit.color); 
      setBalance(String(edit.balance)); 
    } else { 
      setName(''); 
      setType('bank'); 
      setIcon('🏦'); 
      setColor('#6C63FF'); 
      setBalance('0'); 
    }
  }, [edit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (edit) await accountApi.update(edit.id, { name, icon, color, balance: parseFloat(balance) });
      else await accountApi.create({ name, type, icon, color, balance: parseFloat(balance) });
      toast.success(edit ? 'Account updated!' : 'Account created!');
      onSaved(); 
      onClose();
    } catch { 
      toast.error('Failed to save account'); 
    } finally { 
      setLoading(false); 
    }
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
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ border: 'none' }}>
              {loading ? 'Saving...' : (edit ? 'Update Account' : 'Add Account')}
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

  const load = async () => { 
    const r = await accountApi.getAll(); 
    setAccounts(r.data); 
  };
  
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Accounts</h1>
        <button className="btn btn-primary" onClick={() => { setEditAcc(null); setShowModal(true); }}>
          <FiPlus size={16} style={{ marginRight: 4 }} /> Add Account
        </button>
      </div>

      {/* Redesigned Total Balance banner to match screenshot */}
      <motion.div 
        className="card" 
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
          color: 'white', 
          position: 'relative',
          overflow: 'hidden',
          padding: '24px 32px',
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 24
        }}
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Left glassmorphic card icon */}
        <div 
          className="accounts-banner-icon"
          style={{ 
            background: 'rgba(255, 255, 255, 0.15)', 
            backdropFilter: 'blur(8px)',
            width: 72, 
            height: 72, 
            borderRadius: 20, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
          }}
        >
          <FiCreditCard size={32} color="#FFFFFF" />
        </div>

        {/* Center stats */}
        <div style={{ textAlign: 'center', flex: 1, zIndex: 2 }}>
          <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Balance</div>
          <div style={{ fontSize: 42, fontWeight: 900, margin: '6px 0' }}>{sym}{totalBalance.toLocaleString()}</div>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>{accounts.length} accounts</div>
        </div>

        {/* Right decorative elements (Floating wallet, cards, and coins) */}
        <div 
          className="accounts-banner-decor"
          style={{ 
            position: 'relative', 
            width: 140, 
            height: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          {/* Main Wallet illustration */}
          <div style={{ 
            position: 'absolute',
            width: 110,
            height: 75,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 14,
            transform: 'rotate(-12deg)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 10
          }}>
            {/* Wallet button */}
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          </div>
          {/* Card 1 sticking out */}
          <div style={{ 
            position: 'absolute',
            width: 75,
            height: 48,
            background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
            borderRadius: 8,
            transform: 'rotate(-25deg) translate(-20px, -20px)',
            zIndex: -1
          }} />
          {/* Card 2 sticking out */}
          <div style={{ 
            position: 'absolute',
            width: 75,
            height: 48,
            background: 'linear-gradient(135deg, #34D399, #059669)',
            borderRadius: 8,
            transform: 'rotate(-18deg) translate(-10px, -15px)',
            zIndex: -2
          }} />
          {/* Floating coins */}
          <div style={{ 
            position: 'absolute',
            top: -10,
            right: 110,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#FBBF24',
            color: '#78350F',
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>{sym}</div>
          <div style={{ 
            position: 'absolute',
            bottom: 5,
            right: -10,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#FBBF24',
            color: '#78350F',
            fontSize: 7,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>{sym}</div>
        </div>
      </motion.div>

      {accounts.length === 0 && (
        <div className="empty-state card">
          <div className="emoji">🏦</div>
          <h3>No accounts yet</h3>
          <p>Add your bank, cash, or card accounts</p>
        </div>
      )}

      {/* Redesigned Account Cards List (full width, not grid-2) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {accounts.map((a, i) => (
          <motion.div 
            key={a.id} 
            className="card" 
            style={{ 
              padding: 24, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 20
            }} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }} 
            layout
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Icon Circle */}
                <div style={{ 
                  background: a.color + '15', 
                  color: a.color,
                  width: 56, 
                  height: 56, 
                  fontSize: 26,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {a.icon}
                </div>
                {/* Name & Type Badge & Balance */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{a.name}</div>
                    <span style={{ 
                      marginLeft: 10,
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: '#6366F1',
                      padding: '4px 10px',
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {a.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>
                    {a.balance < 0 ? '-' : ''}{sym}{Math.abs(a.balance).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Option details menu icon */}
              <button className="btn btn-ghost btn-icon" style={{ color: 'var(--text-muted)' }}>
                <FiMoreVertical size={20} />
              </button>
            </div>

            {/* Dotted divider line */}
            <div style={{ 
              borderTop: '1px dashed var(--border)', 
              margin: '20px 0' 
            }} />

            {/* Bottom Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Mock account number */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                <FiCreditCard size={16} />
                <span>1234 5678 {(9000 + (Number(a.id) || 0) * 8).toString()}</span>
              </div>
              
              {/* Edit / Delete actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="btn" 
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.08)', 
                    color: '#6366F1', 
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    fontSize: 13
                  }} 
                  onClick={() => { setEditAcc(a); setShowModal(true); }}
                >
                  <FiEdit2 size={14} /> Edit
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    padding: 0, 
                    borderRadius: 10,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--accent-red), #EF4444)'
                  }} 
                  onClick={() => handleDelete(a.id)}
                >
                  <FiTrash2 size={16} style={{ color: '#FFFFFF' }} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AccountModal open={showModal} onClose={() => setShowModal(false)} onSaved={load} edit={editAcc} />
    </div>
  );
}
