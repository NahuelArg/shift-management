import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'CLIENT';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
    const { user, token } = useAuth();
    
    console.log('🔒 PrivateRoute - Verificando acceso:', {
        hasToken: !!token,
        userRole: user?.role,
        requiredRole,
        path: window.location.pathname
    });
    
    // Si no hay token o usuario, redirigir al login
    if (!token || !user) {
        console.log('❌ PrivateRoute - No hay token o usuario, redirigiendo a login');
        return <Navigate to="/login" replace />;
    }

    // Si se requiere un rol específico y el usuario no lo tiene
    if (requiredRole && user.role !== requiredRole) {
        console.log('⚠️ PrivateRoute - Rol incorrecto, redirigiendo...', {
            userRole: user.role,
            requiredRole
        });
        
        // Si es admin, redirigir al dashboard de admin
        if (user.role === 'ADMIN') {
            console.log('🔄 PrivateRoute - Redirigiendo a dashboard admin');
            return <Navigate to="/dashboard/admin" replace />;
        }
        // Si es cliente, redirigir al dashboard normal
        console.log('🔄 PrivateRoute - Redirigiendo a dashboard cliente');
        return <Navigate to="/dashboard" replace />;
    }

    console.log('✅ PrivateRoute - Acceso permitido');
    return <>{children}</>;
};
export default PrivateRoute;
