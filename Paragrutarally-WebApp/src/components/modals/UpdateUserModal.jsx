// src/components/modals/UpdateUserModal.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const UpdateUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        displayName: '',
        name: '',
        phone: '',
        role: 'parent'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Populate form with user data when modal opens
    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                name: user.name || '',
                phone: user.phone || '',
                role: user.role || 'parent'
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Update user document in Firestore
            const userDocRef = doc(db, 'users', user.id);
            await updateDoc(userDocRef, {
                displayName: formData.displayName,
                name: formData.name,
                phone: formData.phone,
                role: formData.role
            });

            // Reset errors
            setErrors({});

            // Notify parent component
            if (onUserUpdated) {
                onUserUpdated();
            }

            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            setErrors({ general: 'Failed to update user. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setErrors({});
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Update User</h3>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isLoading}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={isLoading ? 'loading' : ''}>
                    {errors.general && (
                        <div className="error-message" style={{ marginBottom: '20px', textAlign: 'center' }}>
                            {errors.general}
                        </div>
                    )}

                    <div className={`form-group ${errors.displayName ? 'error' : ''}`}>
                        <label htmlFor="displayName">Display Name *</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter display name"
                        />
                        {errors.displayName && (
                            <div className="error-message">{errors.displayName}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={user.email || ''}
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

                    <div className={`form-group ${errors.name ? 'error' : ''}`}>
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter full name"
                        />
                        {errors.name && (
                            <div className="error-message">{errors.name}</div>
                        )}
                    </div>

                    <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter phone number"
                        />
                        {errors.phone && (
                            <div className="error-message">{errors.phone}</div>
                        )}
                    </div>

                    <div className={`form-group ${errors.role ? 'error' : ''}`}>
                        <label htmlFor="role">Role *</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        >
                            <option value="parent">Parent</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                        </select>
                        {errors.role && (
                            <div className="error-message">{errors.role}</div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateUserModal;