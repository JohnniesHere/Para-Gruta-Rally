// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const Navbar = ({ userRole }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="logo">
                <Link to={`/${userRole}/dashboard`}>Charity Racing App</Link>
            </div>
            <div className="nav-links">
                {user && (
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