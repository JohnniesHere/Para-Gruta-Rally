// src/hooks/useAuth.js
// Custom hook for authentication

import { useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Custom hook for authentication
 * @returns {Object} - Auth state and functions
 */
export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effect to handle auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Get additional user data from Firestore
                    const userRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentUser({ ...user, ...userData });
                        setUserRole(userData.role);

                        // Update last login timestamp
                        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
                    } else {
                        // Handle case where user exists in Auth but not in Firestore
                        console.warn('User exists in Auth but not in Firestore:', user.uid);
                        setCurrentUser(user);
                        setUserRole(null);
                    }
                } catch (err) {
                    console.error('Error fetching user data:', err);
                    setCurrentUser(user);
                    setUserRole(null);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }

            setLoading(false);
        });

        // Cleanup function
        return () => unsubscribe();
    }, []);

    /**
     * Log in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} - Auth user credential
     */
    const login = async (email, password) => {
        setError(null);
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} userData - Additional user data
     * @returns {Promise} - Auth user credential
     */
    const register = async (email, password, userData = {}) => {
        setError(null);
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Add user data to Firestore
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, {
                email,
                ...userData,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            return userCredential;
        } catch (err) {
            console.error('Register error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Log out the current user
     * @returns {Promise} - Void promise
     */
    const logout = async () => {
        setError(null);
        try {
            return await signOut(auth);
        } catch (err) {
            console.error('Logout error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Reset password
     * @param {string} email - User email
     * @returns {Promise} - Void promise
     */
    const resetPassword = async (email) => {
        setError(null);
        try {
            return await sendPasswordResetEmail(auth, email);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise} - Void promise
     */
    const updateProfile = async (profileData) => {
        setError(null);
        if (!currentUser) {
            setError('No authenticated user');
            throw new Error('No authenticated user');
        }

        try {
            const userRef = doc(db, 'users', currentUser.uid);

            // Don't allow changing role unless user is admin
            if (profileData.role && userRole !== 'admin') {
                delete profileData.role;
            }

            await setDoc(userRef, {
                ...profileData,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // Update local current user
            setCurrentUser(prev => ({
                ...prev,
                ...profileData
            }));

            // Update role if changed
            if (profileData.role) {
                setUserRole(profileData.role);
            }

            return true;
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.message);
            throw err;
        }
    };

    return {
        currentUser,
        userRole,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        isAdmin: userRole === 'admin',
        isStaff: userRole === 'staff' || userRole === 'admin',
        isExternal: userRole === 'external'
    };
};

export default useAuth;