import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: '💸', title: 'Track Transactions', desc: 'Log every rupee spent or earned with categories, accounts, and notes.' },
  { icon: '🎯', title: 'Smart Budgets', desc: 'Set monthly budgets and get daily spending allowances to stay on track.' },
  { icon: '📊', title: 'Rich Analytics', desc: 'Visualize your finances with charts, summaries, and monthly history.' },
  { icon: '🏦', title: 'Multiple Accounts', desc: 'Manage bank accounts, cash, and cards all in one place.' },
  { icon: '🔒', title: 'Fully Local', desc: 'Your data stays on your PC. No cloud, no subscriptions, no privacy concerns.' },
  { icon: '🌙', title: 'Dark Mode', desc: 'Easy on the eyes with a beautiful dark theme that persists between sessions.' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing" style={{ background: theme === 'dark' ? 'var(--bg)' : 'linear-gradient(180deg, #F0F2FF 0%, #FFFFFF 50%, #F0F2FF 100%)' }}>
      {/* Navbar */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6C63FF, #5A52D5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💰</div>
          <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #6C63FF, #5A52D5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tracker</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title="Toggle theme" style={{ fontSize: 18 }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-hero-bg" />
        {/* Floating orbs */}
        <motion.div
          style={{ position: 'absolute', top: 80, left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ position: 'absolute', top: 120, right: '12%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,125,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}
          animate={{ y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 24 }}>
            ✨ Personal Finance Tracker — Local & Private
          </div>
          <h1>Track Your Money,<br />Master Your Life</h1>
          <p>A beautiful personal finance tracker that runs entirely on your PC. Track expenses, set budgets, and gain insights — all without any cloud or subscription.</p>
          <div className="landing-cta">
            <Link to="/register">
              <motion.button className="btn btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ fontSize: 16, padding: '14px 32px' }}>
                🚀 Get Started Free
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button className="btn btn-secondary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ fontSize: 16, padding: '14px 32px' }}>
                Sign In →
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}
        >
          {[['💰', 'PKR', 'Currency'], ['🔒', '100%', 'Local Data'], ['⚡', 'Real-time', 'Sync'], ['🎯', 'Smart', 'Budgets']].map(([emoji, val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lbl}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        className="landing-features"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {features.map(f => (
          <motion.div key={f.title} className="feature-card" variants={item}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13, borderTop: '1px solid var(--border)' }}>
        <p>💰 Tracker — Built for personal use. Runs locally on your PC.</p>
      </div>
    </div>
  );
}
