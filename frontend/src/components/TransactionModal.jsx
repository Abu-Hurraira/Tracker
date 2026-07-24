import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionApi, categoryApi, accountApi } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TransactionModal({ open, onClose, onSaved, editTx }) {
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([categoryApi.getAll(), accountApi.getAll()]).then(([cats, accs]) => {
      setCategories(cats.data);
      const usable = (accs.data || []).filter(a => !a.isMain);
      setAccounts(usable);
      if (usable.length > 0 && !accountId) setAccountId(usable[0].id);
    });
  }, [open]);

  useEffect(() => {
    if (editTx) {
      setType(editTx.type);
      setTitle(editTx.title || '');
      setAmount(String(editTx.amount));
      setNote(editTx.note || '');
      setDate(format(new Date(editTx.date), 'yyyy-MM-dd'));
      setCategoryId(editTx.category?.id || '');
      setAccountId(editTx.account?.id || '');
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setNote('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setCategoryId('');
    }
  }, [editTx, open]);

  const filteredCats = categories.filter(c => c.type === type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(+amount) || +amount <= 0) return toast.error('Enter a valid amount');

    if (type === 'expense') {
      if (!accountId) return toast.error('Select an account for expenses');
      const acc = accounts.find(a => String(a.id) === String(accountId));
      const bal = acc?.balance ?? 0;
      const value = parseFloat(amount);
      if (bal <= 0) {
        return toast.error('Account balance is zero. Add funds or transfer from main first.');
      }
      if (value > bal) {
        return toast.error(`Insufficient balance. Available: Rs${Number(bal).toLocaleString()}`);
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: title || null,
        amount: parseFloat(amount),
        type,
        note: note || null,
        date: new Date(date).toISOString(),
        categoryId: categoryId ? parseInt(categoryId) : null,
        accountId: accountId ? parseInt(accountId) : null,
      };
      if (editTx) await transactionApi.update(editTx.id, payload);
      else await transactionApi.create(payload);
      toast.success(editTx ? 'Transaction updated!' : 'Transaction added!');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <span className="modal-title">{editTx ? '✏️ Edit Transaction' : '➕ Add Transaction'}</span>
              <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
            </div>

            {/* Type Toggle */}
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab ${type === 'expense' ? 'active' : ''}`} onClick={() => setType('expense')}>
                📉 Expense
              </button>
              <button className={`tab ${type === 'income' ? 'active' : ''}`} onClick={() => setType('income')}>
                📈 Income
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Amount (Rs)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Name / Title</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Lunch at KFC, Salary, Petrol"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">No Category</option>
                    {filteredCats.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Account {type === 'expense' ? '*' : ''}</label>
                  <select className="form-input form-select" value={accountId} onChange={e => setAccountId(e.target.value)} required={type === 'expense'}>
                    <option value="">{type === 'expense' ? 'Select account' : 'No Account'}</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} disabled={type === 'expense' && (a.balance ?? 0) <= 0}>
                        {a.icon} {a.name} (Rs{Number(a.balance || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                  {type === 'expense' && accountId && (accounts.find(a => String(a.id) === String(accountId))?.balance ?? 0) <= 0 && (
                    <div style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 6 }}>
                      This account has no balance. Transfer from main or add income first.
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" type="text" placeholder="What was this for?" value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
              </div>

              <button type="submit" className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? <span className="spinner" /> : (editTx ? '✓ Update Transaction' : '✓ Add Transaction')}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
