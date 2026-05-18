import { useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { fmt } from '../../utils/formatters';

export default function BudgetForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ effective_month: '', items: [{ description: '', cost: '' }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', cost: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const totalItems = () => form.items.reduce((s, i) => s + parseFloat(i.cost || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        effective_month: form.effective_month + '-01',
        items: form.items.map(it => ({ description: it.description, cost: it.cost }))
      });
      setForm({ effective_month: '', items: [{ description: '', cost: '' }] });
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? JSON.stringify(data) : 'Failed to create budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Monthly Budget" maxWidth={620}>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="calendar" size={12} />
              Month
            </label>
            <input 
              type="month" 
              value={form.effective_month} 
              onChange={e => setForm({...form, effective_month: e.target.value})} 
              required 
            />
          </div>
          
          <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon name="list" size={12} />
            Line Items
          </p>
          
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ flex: 2 }}>
                {i === 0 && <label>Description</label>}
                <input 
                  value={item.description} 
                  onChange={e => updateItem(i, 'description', e.target.value)} 
                  placeholder="e.g. Housekeeping supplies" 
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                {i === 0 && <label>Cost (K)</label>}
                <input 
                  type="number" 
                  step="0.01" 
                  value={item.cost} 
                  onChange={e => updateItem(i, 'cost', e.target.value)} 
                  placeholder="0.00" 
                  required 
                />
              </div>
              {form.items.length > 1 && (
                <button 
                  type="button" 
                  className="btn btn-sm" 
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '0.3rem' }} 
                  onClick={() => removeItem(i)}
                >
                  <Icon name="trash" size={12} />
                </button>
              )}
            </div>
          ))}
          
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={addItem}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Icon name="plus" size={12} />
            Add Line Item
          </button>
          
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'linear-gradient(135deg, var(--off-white), white)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="calculator" size={14} />
              Total:
            </span>
            <strong style={{ fontSize: '1rem', color: 'var(--brick-red)' }}>{fmt(totalItems())}</strong>
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {saving ? (
              <><span className="spinner" /> Creating…</>
            ) : (
              <>
                <Icon name="save" size={14} />
                Create Budget
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}