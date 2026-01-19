import React from 'react';

// Loading skeleton for table rows
export const TableSkeleton = ({ rows = 5, columns = 7 }) => {
  return (
    <tbody>
      {[...Array(rows)].map((_, rowIndex) => (
        <tr key={rowIndex}>
          {[...Array(columns)].map((_, colIndex) => (
            <td key={colIndex}>
              <div className="skeleton" style={{ width: '100%', height: '20px' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

// Loading skeleton for cards
export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="stats-grid">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="stat-card">
          <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '40%', height: '24px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading skeleton for building cards
export const BuildingCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="buildings-grid">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="building-card">
          <div className="skeleton" style={{ width: '100%', height: '200px', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '70%', height: '24px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '40px' }} />
        </div>
      ))}
    </div>
  );
};

// Generic list skeleton
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[...Array(items)].map((_, index) => (
        <div key={index} style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-white)'
        }}>
          <div className="skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '40%', height: '14px' }} />
          </div>
          <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
        </div>
      ))}
    </div>
  );
};

// Chart skeleton
export const ChartSkeleton = () => {
  return (
    <div className="card">
      <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ width: '100%', height: '300px' }} />
    </div>
  );
};

// Full page loading
export const PageSkeleton = () => {
  return (
    <div className="container">
      <div className="skeleton" style={{ width: '200px', height: '40px', marginBottom: '2rem' }} />
      <CardSkeleton />
      <div className="card" style={{ marginTop: '2rem' }}>
        <table className="table">
          <thead>
            <tr>
              {[...Array(7)].map((_, index) => (
                <th key={index}>
                  <div className="skeleton" style={{ width: '80%', height: '16px' }} />
                </th>
              ))}
            </tr>
          </thead>
          <TableSkeleton />
        </table>
      </div>
    </div>
  );
};

const Skeletons = {
  Table: TableSkeleton,
  Card: CardSkeleton,
  Building: BuildingCardSkeleton,
  List: ListSkeleton,
  Chart: ChartSkeleton,
  Page: PageSkeleton
};

export default Skeletons;
