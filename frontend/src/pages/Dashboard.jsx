import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { reportApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiChevronRight, 
  FiPlus, 
  FiTarget, 
  FiBarChart2, 
  FiTag, 
  FiDownload 
} from 'react-icons/fi';
import TransactionModal from '../components/TransactionModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    try {
      const res = await reportApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const sym = user?.currencySymbol || 'Rs';

  // Dynamic sparkline generator helpers using actual transaction history
  const getBalanceSparkData = () => {
    const base = data?.totalBalance || 7350;
    if (!data?.recentTransactions || data.recentTransactions.length === 0) {
      return [
        { value: base * 0.85 },
        { value: base * 0.89 },
        { value: base * 0.82 },
        { value: base * 0.94 },
        { value: base * 0.98 },
        { value: base * 0.92 },
        { value: base }
      ];
    }
    let current = base;
    const points = [{ value: current }];
    // Track balance backwards through recent transactions
    for (const t of data.recentTransactions) {
      if (t.type === 'expense') {
        current += t.amount;
      } else {
        current -= t.amount;
      }
      points.unshift({ value: current });
    }
    return points;
  };

  const getExpenseSparkData = () => {
    const base = data?.thisMonth?.expense || 2650;
    if (!data?.recentTransactions) {
      return [
        { value: 100 },
        { value: 180 },
        { value: 140 },
        { value: 320 },
        { value: 250 },
        { value: 400 },
        { value: base }
      ];
    }
    const expenses = data.recentTransactions
      .filter(t => t.type === 'expense')
      .map(t => t.amount);
    
    if (expenses.length < 3) {
      return [
        { value: base * 0.4 },
        { value: base * 0.6 },
        { value: base * 0.5 },
        { value: base * 0.8 },
        { value: base * 0.75 },
        { value: base }
      ];
    }
    return expenses.reverse().map(val => ({ value: val }));
  };

  const getIncomeSparkData = () => {
    const base = data?.thisMonth?.income || 0;
    if (base === 0) {
      // Return a flat line representing zero income if none
      return [
        { value: 0 },
        { value: 0 },
        { value: 0 },
        { value: 0 }
      ];
    }
    const incomes = data.recentTransactions
      .filter(t => t.type === 'income')
      .map(t => t.amount);

    if (incomes.length < 3) {
      return [
        { value: base * 0.2 },
        { value: base * 0.5 },
        { value: base * 0.4 },
        { value: base * 0.8 },
        { value: base }
      ];
    }
    return incomes.reverse().map(val => ({ value: val }));
  };

  return (
    <div className="page">
      {/* Date Header Row with top-right Add Transaction button */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>
            Hello, {user?.username || 'Hurriara'}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13 }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Transaction
        </button>
      </motion.div>

      {/* 3-Column Stat Cards Row */}
      <div className="dashboard-stat-row">
        {/* TOTAL BALANCE (Purple gradient card) */}
        <motion.div 
          className="card card-balance" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 150 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
              TOTAL BALANCE
            </span>
            <span className="trend-badge positive" style={{ background: '#E6FDF4', color: '#10B981', padding: '4px 10px', fontSize: 12 }}>
              + 73%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginBottom: 6 }}>
                {sym}{(data?.totalBalance || 0).toLocaleString()}
              </div>
              {(data?.activeBudgetTotal || 0) > 0 ? (
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  out of <span style={{ fontWeight: 700 }}>{sym}{(data.activeBudgetTotal).toLocaleString()}</span> (budget)
                </div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.8 }}>out of budget limits</div>
              )}
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                {data?.accounts?.length || 0} account{data?.accounts?.length !== 1 && 's'}
              </div>
            </div>

            {/* Sparkline chart */}
            <div style={{ width: '110px', height: '45px' }} className="sparkline-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getBalanceSparkData()} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#FFFFFF" 
                    strokeWidth={2} 
                    fill="url(#balanceGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* EXPENSE Card */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 150 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ 
              background: 'rgba(255, 90, 90, 0.08)', 
              color: 'var(--accent-red)', 
              borderRadius: '8px', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiTrendingDown size={18} />
            </div>
            <span className="trend-badge negative" style={{ padding: '4px 10px', fontSize: 12 }}>
              - 12%
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>
              EXPENSE
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-red)', lineHeight: 1.1, marginBottom: 6 }}>
                  {sym}{(data?.thisMonth?.expense || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {data?.thisMonth?.transactionCount || 0} transactions
                </div>
              </div>

              {/* Sparkline chart */}
              <div style={{ width: '110px', height: '45px' }} className="sparkline-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getExpenseSparkData()} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--accent-red)" 
                      strokeWidth={2} 
                      fill="url(#expenseGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* INCOME Card */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 150 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.08)', 
              color: 'var(--accent-green)', 
              borderRadius: '8px', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiTrendingUp size={18} />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>
              INCOME
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1.1, marginBottom: 6 }}>
                  {sym}{(data?.thisMonth?.income || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Net: <span style={{ color: (data?.thisMonth?.net || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                    {(data?.thisMonth?.net || 0) >= 0 ? '' : '-'}{sym}{Math.abs(data?.thisMonth?.net || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sparkline chart */}
              <div style={{ width: '110px', height: '45px' }} className="sparkline-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getIncomeSparkData()} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--accent-green)" 
                      strokeWidth={2} 
                      fill="url(#incomeGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grid: Accounts (Left) and Recent Transactions (Right) */}
      <div className="dashboard-grid">
        {/* Accounts Card */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Accounts</div>
            <Link to="/app/accounts" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View all</Link>
          </div>
          {data?.accounts?.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 10px' }}>
              <div className="emoji" style={{ fontSize: 36 }}>🏦</div>
              <p style={{ fontSize: 14 }}>No accounts yet</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data?.accounts?.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="cat-icon" style={{ background: (a.color || '#5F5AF6') + '15', color: a.color || '#5F5AF6', fontSize: 18, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {a.icon || '🏦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{a.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: a.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {sym}{a.balance?.toLocaleString()}
                  </span>
                  <FiChevronRight style={{ color: 'var(--text-muted)', fontSize: 15 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions Card */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Recent Transactions</div>
            <Link to="/app/transactions" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View all</Link>
          </div>
          {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <div className="empty-state" style={{ padding: '40px 10px' }}>
              <div className="emoji" style={{ fontSize: 36 }}>💸</div>
              <p style={{ fontSize: 14 }}>No transactions yet</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data?.recentTransactions?.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="cat-icon" style={{ background: (t.category?.color || '#5F5AF6') + '15', fontSize: 18, borderRadius: '12px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.category?.icon || '💰'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t.title || t.category?.name || 'Transaction'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    {t.category && (
                      <span style={{ 
                        background: (t.category.color || '#5F5AF6') + '15', 
                        color: t.category.color || '#5F5AF6', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: 10, 
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        {t.category.icon} {t.category.name}
                      </span>
                    )}
                    <span>{format(new Date(t.date), 'd MMM')}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: t.type === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: 14 }}>
                  {t.type === 'expense' ? '▼' : '▲'} {sym}{t.amount?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Card */}
      <motion.div 
        className="card" 
        style={{ marginTop: 20 }} 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
      >
        <div className="section-title" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Transaction
          </button>
          <Link to="/app/budgets" className="btn btn-secondary">
            <FiTarget size={16} /> View Budgets
          </Link>
          <Link to="/app/summary" className="btn btn-secondary">
            <FiBarChart2 size={16} /> See Summary
          </Link>
          <Link to="/app/categories" className="btn btn-secondary">
            <FiTag size={16} /> Categories
          </Link>
          <button className="btn btn-secondary" onClick={() => navigate('/app/summary')}>
            <FiDownload size={16} /> Export Report
          </button>
        </div>
      </motion.div>

      <TransactionModal open={showModal} onClose={() => setShowModal(false)} onSaved={loadData} />
    </div>
  );
}
