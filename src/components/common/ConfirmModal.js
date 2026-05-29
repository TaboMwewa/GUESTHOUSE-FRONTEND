import Modal from './Modal';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure?', 
  confirmText = 'Delete', 
  confirmVariant = 'danger',
  size = 'small'
}) {
  if (!isOpen) return null;

  const modalStyle = size === 'small' ? { maxWidth: '400px' } : {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} style={modalStyle}>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn btn-${confirmVariant}`} onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}