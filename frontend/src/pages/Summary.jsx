import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reportApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label, sym }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ fontWeight: 700, color: p.color, fontSize: 14 }}>
            {p.name}: {sym}{p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RANGE_OPTIONS = [
  { label: 'This Month', from: startOfMonth(new Date()), to: new Date() },
  { label: 'Last Month', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
  { label: 'Last 3 Months', from: startOfMonth(subMonths(new Date(), 2)), to: new Date() },
  { label: 'This Year', from: new Date(new Date().getFullYear(), 0, 1), to: new Date() },
];

export default function Summary() {
  const { user } = useAuth();
  const sym = user?.currencySymbol || 'Rs';
  const [rangeIdx, setRangeIdx] = useState(0);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('current');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = RANGE_OPTIONS[rangeIdx];
    setLoading(true);
    Promise.all([
      reportApi.getSummary(from.toISOString(), to.toISOString()),
      reportApi.getMonthlyHistory(12)
    ]).then(([s, h]) => {
      setSummary(s.data);
      setHistory(h.data.reverse());
    }).finally(() => setLoading(false));
  }, [rangeIdx]);

  const pieColors = ['#FF6B6B', '#6C63FF', '#4CAF7D', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#00BCD4'];

  const dailyChartData = summary?.dailyTotals?.map(d => ({
    date: format(new Date(d.date), 'd MMM'),
    Expense: d.expense,
    Income: d.income,
  })) || [];

  const historyChartData = history.map(h => ({
    name: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][h.month - 1]} ${h.year}`,
    Expense: h.expense,
    Income: h.income,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Summary</h1>
        <div className="tabs">
          <button className={`tab ${tab === 'current' ? 'active' : ''}`} onClick={() => setTab('current')}>📅 Current</button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>🕐 History</button>
        </div>
      </div>

      {tab === 'current' && (
        <>
          {/* Range Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {RANGE_OPTIONS.map((r, i) => (
              <button key={r.label} className={`btn btn-sm ${rangeIdx === i ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRangeIdx(i)}>
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Net Total */}
              <div className="card" style={{ textAlign: 'center', marginBottom: 20, background: 'linear-gradient(135deg, var(--primary-light), var(--bg-card))' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Net Total</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: (summary?.netTotal || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', margin: '8px 0' }}>
                  {(summary?.netTotal || 0) >= 0 ? '+' : ''}{sym}{(summary?.netTotal || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{summary?.transactionCount || 0} transactions</div>
              </div>

              {/* Stats Row */}
              <div className="summary-cards" style={{ marginBottom: 20 }}>
                <div className="summary-card">
                  <div className="summary-card-label">📉 Expense × {summary?.categoryBreakdown?.reduce((s,c)=>s+c.count,0)||0}</div>
                  <div className="summary-card-value amount-expense">{sym}{(summary?.totalExpense || 0).toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">📈 Income</div>
                  <div className="summary-card-value amount-income">{sym}{(summary?.totalIncome || 0).toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">📊 Transactions</div>
                  <div className="summary-card-value">{summary?.transactionCount || 0}</div>
                </div>
              </div>

              {/* Area Chart */}
              {dailyChartData.length > 0 && (
                <div className="chart-container" style={{ marginBottom: 20 }}>
                  <div className="chart-title">Daily Cash Flow</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dailyChartData}>
                      <defs>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip content={<CustomTooltip sym={sym} />} />
                      <Area type="monotone" dataKey="Expense" stroke="#FF6B6B" fill="url(#expGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Income" stroke="#4CAF7D" fill="url(#incGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Horizontal Progress Bar */}
              {(summary?.totalExpense || 0) > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="chart-title">Expense vs Income Ratio</div>
                  <div style={{ position: 'relative', height: 28, background: 'var(--bg-input)', borderRadius: 100, overflow: 'hidden' }}>
                    <motion.div
                      style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'linear-gradient(90deg, #FF6B6B, #FF9800)', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((summary?.totalExpense || 0) / Math.max(summary?.totalExpense, summary?.totalIncome, 1)) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    >
                      {summary?.totalExpense > 30 && <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>▼ Expense</span>}
                    </motion.div>
                    <motion.div
                      style={{ position: 'absolute', right: 0, top: 0, height: '100%', background: 'linear-gradient(90deg, #4CAF7D, #8BC34A)', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((summary?.totalIncome || 0) / Math.max(summary?.totalExpense, summary?.totalIncome, 1)) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    >
                      {summary?.totalIncome > 30 && <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>▲ Income</span>}
                    </motion.div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--accent-red)' }}>▼ Outgoing</span>
                    <span style={{ color: 'var(--accent-green)' }}>▲ Incoming</span>
                  </div>
                </div>
              )}

              {/* Category Donut */}
              {summary?.categoryBreakdown?.length > 0 && (
                <div className="chart-container" style={{ marginBottom: 20 }}>
                  <div className="chart-title">Spending by Category</div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    <PieChart width={200} height={200}>
                      <Pie data={summary.categoryBreakdown} dataKey="amount" nameKey="category.name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                        {summary.categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${sym}${val.toLocaleString()}`} />
                    </PieChart>
                    <div style={{ flex: 1 }}>
                      {summary.categoryBreakdown.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: pieColors[i % pieColors.length], flexShrink: 0 }} />
                          <div className="cat-icon" style={{ background: (c.category?.color || '#6C63FF') + '20', width: 36, height: 36, fontSize: 16 }}>
                            {c.category?.icon || '💰'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.category?.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.percentage}% of spending · {c.count} tx</div>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{sym}{c.amount.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {tab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="chart-container" style={{ marginBottom: 20 }}>
            <div className="chart-title">Monthly History (Last 12 Months)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip sym={sym} />} />
                <Legend />
                <Bar dataKey="Expense" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Income" fill="#4CAF7D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {history.map((h, i) => (
            <motion.div key={i} className="card" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'][h.month - 1]} {h.year}
                </div>
                <div style={{ fontSize: 13, color: h.net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                  Net: {h.net >= 0 ? '+' : ''}{sym}{h.net.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--accent-red)', fontWeight: 600 }}>▼ {sym}{h.expense.toLocaleString()}</div>
                <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>▲ {sym}{h.income.toLocaleString()}</div>
              </div>
            </motion.div>
          ))}
          {history.length === 0 && (
            <div className="empty-state"><div className="emoji">📊</div><h3>No history yet</h3><p>Start adding transactions!</p></div>
          )}
        </motion.div>
      )}
    </div>
  );
}
