import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Role = 'ADMIN' | 'CLIENT' | 'EMPLOYEE';

interface PrivateRouteProps {
    children: React.ReactNode;
    /** Un rol o una lista de roles permitidos */
    requiredRole?: Role | Role[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    const allowed = requiredRole === undefined ? null : Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (allowed && !allowed.includes(user.role)) {
        return <Navigate to="/"  />;
    }

    return <>{children}</>;
};
export default PrivateRoute;
