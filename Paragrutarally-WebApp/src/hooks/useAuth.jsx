import { useState, useEffect, useContext, createContext } from 'react';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);

                // Fetch user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                }
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    const signIn = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        return firebaseSignOut(auth);
    };

    const resetPassword = async (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        userRole,
        loading,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};