import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function groupByDate(transactions) {
  const groups = {};
  for (const t of transactions) {
    const key = format(parseISO(t.date), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function dateLabel(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d)) return `Today, ${format(d, 'd MMMM')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'd MMMM')}`;
  return format(d, 'EEEE, d MMMM');
}

export default function Transactions() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const { user } = useAuth();
  const sym = user?.currencySymbol || 'Rs';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionApi.getAll(month, year);
      setTransactions(res.data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await transactionApi.delete(id);
    toast.success('Transaction deleted');
    load();
  };

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const grouped = groupByDate(transactions);

  // Build month tabs: 3 months back → 3 months forward
  const monthTabs = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(year, (now.getMonth() + i));
    monthTabs.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: MONTHS[d.getMonth()] });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
      </div>

      {/* Month Tabs */}
      <div className="month-scroller" style={{ marginBottom: 16 }}>
        {monthTabs.map(m => (
          <button
            key={`${m.year}-${m.month}`}
            className={`month-tab ${month === m.month ? 'active' : ''}`}
            onClick={() => setMonth(m.month)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">▼ Expense</div>
          <div className="stat-value amount-expense">{sym}{totalExpense.toLocaleString()}</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-label">▲ Income</div>
          <div className="stat-value amount-income">{sym}{totalIncome.toLocaleString()}</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-label">= Net</div>
          <div className={`stat-value ${net >= 0 ? 'amount-income' : 'amount-expense'}`}>{net >= 0 ? '' : '-'}{sym}{Math.abs(net).toLocaleString()}</div>
        </div>
      </div>

      {/* List */}
      <motion.div className="card">
        {loading && (
          <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32 }} /><p style={{ marginTop: 12 }}>Loading...</p></div>
        )}
        {!loading && transactions.length === 0 && (
          <div className="empty-state">
            <div className="emoji">💸</div>
            <h3>No transactions in {MONTHS[month - 1]}</h3>
            <p>Tap + to add your first transaction</p>
          </div>
        )}
        {grouped.map(([date, txs]) => (
          <div key={date}>
            <div className="tx-date-header">
              <span>{dateLabel(date)}</span>
              <span style={{
                background: 'rgba(255, 152, 0, 0.12)',
                color: '#FF9800',
                fontWeight: 700,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 100,
                letterSpacing: '0.2px',
              }}>
                −{sym}{txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </span>
            </div>
            <AnimatePresence>
              {txs.map(t => (
                <motion.div
                  key={t.id}
                  className="tx-item"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => { setEditTx(t); setShowModal(true); }}
                  style={{ position: 'relative' }}
                >
                  {/* Left: Category Icon */}
                  <div className="cat-icon" style={{ background: (t.category?.color || '#6C63FF') + '22', flexShrink: 0 }}>
                    {t.category?.icon || '💰'}
                  </div>

                  {/* Center: Name + Badges */}
                  <div className="tx-info">
                    <div className="tx-name">{t.title || t.category?.name || 'Transaction'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                      {t.category && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 100 }}>
                          {t.category.icon} {t.category.name}
                        </span>
                      )}
                      {t.account && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 100 }}>
                          {t.account.icon} {t.account.name}
                        </span>
                      )}
                      {t.note && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>· {t.note}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount + Delete side by side */}
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: t.type === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)',
                      letterSpacing: '-0.3px',
                      textAlign: 'right',
                      minWidth: 70,
                    }}>
                      {t.type === 'expense' ? '−' : '+'}{sym}{t.amount.toLocaleString()}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: 'var(--text-muted)',
                        padding: '4px',
                        borderRadius: 6,
                        lineHeight: 1,
                        transition: 'color 0.2s',
                        flexShrink: 0,
                      }}
                      title="Delete"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      🗑
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
        {!loading && transactions.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            Total cash flow: -{sym}{totalExpense.toLocaleString()} · {transactions.length} transactions
          </div>
        )}
      </motion.div>

      <motion.button className="fab" onClick={() => { setEditTx(null); setShowModal(true); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>+</motion.button>

      <TransactionModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTx(null); }}
        onSaved={load}
        editTx={editTx}
      />
    </div>
  );
}
