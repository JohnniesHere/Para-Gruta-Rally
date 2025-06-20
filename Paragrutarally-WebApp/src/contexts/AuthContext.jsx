// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    GoogleAuthProvider,  // Add this import
    signInWithPopup      // Add this import
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
    return useContext(AuthContext);
}

// Provider component to wrap the app and provide auth context
export function AuthProvider({ children }) {
    console.log("AuthProvider initializing");
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to handle user login (keep this for backward compatibility)
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
        console.log("Setting up auth state change listener");
        try {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                console.log("Auth state changed:", user ? `User with email ${user.email}` : "No user");

                if (user) {
                    try {
                        // Fetch additional user info from Firestore
                        const userRef = doc(db, 'users', user.uid);
                        const userDoc = await getDoc(userRef);

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            console.log("User data from Firestore:", userData);
                            setCurrentUser({ ...user, ...userData });
                            setUserRole(userData.role);

                            // Redirect based on role
                            // const role = userData.role;
                            // if (window.location.pathname === '/login') {
                            //     if (role === 'admin') {
                            //         window.location.href = '/admin-dashboard';
                            //     } else if (role === 'staff') {
                            //         window.location.href = '/staff-dashboard';
                            //     } else {
                            //         window.location.href = '/dashboard';
                            //     }
                            // }
                            // Redirect based on role if on login page
                            if (window.location.pathname === '/login') {
                                console.log("On login page, redirecting to:", `/admin/dashboard`);
                                window.location.href = '/admin/dashboard';
                            }
                        } else {
                            // If user exists in Auth but not in Firestore, create a record
                            // console.log("User exists in Auth but not in Firestore, creating record");
                            console.log("User authenticated but no Firestore document exists");
                            try {
                                await setDoc(userRef, {
                                    email: user.email,
                                    displayName: user.displayName || '',
                                    role: 'external', // Default role
                                    createdAt: serverTimestamp(),
                                    lastLogin: serverTimestamp()
                                });

                                setCurrentUser({ ...user, role: 'external' });
                                setUserRole('external');
                            } catch (docError) {
                                console.error("Error creating user document:", docError);
                            }
                        }
                    } catch (firestoreError) {
                        console.error("Error in auth state change:", firestoreError);
                        console.error("Error fetching user data from Firestore:", firestoreError);
                        // Set basic user info even if Firestore fetch fails
                        setCurrentUser(user);
                        setUserRole('unknown');
                    }
                } else {
                    setCurrentUser(null);
                    setUserRole(null);
                }

                setLoading(false);
            });

            // Cleanup subscription
            return unsubscribe;
        } catch (error) {
            console.error("Error in onAuthStateChanged setup:", error);
            setLoading(false);
            return () => {}; // Return empty cleanup function
        }
    }, []);

    // Create value object with auth functions and state
    const value = {
        currentUser,
        userRole,
        // Keep the original login function for backward compatibility
        login,
        // Add the signIn function that matches what Login.jsx expects
        signIn: async (email, password) => {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);

                // Update last login timestamp
                const userRef = doc(db, 'users', userCredential.user.uid);
                await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });

                return userCredential;
            } catch (error) {
                console.error("Login error:", error);
                throw error;
            }
        },
        // Add signInWithGoogle function
        signInWithGoogle: async () => {
            try {
                const provider = new GoogleAuthProvider();
                const userCredential = await signInWithPopup(auth, provider);
                const user = userCredential.user;

                // First, check if this email exists in our users collection
                const usersRef = collection(db, 'users');
                const emailQuery = query(usersRef, where('email', '==', user.email));
                const emailQuerySnapshot = await getDocs(emailQuery);

                if (emailQuerySnapshot.empty) {
                    // Email not found in authorized users
                    // Sign out the user immediately
                    await signOut(auth);
                    throw new Error('UNAUTHORIZED_EMAIL');
                }

                // Email exists, get the user document
                const existingUserDoc = emailQuerySnapshot.docs[0];
                const existingUserData = existingUserDoc.data();
                const existingUserId = existingUserDoc.id;

                // Update the existing user document with Google auth info
                const userRef = doc(db, 'users', existingUserId);
                await setDoc(userRef, {
                    lastLogin: serverTimestamp(),
                    authProvider: 'google',
                    // Update display name if it was empty before
                    ...(user.displayName && !existingUserData.displayName
                        ? { displayName: user.displayName }
                        : {}),
                    // Update photo URL if available
                    ...(user.photoURL ? { photoURL: user.photoURL } : {})
                }, { merge: true });

                // Create a custom user object that maintains the existing UID from Firestore
                // but uses the Google Auth user for authentication
                const customUser = {
                    ...user,
                    firestoreUid: existingUserId,
                    ...existingUserData
                };

                return userCredential;
            } catch (error) {
                console.error("Google sign-in error:", error);

                if (error.message === 'UNAUTHORIZED_EMAIL') {
                    throw new Error('This email is not authorized to access this application. Please contact an administrator.');
                }

                throw error;
            }
        },
        registerUser,
        logout,
        // You might also want to add signOut as an alias for logout
        signOut: logout,
        resetPassword,
        isAdmin: userRole === 'admin',
        isStaff: userRole === 'staff' || userRole === 'admin',
        isExternal: userRole === 'external'
    };

    console.log("AuthProvider rendering", { loading });
    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <div>Loading...</div>}
        </AuthContext.Provider>
    );
}