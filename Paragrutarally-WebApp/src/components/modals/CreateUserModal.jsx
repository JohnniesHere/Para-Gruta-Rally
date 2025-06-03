// src/components/modals/CreateUserModal.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/config';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
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
            newErrors.displayName = 'Display name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
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

        // Store current admin info
        const { auth } = await import('../../firebase/config');
        const currentAdmin = auth.currentUser;
        const adminEmail = currentAdmin?.email;

        if (!adminEmail) {
            setErrors({ general: 'You must be logged in as admin to create users' });
            setIsLoading(false);
            return;
        }

        try {
            // Get Firebase config
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
                    '123456'
                );

                const uid = userCredential.user.uid;
                const now = serverTimestamp();

                // Create user document in Firestore
                const userDoc = {
                    createdAt: now,
                    displayName: formData.displayName,
                    email: formData.email,
                    lastLogin: now,
                    name: formData.name,
                    phone: formData.phone,
                    role: formData.role,
                    updatedAt: now // Initialize updatedAt same as createdAt
                };

                await setDoc(doc(db, 'users', uid), userDoc);

                // Success! Clean up and close
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
                    `✅ SUCCESS!\n\n` +
                    `User "${formData.displayName}" has been created successfully!\n\n` +
                    `📧 Email: ${formData.email}\n` +
                    `🔑 Password: 123456\n` +
                    `👤 Role: ${formData.role}\n\n` +
                    `✨ You remain logged in as admin!`
                );

                // Notify parent and close
                if (onUserCreated) {
                    onUserCreated();
                }
                onClose();

            } catch (userCreationError) {
                // Clean up secondary app on error
                await deleteApp(secondaryApp);
                throw userCreationError;
            }

        } catch (error) {
            console.error('Error creating user:', error);

            // Handle specific Firebase errors
            if (error.code === 'auth/email-already-in-use') {
                setErrors({ email: 'This email is already registered' });
            } else if (error.code === 'auth/invalid-email') {
                setErrors({ email: 'Invalid email address' });
            } else if (error.code === 'auth/weak-password') {
                setErrors({ general: 'Password is too weak' });
            } else if (error.code === 'app/duplicate-app') {
                // If secondary app already exists, try a different approach
                setErrors({
                    general: 'Please wait a moment and try again. (App instance conflict)'
                });
            } else {
                setErrors({ general: 'Failed to create user. Please try again.' });
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
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create New User</h3>
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

                    <div className={`form-group ${errors.email ? 'error' : ''}`}>
                        <label htmlFor="email">Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter email address"
                        />
                        {errors.email && (
                            <div className="error-message">{errors.email}</div>
                        )}
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
                            {isLoading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;