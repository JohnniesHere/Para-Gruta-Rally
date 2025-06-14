// src/hooks/usePermissions.jsx - SIMPLIFIED ROLE-BASED PERMISSIONS
import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const PermissionContext = createContext();

// SIMPLE ROLE-BASED PERMISSIONS
const createRolePermissions = (userRole = 'guest') => {
    switch (userRole) {
        case 'admin':
            return {
                canCreate: true,
                canEdit: true,
                canDelete: true,
                canViewAll: true,
                canViewKid: () => true,
                canViewField: () => true,
                canEditField: () => true,
                role: 'admin'
            };

        case 'parent':
            return {
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canViewAll: false,
                canViewKid: (kid, userId) => kid.parentInfo?.parentId === userId,
                canViewField: () => true,
                canEditField: () => false,
                role: 'parent'
            };

        case 'instructor':
            return {
                canCreate: false,
                canEdit: true,
                canDelete: false,
                canViewAll: false,
                canViewKid: (kid, userData) => kid.instructorId === userData?.instructorId,
                canViewField: () => true,
                canEditField: () => true,
                role: 'instructor'
            };

        case 'guest':
        default:
            return {
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canViewAll: false,
                canViewKid: () => false,
                canViewField: () => false,
                canEditField: () => false,
                role: 'guest'
            };
    }
};

export const PermissionProvider = ({ children }) => {
    const authContext = useAuth();

    // Extract auth values with fallbacks
    const authUser = authContext?.currentUser || authContext?.user || null;
    const authUserRole = authContext?.userRole || null;
    const authLoading = authContext?.loading || false;

    const [userData, setUserData] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    const loadUserData = useCallback(async () => {
        if (hasInitialized || authLoading) {
            return;
        }

        try {
            setError(null);

            if (!authUser) {
                setPermissions(createRolePermissions('guest'));
                setUserData(null);
            } else {
                // Use auth role as primary source, Firestore as fallback
                if (authUserRole) {
                    const authBasedData = {
                        role: authUserRole,
                        email: authUser.email,
                        displayName: authUser.displayName || '',
                        source: 'authContext'
                    };
                    setUserData(authBasedData);
                    setPermissions(createRolePermissions(authUserRole));
                } else {
                    // Fallback to Firestore if auth role is missing
                    try {
                        const userDoc = await getDoc(doc(db, 'users', authUser.uid));

                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            const role = data.role || 'admin';

                            setUserData({ ...data, source: 'firestore' });
                            setPermissions(createRolePermissions(role));
                        } else {
                            // No Firestore doc - default to admin for development
                            const defaultData = {
                                role: 'admin',
                                email: authUser.email,
                                displayName: authUser.displayName || '',
                                source: 'default'
                            };
                            setUserData(defaultData);
                            setPermissions(createRolePermissions('admin'));
                        }
                    } catch (firestoreError) {
                        // Firestore error - fall back to admin
                        const fallbackData = {
                            role: 'admin',
                            email: authUser.email,
                            displayName: authUser.displayName || '',
                            source: 'fallback'
                        };
                        setUserData(fallbackData);
                        setPermissions(createRolePermissions('admin'));
                    }
                }
            }
        } catch (error) {
            setError(error.message);
            // Even on error, provide admin permissions for development
            const errorData = {
                role: 'admin',
                email: authUser?.email || '',
                displayName: authUser?.displayName || '',
                source: 'error'
            };
            setUserData(errorData);
            setPermissions(createRolePermissions('admin'));
        } finally {
            setLoading(false);
            setHasInitialized(true);
        }
    }, [authUser, authUserRole, authLoading, hasInitialized]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // Priority order for role determination
    const finalUserRole = userData?.role || authUserRole || 'guest';
    const finalPermissions = permissions || createRolePermissions(finalUserRole);

    const contextValue = {
        permissions: finalPermissions,
        userRole: finalUserRole,
        userData,
        user: authUser,
        loading,
        error
    };

    return (
        <PermissionContext.Provider value={contextValue}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionContext);

    if (!context) {
        return {
            permissions: createRolePermissions('admin'),
            userRole: 'admin',
            userData: { role: 'admin' },
            user: null,
            loading: false,
            error: 'Used outside provider'
        };
    }

    return context;
};

// UTILITY FUNCTIONS for easy permission checking
export const canUserAccessKid = (userRole, kid, userData, user) => {
    switch (userRole) {
        case 'admin':
            return true;

        case 'parent':
            return kid.parentInfo?.parentId === user?.uid;

        case 'instructor':
            return kid.instructorId === userData?.instructorId;

        case 'guest':
        default:
            return false;
    }
};

export const canUserEditKid = (userRole, kid, userData, user) => {
    switch (userRole) {
        case 'admin':
            return true;

        case 'instructor':
            return kid.instructorId === userData?.instructorId;

        case 'parent':
        case 'guest':
        default:
            return false;
    }
};