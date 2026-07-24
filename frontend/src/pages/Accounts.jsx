import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accountApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCreditCard,
  FiSend
} from 'react-icons/fi';

const ACCOUNT_ICONS = ['🏦', '💵', '💳', '🏧', '💰', '🪙', '📱', '💼', '💎'];
const ACCOUNT_TYPES = ['bank', 'cash', 'card', 'savings', 'investment'];
const COLORS = ['#6C63FF', '#4CAF7D', '#FF6B6B', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#00BCD4'];

function AccountModal({ open, onClose, onSaved, edit, hasMain }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#6C63FF');
  const [balance, setBalance] = useState('0');
  const [isMain, setIsMain] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (edit) { 
      setName(edit.name); 
      setType(edit.type); 
      setIcon(edit.icon); 
      setColor(edit.color); 
      setBalance(String(edit.balance));
      setIsMain(!!edit.isMain);
    } else { 
      setName(''); 
      setType('bank'); 
      setIcon('🏦'); 
      setColor('#6C63FF'); 
      setBalance('0');
      setIsMain(false);
    }
  }, [edit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (edit) {
        const payload = { name, icon, color };
        if (!edit.isMain) payload.balance = parseFloat(balance);
        await accountApi.update(edit.id, payload);
      } else {
        await accountApi.create({
          name,
          type: isMain ? 'main' : type,
          icon,
          color,
          balance: parseFloat(balance) || 0,
          isMain
        });
      }
      toast.success(edit ? 'Account updated!' : (isMain ? 'Main savings account created!' : 'Account created!'));
      onSaved(); 
      onClose();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to save account'); 
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: hasMain ? 'not-allowed' : 'pointer', opacity: hasMain ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    checked={isMain}
                    disabled={hasMain}
                    onChange={e => {
                      setIsMain(e.target.checked);
                      if (e.target.checked) {
                        setType('main');
                        setIcon('💎');
                        setColor('#F59E0B');
                      }
                    }}
                  />
                  <span>
                    <strong>Main savings account</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {hasMain
                        ? 'You already have a main account'
                        : 'Excluded from Total Balance · initial amount counts as Income (notification only, not a transaction)'}
                    </div>
                  </span>
                </label>
              </div>
            )}

            {!edit && !isMain && (
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
            {(!edit || !edit.isMain) && (
              <div className="form-group">
                <label className="form-label">
                  {isMain ? 'Initial Savings Amount (Rs)' : 'Current Balance (Rs)'}
                </label>
                <input className="form-input" type="number" value={balance} onChange={e => setBalance(e.target.value)} step="0.01" min="0" />
                {isMain && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Counted in Income and shown as a notification — not added as a transaction.
                  </div>
                )}
              </div>
            )}
            {edit?.isMain && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 12 }}>
                Main balance changes via Transfer only. Initial deposit ({edit.initialDeposit?.toLocaleString()}) stays in Income.
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ border: 'none' }}>
              {loading ? 'Saving...' : (edit ? 'Update Account' : 'Add Account')}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TransferModal({ open, onClose, onSaved, mainAccount, targets, sym }) {
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount('');
      setToAccountId(targets[0]?.id ? String(targets[0].id) : '');
    }
  }, [open, targets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!toAccountId) return toast.error('Select an account');
    if (!value || value <= 0) return toast.error('Enter a valid amount');
    if (value > (mainAccount?.balance || 0)) return toast.error('Insufficient main balance');
    setLoading(true);
    try {
      await accountApi.transfer(mainAccount.id, { toAccountId: parseInt(toAccountId), amount: value });
      toast.success('Transferred successfully!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !mainAccount) return null;
  return (
    <AnimatePresence>
      <motion.div className="modal-overlay center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">💸 Transfer from Main</span>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Available in {mainAccount.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)' }}>
                {sym}{(mainAccount.balance || 0).toLocaleString()}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">To Account</label>
              <select className="form-input form-select" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                {targets.length === 0 && <option value="">No other accounts</option>}
                {targets.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name} ({sym}{(a.balance || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (Rs)</label>
              <input className="form-input" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Income stays at the original main deposit. Only account balances update.
            </p>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || targets.length === 0}>
              {loading ? 'Transferring...' : 'Transfer'}
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
  const [showTransfer, setShowTransfer] = useState(false);

  const load = async () => {
    const r = await accountApi.getAll();
    setAccounts(r.data);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    try {
      await accountApi.delete(id);
      toast.success('Account deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const mainAccount = accounts.find(a => a.isMain);
  const regularAccounts = accounts.filter(a => !a.isMain);
  const totalBalance = regularAccounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Accounts</h1>
        <button className="btn btn-primary" onClick={() => { setEditAcc(null); setShowModal(true); }}>
          <FiPlus size={16} style={{ marginRight: 4 }} /> Add Account
        </button>
      </div>

      <motion.div 
        className="card" 
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
          color: 'white', 
          position: 'relative',
          overflow: 'hidden',
          padding: '24px 32px',
          minHeight: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 24
        }}
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
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
            justifyContent: 'center'
          }}
        >
          <FiCreditCard size={32} color="#FFFFFF" />
        </div>

        <div style={{ textAlign: 'center', flex: 1, zIndex: 2 }}>
          <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Total Account Balance</div>
          <div style={{ fontSize: 42, fontWeight: 900, margin: '6px 0', color: totalBalance < 0 ? '#fecaca' : undefined }}>{sym}{totalBalance.toLocaleString()}</div>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>
            {regularAccounts.length} account{regularAccounts.length !== 1 ? 's' : ''} · main savings excluded
          </div>
        </div>
        <div style={{ width: 72 }} />
      </motion.div>

      {mainAccount && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 20,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: '#fff',
            border: 'none',
            padding: 24,
            borderRadius: 20
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {mainAccount.icon || '💎'}
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Main Savings</div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{mainAccount.name}</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{sym}{(mainAccount.balance || 0).toLocaleString()}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                  Initial deposit (Income): {sym}{(mainAccount.initialDeposit || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn"
                style={{ background: '#fff', color: '#D97706', fontWeight: 700, border: 'none' }}
                onClick={() => setShowTransfer(true)}
                disabled={regularAccounts.length === 0}
              >
                <FiSend size={14} style={{ marginRight: 6 }} /> Transfer
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
                onClick={() => { setEditAcc(mainAccount); setShowModal(true); }}
              >
                <FiEdit2 size={14} style={{ marginRight: 6 }} /> Edit
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: 'none' }}
                onClick={() => handleDelete(mainAccount.id)}
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {accounts.length === 0 && (
        <div className="empty-state card">
          <div className="emoji">🏦</div>
          <h3>No accounts yet</h3>
          <p>Add a main savings account or regular bank/cash accounts</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {regularAccounts.map((a, i) => (
          <motion.div 
            key={a.id} 
            className="card" 
            style={{ padding: 24, display: 'flex', flexDirection: 'column', borderRadius: 20 }} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }} 
            layout
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  background: a.color + '15', color: a.color, width: 56, height: 56, fontSize: 26,
                  borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{a.name}</div>
                    <span style={{ 
                      marginLeft: 10, background: 'rgba(99, 102, 241, 0.08)', color: '#6366F1',
                      padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, textTransform: 'capitalize'
                    }}>
                      {a.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: a.balance < 0 ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: 8 }}>
                    {a.balance < 0 ? '-' : ''}{sym}{Math.abs(a.balance).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', margin: '20px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                <FiCreditCard size={16} />
                <span>1234 5678 {(9000 + (Number(a.id) || 0) * 8).toString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="btn" 
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.08)', color: '#6366F1', padding: '8px 16px',
                    borderRadius: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: 'none', fontSize: 13
                  }} 
                  onClick={() => { setEditAcc(a); setShowModal(true); }}
                >
                  <FiEdit2 size={14} /> Edit
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ 
                    width: 40, height: 40, padding: 0, borderRadius: 10, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
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

      <AccountModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={load}
        edit={editAcc}
        hasMain={!!mainAccount && !editAcc?.isMain}
      />
      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSaved={load}
        mainAccount={mainAccount}
        targets={regularAccounts}
        sym={sym}
      />
    </div>
  );
}
