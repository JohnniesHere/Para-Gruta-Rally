// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import DarkModeToggle from '../common/DarkModeToggle.jsx';
import logoImage from '../../assets/images/PGR Logo.png';
import './Navbar.css';

const Navbar = ({ userRole }) => {
    const { currentUser, signOut } = useAuth();
    const { isDarkMode } = useTheme(); // Fixed: changed from isDark to isDarkMode
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Determine the dashboard link based on user role
    const getDashboardLink = () => {
        if (userRole === 'admin') return '/admin/dashboard';
        if (userRole === 'instructor') return '/instructor/dashboard';
        if (userRole === 'host') return '/host/dashboard';
        return '/dashboard';
    };

    const dashboardLink = getDashboardLink();

    return (
        <nav className={`navbar ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="logo">
                <Link to={dashboardLink}>
                    <img src={logoImage} alt="ParaGrutaRally Logo" />
                    ParaGrutaRally
                </Link>
            </div>
            <div className="nav-links">
                {currentUser && (
                    <>
                        <Link to="/my-account">My Account</Link>
                        <DarkModeToggle className="navbar-theme-toggle" />
                        <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;