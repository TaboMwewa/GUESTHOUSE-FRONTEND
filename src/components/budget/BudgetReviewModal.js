// src/components/budget/BudgetReviewModal.js
import { useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { fmt, formatMonth } from '../../utils/formatters';

export default function BudgetReviewModal({ isOpen, onClose, budget, onReview, isRequest = false }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverAction, setHoverAction] = useState(null);

  const handleReview = async (status) => {
    setSubmitting(true);
    try {
      await onReview(budget.id, status, comment);
      setComment('');
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Review failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!budget) return null;

  const title = isRequest ? 'Review Budget Request' : 'Approve / Reject Budget';
  const amountLabel = isRequest ? 'Amount' : 'Total Amount';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={560}>
      <Modal.Body>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--off-white) 0%, #fff 100%)',
          borderRadius: 'var(--radius-md)', 
          padding: '1.25rem', 
          marginBottom: '1.5rem',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Icon name="budget-pending" size={20} color="var(--gold)" />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              {amountLabel}
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
            {fmt(budget.total_amount || budget.amount)}
          </p>
          
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Icon name="calendar" size={16} color="var(--text-muted)" />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                Month
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', margin: 0, fontWeight: 500 }}>
              {formatMonth(budget.effective_month || budget.date)}
            </p>
          </div>

          {!isRequest && budget.items?.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Icon name="list" size={16} color="var(--text-muted)" />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Line Items ({budget.items.length})
                </p>
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                borderRadius: 'var(--radius-sm)'
              }}>
                <table style={{ width: '100%', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Description</th>
                      <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: idx < budget.items.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        <td style={{ padding: '0.5rem 0' }}>{item.description}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 500 }}>{fmt(item.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 600 }}>
                      <td style={{ paddingTop: '0.5rem' }}>Total</td>
                      <td style={{ textAlign: 'right', paddingTop: '0.5rem' }}>
                        {fmt(budget.items.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {isRequest && budget.purpose && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Icon name="purpose" size={16} color="var(--text-muted)" />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Purpose
                </p>
              </div>
              <p style={{ fontSize: '0.88rem', margin: 0, lineHeight: 1.5, color: 'var(--text)' }}>
                {budget.purpose}
              </p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="comment" size={16} color="var(--text-muted)" />
            Comment (optional)
          </label>
          <textarea 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            placeholder="Add your comments here…"
            style={{
              resize: 'vertical',
              minHeight: '80px',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <button 
          className="btn btn-ghost" 
          onClick={onClose}
          onMouseEnter={() => setHoverAction(null)}
          style={{ transition: 'all 0.2s ease' }}
        >
          Cancel
        </button>
        
        <button 
          className="btn btn-danger" 
          disabled={submitting} 
          onClick={() => handleReview('REJECTED')}
          onMouseEnter={() => setHoverAction('reject')}
          onMouseLeave={() => setHoverAction(null)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            transform: hoverAction === 'reject' ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          {submitting ? (
            <><span className="spinner"/>…</>
          ) : (
            <>
              <Icon name="reject" size={16} />
              Reject
            </>
          )}
        </button>
        
        <button 
          className="btn btn-success" 
          disabled={submitting} 
          onClick={() => handleReview('APPROVED')}
          onMouseEnter={() => setHoverAction('approve')}
          onMouseLeave={() => setHoverAction(null)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            transform: hoverAction === 'approve' ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          {submitting ? (
            <><span className="spinner"/>…</>
          ) : (
            <>
              <Icon name="approve" size={16} />
              Approve
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}