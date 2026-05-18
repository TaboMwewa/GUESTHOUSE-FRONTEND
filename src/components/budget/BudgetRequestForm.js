import { useState } from 'react';
import Modal from '../common/Modal';

export default function BudgetRequestForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ amount: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate amount is positive
    const amount = parseFloat(form.amount);
    if (!form.amount || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({ amount: '', purpose: '' });
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? JSON.stringify(data) : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Budget Request">
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-grid cols-1">
            <div className="form-group">
              <label>Amount (K)</label>
              <input 
                type="number" 
                step="0.01" 
                value={form.amount} 
                onChange={e => setForm({...form, amount: e.target.value})} 
                placeholder="0.00" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea 
                value={form.purpose} 
                onChange={e => setForm({...form, purpose: e.target.value})} 
                placeholder="Describe what the funds are needed for…" 
                required 
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={submitting || !form.amount || parseFloat(form.amount) <= 0 || !form.purpose}
          >
            {submitting ? <><span className="spinner"/>Submitting…</> : 'Submit Request'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}