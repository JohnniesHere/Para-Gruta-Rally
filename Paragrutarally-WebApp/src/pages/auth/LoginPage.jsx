import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
    const { currentUser, userRole } = useAuth();
    const [error, setError] = useState('');

    // Redirect if already logged in
    if (currentUser) {
        if (userRole === 'admin') {
            return <Navigate to="/admin" />;
        } else if (userRole === 'parent') {
            return <Navigate to="/parent" />;
        }
        return <Navigate to="/" />;
    }

    return (
        <div className="login-page">
            <div className="auth-container">
                <h1>Login</h1>
                {error && <div className="error-message">{error}</div>}
                <LoginForm onError={setError} />
                <div className="auth-links">
                    <a href="/reset-password">Forgot your password?</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;