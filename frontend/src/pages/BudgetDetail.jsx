import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { budgetApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const getBudgetGradient = (budgetId, percentUsed) => {
  if (percentUsed > 80) {
    return 'linear-gradient(90deg, #FF6B6B, #E53935)';
  }
  const gradients = [
    'linear-gradient(90deg, #10B981, #34D399)', // Emerald/Mint
    'linear-gradient(90deg, #3B82F6, #60A5FA)', // Blue
    'linear-gradient(90deg, #8B5CF6, #A78BFA)', // Purple
    'linear-gradient(90deg, #FBBF24, #F59E0B)', // Amber
    'linear-gradient(90deg, #EC4899, #F472B6)', // Pink
    'linear-gradient(90deg, #06B6D4, #22D3EE)', // Cyan
    'linear-gradient(90deg, #F43F5E, #FB7185)', // Rose
  ];
  let hash = 0;
  const str = budgetId || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const COLORS = ['#FF6B6B', '#6C63FF', '#4CAF7D', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#00BCD4'];

export default function BudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sym = user?.currencySymbol || 'Rs';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetApi.getSpending(id).then(r => { setData(r.data); setLoading(false); }).catch(() => navigate('/app/budgets'));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!data) return null;

  const { budget, spent, remaining, percentUsed, dailyAllowance, daysRemaining, categoryBreakdown } = data;
  const pieData = categoryBreakdown.map((c, i) => ({ name: c.category?.name, value: c.amount, color: COLORS[i % COLORS.length] }));

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/app/budgets')}>←</button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{budget.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {format(new Date(budget.startDate), 'd MMMM')} – {format(new Date(budget.endDate), 'd MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Budget Header Card */}
      <motion.div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--bg-card))', marginBottom: 20 }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: remaining < 0 ? 'var(--accent-red)' : 'var(--primary)' }}>
          {sym}{remaining.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>left of {sym}{budget.amount.toLocaleString()}</span>
        </div>
        <div style={{ margin: '16px 0 8px', position: 'relative', height: 28, background: 'var(--bg-input)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', inset: 0, padding: '0 12px', alignItems: 'center', zIndex: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{format(new Date(budget.startDate), 'd MMM')}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{percentUsed}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{format(new Date(budget.endDate), 'd MMM')}</span>
          </div>
          <motion.div style={{ height: '100%', background: getBudgetGradient(budget.id, percentUsed), borderRadius: 100 }}
            initial={{ width: 0 }} animate={{ width: `${Math.min(100, percentUsed)}%` }} transition={{ duration: 1 }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          You can spend {sym}{dailyAllowance.toLocaleString()}/day for {daysRemaining} more days
        </div>
      </motion.div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Spent', value: `${sym}${spent.toLocaleString()}`, color: 'var(--accent-red)' },
          { label: 'Remaining', value: `${sym}${remaining.toLocaleString()}`, color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
          { label: 'Daily Budget', value: `${sym}${dailyAllowance.toLocaleString()}`, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Donut Chart */}
      {pieData.length > 0 && (
        <motion.div className="chart-container" style={{ marginBottom: 20 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div className="chart-title">Spending Breakdown</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => `${sym}${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {categoryBreakdown.map((c, i) => (
                <motion.div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="cat-icon" style={{ background: (c.category?.color || '#6C63FF') + '20', width: 40, height: 40 }}>
                    {c.category?.icon || '💰'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.category?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.percentage}% of spending · {c.count} transaction{c.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{sym}{c.amount.toLocaleString()}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {categoryBreakdown.length === 0 && (
        <div className="card empty-state">
          <div className="emoji">💰</div>
          <h3>No spending tracked yet</h3>
          <p>Add transactions in the selected categories to see the breakdown</p>
        </div>
      )}
    </div>
  );
}
