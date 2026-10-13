import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingScreen from '../components/ui/LoadingScreen.jsx';

// Each page loads only when someone opens it. Keeps the first download small,
// which matters most on the slow connections this is built for.
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'));
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));
const TenderIntelligencePage = lazy(() => import('../pages/TenderIntelligencePage.jsx'));
const ProjectMonitoringPage = lazy(() => import('../pages/ProjectMonitoringPage.jsx'));
const CitizenVerificationPage = lazy(() => import('../pages/CitizenVerificationPage.jsx'));
const ContractorManagementPage = lazy(() => import('../pages/ContractorManagementPage.jsx'));
const ContractorAnalysisPage = lazy(() => import('../pages/ContractorAnalysisPage.jsx'));

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

// The complaint portal belongs to citizens. Officials review complaints on
// their own dashboard, so sending them here would let them file complaints as
// though they were members of the public.
const CitizenRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'citizen' && !user.isCitizen) {
    return <Navigate to="/dashboard" replace />;
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
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
};

export default AppRoutes;
