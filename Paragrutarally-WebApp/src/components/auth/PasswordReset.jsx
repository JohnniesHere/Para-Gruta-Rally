// src/components/auth/PasswordReset.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import './PasswordReset.css';

const PasswordReset = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await resetPassword(email);
            setMessage('Check your email for password reset instructions');
        } catch (error) {
            setError('Failed to reset password. Please check your email address.');
            console.error(error);
        }

        setLoading(false);
    };

    return (
        <div className="password-reset-page">
            <div className="password-reset-container">
                <div className="logo-container">
                    <div className="logo-triangle">
                        <span className="logo-text">Logo</span>
                    </div>
                </div>

                <div className="password-reset-form-container">
                    <h1 className="app-title">Paragrutarally WebApp</h1>

                    <div className="password-reset-form-box">
                        <h2 className="password-reset-heading">Reset Password</h2>

                        {error && <div className="error-message">{error}</div>}
                        {message && <div className="success-message">{message}</div>}

                        <form onSubmit={handleSubmit} className="password-reset-form">
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="reset-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>

                        <div className="return-to-login">
                            <Link to="/login" className="back-to-login-link">
                                Back to Login
                            </Link>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="contact-us-btn"
                        onClick={() => alert('Contact functionality coming soon')}
                    >
                        Contact Us
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;