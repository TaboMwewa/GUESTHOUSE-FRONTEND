import { useEffect } from 'react';
import Icon from './Icon';
export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span className="toast-icon">{type === 'error' ? <Icon name="warning" /> : type === 'success' ? <Icon name="check" /> : <Icon name="info" />}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}