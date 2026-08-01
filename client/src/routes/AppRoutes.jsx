import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// Pages
import DashboardPage from '../pages/DashboardPage.jsx';
import TenderIntelligencePage from '../pages/TenderIntelligencePage.jsx';
import ProjectMonitoringPage from '../pages/ProjectMonitoringPage.jsx';
import CitizenVerificationPage from '../pages/CitizenVerificationPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';

// Component to protect authority-only routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'authority' && user.role !== 'admin') {
    return <Navigate to="/verify" replace />;
  }

  return children;
};

// Simple helper redirect for home path
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    if (user.role !== 'citizen') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/verify" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<CitizenVerificationPage />} />
      
      {/* Protected Authority Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tenders" 
        element={
          <ProtectedRoute>
            <TenderIntelligencePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects" 
        element={
          <ProtectedRoute>
            <ProjectMonitoringPage />
          </ProtectedRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
