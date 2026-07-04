import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { budgetApi, categoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiTarget, 
  FiBarChart2, 
  FiTrash2, 
  FiInfo, 
  FiCreditCard, 
  FiDollarSign, 
  FiActivity 
} from 'react-icons/fi';

function BudgetModal({ open, onClose, onSaved, categories }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));
  const [selectedCats, setSelectedCats] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCat = (id) => setSelectedCats(s => s.includes(id) ? s.filter(c => c !== id) : [...s, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await budgetApi.create({ name, amount: parseFloat(amount), startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), categoryIds: selectedCats });
      toast.success('Budget created!');
      onSaved();
      onClose();
    } catch { toast.error('Failed to create budget'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">🎯 Create Budget</span>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Budget Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Budget" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Limit Amount</label>
              <input className="form-input" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Include Categories</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 150, overflowY: 'auto', padding: 4 }}>
                {categories.map(c => (
                  <button
                    type="button"
                    key={c.id}
                    className={`badge ${selectedCats.includes(c.id) ? 'badge-primary' : 'btn-secondary'}`}
                    onClick={() => toggleCat(c.id)}
                    style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid var(--border)' }}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ border: 'none' }}>
              {loading ? 'Creating...' : 'Create Budget'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Budgets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sym = user?.currencySymbol || 'Rs';

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const [bRes, cRes] = await Promise.all([budgetApi.getAll(), categoryApi.getAll()]);
    setBudgets(bRes.data);
    setCategories(cRes.data);
    // Load spending for each budget
    const spendMap = {};
    for (const b of bRes.data) {
      try { const s = await budgetApi.getSpending(b.id); spendMap[b.id] = s.data; } catch {}
    }
    setSpending(spendMap);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await budgetApi.delete(id);
    toast.success('Budget deleted');
    load();
  };

  const now = new Date();

  return (
    <div className="page">
      {/* Redesigned Header to match screenshot */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            background: 'var(--primary-light)', 
            color: 'var(--primary)', 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 24
          }}>
            <FiTarget size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Budgets</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              Stay on track and reach your goals 💜
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus size={16} style={{ marginRight: 4 }} /> New Budget
        </button>
      </div>

      {budgets.length === 0 && (
        <div className="empty-state card">
          <div className="emoji">🎯</div>
          <h3>No budgets yet</h3>
          <p>Create a budget to track your spending</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Budget</button>
        </div>
      )}

      {budgets.map(b => {
        const s = spending[b.id];
        const totalDays = differenceInDays(new Date(b.endDate), new Date(b.startDate)) + 1;
        const daysPassed = differenceInDays(now, new Date(b.startDate));
        const timePercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

        return (
          <motion.div key={b.id} className="card" style={{ marginBottom: 24, padding: 24 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} layout>
            {/* Header info inside card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiTarget size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{b.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                    {s ? `${sym}${s.remaining.toLocaleString()} left of ${sym}${b.amount.toLocaleString()}` : `${sym}${b.amount.toLocaleString()} total`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', color: 'var(--accent-green)', background: '#FFFFFF' }} 
                  onClick={() => navigate(`/app/budgets/${b.id}`)}
                >
                  <FiBarChart2 size={18} />
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-red), #EF4444)' }} 
                  onClick={() => handleDelete(b.id)}
                >
                  <FiTrash2 size={18} style={{ color: '#FFFFFF' }} />
                </button>
              </div>
            </div>

            {/* Timeline Progress with floating pill */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>{format(new Date(b.startDate), 'd MMM')}</span>
                <span>{format(new Date(b.endDate), 'd MMM')}</span>
              </div>
              
              <div style={{ position: 'relative', height: 24, marginBottom: 4 }}>
                <motion.span 
                  style={{ 
                    position: 'absolute', 
                    left: `${timePercent}%`, 
                    transform: 'translateX(-50%)',
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: '2px 10px', 
                    borderRadius: 100, 
                    fontSize: 11, 
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Today
                </motion.span>
              </div>

              <div className="progress-bar" style={{ height: 6, background: '#EAEBFF' }}>
                <motion.div
                  className="progress-bar-fill"
                  style={{ background: 'var(--primary)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${timePercent}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            {/* Spending progress bar */}
            {s && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{s.percentUsed}% spent</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{sym}{s.spent.toLocaleString()}</span> / {sym}{b.amount.toLocaleString()}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 8, background: '#ECEEF6' }}>
                  <motion.div
                    className="progress-bar-fill"
                    style={{ background: 'linear-gradient(90deg, #10B981, #34D399)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, s.percentUsed)}%` }}
                    transition={{ duration: 1, delay: 0.1 }}
                  />
                </div>
              </div>
            )}

            {/* Bottom Gray Stats Block */}
            {s && (
              <div style={{ 
                background: 'var(--bg-card2)', 
                padding: '16px 24px', 
                borderRadius: '16px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 16,
                alignItems: 'center',
                marginBottom: 16
              }}>
                {/* Stat 1: Budget Amount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiCreditCard size={18} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Budget Amount</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{sym}{b.amount.toLocaleString()}</div>
                  </div>
                </div>

                {/* Stat 2: Spent */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiDollarSign size={18} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Spent</div>
                    <div style={{ color: 'var(--accent-green)', fontSize: 15, fontWeight: 700 }}>{sym}{s.spent.toLocaleString()}</div>
                  </div>
                </div>

                {/* Stat 3: Daily Limit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiActivity size={18} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>Daily Limit</div>
                    <div style={{ color: 'var(--primary)', fontSize: 15, fontWeight: 700 }}>{sym}{s.dailyAllowance.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Message */}
            {s && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <FiInfo size={15} style={{ color: 'var(--text-muted)' }} />
                <span>You can spend {sym}{s.dailyAllowance.toFixed(2)}/day for {s.daysRemaining} more days</span>
              </div>
            )}

            {/* Category chips if present */}
            {!s && b.categories.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {b.categories.map(c => (
                  <span key={c.id} className="badge badge-primary" style={{ fontSize: 11 }}>{c.icon} {c.name}</span>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      <BudgetModal open={showModal} onClose={() => setShowModal(false)} onSaved={load} categories={categories} />
    </div>
  );
}
