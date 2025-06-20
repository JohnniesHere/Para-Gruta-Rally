// src/components/modals/CreateUserModal.jsx - FIXED VERSION
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
    const { t, isRTL } = useLanguage();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        name: '',
        phone: '',
        role: 'parent'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = t('users.displayNameRequired', 'Display name is required');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('users.emailRequired', 'Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('users.emailInvalid', 'Please enter a valid email address');
        }

        if (!formData.name.trim()) {
            newErrors.name = t('users.nameRequired', 'Name is required');
        }

        if (!formData.phone.trim()) {
            newErrors.phone = t('users.phoneRequired', 'Phone number is required');
        }

        if (!formData.role) {
            newErrors.role = t('users.roleRequired', 'Role is required');
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
            console.log('Creating user with data:', formData);

            // Get Firebase config from environment variables
            const firebaseConfig = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID
            };

            // Create secondary app instance with unique name
            const timestamp = Date.now();
            const secondaryApp = initializeApp(firebaseConfig, `CreateUser_${timestamp}`);
            const secondaryAuth = getAuth(secondaryApp);

            try {
                // Create user with secondary auth instance
                const userCredential = await createUserWithEmailAndPassword(
                    secondaryAuth,
                    formData.email,
                    '123456' // Default password
                );

                const uid = userCredential.user.uid;
                const now = serverTimestamp();

                console.log('User created in auth, UID:', uid);

                // Create user document in Firestore
                const userDoc = {
                    createdAt: now,
                    displayName: formData.displayName.trim(),
                    email: formData.email.trim(),
                    lastLogin: now,
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    role: formData.role,
                    updatedAt: now
                };

                await setDoc(doc(db, 'users', uid), userDoc);
                console.log('User document created in Firestore');

                // Clean up secondary app
                await deleteApp(secondaryApp);

                // Reset form
                setFormData({
                    displayName: '',
                    email: '',
                    name: '',
                    phone: '',
                    role: 'parent'
                });
                setErrors({});

                // Show success message
                alert(
                    `✅ ${t('users.createSuccess', 'SUCCESS!')}\n\n` +
                    `${t('users.userCreated', 'User has been created successfully!')}\n\n` +
                    `📧 ${t('users.email', 'Email')}: ${formData.email}\n` +
                    `🔑 ${t('users.password', 'Password')}: TempPass123!\n` +
                    `👤 ${t('users.role', 'Role')}: ${formData.role}\n\n` +
                    `${t('users.remainLoggedIn', 'You remain logged in as admin!')}`
                );

                // Notify parent and close
                if (onUserCreated) {
                    onUserCreated();
                }
                onClose();

            } catch (userCreationError) {
                // Clean up secondary app on error
                try {
                    await deleteApp(secondaryApp);
                } catch (cleanupError) {
                    console.warn('Error cleaning up secondary app:', cleanupError);
                }
                throw userCreationError;
            }

        } catch (error) {
            console.error('Error creating user:', error);

            // Handle specific Firebase errors
            if (error.code === 'auth/email-already-in-use') {
                setErrors({ email: t('users.emailInUse', 'This email is already registered') });
            } else if (error.code === 'auth/invalid-email') {
                setErrors({ email: t('users.emailInvalid', 'Invalid email address') });
            } else if (error.code === 'auth/weak-password') {
                setErrors({ general: t('users.weakPassword', 'Password is too weak') });
            } else if (error.code === 'app/duplicate-app') {
                setErrors({
                    general: t('users.tryAgain', 'Please wait a moment and try again. (App instance conflict)')
                });
            } else {
                setErrors({
                    general: t('users.createError', 'Failed to create user. Please try again.')
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setFormData({
                displayName: '',
                email: '',
                name: '',
                phone: '',
                role: 'parent'
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={handleClose} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('users.createNewUser', 'Create New User')}</h3>
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

                        <div className={`form-group ${errors.email ? 'error' : ''}`}>
                            <label htmlFor="email">{t('users.emailAddress', 'Email Address')} *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder={t('users.emailPlaceholder', 'Enter email address')}
                            />
                            {errors.email && (
                                <div className="error-message">{errors.email}</div>
                            )}
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
                        {isLoading ? t('users.creating', 'Creating...') : t('users.createUser', 'Create User')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;