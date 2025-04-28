import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import ChildrenList from '../../components/parent/ChildrenList';
import ChildRegistration from '../../components/parent/ChildRegistration';

const ParentProfile = () => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [editing, setEditing] = useState(false);
    const [showAddChild, setShowAddChild] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfile({
                        name: userData.name || '',
                        phone: userData.phone || '',
                        address: userData.address || ''
                    });
                }
            } catch (err) {
                setError('Failed to load profile');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            // Update Firestore document
            await updateDoc(doc(db, 'users', currentUser.uid), {
                name: profile.name,
                phone: profile.phone,
                address: profile.address
            });

            // Update display name in Firebase Auth
            if (profile.name) {
                await updateProfile(currentUser, {
                    displayName: profile.name
                });
            }

            setSuccess(true);
            setEditing(false);
        } catch (err) {
            setError('Failed to update profile');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="parent-profile-page">
            <h1>My Profile</h1>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Profile updated successfully!</div>}

            <div className="card">
                <div className="profile-section">
                    <div className="section-header">
                        <h2>Personal Information</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="edit-btn"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="save-btn"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="cancel-btn"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-info">
                            <p><strong>Email:</strong> {currentUser?.email}</p>
                            <p><strong>Name:</strong> {profile.name || 'Not provided'}</p>
                            <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
                            <p><strong>Address:</strong> {profile.address || 'Not provided'}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="children-section">
                    <div className="section-header">
                        <h2>My Children</h2>
                        <button
                            onClick={() => setShowAddChild(!showAddChild)}
                            className="add-button"
                        >
                            {showAddChild ? 'Cancel' : 'Add Child'}
                        </button>
                    </div>

                    {showAddChild && (
                        <ChildRegistration />
                    )}

                    <ChildrenList />
                </div>
            </div>
        </div>
    );
};

export default ParentProfile;