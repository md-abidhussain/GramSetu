import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingScreen from '../components/ui/LoadingScreen.jsx';

// Pages
import DashboardPage from '../pages/DashboardPage.jsx';
import TenderIntelligencePage from '../pages/TenderIntelligencePage.jsx';
import ProjectMonitoringPage from '../pages/ProjectMonitoringPage.jsx';
import CitizenVerificationPage from '../pages/CitizenVerificationPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import ContractorManagementPage from '../pages/ContractorManagementPage.jsx';
import ContractorAnalysisPage from '../pages/ContractorAnalysisPage.jsx';

// Component to protect authority-only routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure user is an official (role is not 'citizen')
  if (user.role === 'citizen' || user.isCitizen) {
    return <Navigate to="/verify" replace />;
  }

  return children;
};

// Component to protect citizen routes (accessible by citizens and authorities for verification/testing)
const CitizenRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Simple helper redirect for home path
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  if (user) {
    if (user.role === 'citizen' || user.isCitizen) {
      return <Navigate to="/verify" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Citizen Route */}
      <Route 
        path="/verify" 
        element={
          <CitizenRoute>
            <CitizenVerificationPage />
          </CitizenRoute>
        } 
      />
      
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
      <Route 
        path="/contractors" 
        element={
          <ProtectedRoute>
            <ContractorManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/contractors-analysis" 
        element={
          <ProtectedRoute>
            <ContractorAnalysisPage />
          </ProtectedRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
