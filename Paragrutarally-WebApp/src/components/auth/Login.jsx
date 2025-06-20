// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import DarkModeToggle from '../common/DarkModeToggle.jsx';
import LanguageSelector from '../common/LanguageSelector.jsx';
import ContactUsModal from '../layout/ContactUsModal';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(t('login.error', 'Failed to sign in. Please check your credentials.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            await signInWithGoogle();
            // Navigation will be handled by the AuthContext redirect logic
        } catch (err) {
            console.error('Google sign-in error:', err);

            // Handle specific error cases
            if (err.code === 'auth/popup-closed-by-user') {
                setError(t('login.googleCancelled', 'Google sign-in was cancelled.'));
            } else if (err.code === 'auth/popup-blocked') {
                setError(t('login.popupBlocked', 'Popup was blocked. Please allow popups and try again.'));
            } else {
                setError(t('login.googleError', 'Failed to sign in with Google. Please try again.'));
            }
        } finally {
            setGoogleLoading(false);
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
                    <h1 className="app-title">{t('login.appTitle', 'Paragrutarally WebApp')}</h1>
                </div>

                <div className="login-form-box">
                    <h2 className="login-heading">{t('login.title', 'Login')}</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">{t('login.email', 'Email:')}:</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder={t('login.emailPlaceholder', 'Enter your email')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t('login.password', 'Password:')}:</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                                />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? t('login.hide', 'Hide') : t('login.show', 'Show')}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading || googleLoading}
                        >
                            {loading ? t('login.signingIn', 'Signing In...') : t('login.signIn', 'Sign In')}
                        </button>

                        {/* Text link for forgot password */}
                        <Link to="/forgot-password" className="forgot-password-link">
                            {t('login.forgotPassword', 'Forgot Password?')}
                        </Link>
                    </form>

                    <div className="login-options">
                        <button
                            type="button"
                            className="google-login-btn"
                            onClick={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                        >
                            {googleLoading ? t('login.googleSigningIn', 'Signing in with Google...') : t('login.googleSignIn', 'Sign In With Google')}
                        </button>
                    </div>
                </div>

                <div className="contact-container">
                    <button
                        className="contact-us-btn"
                        onClick={() => setIsContactModalOpen(true)}
                    >
                        {t('login.contactUs', 'Contact Us')}
                    </button>
                </div>

                {/* Language selector at the bottom */}
                <div className="login-language-selector">
                    <LanguageSelector />
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