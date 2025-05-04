import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Get additional user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserRole(userData.role);
                    } else {
                        console.warn('User document not found in Firestore');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                setUserRole(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signOut = () => {
        return firebaseSignOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        signOut,
        isAdmin: userRole === 'admin',
        isParent: userRole === 'parent',
        isStaff: userRole === 'staff'
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;