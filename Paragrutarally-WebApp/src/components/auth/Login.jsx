// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import ContactUsModal from '../layout/ContactUsModal';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            // Navigation will be handled by the auth state change in the AuthProvider
        } catch (error) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(error);
        }

        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            // Navigation will be handled by the auth state change
        } catch (error) {
            setError('Failed to sign in with Google.');
            console.error(error);
        }
    };

    const handleMobileSignIn = () => {
        // This would be implemented when you're ready to add phone authentication
        alert('Mobile sign-in functionality coming soon');
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="logo-container">
                    <div className="logo-triangle">
                        <span className="logo-text">Logo</span>
                    </div>
                </div>

                <div className="login-form-container">
                    <h1 className="app-title">Paragrutarally WebApp</h1>

                    <div className="login-form-box">
                        <h2 className="login-heading">Login</h2>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit} className="login-form">
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

                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="login-options">
                                <button
                                    type="button"
                                    className="mobile-login-btn"
                                    onClick={handleMobileSignIn}
                                >
                                    Sign In With Mobile Number
                                </button>

                                <button
                                    type="button"
                                    className="google-login-btn"
                                    onClick={handleGoogleSignIn}
                                >
                                    Sign In With Google
                                </button>

                                <Link to="/reset-password" className="forgot-password-link">
                                    Forgot Password?
                                </Link>
                            </div>
                        </form>
                    </div>

                    <button
                        type="button"
                        className="contact-us-btn"
                        onClick={() => setContactModalOpen(true)}
                    >
                        Contact Us
                    </button>
                </div>
            </div>

            <ContactUsModal
                isOpen={contactModalOpen}
                onClose={() => setContactModalOpen(false)}
            />
        </div>
    );
};

export default Login;