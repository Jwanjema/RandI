import React, { useState } from 'react';

const DateRangePicker = ({ onApply, onClear }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleApply = () => {
    if (startDate && endDate) {
      onApply({ startDate, endDate });
      setShowPicker(false);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    if (onClear) onClear();
    setShowPicker(false);
  };

  const presetRanges = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
    },
    {
      label: 'This Week',
      getValue: () => {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return {
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Last Month',
      getValue: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'This Year',
      getValue: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        return {
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0]
        };
      }
    }
  ];

  const applyPreset = (preset) => {
    const { startDate, endDate } = preset.getValue();
    setStartDate(startDate);
    setEndDate(endDate);
    onApply({ startDate, endDate });
    setShowPicker(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary"
        onClick={() => setShowPicker(!showPicker)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        📅 {startDate && endDate ? `${startDate} - ${endDate}` : 'Select Date Range'}
      </button>

      {showPicker && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'var(--bg-white)',
          border: '2px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          padding: '1.5rem',
          zIndex: 1000,
          minWidth: '350px'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Select Date Range</h4>
          
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>

          <div style={{ 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '1rem', 
            marginTop: '1rem' 
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Quick Select:
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '0.5rem' 
            }}>
              {presetRanges.map((preset, idx) => (
                <button
                  key={idx}
                  className="btn btn-secondary"
                  onClick={() => applyPreset(preset)}
                  style={{ 
                    padding: '0.5rem', 
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end" style={{ marginTop: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowPicker(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleApply}
              disabled={!startDate || !endDate}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
