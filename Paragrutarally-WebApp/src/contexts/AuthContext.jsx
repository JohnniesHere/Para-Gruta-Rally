// src/contexts/AuthContext.jsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
    return useContext(AuthContext);
}

// Role-based redirect mapping
const ROLE_REDIRECTS = {
    admin: '/admin/dashboard',
    instructor: '/instructor/dashboard',
    parent: '/parent/dashboard',
    host: '/host/dashboard',
    guest: '/host/dashboard',
    external: '/host/dashboard'
};

// Get appropriate dashboard for role
const getDashboardForRole = (role) => {
    return ROLE_REDIRECTS[role] || '/admin/dashboard';
};

// Provider component to wrap the app and provide auth context
export function AuthProvider({ children }) {
    console.log("AuthProvider initializing");

    // State management
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Function to create or update user document in Firestore
    async function createUserDocument(user, additionalData = {}) {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            const { displayName, email } = user;
            const defaultRole = additionalData.role || 'external';

            try {
                await setDoc(userRef, {
                    displayName: displayName || '',
                    email,
                    role: defaultRole,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    ...additionalData
                });

                return { displayName, email, role: defaultRole, ...additionalData };
            } catch (error) {
                console.error("Error creating user document:", error);
                throw error;
            }
        }

        return userDoc.data();
    }

    // Enhanced login function with role detection
    async function signIn(email, password) {
        try {
            setError(null);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Update last login timestamp
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

            return userCredential;
        } catch (error) {
            console.error("Login error:", error);
            setError(error.message);
            throw error;
        }
    }

    // Enhanced Google sign-in with role verification
    async function signInWithGoogle() {
        try {
            setError(null);
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Check if email exists in authorized users
            const usersRef = collection(db, 'users');
            const emailQuery = query(usersRef, where('email', '==', user.email));
            const emailQuerySnapshot = await getDocs(emailQuery);

            if (emailQuerySnapshot.empty) {
                // Email not found in authorized users
                await signOut(auth);
                throw new Error('This email is not authorized to access this application. Please contact an administrator.');
            }

            // Email exists, update user document
            const existingUserDoc = emailQuerySnapshot.docs[0];
            const existingUserData = existingUserDoc.data();
            const existingUserId = existingUserDoc.id;

            // Update the existing user document with Google auth info
            const userRef = doc(db, 'users', existingUserId);
            await setDoc(userRef, {
                lastLogin: serverTimestamp(),
                authProvider: 'google',
                ...(user.displayName && !existingUserData.displayName
                    ? { displayName: user.displayName }
                    : {}),
                ...(user.photoURL ? { photoURL: user.photoURL } : {})
            }, { merge: true });

            return userCredential;
        } catch (error) {
            console.error("Google sign-in error:", error);
            setError(error.message);
            throw error;
        }
    }

    // Function to register a new user (admin only)
    async function registerUser(email, password, displayName, role = 'external') {
        try {
            setError(null);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document in Firestore
            await createUserDocument(userCredential.user, {
                displayName,
                role,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            return userCredential;
        } catch (error) {
            console.error("Registration error:", error);
            setError(error.message);
            throw error;
        }
    }

    // Enhanced logout function
    async function logout() {
        try {
            setError(null);
            await signOut(auth);

            // Clear state
            setCurrentUser(null);
            setUserRole(null);
            setUserData(null);

            return true;
        } catch (error) {
            console.error("Logout error:", error);
            setError(error.message);
            throw error;
        }
    }

    // Password reset function
    async function resetPassword(email) {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            console.error("Password reset error:", error);
            setError(error.message);
            throw error;
        }
    }

    // Function to handle role-based redirects
    function redirectToRoleDashboard(role, currentPath = window.location.pathname) {
        // Only redirect if we're on the login page or root
        if (currentPath === '/login' || currentPath === '/' || currentPath === '/dashboard') {
            const targetDashboard = getDashboardForRole(role);
            console.log(`Redirecting ${role} to ${targetDashboard}`);
            window.location.href = targetDashboard;
        }
    }

    // Effect to handle auth state changes with enhanced role detection
    useEffect(() => {
        console.log("Setting up auth state change listener");

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user ? `User with email ${user.email}` : "No user");

            try {
                if (user) {
                    // User is signed in, fetch user data from Firestore
                    const userRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const firestoreData = userDoc.data();
                        console.log("User data from Firestore:", firestoreData);

                        // Combine Firebase Auth user with Firestore data
                        const enhancedUser = {
                            ...user,
                            ...firestoreData,
                            uid: user.uid, // Ensure we use Auth UID
                            email: user.email // Ensure we use Auth email
                        };

                        setCurrentUser(enhancedUser);
                        setUserData(firestoreData);
                        setUserRole(firestoreData.role);

                        // Handle role-based redirects
                        redirectToRoleDashboard(firestoreData.role);

                    } else {
                        // User exists in Auth but not in Firestore - create document
                        console.log("User authenticated but no Firestore document exists, creating default document");

                        try {
                            const defaultUserData = await createUserDocument(user, {
                                role: 'external' // Default role for new users
                            });

                            const enhancedUser = { ...user, ...defaultUserData };
                            setCurrentUser(enhancedUser);
                            setUserData(defaultUserData);
                            setUserRole(defaultUserData.role);

                            // Redirect to appropriate dashboard
                            redirectToRoleDashboard(defaultUserData.role);

                        } catch (docError) {
                            console.error("Error creating user document:", docError);
                            setError("Error setting up user account");

                            // Set basic user info even if Firestore fails
                            setCurrentUser(user);
                            setUserData({ role: 'external' });
                            setUserRole('external');
                        }
                    }
                } else {
                    // User is signed out
                    console.log("User signed out");
                    setCurrentUser(null);
                    setUserData(null);
                    setUserRole(null);
                }
            } catch (firestoreError) {
                console.error("Error in auth state change handler:", firestoreError);
                setError("Error loading user data");

                if (user) {
                    // Set basic user info even if Firestore fails
                    setCurrentUser(user);
                    setUserData({ role: 'admin' }); // Fallback to admin for development
                    setUserRole('admin');
                }
            } finally {
                setLoading(false);
                setAuthInitialized(true);
            }
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // FIXED: Enhanced role checking functions based on current userRole
    const isAdmin = userRole === 'admin';
    const isInstructor = userRole === 'instructor' || userRole === 'admin'; // FIXED: This was the problem!
    const isParent = userRole === 'parent' || userRole === 'admin';
    const isHost = userRole === 'host' || userRole === 'guest' || userRole === 'admin';
    const isExternal = userRole === 'external';

    // Function to check if user has specific role
    const hasRole = (requiredRole) => {
        if (!userRole) return false;
        if (userRole === 'admin') return true; // Admin can access everything
        return userRole === requiredRole;
    };

    // Function to check if user has any of the specified roles
    const hasAnyRole = (roles) => {
        if (!userRole) return false;
        if (userRole === 'admin') return true; // Admin can access everything
        return roles.includes(userRole);
    };

    // Create value object with auth functions and state
    const value = {
        // User state
        currentUser,
        userRole,
        userData,
        loading,
        error,
        authInitialized,

        // Auth functions
        signIn,
        signInWithGoogle,
        registerUser,
        logout,
        signOut: logout, // Alias for consistency
        resetPassword,

        // FIXED: Role checking functions now use the updated userRole state
        isAdmin,
        isInstructor,
        isParent,
        isHost,
        isExternal,
        hasRole,
        hasAnyRole,

        // Utility functions
        getDashboardForRole,
        redirectToRoleDashboard,

        // Legacy compatibility
        login: signIn // Keep for backward compatibility
    };

    console.log("AuthProvider rendering", {
        loading,
        userRole,
        authInitialized,
        hasUser: !!currentUser,
        isInstructor // Add this to debug
    });

    // Show loading spinner while initializing
    if (!authInitialized || loading) {
        return (
            <AuthContext.Provider value={value}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>Initializing...</p>
                </div>
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}