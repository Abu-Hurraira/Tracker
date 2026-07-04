import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryApi } from '../services/api';
import toast from 'react-hot-toast';

const ICONS = ['🍔','🛒','🚌','🛍️','📄','💊','🎬','📚','🎁','💵','💻','🏢','📈','💰','🏦','☕','🍕','🎮','✈️','🏠','💡','🎓','🎵','🎭','🏋️','🌸','🚗','🐾','💈','🛠️'];
const COLORS = ['#FF6B6B','#6C63FF','#4CAF7D','#FF9800','#2196F3','#E91E63','#9C27B0','#00BCD4','#8BC34A','#607D8B','#FF5722','#795548'];

function CatModal({ open, onClose, onSaved, edit }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#6C63FF');
  const [type, setType] = useState('expense');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (edit) { setName(edit.name); setIcon(edit.icon); setColor(edit.color); setType(edit.type); }
    else { setName(''); setIcon('💰'); setColor('#6C63FF'); setType('expense'); }
  }, [edit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (edit) await categoryApi.update(edit.id, { name, icon, color });
      else await categoryApi.create({ name, icon, color, type });
      toast.success(edit ? 'Category updated!' : 'Category created!');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save category'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div className="modal-overlay center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{edit ? '✏️ Edit Category' : '🏷️ Add Category'}</span>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            {!edit && (
              <div className="tabs" style={{ marginBottom: 20 }}>
                <button type="button" className={`tab ${type === 'expense' ? 'active' : ''}`} onClick={() => setType('expense')}>📉 Expense</button>
                <button type="button" className={`tab ${type === 'income' ? 'active' : ''}`} onClick={() => setType('income')}>📈 Income</button>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Coffee" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div className="emoji-grid" style={{ maxHeight: 130, overflowY: 'auto' }}>
                {ICONS.map(ic => (
                  <button type="button" key={ic} className={`emoji-btn ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-grid">
                {COLORS.map(c => (
                  <div key={c} className={`color-dot ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-input)', padding: 12, borderRadius: 10, marginBottom: 20 }}>
              <div className="cat-icon" style={{ background: color + '20' }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{name || 'Category Name'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type}</div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : (edit ? '✓ Update' : '✓ Create Category')}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [filterType, setFilterType] = useState('expense');

  const load = async () => { const r = await categoryApi.getAll(); setCategories(r.data); };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await categoryApi.delete(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const filtered = categories.filter(c => c.type === filterType);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button className="btn btn-primary" onClick={() => { setEditCat(null); setShowModal(true); }}>Add Category</button>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${filterType === 'expense' ? 'active' : ''}`} onClick={() => setFilterType('expense')}>📉 Expense ({categories.filter(c=>c.type==='expense').length})</button>
        <button className={`tab ${filterType === 'income' ? 'active' : ''}`} onClick={() => setFilterType('income')}>📈 Income ({categories.filter(c=>c.type==='income').length})</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {filtered.map((c, i) => (
          <motion.div key={c.id} className="card card-sm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} layout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="cat-icon" style={{ background: c.color + '20', width: 40, height: 40, fontSize: 18 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                {c.isDefault && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>default</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setEditCat(c); setShowModal(true); }}>✏️</button>
              {!c.isDefault && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card"><div className="emoji">🏷️</div><h3>No {filterType} categories</h3></div>
      )}

      <CatModal open={showModal} onClose={() => setShowModal(false)} onSaved={load} edit={editCat} />
    </div>
  );
}
