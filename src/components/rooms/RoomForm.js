import { useState } from 'react';
import Modal from '../common/Modal';

export default function RoomForm({ isOpen, onClose, onSubmit, editing, initialData }) {
  const [form, setForm] = useState(
    initialData || { 
      room_no: '', 
      room_class: 'STANDARD', 
      capacity: 1, 
      status: 'AVAILABLE', 
      price_per_night: '' 
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? JSON.stringify(data) : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Room' : 'New Room'}>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>Room Number</label>
              <input 
                value={form.room_no} 
                onChange={e => setForm({...form, room_no: e.target.value})} 
                placeholder="e.g. 101" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Class</label>
              <select value={form.room_class} onChange={e => setForm({...form, room_class: e.target.value})}>
                <option value="STANDARD">Standard</option>
                <option value="DELUXE">Deluxe</option>
                <option value="SUITE">Suite</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input 
                type="number" 
                min="1" 
                value={form.capacity} 
                onChange={e => setForm({...form, capacity: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label>Price Per Night (K)</label>
              <input 
                type="number" 
                step="0.01" 
                value={form.price_per_night} 
                onChange={e => setForm({...form, price_per_night: e.target.value})} 
                placeholder="0.00" 
                required 
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner"/>Saving…</> : (editing ? 'Update Room' : 'Create Room')}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}