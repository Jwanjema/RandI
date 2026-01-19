import React, { useState, useEffect, useRef } from 'react';

const AdvancedSearch = ({ 
  onSearch, 
  placeholder = 'Search...',
  suggestions = [],
  onSuggestionClick,
  filters = []
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    onSearch(query, activeFilters);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    key => activeFilters[key] && activeFilters[key] !== 'all'
  ).length;

  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex items-center gap-2">
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              style={{
                width: '100%',
                padding: '1rem 3rem 1rem 3rem',
                fontSize: '1rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'var(--bg-white)'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.2rem',
              color: 'var(--text-light)'
            }}>
              🔍
            </span>
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  onSearch('', activeFilters);
                }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            )}
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleSearch}
            style={{ minWidth: '100px' }}
          >
            Search
          </button>
          
          {filters.length > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
              style={{ position: 'relative' }}
            >
              🎛️ Filters
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--danger-color)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && query && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--bg-white)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {suggestions
              .filter(s => 
                s.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 10)
              .map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                    if (onSuggestionClick) onSuggestionClick(suggestion);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  🔍 {suggestion}
                </div>
              ))}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && filters.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'var(--bg-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div className="flex items-center justify-between mb-3">
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Advanced Filters</h4>
              {activeFilterCount > 0 && (
                <button 
                  className="btn btn-secondary"
                  onClick={clearFilters}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              {filters.map((filter, idx) => (
                <div key={idx} className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ marginBottom: '0.5rem' }}>{filter.label}</label>
                  {filter.type === 'select' ? (
                    <select
                      value={activeFilters[filter.key] || 'all'}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-white)'
                      }}
                    >
                      <option value="all">All</option>
                      {filter.options.map((opt, i) => (
                        <option key={i} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : filter.type === 'date' ? (
                    <input
                      type="date"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-white)'
                      }}
                    />
                  ) : (
                    <input
                      type={filter.type}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-white)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2" style={{ marginTop: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowFilters(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleSearch();
                  setShowFilters(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
