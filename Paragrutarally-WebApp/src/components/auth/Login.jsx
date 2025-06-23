// src/components/auth/Login.jsx - UPDATED with Legal Modal Trigger
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import DarkModeToggle from '../common/DarkModeToggle.jsx';
import LanguageSelector from '../common/LanguageSelector.jsx';
import ContactUsModal from '../layout/ContactUsModal';
import LegalTrigger from '../ui/LegalTrigger';
import GoogleIconLight from '../../assets/icons/GoogleIconLight';
import GoogleIconDark from '../../assets/icons/GoogleIconDark';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const {
        signIn,
        signInWithGoogle,
        currentUser,
        userRole,
        getDashboardForRole,
        authInitialized,
        loading: authLoading
    } = useAuth();

    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the intended destination (from protected route redirect)
    const from = location.state?.from?.pathname || null;

    // FIXED: Enhanced redirect logic with proper conditions and debugging
    useEffect(() => {
        console.log('Login useEffect triggered:', {
            authInitialized,
            currentUser: !!currentUser,
            userRole,
            from,
            authLoading,
            isRedirecting
        });

        // Only proceed if auth is fully initialized and not currently loading
        if (!authInitialized || authLoading) {
            console.log('Auth not ready yet - authInitialized:', authInitialized, 'authLoading:', authLoading);
            return;
        }

        // If we have a user and role, and we're not already redirecting
        if (currentUser && userRole && !isRedirecting) {
            const targetPath = from || getDashboardForRole(userRole);
            console.log(`User authenticated, preparing redirect to: ${targetPath}`);

            setIsRedirecting(true);

            // Add a delay to ensure all state has settled, then redirect
            const redirectTimer = setTimeout(() => {
                console.log(`Executing redirect to: ${targetPath}`);
                navigate(targetPath, { replace: true });
            }, 800); // Slightly longer delay to ensure everything is ready

            return () => {
                console.log('Cleaning up redirect timer');
                clearTimeout(redirectTimer);
            };
        } else if (authInitialized && !currentUser && !authLoading) {
            // User is not authenticated, make sure we're not in redirecting state
            console.log('User not authenticated, staying on login page');
            setIsRedirecting(false);
        }
    }, [authInitialized, currentUser, userRole, from, getDashboardForRole, navigate, authLoading, isRedirecting]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signIn(email, password);
            console.log('Sign in successful:', userCredential.user.email);

            // Let the useEffect above handle the redirect after auth state updates

        } catch (err) {
            console.error('Login error:', err);

            // Handle specific Firebase auth errors
            let errorMessage = t('login.error', 'Failed to sign in. Please check your credentials.');

            switch (err.code) {
                case 'auth/user-not-found':
                    errorMessage = t('login.userNotFound', 'No account found with this email address.');
                    break;
                case 'auth/wrong-password':
                    errorMessage = t('login.wrongPassword', 'Incorrect password. Please try again.');
                    break;
                case 'auth/invalid-credential':  // Add this case
                    errorMessage = t('login.invalidCredential', 'Invalid email or password. Please check your credentials and try again.');
                    break;
                case 'auth/invalid-email':
                    errorMessage = t('login.invalidEmail', 'Please enter a valid email address.');
                    break;
                case 'auth/user-disabled':
                    errorMessage = t('login.userDisabled', 'This account has been disabled. Please contact support.');
                    break;
                case 'auth/too-many-requests':
                    errorMessage = t('login.tooManyAttempts', 'Too many failed attempts. Please try again later.');
                    break;
                default:
                    errorMessage = err.message || errorMessage;
            }

            setError(errorMessage);
            setIsRedirecting(false); // Reset redirecting state on error
        } finally {
            setLoading(false);
        }
    };

    // Handle Google sign-in
    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            const userCredential = await signInWithGoogle();
            console.log('Google sign in successful:', userCredential.user.email);

            // Let the useEffect above handle the redirect after auth state updates

        } catch (err) {
            console.error('Google sign-in error:', err);

            // Handle specific error cases
            let errorMessage = t('login.googleError', 'Failed to sign in with Google. Please try again.');

            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = t('login.googleCancelled', 'Google sign-in was cancelled.');
            } else if (err.code === 'auth/popup-blocked') {
                errorMessage = t('login.popupBlocked', 'Popup was blocked. Please allow popups and try again.');
            } else if (err.code === 'auth/account-exists-with-different-credential') {
                errorMessage = t('login.accountExists', 'An account already exists with this email. Please sign in with your original method.');
            } else if (err.message.includes('not authorized')) {
                errorMessage = t('login.notAuthorized', 'This email is not authorized to access this application. Please contact an administrator.');
            } else {
                errorMessage = err.message || errorMessage;
            }

            setError(errorMessage);
            setIsRedirecting(false); // Reset redirecting state on error
        } finally {
            setGoogleLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // FIXED: More precise loading conditions
    const shouldShowLoadingSpinner = (
        !authInitialized ||
        authLoading ||
        isRedirecting ||
        (authInitialized && currentUser && userRole) // Show loading if we have user data (about to redirect)
    );

    const shouldShowLoginForm = (
        authInitialized &&
        !authLoading &&
        !currentUser &&
        !isRedirecting
    );

    console.log('=== LOGIN RENDER DECISION ===');
    console.log('authInitialized:', authInitialized);
    console.log('authLoading:', authLoading);
    console.log('currentUser:', !!currentUser);
    console.log('userRole:', userRole);
    console.log('isRedirecting:', isRedirecting);
    console.log('shouldShowLoadingSpinner:', shouldShowLoadingSpinner);
    console.log('shouldShowLoginForm:', shouldShowLoginForm);
    console.log('=== END RENDER DECISION ===');

    // Show loading while auth is initializing OR we have a user and are redirecting
    if (shouldShowLoadingSpinner) {
        let loadingMessage = t('login.initializing', 'Initializing...');

        if (isRedirecting) {
            loadingMessage = t('login.redirecting', 'Redirecting...');
        } else if (authLoading) {
            loadingMessage = t('login.loading', 'Loading user data...');
        } else if (authInitialized && currentUser && userRole) {
            loadingMessage = t('login.redirecting', 'Redirecting to dashboard...');
        }

        return (
            <div className={`login-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>
                        {loadingMessage}
                    </p>
                </div>
            </div>
        );
    }

    // If we don't meet the conditions to show the login form, show a fallback loading
    if (!shouldShowLoginForm) {
        return (
            <div className={`login-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>
                        {t('login.preparing', 'Preparing...')}
                    </p>
                </div>
            </div>
        );
    }

    // Show the login form
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

                    {/* Show redirect information if coming from a protected route */}
                    {from && (
                        <div className="redirect-info" style={{
                            backgroundColor: '#e3f2fd',
                            border: '1px solid #2196f3',
                            borderRadius: '4px',
                            padding: '12px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            color: '#1976d2'
                        }}>
                            {t('login.redirectMessage', 'Please sign in to access the requested page.')}
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">{t('login.email', 'Email')}:</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder={t('login.emailPlaceholder', 'Enter your email')}
                                disabled={loading || googleLoading}
                                onInvalid={(e) => {
                                    e.target.setCustomValidity(t('validation.emailRequired'));
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t('login.password', 'Password')}:</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                                    disabled={loading || googleLoading}
                                    onInvalid={(e) => {
                                        e.target.setCustomValidity(t('validation.passwordRequired'));
                                    }}
                                    onInput={(e) => {
                                        e.target.setCustomValidity('');
                                    }}
                                />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={togglePasswordVisibility}
                                    disabled={loading || googleLoading}
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

                        {/* Forgot password link */}
                        <Link to="/forgot-password" className="forgot-password-link">
                            {t('login.forgotPassword', 'Forgot Password?')}
                        </Link>
                    </form>

                    <div className="login-options">
                        <div className="divider" style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '20px 0',
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                            <span style={{ padding: '0 16px' }}>{t('login.or', 'or')}</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                        </div>

                        <button
                            type="button"
                            className="google-login-btn"
                            onClick={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                        >
                            {isDarkMode ?
                                <GoogleIconDark className="google-icon" /> :
                                <GoogleIconLight className="google-icon" />
                            }
                            {googleLoading
                                ? t('login.googleSigningIn', 'Signing in with Google...')
                                : t('login.googleSignIn', 'Sign In With Google')
                            }
                        </button>

                        {/* Legal Modal Trigger - positioned under Google button */}
                        <div className="login-legal-trigger">
                            <LegalTrigger variant="minimal" size="small" />
                        </div>
                    </div>
                </div>

                <div className="contact-container">
                    <button
                        className="contact-us-btn"
                        onClick={() => setIsContactModalOpen(true)}
                        disabled={loading || googleLoading}
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