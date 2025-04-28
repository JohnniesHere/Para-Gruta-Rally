import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminHeader = () => {
    const { signOut } = useAuth();
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
        <header className="header admin-header">
            <div className="container">
                <div className="navbar">
                    <div className="nav-logo">
                        <Link to="/admin">Admin Dashboard</Link>
                    </div>

                    <div className="admin-nav-right">
                        <Link to="/" className="view-site-link">View Website</Link>
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;