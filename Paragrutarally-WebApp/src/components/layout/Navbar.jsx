// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Navbar.css';

const Navbar = ({ userRole }) => {
    const { currentUser, signOut } = useAuth();
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

    return (
        <nav className="navbar">
            <div className="logo">
                <Link to={getDashboardLink()}>Charity Racing App</Link>
            </div>
            <div className="nav-links">
                {currentUser && (
                    <>
                        <Link to="/my-account">My Account</Link>
                        <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;