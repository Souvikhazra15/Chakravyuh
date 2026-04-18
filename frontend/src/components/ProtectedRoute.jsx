import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role && user?.role !== requiredRole) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  if (requiredRole && !user?.role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
