// src/firebase/services/auth.js
// Authentication service wrapper

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../config';

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Firebase user credential
 */
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Update last login timestamp
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

        return userCredential;
    } catch (error) {
        throw error;
    }
};

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @param {string} role - User role (admin, staff, external)
 * @returns {Promise} - Firebase user credential
 */
export const registerUser = async (email, password, displayName, role = 'external') => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update user profile
        await updateProfile(userCredential.user, { displayName });

        // Create a user document in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
            email,
            displayName,
            role,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        return userCredential;
    } catch (error) {
        throw error;
    }
};

/**
 * Log out the current user
 * @returns {Promise} - Void promise
 */
export const logoutUser = async () => {
    try {
        return await signOut(auth);
    } catch (error) {
        throw error;
    }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise} - Void promise
 */
export const resetPassword = async (email) => {
    try {
        return await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw error;
    }
};

/**
 * Update user profile information
 * @param {Object} user - Firebase user object
 * @param {Object} data - Profile data to update
 * @returns {Promise} - Void promise
 */
export const updateUserProfile = async (user, data) => {
    try {
        const updates = {};

        // Update display name if provided
        if (data.displayName) {
            await updateProfile(user, { displayName: data.displayName });
            updates.displayName = data.displayName;
        }

        // Update other user data in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userData = await getDoc(userRef);

        if (userData.exists()) {
            // Only admins can update roles
            if (data.role && userData.data().role === 'admin') {
                updates.role = data.role;
            }

            // Add any other allowed fields
            if (data.phoneNumber) updates.phoneNumber = data.phoneNumber;
            if (data.photoURL) updates.photoURL = data.photoURL;

            updates.updatedAt = serverTimestamp();

            await setDoc(userRef, updates, { merge: true });
        }

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Update user email
 * @param {Object} user - Firebase user object
 * @param {string} newEmail - New email address
 * @param {string} password - Current password for verification
 * @returns {Promise} - Void promise
 */
export const updateUserEmail = async (user, newEmail, password) => {
    try {
        // Re-authenticate user before changing email
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // Update email in Firebase Auth
        await updateEmail(user, newEmail);

        // Update email in Firestore
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            email: newEmail,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Update user password
 * @param {Object} user - Firebase user object
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} - Void promise
 */
export const updateUserPassword = async (user, currentPassword, newPassword) => {
    try {
        // Re-authenticate user before changing password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        // Log password update in Firestore
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            passwordUpdatedAt: serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        throw error;
    }
};


