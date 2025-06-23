// src/components/modals/UpdateUserModal.jsx - UPDATED VERSION WITH USER SCHEMA
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../firebase/config';
import {
    validateUser,
    validateUserField,
    prepareUserForFirestore,
    USER_ROLES,
    cleanPhoneNumber
} from '@/schemas/userSchema.js';

const UpdateUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const { t, isRTL } = useLanguage();
    const [formData, setFormData] = useState({
        displayName: '',
        name: '',
        phone: '',
        role: USER_ROLES.PARENT
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
                role: user.role || USER_ROLES.PARENT
            });
            setErrors({}); // Clear any previous errors
        }
    }, [user, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Special handling for phone number - only allow digits
        if (name === 'phone') {
            processedValue = cleanPhoneNumber(value);
            // Limit to 10 digits
            if (processedValue.length > 10) {
                processedValue = processedValue.slice(0, 10);
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Real-time validation using schema
        const fieldError = validateUserField(name, processedValue, { isUpdate: true }, t);
        setErrors(prev => ({
            ...prev,
            [name]: fieldError
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.id) {
            setErrors({ general: t('users.noUserSelected', 'No user selected for update') });
            return;
        }

        // Validate entire form using schema (isUpdate = true to skip email validation)
        const validation = validateUser(formData, { isUpdate: true }, t);

        if (!validation.isValid) {
            setErrors(validation.errors);

            // Show alert with first error for better UX
            const firstError = Object.values(validation.errors)[0];
            alert(t('users.pleaseFixErrors', 'Please fix the following errors:') + '\n' + firstError);
            return;
        }

        setIsLoading(true);

        try {
            console.log('Updating user:', user.id, 'with data:', formData);

            // Prepare user data for Firestore using schema
            const updateData = prepareUserForFirestore(formData, true);
            console.log('Prepared update data:', updateData);

            // Update user document in Firestore
            const userDocRef = doc(db, 'users', user.id);
            await updateDoc(userDocRef, updateData);

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

    // Check if form has errors
    const hasFormErrors = Object.keys(errors).some(key => errors[key]);

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
                        aria-label={t('common.close', 'Close')}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit} className={isLoading ? 'loading' : ''}>
                        {errors.general && (
                            <div className="error-message general-error" role="alert">
                                {errors.general}
                            </div>
                        )}

                        <div className={`form-group ${errors.displayName ? 'error' : ''}`}>
                            <label htmlFor="displayName">
                                {t('users.displayName', 'Display Name')} *
                            </label>
                            <input
                                type="text"
                                id="displayName"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.displayNamePlaceholder', 'Enter display name')}
                                aria-describedby={errors.displayName ? 'displayName-error' : undefined}
                                aria-invalid={!!errors.displayName}
                            />
                            {errors.displayName && (
                                <div id="displayName-error" className="error-message" role="alert">
                                    {errors.displayName}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                {t('users.emailAddress', 'Email Address')}
                            </label>
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
                            <label htmlFor="name">
                                {t('users.fullName', 'Full Name')} *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.fullNamePlaceholder', 'Enter full name')}
                                aria-describedby={errors.name ? 'name-error' : undefined}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && (
                                <div id="name-error" className="error-message" role="alert">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                            <label htmlFor="phone">
                                {t('users.phoneNumber', 'Phone Number')} *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.phoneNumberPlaceholder', 'Enter phone number')}
                                maxLength="10"
                                aria-describedby={errors.phone ? 'phone-error' : undefined}
                                aria-invalid={!!errors.phone}
                            />
                            {errors.phone && (
                                <div id="phone-error" className="error-message" role="alert">
                                    {errors.phone}
                                </div>
                            )}
                            <small className="field-hint">
                                {t('users.phoneHint', 'Israeli phone number (10 digits)')}
                            </small>
                        </div>

                        <div className={`form-group ${errors.role ? 'error' : ''}`}>
                            <label htmlFor="role">
                                {t('users.role', 'Role')} *
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                aria-describedby={errors.role ? 'role-error' : undefined}
                                aria-invalid={!!errors.role}
                            >
                                <option value={USER_ROLES.PARENT}>{t('users.parent', 'Parent')}</option>
                                <option value={USER_ROLES.INSTRUCTOR}>{t('users.instructor', 'Instructor')}</option>
                                <option value={USER_ROLES.ADMIN}>{t('users.admin', 'Admin')}</option>
                                <option value={USER_ROLES.HOST}>{t('users.host', 'Host')}</option>
                            </select>
                            {errors.role && (
                                <div id="role-error" className="error-message" role="alert">
                                    {errors.role}
                                </div>
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
                        disabled={isLoading || hasFormErrors}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner" aria-hidden="true"></span>
                                {t('users.updating', 'Updating...')}
                            </>
                        ) : (
                            t('users.updateUserButton', 'Update User')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateUserModal;