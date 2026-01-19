import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import AdvancedReports from './pages/AdvancedReports';
import Documents from './pages/Documents';
import Search from './pages/Search';
import Utilities from './pages/Utilities';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import TenantPortal from './pages/TenantPortal';
import TenantMaintenance from './pages/TenantMaintenance';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

export const ThemeContext = createContext();

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/tenant-portal" replace />;
  }
  
  return children;
}

// Layout wrapper to handle sidebar visibility
function AppLayout({ children, darkMode, toggleDarkMode, sidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  });

  // Update user state when location or localStorage changes
  useEffect(() => {
    const checkUser = () => {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(userData);
    };
    
    checkUser();
    window.addEventListener('storage', checkUser);
    
    return () => window.removeEventListener('storage', checkUser);
  }, [location]);

  const showNavbar = user && user.role !== 'TENANT' && location.pathname !== '/login';

  return (
    <div className={`App ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      {showNavbar && <Navbar />}
      <div className="main-content" style={!showNavbar ? { marginLeft: 0 } : {}}>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode, sidebarOpen, toggleSidebar }}>
        <ToastProvider>
          <Router>
            <AppLayout
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              sidebarOpen={sidebarOpen}
              toggleSidebar={toggleSidebar}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/tenant-portal" element={<TenantPortal />} />
                <Route path="/tenant-maintenance" element={<TenantMaintenance />} />
                
                {/* Admin and Manager Routes */}
                <Route path="/" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MAINTENANCE']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT', 'MAINTENANCE']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/buildings" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                      <Buildings />
                    </ProtectedRoute>
                  } />
                  <Route path="/units" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                      <Units />
                    </ProtectedRoute>
                  } />
                  <Route path="/tenants" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT']}>
                      <Tenants />
                    </ProtectedRoute>
                  } />
                  <Route path="/payments" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT']}>
                      <Payments />
                    </ProtectedRoute>
                  } />
                  <Route path="/expenses" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT']}>
                      <Expenses />
                    </ProtectedRoute>
                  } />
                  <Route path="/maintenance" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'MAINTENANCE']}>
                      <Maintenance />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT']}>
                      <AdvancedReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/documents" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                      <Documents />
                    </ProtectedRoute>
                  } />
                  <Route path="/search" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT']}>
                      <Search />
                    </ProtectedRoute>
                  } />
                  <Route path="/utilities" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                      <Utilities />
                    </ProtectedRoute>
                  } />
                  <Route path="/gallery" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                      <Gallery />
                    </ProtectedRoute>
                  } />
                </Routes>
              </AppLayout>
            </Router>
        </ToastProvider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}

export default App;

