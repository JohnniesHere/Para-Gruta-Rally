// src/services/userService.js - FIXED VERSION
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../firebase/config';

/**
 * Update user profile information in Firestore
 * @param {string} userId - The user's document ID
 * @param {Object} userData - The user data to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, userData) => {
    try {
        const { serverTimestamp } = await import('firebase/firestore');

        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            displayName: userData.displayName,
            name: userData.name,
            phone: userData.phone,
            updatedAt: serverTimestamp(),
            ...(userData.role && { role: userData.role })
        });

        console.log('✅ User profile updated successfully');
    } catch (error) {
        console.error('❌ Error updating user profile:', error);
        throw new Error('Failed to update user profile. Please try again.');
    }
};

/**
 * Get user data from Firestore
 * @param {string} userId - The user's document ID
 * @returns {Promise<Object>} User data
 */
export const getUserData = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('❌ Error fetching user data:', error);
        throw new Error('Failed to fetch user data. Please try again.');
    }
};

/**
 * Update user password with improved error handling
 * @param {string} currentPassword - Current password for reauthentication
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
    try {
        console.log('🔐 Starting password update process...');

        const user = auth.currentUser;

        if (!user) {
            console.error('❌ No authenticated user found');
            throw new Error('No authenticated user found. Please sign in again.');
        }

        if (!user.email) {
            console.error('❌ User email not found');
            throw new Error('User email not available. Please sign in again.');
        }

        console.log('👤 User found:', user.email);
        console.log('🔑 Creating credentials for reauthentication...');

        // Create credential for reauthentication
        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        console.log('🔐 Attempting reauthentication...');

        // Reauthenticate user with current password
        await reauthenticateWithCredential(user, credential);

        console.log('✅ Reauthentication successful');
        console.log('🔄 Updating password...');

        // Update password
        await updatePassword(user, newPassword);

        console.log('✅ Password updated successfully');
    } catch (error) {
        console.error('❌ Error updating password:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific Firebase errors with more descriptive messages
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                throw new Error('Current password is incorrect. Please check your current password and try again.');

            case 'auth/weak-password':
                throw new Error('New password is too weak. Please choose a stronger password with at least 6 characters.');

            case 'auth/requires-recent-login':
                throw new Error('For security reasons, please sign out and sign back in before changing your password.');

            case 'auth/user-not-found':
                throw new Error('User account not found. Please sign in again.');

            case 'auth/invalid-email':
                throw new Error('Invalid email format. Please sign in again.');

            case 'auth/network-request-failed':
                throw new Error('Network error. Please check your internet connection and try again.');

            case 'auth/too-many-requests':
                throw new Error('Too many failed attempts. Please wait a few minutes before trying again.');

            case 'auth/operation-not-allowed':
                throw new Error('Password update is not enabled. Please contact support.');

            default:
                // For any other error, provide a generic message
                throw new Error(`Failed to update password: ${error.message || 'Unknown error occurred'}`);
        }
    }
};

/**
 * Validate password strength with improved criteria
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
    if (!password) {
        return {
            isValid: false,
            message: 'Password is required'
        };
    }

    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return {
            isValid: false,
            message: `Password must be at least ${minLength} characters long`
        };
    }

    // Basic validation (Firebase minimum requirements)
    if (password.length >= 6) {
        return {
            isValid: true,
            message: 'Password meets minimum requirements'
        };
    }

    // Enhanced validation (recommended)
    if (!hasUpperCase || !hasLowerCase) {
        return {
            isValid: false,
            message: 'Password should contain both uppercase and lowercase letters'
        };
    }

    if (!hasNumbers) {
        return {
            isValid: false,
            message: 'Password should contain at least one number'
        };
    }

    return {
        isValid: true,
        message: 'Password is strong'
    };
};

/**
 * Check if user is properly authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isUserAuthenticated = () => {
    const user = auth.currentUser;
    return user !== null && user.email !== null;
};

/**
 * Get current user's authentication status
 * @returns {Object} User auth status information
 */
export const getCurrentUserStatus = () => {
    const user = auth.currentUser;

    if (!user) {
        return {
            isAuthenticated: false,
            user: null,
            email: null,
            uid: null
        };
    }

    return {
        isAuthenticated: true,
        user: user,
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified,
        providerData: user.providerData
    };
};