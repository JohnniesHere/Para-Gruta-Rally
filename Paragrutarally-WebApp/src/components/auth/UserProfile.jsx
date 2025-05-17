// src/components/auth/UserProfile.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);

    // State for form fields
    const [profileData, setProfileData] = useState({
        displayName: currentUser?.displayName || 'Admin User',
        email: currentUser?.email || 'admin@example.com',
        phone: currentUser?.phone || '',
        organization: currentUser?.organization || 'Charity Racing Organization',
        bio: currentUser?.bio || '',
    });

    // Password change fields
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

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
    };

    // Handle profile update
    const handleProfileUpdate = (e) => {
        e.preventDefault();
        // In a real implementation, this would update the user profile
        alert('Profile updated successfully!');
        setIsEditing(false);
    };

    // Handle password update
    const handlePasswordUpdate = (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match!');
            return;
        }

        // In a real implementation, this would update the user's password
        alert('Password updated successfully!');

        // Reset form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    return (
        <div className="user-profile">
            <div className="profile-header">
                <div className="profile-avatar">
                    {profileData.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h2>{profileData.displayName}</h2>
                    <p>{profileData.email}</p>
                    <p className="user-role">Role: {currentUser?.role || 'Admin'}</p>
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
                                    <label htmlFor="displayName">Full Name</label>
                                    <input
                                        type="text"
                                        id="displayName"
                                        name="displayName"
                                        value={profileData.displayName}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="organization">Organization</label>
                                    <input
                                        type="text"
                                        id="organization"
                                        name="organization"
                                        value={profileData.organization}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bio">Bio</label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={profileData.bio}
                                        onChange={handleProfileChange}
                                        rows="4"
                                    ></textarea>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-button">
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-details">
                                <div className="detail-item">
                                    <span className="detail-label">Full Name:</span>
                                    <span className="detail-value">{profileData.displayName}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{profileData.email}</span>
                                </div>

                                {profileData.phone && (
                                    <div className="detail-item">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{profileData.phone}</span>
                                    </div>
                                )}

                                <div className="detail-item">
                                    <span className="detail-label">Organization:</span>
                                    <span className="detail-value">{profileData.organization}</span>
                                </div>

                                {profileData.bio && (
                                    <div className="detail-item">
                                        <span className="detail-label">Bio:</span>
                                        <span className="detail-value bio">{profileData.bio}</span>
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
                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>

                                <button type="submit" className="save-button">
                                    Update Password
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
                                            defaultChecked
                                        />
                                        <label htmlFor="darkTheme">Dark Mode</label>
                                    </div>
                                    <div className="theme-option">
                                        <input
                                            type="radio"
                                            id="lightTheme"
                                            name="theme"
                                            value="light"
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