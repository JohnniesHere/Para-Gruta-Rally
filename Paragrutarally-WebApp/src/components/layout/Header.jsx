import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
    const { currentUser, userRole, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <header className="header">
            <div className="container">
                <div className="navbar">
                    <div className="nav-logo">
                        <Link to="/">Charity Race Events</Link>
                    </div>

                    <nav>
                        <ul className="nav-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About</Link></li>
                            <li><Link to="/events">Events</Link></li>
                            <li><Link to="/gallery">Gallery</Link></li>

                            {currentUser ? (
                                <>
                                    <li>
                                        <Link to={userRole === 'admin' ? '/admin' : '/parent'}>
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li>
                                        <button onClick={handleLogout} className="logout-button">
                                            Logout
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li><Link to="/login" className="login-button">Login</Link></li>
                            )}
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;