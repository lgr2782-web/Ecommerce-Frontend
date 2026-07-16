import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useContext(AuthContext);

  if (!token) {
    // Si no está autenticado, redirigir al login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Si su rol no está autorizado, redirigir a la tienda principal
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;