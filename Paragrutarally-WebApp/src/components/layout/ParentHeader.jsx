import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ParentHeader = () => {
    const { currentUser, signOut } = useAuth();
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
        <header className="header parent-header">
            <div className="container">
                <div className="navbar">
                    <div className="nav-logo">
                        <Link to="/parent">Parent Dashboard</Link>
                    </div>

                    <nav>
                        <ul className="nav-links">
                            <li><Link to="/parent">Dashboard</Link></li>
                            <li><Link to="/parent/events">Events</Link></li>
                            <li><Link to="/parent/profile">My Profile</Link></li>
                            <li>
                                <div className="user-menu">
                  <span className="username">
                    {currentUser?.displayName || currentUser?.email}
                  </span>
                                    <button onClick={handleLogout} className="logout-button">
                                        Logout
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default ParentHeader;