import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { budgetApi, categoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
              <label className="form-label">Total Amount (Rs)</label>
              <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" required min="1" />
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
              <label className="form-label">Track Categories (optional — leave empty for all)</label>
              <div className="emoji-grid" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <button type="button" key={c.id} className={`emoji-btn ${selectedCats.includes(c.id) ? 'selected' : ''}`}
                    onClick={() => toggleCat(c.id)} title={c.name} style={{ width: 'auto', padding: '6px 10px', gap: 4, fontSize: 13 }}>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : '✓ Create Budget'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Budgets() {
  const { user } = useAuth();
  const sym = user?.currencySymbol || 'Rs';
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

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
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Budget</button>
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
          <motion.div key={b.id} className="budget-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div className="budget-name">{b.name}</div>
                <div className="budget-meta">
                  {s ? `${sym}${s.remaining.toLocaleString()} left of ${sym}${b.amount.toLocaleString()}` : `${sym}${b.amount.toLocaleString()} total`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/budgets/${b.id}`)}>📊</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>🗑️</button>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 6 }}>
              <div className="budget-timeline">
                <span>{format(new Date(b.startDate), 'd MMM')}</span>
                <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                  Today
                </span>
                <span>{format(new Date(b.endDate), 'd MMM')}</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill"
                  style={{ background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${timePercent}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            {/* Spending */}
            {s && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.percentUsed}% spent</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.remaining < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {sym}{s.spent.toLocaleString()} / {sym}{b.amount.toLocaleString()}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 10, marginBottom: 10 }}>
                  <motion.div
                    className="progress-bar-fill"
                    style={{ background: s.percentUsed > 80 ? 'linear-gradient(90deg, #FF6B6B, #E53935)' : 'linear-gradient(90deg, #4CAF7D, #8BC34A)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, s.percentUsed)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  You can spend {sym}{s.dailyAllowance.toLocaleString()}/day for {s.daysRemaining} more days
                </div>
              </>
            )}

            {/* Category chips */}
            {b.categories.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {b.categories.map(c => (
                  <span key={c.id} className="badge badge-primary" style={{ fontSize: 11 }}>{c.icon} {c.name}</span>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      <motion.button className="fab" onClick={() => setShowModal(true)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>+</motion.button>

      <BudgetModal open={showModal} onClose={() => setShowModal(false)} onSaved={load} categories={categories} />
    </div>
  );
}
