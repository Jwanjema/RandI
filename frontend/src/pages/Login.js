import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import axios from 'axios';
import { API_URL } from '../config';

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch CSRF token on mount
  useEffect(() => {
    axios.get(`${API_URL}/auth/csrf/`, {
      withCredentials: true
    }).catch(err => console.log('CSRF fetch failed:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get CSRF token from cookie
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSignup ? '/auth/signup/' : '/auth/login/';
      
      // Get CSRF token
      const csrfToken = getCookie('csrftoken');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        withCredentials: true,
        headers: headers
      });

      const { user, tenant_info } = response.data;

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      if (tenant_info) {
        localStorage.setItem('tenant_info', JSON.stringify(tenant_info));
      }

      // Trigger storage event for App to detect
      window.dispatchEvent(new Event('storage'));

      toast.success(`Welcome ${user.first_name || user.username}!`);

      // Redirect based on role
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        navigate('/dashboard');
      } else if (user.role === 'TENANT') {
        navigate('/tenant-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.error || (isSignup ? 'Signup failed' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Rental Management
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Demo Credentials - only show on login */}
        {!isSignup && (
          <div style={{
            background: '#f8f9ff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: '#666'
          }}>
            <strong>Demo Accounts:</strong><br />
            Admin: admin / admin123<br />
            Manager: manager / manager123<br />
            Tenant: tenant / tenant123
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required={isSignup}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (isSignup ? 'Creating Account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => setIsSignup(!isSignup)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '0.95rem',
              textDecoration: 'underline'
            }}
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
