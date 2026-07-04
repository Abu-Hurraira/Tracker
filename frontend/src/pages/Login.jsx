import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 👋');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-logo">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="56" height="56" style={{ margin: '0 auto 12px', display: 'block' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--primary)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0px 0px 4px var(--primary))' }} />
              <path d="M15,15 L25,15 L25,25 Z" fill="var(--primary)" />
            </svg>
          </Link>
          <div className="auth-title">Welcome Back</div>
          <div className="auth-subtitle">Sign in to your CarryUp account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 8, fontSize: 15, padding: '14px' }}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <span className="spinner" /> : '🔓 Sign In'}
          </motion.button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </motion.div>
    </div>
  );
}
