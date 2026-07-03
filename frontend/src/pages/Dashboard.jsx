import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { reportApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TransactionModal from '../components/TransactionModal';

function StatCard({ emoji, label, value, color, sub }) {
  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', boxShadow: 'var(--shadow)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ fontWeight: 700, color: p.color, fontSize: 14 }}>
            {p.name}: Rs{p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    const res = await reportApi.getDashboard();
    setData(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const sym = user?.currencySymbol || 'Rs';

  const chartData = data?.recentTransactions
    ? [{ name: 'This Month', expense: data.thisMonth.expense, income: data.thisMonth.income }]
    : [];

  return (
    <div className="page">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          Hello, {user?.username}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </motion.div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* Total Balance - big card */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 2, minWidth: 220 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>💼 Total Balance</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
            {sym}{(data?.totalBalance || 0).toLocaleString()}
          </div>
          {(data?.activeBudgetTotal || 0) > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
              out of{' '}
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                {sym}{(data.activeBudgetTotal).toLocaleString()}
              </span>
              {' '}(budget)
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{data?.accounts?.length || 0} accounts</div>
        </motion.div>

        {/* Expense */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>📉</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Expense</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-red)' }}>{sym}{(data?.thisMonth?.expense || 0).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{data?.thisMonth?.transactionCount || 0} transactions</div>
        </motion.div>

        {/* Income */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>📈</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Income</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)' }}>{sym}{(data?.thisMonth?.income || 0).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Net: <span style={{ color: (data?.thisMonth?.net || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>{sym}{(data?.thisMonth?.net || 0).toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Accounts */}
        <motion.div className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>🏦 Accounts</div>
            <Link to="/app/accounts" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all →</Link>
          </div>
          {data?.accounts?.length === 0 && <div className="empty-state"><div className="emoji">🏦</div><p>No accounts yet</p></div>}
          {data?.accounts?.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="cat-icon" style={{ background: a.color + '20', fontSize: 18 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{a.type}</div>
              </div>
              <div style={{ fontWeight: 700, color: a.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {sym}{a.balance?.toLocaleString()}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>🕐 Recent</div>
            <Link to="/app/transactions" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View all →</Link>
          </div>
          {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <div className="empty-state"><div className="emoji">💸</div><p>No transactions yet</p></div>
          )}
          {data?.recentTransactions?.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="cat-icon" style={{ background: (t.category?.color || '#6C63FF') + '20', fontSize: 18 }}>
                {t.category?.icon || '💰'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title || t.category?.name || 'Transaction'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                  {t.category && <span className="badge badge-primary" style={{ fontSize: 10 }}>{t.category.icon} {t.category.name}</span>}
                  <span>{format(new Date(t.date), 'd MMM')}</span>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: t.type === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: 14 }}>
                {t.type === 'expense' ? '▼' : '▲'}{sym}{t.amount?.toLocaleString()}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div className="card" style={{ marginTop: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="section-title">⚡ Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Transaction</button>
          <Link to="/app/budgets" className="btn btn-secondary">🎯 View Budgets</Link>
          <Link to="/app/summary" className="btn btn-secondary">📊 See Summary</Link>
          <Link to="/app/categories" className="btn btn-secondary">🏷️ Categories</Link>
        </div>
      </motion.div>

      {/* FAB */}
      <motion.button className="fab" onClick={() => setShowModal(true)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>+</motion.button>

      <TransactionModal open={showModal} onClose={() => setShowModal(false)} onSaved={loadData} />
    </div>
  );
}
