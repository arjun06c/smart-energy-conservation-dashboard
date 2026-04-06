import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-400 animate-pulse uppercase tracking-widest">Loading</div>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/devices" 
        element={
          <ProtectedRoute>
            <Devices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } 
      />
      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
