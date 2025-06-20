// src/components/auth/UserProfile.jsx - Updated with Google Auth Support
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { updateUserProfile, updateUserPassword, getUserData, validatePassword } from '../../services/userService';
import './UserProfile.css';

const UserProfile = () => {
    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();

    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // State for profile fields
    const [profileData, setProfileData] = useState({
        displayName: '',
        name: '',
        email: '',
        phone: '',
        role: ''
    });

    // Password change fields
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [passwordErrors, setPasswordErrors] = useState({});

    // Check if user is Google authenticated
    const isGoogleUser = currentUser?.providerData?.some(provider => provider.providerId === 'google.com') || false;

    // Load user data from Firestore
    useEffect(() => {
        const loadUserData = async () => {
            if (currentUser) {
                try {
                    const userData = await getUserData(currentUser.uid);
                    setProfileData({
                        displayName: userData.displayName || '',
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        role: userData.role || ''
                    });
                } catch (error) {
                    console.error('Error loading user data:', error);
                    setMessage({ type: 'error', text: 'Failed to load user data' });
                }
            }
        };

        loadUserData();
    }, [currentUser]);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Handle profile form changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle password form changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Validate new password in real-time
        if (name === 'newPassword') {
            const validation = validatePassword(value);
            if (!validation.isValid && value.length > 0) {
                setPasswordErrors(prev => ({
                    ...prev,
                    newPassword: validation.message
                }));
            }
        }
    };

    // Handle profile update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if (!profileData.displayName.trim() || !profileData.name.trim() || !profileData.phone.trim()) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateUserProfile(currentUser.uid, {
                displayName: profileData.displayName,
                name: profileData.name,
                phone: profileData.phone
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password update
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        console.log('🔐 Password update form submitted');

        // Clear previous messages
        setMessage({ type: '', text: '' });

        // Validate form
        const newErrors = {};

        if (!passwordData.currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = 'New password must be at least 6 characters long';
        }

        if (!passwordData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'New passwords do not match';
        }

        // Check if trying to use the same password
        if (passwordData.currentPassword === passwordData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        if (Object.keys(newErrors).length > 0) {
            console.log('❌ Form validation failed:', newErrors);
            setPasswordErrors(newErrors);
            return;
        }

        setIsPasswordLoading(true);
        setPasswordErrors({});

        try {
            console.log('🔄 Attempting to update password...');

            await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);

            console.log('✅ Password updated successfully');

            setMessage({
                type: 'success',
                text: 'Password updated successfully! Your account is now more secure.'
            });

            // Reset form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordErrors({});

            // Scroll to top to show success message
            document.querySelector('.user-profile')?.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('❌ Password update failed:', error);

            // Show user-friendly error message
            setMessage({
                type: 'error',
                text: error.message || 'Failed to update password. Please try again.'
            });

            // If it's an authentication error, clear the current password field
            if (error.message.includes('Current password is incorrect') ||
                error.message.includes('invalid-credential')) {
                setPasswordData(prev => ({
                    ...prev,
                    currentPassword: ''
                }));
                setPasswordErrors({
                    currentPassword: 'Please re-enter your current password'
                });
            }

            // Scroll to top to show error message
            document.querySelector('.user-profile')?.scrollTo({ top: 0, behavior: 'smooth' });

        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className={`user-profile ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="profile-header">
                <div className="profile-avatar">
                    {profileData.displayName.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="profile-info">
                    <h2>{profileData.displayName || 'User'}</h2>
                    <p>{profileData.email}</p>
                    <p className="user-role">Role: {profileData.role || 'User'}</p>
                    {isGoogleUser && (
                        <p className="auth-provider">
                            <span style={{ color: '#4285f4', fontWeight: '500' }}>
                                🔗 Signed in with Google
                            </span>
                        </p>
                    )}
                </div>
            </div>

            <div className="profile-tabs">
                <button
                    className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile Information
                </button>
                <button
                    className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    Password Settings
                </button>
                <button
                    className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preferences')}
                >
                    Preferences
                </button>
            </div>

            <div className="profile-content">
                {/* Display messages */}
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="profile-section">
                        <div className="section-header">
                            <h3>Profile Information</h3>
                            {!isEditing && (
                                <button
                                    className="edit-button"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleProfileUpdate} className="profile-form">
                                <div className="form-group">
                                    <label htmlFor="displayName">Display Name *</label>
                                    <input
                                        type="text"
                                        id="displayName"
                                        name="displayName"
                                        value={profileData.displayName}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={profileData.email}
                                        disabled={true}
                                        style={{
                                            backgroundColor: 'var(--bg-tertiary)',
                                            cursor: 'not-allowed',
                                            opacity: 0.6
                                        }}
                                        placeholder="Email cannot be changed"
                                    />
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        Email cannot be changed as it's linked to authentication
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number *</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="save-button"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-details">
                                <div className="detail-item">
                                    <span className="detail-label">Display Name:</span>
                                    <span className="detail-value">{profileData.displayName}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{profileData.email}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Full Name:</span>
                                    <span className="detail-value">{profileData.name}</span>
                                </div>

                                {profileData.phone && (
                                    <div className="detail-item">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{profileData.phone}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="security-section">
                        <div className="section-header">
                            <h3>Password Settings</h3>
                        </div>

                        {isGoogleUser ? (
                            <div className="google-auth-notice">
                                <div className="notice-card">
                                    <div className="notice-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#4285f4"/>
                                        </svg>
                                    </div>
                                    <div className="notice-content">
                                        <h4>Google Account Authentication</h4>
                                        <p>
                                            Your account is authenticated through Google. Password management is handled
                                            by Google's secure systems. To change your password, please visit your
                                            Google Account settings.
                                        </p>
                                        <a
                                            href="https://myaccount.google.com/security"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="google-settings-link"
                                        >
                                            Manage Google Account Security
                                        </a>
                                    </div>
                                </div>

                                <div className="security-benefits">
                                    <h4>Security Benefits</h4>
                                    <ul>
                                        <li>✅ Two-factor authentication managed by Google</li>
                                        <li>✅ Advanced threat protection</li>
                                        <li>✅ Automatic security updates</li>
                                        <li>✅ Sign-in alerts and monitoring</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="password-change">
                                <h4>Change Password</h4>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                                    Update your password to keep your account secure. Use a strong, unique password.
                                </p>

                                <form onSubmit={handlePasswordUpdate} className="password-form">
                                    <div className={`form-group ${passwordErrors.currentPassword ? 'error' : ''}`}>
                                        <label htmlFor="currentPassword">Current Password *</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            disabled={isPasswordLoading}
                                            placeholder="Enter your current password"
                                        />
                                        {passwordErrors.currentPassword && (
                                            <div className="error-message">{passwordErrors.currentPassword}</div>
                                        )}
                                    </div>

                                    <div className={`form-group ${passwordErrors.newPassword ? 'error' : ''}`}>
                                        <label htmlFor="newPassword">New Password *</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            disabled={isPasswordLoading}
                                            placeholder="Enter your new password"
                                        />
                                        {passwordErrors.newPassword && (
                                            <div className="error-message">{passwordErrors.newPassword}</div>
                                        )}
                                    </div>

                                    <div className={`form-group ${passwordErrors.confirmPassword ? 'error' : ''}`}>
                                        <label htmlFor="confirmPassword">Confirm New Password *</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            disabled={isPasswordLoading}
                                            placeholder="Confirm your new password"
                                        />
                                        {passwordErrors.confirmPassword && (
                                            <div className="error-message">{passwordErrors.confirmPassword}</div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="save-button"
                                        disabled={isPasswordLoading}
                                    >
                                        {isPasswordLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="preferences-section">
                        <div className="section-header">
                            <h3>User Preferences</h3>
                        </div>

                        <div className="theme-settings">
                            <h4>Display Settings</h4>
                            <div className="preference-group">
                                <label>Theme</label>
                                <div className="theme-options">
                                    <div className="theme-option">
                                        <input
                                            type="radio"
                                            id="darkTheme"
                                            name="theme"
                                            value="dark"
                                            defaultChecked={isDarkMode}
                                        />
                                        <label htmlFor="darkTheme">Dark Mode</label>
                                    </div>
                                    <div className="theme-option">
                                        <input
                                            type="radio"
                                            id="lightTheme"
                                            name="theme"
                                            value="light"
                                            defaultChecked={!isDarkMode}
                                        />
                                        <label htmlFor="lightTheme">Light Mode</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="notification-settings">
                            <h4>Notification Preferences</h4>
                            <div className="notification-options">
                                <div className="notification-option">
                                    <input
                                        type="checkbox"
                                        id="emailNotifications"
                                        defaultChecked
                                    />
                                    <label htmlFor="emailNotifications">Email notifications for new events</label>
                                </div>
                                <div className="notification-option">
                                    <input
                                        type="checkbox"
                                        id="reminderNotifications"
                                        defaultChecked
                                    />
                                    <label htmlFor="reminderNotifications">Event reminders</label>
                                </div>
                                <div className="notification-option">
                                    <input
                                        type="checkbox"
                                        id="systemNotifications"
                                    />
                                    <label htmlFor="systemNotifications">System updates</label>
                                </div>
                                <div className="notification-option">
                                    <input
                                        type="checkbox"
                                        id="weeklyDigest"
                                        defaultChecked
                                    />
                                    <label htmlFor="weeklyDigest">Weekly activity digest</label>
                                </div>
                            </div>
                        </div>

                        <button className="save-button">
                            Save Preferences
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;