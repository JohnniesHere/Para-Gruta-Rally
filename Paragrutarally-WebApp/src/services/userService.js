// src/services/userService.js
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
            updatedAt: serverTimestamp(), // Add timestamp for tracking updates
            ...(userData.role && { role: userData.role }) // Only update role if provided
        });

        console.log('User profile updated successfully');
    } catch (error) {
        console.error('Error updating user profile:', error);
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
        console.error('Error fetching user data:', error);
        throw new Error('Failed to fetch user data. Please try again.');
    }
};

/**
 * Update user password
 * @param {string} currentPassword - Current password for reauthentication
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('No authenticated user found');
        }

        // Reauthenticate user with current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        console.log('Password updated successfully');
    } catch (error) {
        console.error('Error updating password:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/wrong-password') {
            throw new Error('Current password is incorrect');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('New password is too weak. Please choose a stronger password.');
        } else if (error.code === 'auth/requires-recent-login') {
            throw new Error('Please sign out and sign back in before changing your password');
        } else {
            throw new Error('Failed to update password. Please try again.');
        }
    }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (password.length < minLength) {
        return {
            isValid: false,
            message: `Password must be at least ${minLength} characters long`
        };
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return {
            isValid: false,
            message: 'Password must contain uppercase, lowercase, and numeric characters'
        };
    }

    return {
        isValid: true,
        message: 'Password is strong'
    };
};