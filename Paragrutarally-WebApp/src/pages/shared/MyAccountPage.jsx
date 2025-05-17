// src/pages/shared/MyAccountPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import UserProfile from '../../components/auth/UserProfile';
import './MyAccountPage.css';
import { useAuth } from '../../contexts/AuthContext';

const MyAccountPage = () => {
    const { userRole } = useAuth();

    return (
        <Dashboard requiredRole={userRole}>
            <div className="my-account-page">
                <h1>My Account</h1>
                <UserProfile />
            </div>
        </Dashboard>
    );
};

export default MyAccountPage;