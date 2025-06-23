// src/components/modals/UpdateUserModal.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../firebase/config';

const UpdateUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const { t, isRTL } = useLanguage();
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
        if (user && isOpen) {
            console.log('Loading user data:', user);
            setFormData({
                displayName: user.displayName || '',
                name: user.name || '',
                phone: user.phone || '',
                role: user.role || 'parent'
            });
            setErrors({}); // Clear any previous errors
        }
    }, [user, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        // Display name validation
        if (!formData.displayName.trim()) {
            newErrors.displayName = t('users.displayNameRequired', 'Display name is required');
        } else if (formData.displayName.trim().length < 2) {
            newErrors.displayName = t('users.displayNameMinLength', 'Display name must be at least 2 characters');
        }

        // Full name validation
        if (!formData.name.trim()) {
            newErrors.name = t('users.nameRequired', 'Name is required');
        } else if (formData.name.trim().length < 2) {
            newErrors.name = t('users.nameMinLength', 'Full name must be at least 2 characters');
        }

        // Phone validation - exactly 10 digits
        if (!formData.phone.trim()) {
            newErrors.phone = t('users.phoneRequired', 'Phone number is required');
        } else if (!/^\d+$/.test(formData.phone.trim())) {
            newErrors.phone = t('users.phoneOnlyNumbers', 'Phone number must contain only numbers');
        } else if (formData.phone.trim().length !== 10) {
            newErrors.phone = t('users.phoneInvalid', 'Phone number must be exactly 10 digits');
        }

        // Role validation
        if (!formData.role) {
            newErrors.role = t('users.roleRequired', 'Role is required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Special handling for phone number - only allow digits
        if (name === 'phone') {
            const numbersOnly = value.replace(/[^\d]/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: numbersOnly
            }));

            // Real-time validation for phone
            if (numbersOnly.length > 0 && numbersOnly.length !== 10) {
                setErrors(prev => ({
                    ...prev,
                    phone: t('users.phoneInvalid', 'Phone number must be exactly 10 digits')
                }));
            } else {
                // Clear phone error if it's valid
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                });
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error when user starts typing (for non-phone fields)
        if (errors[name] && name !== 'phone') {
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

        if (!user?.id) {
            setErrors({ general: t('users.noUserSelected', 'No user selected for update') });
            return;
        }

        setIsLoading(true);

        try {
            console.log('Updating user:', user.id, 'with data:', formData);

            // Update user document in Firestore
            const userDocRef = doc(db, 'users', user.id);
            await updateDoc(userDocRef, {
                displayName: formData.displayName.trim(),
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                role: formData.role,
                updatedAt: serverTimestamp()
            });

            console.log('✅ User updated successfully');

            // Reset errors
            setErrors({});

            // Show success message
            alert(t('users.updateSuccess', 'User "{displayName}" updated successfully!', { displayName: formData.displayName }));

            // Notify parent component
            if (onUserUpdated) {
                onUserUpdated();
            }

            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            setErrors({
                general: t('users.updateError', 'Failed to update user. Please try again.')
            });
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
        <div className="modal-overlay active" onClick={handleClose} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('users.updateUser', 'Update User')}</h3>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isLoading}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit} className={isLoading ? 'loading' : ''}>
                        {errors.general && (
                            <div className="error-message" style={{ marginBottom: '20px', textAlign: 'center' }}>
                                {errors.general}
                            </div>
                        )}

                        <div className={`form-group ${errors.displayName ? 'error' : ''}`}>
                            <label htmlFor="displayName">{t('users.displayName', 'Display Name')} *</label>
                            <input
                                type="text"
                                id="displayName"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.displayNamePlaceholder', 'Enter display name')}
                            />
                            {errors.displayName && (
                                <div className="error-message">{errors.displayName}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">{t('users.emailAddress', 'Email Address')}</label>
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
                                placeholder={t('users.emailCannotChange', 'Email cannot be changed')}
                            />
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {t('users.emailLinkedToAuth', 'Email cannot be changed as it\'s linked to authentication')}
                            </div>
                        </div>

                        <div className={`form-group ${errors.name ? 'error' : ''}`}>
                            <label htmlFor="name">{t('users.fullName', 'Full Name')} *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.fullNamePlaceholder', 'Enter full name')}
                            />
                            {errors.name && (
                                <div className="error-message">{errors.name}</div>
                            )}
                        </div>

                        <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                            <label htmlFor="phone">{t('users.phoneNumber', 'Phone Number')} *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.phoneNumberPlaceholder', 'Enter phone number')}
                                maxLength="10"
                                pattern="[0-9]{10}"
                                onInvalid={(e) => {
                                    e.target.setCustomValidity(t('users.phoneInvalid'));
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
                            />
                            {errors.phone && (
                                <div className="error-message">{errors.phone}</div>
                            )}
                        </div>

                        <div className={`form-group ${errors.role ? 'error' : ''}`}>
                            <label htmlFor="role">{t('users.role', 'Role')} *</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                disabled={isLoading}
                            >
                                <option value="parent">{t('users.parent', 'Parent')}</option>
                                <option value="instructor">{t('users.instructor', 'Instructor')}</option>
                                <option value="admin">{t('users.admin', 'Admin')}</option>
                                <option value="host">{t('users.host', 'Host')}</option>
                            </select>
                            {errors.role && (
                                <div className="error-message">{errors.role}</div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        {t('general.cancel', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? t('users.updating', 'Updating...') : t('users.updateUserButton', 'Update User')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateUserModal;