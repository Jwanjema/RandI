import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // danger, warning, info
}) => {
  if (!isOpen) return null;

  const getColor = () => {
    switch (type) {
      case 'danger': return '#e74c3c';
      case 'warning': return '#f39c12';
      default: return '#3498db';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-zoom-in" onClick={e => e.stopPropagation()} style={{
        maxWidth: '500px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: `${getColor()}20`,
            color: getColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {type === 'danger' ? '⚠' : type === 'warning' ? '⚠' : 'ℹ'}
          </div>
          <h2 style={{ margin: 0, flex: 1 }}>{title}</h2>
        </div>
        
        <p style={{ 
          color: 'var(--text-dark)', 
          marginBottom: '2rem',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          {message}
        </p>
        
        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
