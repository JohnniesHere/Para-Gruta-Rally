// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
    return useContext(AuthContext);
}

// Provider component to wrap the app and provide auth context
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to handle user login
    async function login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Update last login timestamp
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

            return userCredential;
        } catch (error) {
            throw error;
        }
    }

    // Function to register a new user (admin only)
    async function registerUser(email, password, displayName, role) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

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
    }

    // Function to log out
    async function logout() {
        return signOut(auth);
    }

    // Function to reset password
    async function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    // Effect to handle auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch additional user info from Firestore
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser({ ...user, ...userData });
                    setUserRole(userData.role);
                } else {
                    // If user exists in Auth but not in Firestore, create a record
                    await setDoc(userRef, {
                        email: user.email,
                        displayName: user.displayName || '',
                        role: 'external', // Default role
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp()
                    });

                    setCurrentUser({ ...user, role: 'external' });
                    setUserRole('external');
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }

            setLoading(false);
        });

        // Cleanup subscription
        return unsubscribe;
    }, []);

    // Create value object with auth functions and state
    const value = {
        currentUser,
        userRole,
        login,
        registerUser,
        logout,
        resetPassword,
        isAdmin: userRole === 'admin',
        isStaff: userRole === 'staff' || userRole === 'admin',
        isExternal: userRole === 'external'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}