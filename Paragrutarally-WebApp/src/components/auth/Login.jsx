// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import DarkModeToggle from '../common/DarkModeToggle.jsx';
import ContactUsModal from '../layout/ContactUsModal';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const { signIn } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`login-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="theme-toggle-container">
                <DarkModeToggle />
            </div>

            <div className="login-content">
                <div className="app-title-container">
                    <h1 className="app-title">Paragrutarally WebApp</h1>
                </div>

                <div className="login-form-box">
                    <h2 className="login-heading">Login</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
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
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>

                        {/* Text link for forgot password */}
                        <Link to="/forgot-password" className="forgot-password-link">
                            Forgot Password?
                        </Link>
                    </form>

                    <div className="login-options">
                        <button type="button" className="mobile-login-btn">
                            Sign In With Mobile Number
                        </button>
                        <button type="button" className="google-login-btn">
                            Sign In With Google
                        </button>
                    </div>
                </div>

                <div className="contact-container">
                    <button
                        className="contact-us-btn"
                        onClick={() => setIsContactModalOpen(true)}
                    >
                        Contact Us
                    </button>
                </div>
            </div>

            <ContactUsModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
            />
        </div>
    );
};

export default Login;