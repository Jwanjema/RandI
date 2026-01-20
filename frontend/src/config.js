// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:8000/api'
);

// Validate in production
if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  console.error('REACT_APP_API_URL is not set in production');
}

export default { API_URL };
