// src/components/layout/Dashboard.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx'; // Updated import path
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Dashboard.css';

const Dashboard = ({ children, requiredRole }) => {
    const { currentUser, userRole, loading } = useAuth(); // Changed user to currentUser

    // Show loading state if auth is still being determined
    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!currentUser) { // Changed user to currentUser
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
        <div className="dashboard">
            <Navbar />
            <div className="dashboard-content">
                <Sidebar userRole={userRole} />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;