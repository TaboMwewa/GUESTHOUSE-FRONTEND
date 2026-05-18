import { useState } from 'react';
import api from '../../api/api';
import { fmt } from '../../utils/formatters';
import Icon from '../common/Icon';

export default function CheckInForm({ rooms, onSuccess }) {
  const available = rooms.filter(r => r.status === 'AVAILABLE');
  const [form, setForm] = useState({
    guest_name: '', guest_contact: '', room: '',
    checked_in_at: new Date().toISOString().slice(0, 16),
    no_of_occupants: 1,
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedRoom = rooms.find(r => r.id === parseInt(form.room));

  // ── Validation helpers ─────────────────────────────────
  const validateName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Guest name is required.';
    if (trimmed.length < 2) return 'Name must be at least 2 characters.';
    if (trimmed.length > 100) return 'Name is too long (max 100 characters).';
    if (!/^[a-zA-ZÀ-ÿ\s\-'.]+$/.test(trimmed)) return 'Name contains invalid characters.';
    return null;
  };

  const validateContact = (contact) => {
    const trimmed = contact.trim();
    if (!trimmed) return 'Contact number is required.';
    // International format: allow +, digits, spaces, dashes, parentheses
    if (!/^[\+\d\s\-\(\)]{8,20}$/.test(trimmed)) return 'Invalid contact format. Use e.g., +260977123456';
    return null;
  };

  const sanitizeInput = (str) => {
    return str.replace(/[<>]/g, ''); // basic XSS prevention
  };

  // ── Error parser for API responses ─────────────────────
  const parseApiError = (err) => {
    const response = err.response;
    if (!response) return { general: 'Network error. Please check your connection.' };
    
    const { status, data } = response;
    const generalErrors = [];
    const fieldErrorsMap = {};

    // HTTP status mapping
    if (status === 400) {
      // Check for non-field errors
      if (typeof data === 'string') {
        generalErrors.push(data);
      } else if (data.non_field_errors) {
        generalErrors.push(...data.non_field_errors);
      } else if (data.detail) {
        generalErrors.push(data.detail);
      } else if (data.error) {
        generalErrors.push(data.error);
      } else {
        // Field-specific errors
        for (const [field, messages] of Object.entries(data)) {
          if (Array.isArray(messages)) {
            fieldErrorsMap[field] = messages[0];
          } else if (typeof messages === 'string') {
            fieldErrorsMap[field] = messages;
          } else {
            generalErrors.push(`${field}: ${JSON.stringify(messages)}`);
          }
        }
      }
    } else if (status === 403) {
      generalErrors.push('You do not have permission to perform this action.');
    } else if (status === 404) {
      generalErrors.push('Resource not found. Please refresh and try again.');
    } else if (status === 409) {
      generalErrors.push('Room is no longer available. Please select another room.');
    } else if (status >= 500) {
      generalErrors.push('Server error. Please try again later.');
    } else {
      generalErrors.push(data?.detail || data?.message || 'An unexpected error occurred.');
    }

    return { general: generalErrors.join('; '), fields: fieldErrorsMap };
  };

  // ── Form submission with validation ────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);

    // Client-side validation
    const nameError = validateName(form.guest_name);
    const contactError = validateContact(form.guest_contact);
    
    if (nameError) {
      setError(nameError);
      setLoading(false);
      return;
    }
    if (contactError) {
      setError(contactError);
      setLoading(false);
      return;
    }
    if (!form.room) {
      setError('Please select a room.');
      setLoading(false);
      return;
    }
    const occupants = parseInt(form.no_of_occupants);
    if (selectedRoom && occupants > selectedRoom.capacity) {
      setError(`Occupants (${occupants}) exceed maximum capacity of ${selectedRoom.capacity}.`);
      setLoading(false);
      return;
    }
    if (paymentAmount && parseFloat(paymentAmount) <= 0) {
      setError('Payment amount must be greater than zero if provided.');
      setLoading(false);
      return;
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(form.guest_name.trim());
    const sanitizedContact = sanitizeInput(form.guest_contact.trim());

    try {
      const res = await api.post('/room-allocations/', {
        ...form,
        guest_name: sanitizedName,
        guest_contact: sanitizedContact,
        room: parseInt(form.room),
        no_of_occupants: occupants,
        checked_in_at: new Date(form.checked_in_at).toISOString(),
      });
      
      if (paymentAmount) {
        await api.post('/payments/', {
          allocation: res.data.id,
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
        });
      }
      
      setSuccess(`${sanitizedName} successfully checked in to Room ${selectedRoom?.room_no}!`);
      // Reset form
      setForm({
        guest_name: '', guest_contact: '', room: '',
        checked_in_at: new Date().toISOString().slice(0, 16),
        no_of_occupants: 1,
      });
      setPaymentAmount('');
      onSuccess();
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.general) setError(parsed.general);
      if (Object.keys(parsed.fields).length) setFieldErrors(parsed.fields);
      if (!parsed.general && !Object.keys(parsed.fields).length) {
        setError('Check-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to display field-specific error under input
  const FieldError = ({ field }) => {
    if (!fieldErrors[field]) return null;
    return <small style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '0.2rem' }}>{fieldErrors[field]}</small>;
  };

  return (
    <div className="card" style={{ maxWidth: 680 }}>
      <div className="card-header">
        <span className="card-title">Guest Check-In</span>
        <Icon name="checkin" size={20} color="var(--brick-red)" />
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="alert-circle" size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="check-circle" size={18} />
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>
                <Icon name="user" size={12} style={{ marginRight: '0.3rem' }} />
                Guest Full Name
              </label>
              <input 
                value={form.guest_name} 
                onChange={e => setForm({...form, guest_name: e.target.value})} 
                placeholder="e.g. Peter Zulu" 
                required 
              />
              <FieldError field="guest_name" />
            </div>
            <div className="form-group">
              <label>
                <Icon name="phone" size={12} style={{ marginRight: '0.3rem' }} />
                Contact / Phone
              </label>
              <input 
                value={form.guest_contact} 
                onChange={e => setForm({...form, guest_contact: e.target.value})} 
                placeholder="+260 977 123 456" 
                required 
              />
              <FieldError field="guest_contact" />
            </div>
            <div className="form-group">
              <label>
                <Icon name="bed" size={12} style={{ marginRight: '0.3rem' }} />
                Room
              </label>
              <select value={form.room} onChange={e => setForm({...form, room: e.target.value})} required>
                <option value="">— Select a room —</option>
                {available.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_no} — {r.room_class} ({fmt(r.price_per_night)}/night)
                  </option>
                ))}
              </select>
              <FieldError field="room" />
            </div>
            <div className="form-group">
              <label>
                <Icon name="users" size={12} style={{ marginRight: '0.3rem' }} />
                No. of Occupants
              </label>
              <input 
                type="number" 
                min="1" 
                max={selectedRoom?.capacity || 10}
                value={form.no_of_occupants}
                onChange={e => setForm({...form, no_of_occupants: e.target.value})}
                required 
              />
              {selectedRoom && (
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Icon name="info" size={10} />
                  Max capacity: {selectedRoom.capacity}
                </small>
              )}
              <FieldError field="no_of_occupants" />
            </div>
            <div className="form-group span-2">
              <label>
                <Icon name="calendar" size={12} style={{ marginRight: '0.3rem' }} />
                Check-In Date & Time
              </label>
              <input 
                type="datetime-local" 
                value={form.checked_in_at} 
                onChange={e => setForm({...form, checked_in_at: e.target.value})} 
                required 
              />
              <FieldError field="checked_in_at" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="credit-card" size={14} />
              Payment (optional)
            </p>
            <div className="form-grid">
              <div className="form-group">
                <label>Amount (K)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  placeholder="0.00" 
                />
                <FieldError field="amount" />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="TRANSFER">Mobile Money</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? (
              <><span className="spinner" /> Checking in…</>
            ) : (
              <>
                <Icon name="checkin" size={16} />
                Check In Guest
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}