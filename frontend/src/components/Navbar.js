import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';
import axios from 'axios';
import { API_URL } from '../config';

function Navbar() {
  const { sidebarOpen, toggleSidebar } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout/`, {}, {
        withCredentials: true
      });
      localStorage.removeItem('user');
      localStorage.removeItem('tenant_info');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage anyway
      localStorage.removeItem('user');
      localStorage.removeItem('tenant_info');
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/buildings', icon: '🏢', label: 'Buildings' },
    { path: '/units', icon: '🚪', label: 'Units' },
    { path: '/tenants', icon: '👥', label: 'Tenants' },
    { path: '/payments', icon: '💰', label: 'Payments' },    { path: '/expenses', icon: '💸', label: 'Expenses' },    { path: '/maintenance', icon: '🔧', label: 'Maintenance' },
    { path: '/reports', icon: '📈', label: 'Reports' }
  ];

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth <= 768 && sidebarOpen) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.querySelector('.sidebar-toggle');
        
        if (sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          toggleSidebar();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, toggleSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="mobile-overlay active" 
          onClick={toggleSidebar}
        />
      )}

      {/* Toggle Button */}
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        title={sidebarOpen ? 'Close Menu' : 'Open Menu'}
        aria-label={sidebarOpen ? 'Close Menu' : 'Open Menu'}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🏢</span>
            {sidebarOpen && <span className="logo-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>RMS</span>}
          </div>
        </div>

        <ul className="sidebar-menu" style={{ padding: sidebarOpen ? '1rem 0.5rem' : '1rem 0' }}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={location.pathname === item.path ? 'active' : ''}
                title={!sidebarOpen ? item.label : ''}
                aria-label={item.label}
                style={{
                  padding: sidebarOpen ? '0.75rem 1rem' : '0.75rem',
                  margin: sidebarOpen ? '0.25rem 0' : '0.5rem 0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <span className="menu-icon" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {sidebarOpen && <span className="menu-label" style={{ fontSize: '0.95rem', fontWeight: '500' }}>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer" style={{ 
          marginTop: 'auto', 
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          {user && sidebarOpen && (
            <div style={{
              padding: '1rem',
              margin: '0 0.5rem 1rem 0.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                fontWeight: '700',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}>
                {(user.first_name || user.username).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '600', 
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.first_name || user.username}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.6)', 
                  marginTop: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.role_display || user.role}
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="theme-toggle-sidebar"
            style={{ 
              margin: sidebarOpen ? '0 0.5rem 1rem 0.5rem' : '0 0 1rem 0',
              width: sidebarOpen ? 'calc(100% - 1rem)' : 'auto',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              transition: 'all 0.3s ease',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Logout"
            aria-label="Logout"
          >
            <span className="menu-icon">🚪</span>
            {sidebarOpen && <span className="menu-label">Logout</span>}
          </button>

          {!sidebarOpen && user && (
            <div style={{ 
              padding: '0 0 1rem 0', 
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title={user.first_name || user.username}
              >
                {(user.first_name || user.username).charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;

