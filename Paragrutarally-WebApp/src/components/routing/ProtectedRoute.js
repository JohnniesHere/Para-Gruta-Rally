// src/components/routing/ProtectedRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Component to protect routes that require authentication
export function RequireAuth({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" />;
    }

    return children || <Outlet />;
}

// Component to protect routes that require admin role
export function RequireAdmin({ children }) {
    const { currentUser, isAdmin } = useAuth();

    if (!currentUser) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" />;
    }

    if (!isAdmin) {
        // Redirect to dashboard if not an admin
        return <Navigate to="/dashboard" />;
    }

    return children || <Outlet />;
}

// Component to protect routes that require staff role (staff or admin)
export function RequireStaff({ children }) {
    const { currentUser, isStaff } = useAuth();

    if (!currentUser) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" />;
    }

    if (!isStaff) {
        // Redirect to dashboard if not staff or admin
        return <Navigate to="/dashboard" />;
    }

    return children || <Outlet />;
}