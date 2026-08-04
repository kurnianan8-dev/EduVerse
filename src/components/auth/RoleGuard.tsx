import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types/auth.types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallbackUrl?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackUrl = '/unauthorized',
}) => {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallbackUrl} replace />;
  }

  return <>{children}</>;
};
