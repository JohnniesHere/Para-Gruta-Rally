// src/components/auth/UserProfile.jsx
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

        // Validate form
        const newErrors = {};

        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else {
            const validation = validatePassword(passwordData.newPassword);
            if (!validation.isValid) {
                newErrors.newPassword = validation.message;
            }
        }

        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'New passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setPasswordErrors(newErrors);
            return;
        }

        setIsPasswordLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);

            setMessage({ type: 'success', text: 'Password updated successfully!' });

            // Reset form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordErrors({});
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
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
                    Security Settings
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
                            <h3>Security Settings</h3>
                        </div>

                        <div className="password-change">
                            <h4>Change Password</h4>
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

                        <div className="two-factor">
                            <h4>Two-Factor Authentication</h4>
                            <p>Enhance your account security by enabling two-factor authentication.</p>
                            <button className="secondary-button">
                                Enable Two-Factor Authentication
                            </button>
                        </div>

                        <div className="login-history">
                            <h4>Recent Login Activity</h4>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <div className="activity-details">
                                        <div className="activity-info">
                                            <span className="device">Chrome on Windows</span>
                                            <span className="location">Jerusalem, Israel</span>
                                        </div>
                                        <div className="activity-time">Today, {new Date().toLocaleTimeString()}</div>
                                    </div>
                                    <div className="activity-status current">Current</div>
                                </div>

                                <div className="activity-item">
                                    <div className="activity-details">
                                        <div className="activity-info">
                                            <span className="device">Firefox on Windows</span>
                                            <span className="location">Tel Aviv, Israel</span>
                                        </div>
                                        <div className="activity-time">Yesterday, 10:15 AM</div>
                                    </div>
                                </div>

                                <div className="activity-item">
                                    <div className="activity-details">
                                        <div className="activity-info">
                                            <span className="device">Safari on iPhone</span>
                                            <span className="location">Haifa, Israel</span>
                                        </div>
                                        <div className="activity-time">2 days ago, 3:22 PM</div>
                                    </div>
                                </div>
                            </div>
                        </div>
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