// src/components/layout/Dashboard.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Dashboard.css';

const Dashboard = ({ children, requiredRole }) => {
    const { currentUser, userRole, loading } = useAuth();
    const { isDark } = useTheme();
    const location = useLocation();

    // Show loading state if auth is still being determined
    if (loading) {
        return <div className={`loading-screen ${isDark ? 'dark-mode' : 'light-mode'}`}>Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Redirect based on user role if they don't have permission
    if (requiredRole && requiredRole !== userRole) {
        switch (userRole) {
            case 'admin':
                return <Navigate to="/admin/dashboard" />;
            case 'instructor':
                return <Navigate to="/instructor/dashboard" />;
            case 'host':
                return <Navigate to="/host/dashboard" />;
            default:
                return <Navigate to="/login" />;
        }
    }

    return (
        <div className={`dashboard ${isDark ? 'dark-mode' : 'light-mode'}`}>
            <Navbar userRole={userRole} />
            <div className="dashboard-content">
                <Sidebar userRole={userRole} />
                <main className="main-content" key={location.pathname}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;