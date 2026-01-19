import React from 'react';

const BulkActions = ({ 
  selectedItems = [], 
  totalItems = 0,
  onSelectAll,
  onDeselectAll,
  actions = []
}) => {
  const selectedCount = selectedItems.length;
  const allSelected = selectedCount === totalItems && totalItems > 0;

  return (
    <div className="card" style={{ 
      marginBottom: '1rem',
      background: selectedCount > 0 ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 'var(--bg-white)',
      border: selectedCount > 0 ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
      transition: 'all 0.3s ease'
    }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  onSelectAll();
                } else {
                  onDeselectAll();
                }
              }}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: 'var(--primary-color)'
              }}
            />
            <span className="font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </label>
          
          {selectedCount > 0 && (
            <span className="chip" style={{ 
              background: 'var(--primary-gradient)',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {selectedCount} selected
            </span>
          )}
        </div>

        {selectedCount > 0 && actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((action, idx) => (
              <button
                key={idx}
                className={`btn ${action.variant || 'btn-primary'}`}
                onClick={() => action.onClick(selectedItems)}
                disabled={action.disabled}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActions;
