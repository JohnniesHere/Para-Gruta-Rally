// src/contexts/AuthContext.jsx - COMPLETE SIMPLIFIED VERSION
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
                    role: defaultRole, // Use 'role' field consistently
                    assignee: defaultRole, // Also set 'assignee' for backward compatibility
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    ...additionalData
                });

                return { displayName, email, role: defaultRole, assignee: defaultRole, ...additionalData };
            } catch (error) {
                console.error("Error creating user document:", error);
                throw error;
            }
        }

        // If document exists, return the data with role handling
        const existingData = userDoc.data();
        const userRole = existingData.role || existingData.assignee || 'external';
        return { ...existingData, role: userRole };
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

    // Enhanced logout function with complete state reset
    async function logout() {
        try {
            setError(null);
            setLoading(true); // Set loading during logout

            // IMPORTANT: Clear all state BEFORE signing out
            setCurrentUser(null);
            setUserRole(null);
            setUserData(null);

            // Sign out from Firebase
            await signOut(auth);

            // Additional cleanup - clear any cached data
            if (typeof window !== 'undefined') {
                // Clear any localStorage items if you're using them
                localStorage.removeItem('userRole');
                localStorage.removeItem('userData');
                // Clear sessionStorage as well
                sessionStorage.clear();
            }

            // Force a small delay to ensure Firebase state is cleared
            await new Promise(resolve => setTimeout(resolve, 100));

            console.log("Logout completed successfully");
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            setError(error.message);
            throw error;
        } finally {
            // Force page reload to ensure complete state reset
            window.location.reload();
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

    // Utility function to determine if we should redirect after login (for use by components)
    function shouldRedirectAfterLogin(role, currentPath = window.location.pathname) {
        console.log(`shouldRedirectAfterLogin called with role: ${role}, currentPath: ${currentPath}`);

        // Don't redirect if we don't have a role yet
        if (!role) {
            console.log('No role provided, not redirecting');
            return null;
        }

        // Only redirect if we're on specific paths
        const redirectPaths = ['/login', '/', '/dashboard'];
        const isOnRedirectPath = redirectPaths.includes(currentPath) || currentPath === '/';

        console.log(`Is on redirect path: ${isOnRedirectPath}`);

        // Also redirect if user is trying to access wrong dashboard
        const isOnWrongDashboard = (
            (role === 'parent' && currentPath.startsWith('/admin')) ||
            (role === 'admin' && (currentPath.startsWith('/parent') || currentPath.startsWith('/host') || currentPath.startsWith('/instructor'))) ||
            (role === 'instructor' && (currentPath.startsWith('/admin') || currentPath.startsWith('/parent') || currentPath.startsWith('/host'))) ||
            (role === 'host' && !currentPath.startsWith('/host')) ||
            (role === 'guest' && !currentPath.startsWith('/host')) ||
            (role === 'external' && !currentPath.startsWith('/host'))
        );

        console.log(`Is on wrong dashboard: ${isOnWrongDashboard}`);

        if (isOnRedirectPath || isOnWrongDashboard) {
            const targetDashboard = getDashboardForRole(role);
            console.log(`Should redirect ${role} from ${currentPath} to ${targetDashboard}`);
            return targetDashboard;
        }

        console.log('No redirect needed');
        return null;
    }

    // Enhanced auth state change handler
    useEffect(() => {
        console.log("Setting up auth state change listener");

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("=== AUTH STATE CHANGE ===");
            console.log("User:", user ? `${user.email} (${user.uid})` : "No user");

            // Clear state immediately when user changes or signs out
            if (!user) {
                console.log("User signed out - clearing all state");
                setCurrentUser(null);
                setUserData(null);
                setUserRole(null);
                setError(null);
                setLoading(false);
                setAuthInitialized(true);
                return;
            }

            // If we have a different user than before, clear previous state first
            if (currentUser && currentUser.uid !== user.uid) {
                console.log(`Different user detected: ${currentUser.uid} -> ${user.uid}`);
                setCurrentUser(null);
                setUserData(null);
                setUserRole(null);
                setError(null);
            }

            setLoading(true);

            try {
                console.log("Fetching user data from Firestore...");
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const firestoreData = userDoc.data();
                    console.log("Firestore data:", {
                        email: firestoreData.email,
                        role: firestoreData.role,
                        assignee: firestoreData.assignee,
                        displayName: firestoreData.displayName
                    });

                    // Better role determination logic
                    let userRole = null;

                    // Priority 1: Check 'role' field
                    if (firestoreData.role && firestoreData.role !== null && firestoreData.role !== '') {
                        userRole = firestoreData.role;
                        console.log(`Role found in 'role' field: ${userRole}`);
                    }
                    // Priority 2: Check 'assignee' field for backward compatibility
                    else if (firestoreData.assignee && firestoreData.assignee !== null && firestoreData.assignee !== '') {
                        userRole = firestoreData.assignee;
                        console.log(`Role found in 'assignee' field: ${userRole}`);
                    }
                    // Priority 3: Determine from email pattern
                    else {
                        if (user.email.includes('admin')) {
                            userRole = 'admin';
                        } else if (user.email.includes('parent')) {
                            userRole = 'parent';
                        } else if (user.email.includes('instructor')) {
                            userRole = 'instructor';
                        } else {
                            userRole = 'external';
                        }
                        console.log(`Role determined from email: ${userRole}`);

                        // Update Firestore with the determined role
                        try {
                            await setDoc(userRef, {
                                role: userRole,
                                lastLogin: serverTimestamp()
                            }, { merge: true });
                            console.log(`Updated role in Firestore: ${userRole}`);
                        } catch (updateError) {
                            console.warn('Could not update role in Firestore:', updateError);
                        }
                    }

                    console.log(`Final determined role: ${userRole}`);

                    // Create enhanced user object
                    const enhancedUser = {
                        ...user,
                        ...firestoreData,
                        role: userRole,
                        uid: user.uid,
                        email: user.email
                    };

                    // Set all state
                    console.log("Setting user state...");
                    setCurrentUser(enhancedUser);
                    setUserData({ ...firestoreData, role: userRole });
                    setUserRole(userRole);
                    setError(null);

                    console.log(`User state updated: ${user.email} with role ${userRole}`);

                } else {
                    console.log("No Firestore document - creating default");

                    const defaultUserData = await createUserDocument(user, {
                        role: 'external'
                    });

                    const userRole = defaultUserData.role || 'external';
                    const enhancedUser = {
                        ...user,
                        ...defaultUserData,
                        role: userRole
                    };

                    setCurrentUser(enhancedUser);
                    setUserData({ ...defaultUserData, role: userRole });
                    setUserRole(userRole);
                    setError(null);

                    console.log(`New user created with role: ${userRole}`);
                }
            } catch (firestoreError) {
                console.error("Error in auth state change handler:", firestoreError);
                setError("Error loading user data");

                // Fallback: set basic user info
                setCurrentUser(user);
                setUserData({ role: 'external' });
                setUserRole('external');
            } finally {
                setLoading(false);
                setAuthInitialized(true);
                console.log("Auth state change complete");
            }
        });

        return unsubscribe;
    }, []); // Keep dependencies empty to avoid loops

    // Enhanced role checking functions based on current userRole
    const isAdmin = userRole === 'admin';
    const isInstructor = userRole === 'instructor' || userRole === 'admin';
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

        // Role checking functions
        isAdmin,
        isInstructor,
        isParent,
        isHost,
        isExternal,
        hasRole,
        hasAnyRole,

        // Utility functions
        getDashboardForRole,
        shouldRedirectAfterLogin,

        // Legacy compatibility
        login: signIn // Keep for backward compatibility
    };

    console.log("AuthProvider rendering", {
        loading,
        userRole,
        authInitialized,
        hasUser: !!currentUser
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