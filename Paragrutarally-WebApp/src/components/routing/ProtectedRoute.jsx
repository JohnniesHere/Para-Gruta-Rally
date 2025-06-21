// src/components/routing/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

// Loading component for better UX
const LoadingSpinner = () => (
    <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
    }}>
        <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </div>
);

// Unauthorized access component
const UnauthorizedAccess = ({ userRole, requiredRole, redirectTo }) => (
    <div className="unauthorized-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
    }}>
        <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px'
        }}>
            <h2 style={{ color: '#c33', marginBottom: '16px' }}>Access Denied</h2>
            <p style={{ marginBottom: '16px' }}>
                You don't have permission to access this page.
            </p>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                Your role: <strong>{userRole || 'Unknown'}</strong>
                {requiredRole && (
                    <>
                        <br />
                        Required role: <strong>{requiredRole}</strong>
                    </>
                )}
            </p>
            <button
                onClick={() => window.location.href = redirectTo}
                style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Go to Dashboard
            </button>
        </div>
    </div>
);

// Role-based dashboard redirects
const getRoleBasedDashboard = (userRole) => {
    switch (userRole) {
        case 'admin':
            return '/admin/dashboard';
        case 'instructor':
            return '/instructor/dashboard';
        case 'parent':
            return '/parent/dashboard';
        case 'host':
        case 'guest':
            return '/host/dashboard';
        default:
            return '/login';
    }
};

// Main ProtectedRoute component
const ProtectedRoute = ({
                            children,
                            requiredRole = null,
                            requiredRoles = [],
                            requireAuth = true,
                            fallbackComponent = null
                        }) => {
    const { currentUser, userRole, loading: authLoading } = useAuth();
    const { permissions, loading: permissionsLoading, error: permissionsError } = usePermissions();
    const location = useLocation();

    // Handle loading states
    if (authLoading || permissionsLoading) {
        return <LoadingSpinner />;
    }

    // Handle authentication requirement
    if (requireAuth && !currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If no role requirements, just check authentication
    if (!requiredRole && requiredRoles.length === 0) {
        return children;
    }

    // Handle permissions error gracefully
    if (permissionsError) {
        console.error('Permissions error:', permissionsError);
        // Allow access but log the error - could be enhanced based on your needs
    }

    // Normalize role requirements
    const allowedRoles = requiredRole
        ? [requiredRole]
        : requiredRoles.length > 0
            ? requiredRoles
            : [];

    // Check role authorization
    if (allowedRoles.length > 0) {
        const hasRequiredRole = allowedRoles.includes(userRole);

        if (!hasRequiredRole) {
            const redirectTo = getRoleBasedDashboard(userRole);

            // Return custom fallback or default unauthorized component
            return fallbackComponent || (
                <UnauthorizedAccess
                    userRole={userRole}
                    requiredRole={requiredRole || requiredRoles.join(' or ')}
                    redirectTo={redirectTo}
                />
            );
        }
    }

    // All checks passed - render the protected content
    return children;
};

// Convenience components for specific roles
export const RequireAuth = ({ children, fallbackComponent }) => (
    <ProtectedRoute requireAuth={true} fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

export const RequireAdmin = ({ children, fallbackComponent }) => (
    <ProtectedRoute requiredRole="admin" fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

export const RequireInstructor = ({ children, fallbackComponent }) => (
    <ProtectedRoute requiredRoles={['admin', 'instructor']} fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

export const RequireStaff = ({ children, fallbackComponent }) => (
    <ProtectedRoute requiredRoles={['admin', 'instructor']} fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

export const RequireParent = ({ children, fallbackComponent }) => (
    <ProtectedRoute requiredRoles={['admin', 'parent']} fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

export const RequireHost = ({ children, fallbackComponent }) => (
    <ProtectedRoute requiredRoles={['admin', 'host', 'guest']} fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

// Multi-role component for complex permission requirements
export const RequireAnyRole = ({ children, roles, fallbackComponent }) => (
    <ProtectedRoute requiredRoles={roles} fallbackComponent={fallbackComponent}>
        {children}
    </ProtectedRoute>
);

export default ProtectedRoute;