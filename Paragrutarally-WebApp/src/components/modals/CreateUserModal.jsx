// src/components/modals/CreateUserModal.jsx - FIXED VERSION
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {doc, setDoc, serverTimestamp, getDoc} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { db} from '@/firebase/config.js';
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

        // Display name validation
        if (!formData.displayName.trim()) {
            newErrors.displayName = t('users.displayNameRequired', 'Display name is required');
        } else if (formData.displayName.trim().length < 2) {
            newErrors.displayName = t('users.displayNameMinLength', 'Display name must be at least 2 characters');
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = t('users.emailRequired', 'Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('users.emailInvalid', 'Please enter a valid email address');
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

                // FIXED: Create comprehensive user document
                const userDoc = {
                    createdAt: now,
                    displayName: formData.displayName.trim(),
                    email: formData.email.trim(),
                    lastLogin: now,
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    role: formData.role, // Make sure this is set correctly
                    updatedAt: now,
                    // Add any other fields that might be expected
                    authProvider: 'email' // Track how user was created
                };

                console.log('Creating user document with data:', userDoc);

                // Create the document using the UID from Firebase Auth
                await setDoc(doc(db, 'users', uid), userDoc);
                console.log('User document created in Firestore with UID:', uid);

                // VERIFICATION: Read back the document to confirm it was created correctly
                const verificationDoc = await getDoc(doc(db, 'users', uid));
                if (verificationDoc.exists()) {
                    const verificationData = verificationDoc.data();
                    console.log('✅ VERIFICATION: Document created successfully:', verificationData);
                    console.log('✅ VERIFICATION: Role in document:', verificationData.role);
                } else {
                    console.error('❌ VERIFICATION: Document was not created properly');
                    throw new Error('User document verification failed');
                }

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
                    `👤 ${t('users.role', 'Role')}: ${t(`users.${formData.role}`, formData.role)}\n` +
                    `🆔 ${t('users.userId', 'User ID')}: ${uid}\n\n` +
                    `${t('users.defaultPassword', 'Default password')}: 123456`
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
                                onInvalid={(e) => {
                                    e.target.setCustomValidity(t('users.emailInvalid'));
                                }}
                                onInput={(e) => {
                                    e.target.setCustomValidity('');
                                }}
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
                        {isLoading ? t('users.creating', 'Creating...') : t('users.createUser', 'Create User')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;