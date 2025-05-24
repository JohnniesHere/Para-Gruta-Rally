// src/pages/shared/MyAccountPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import UserProfile from '../../components/auth/UserProfile';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './MyAccountPage.css';

const MyAccountPage = () => {
    const { userRole } = useAuth();
    const { isDarkMode } = useTheme();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`my-account-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1>My Account</h1>
                <UserProfile />
            </div>
        </Dashboard>
    );
};

export default MyAccountPage;