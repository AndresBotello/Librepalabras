import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homeRouteForRole } from '../utils/roles';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }

  return children;
}