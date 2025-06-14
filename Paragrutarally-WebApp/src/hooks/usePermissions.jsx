// src/hooks/usePermissions.jsx - SIMPLIFIED ROLE-BASED PERMISSIONS
import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const PermissionContext = createContext();

// SIMPLE ROLE-BASED PERMISSIONS - Much cleaner!
const createRolePermissions = (userRole = 'guest') => {
    switch (userRole) {
        case 'admin':
            return {
                // Admin can do EVERYTHING
                canCreate: true,
                canEdit: true,
                canDelete: true,
                canViewAll: true,
                canViewKid: () => true,        // Can view any kid
                canViewField: () => true,      // Can view any field
                canEditField: () => true,      // Can edit any field
                role: 'admin'
            };

        case 'parent':
            return {
                // Parent can only see their own kids
                canCreate: false,              // Cannot create new kids
                canEdit: false,                // Cannot edit kids (admins handle this)
                canDelete: false,              // Cannot delete kids
                canViewAll: false,             // Cannot see all kids
                canViewKid: (kid, userId) => kid.parentInfo?.parentId === userId, // Only their own kids
                canViewField: () => true,      // Can see all fields of their own kids
                canEditField: () => false,     // Cannot edit any fields
                role: 'parent'
            };

        case 'instructor':
            return {
                // Instructor can see kids assigned to them
                canCreate: false,              // Cannot create kids
                canEdit: true,                 // Can edit assigned kids
                canDelete: false,              // Cannot delete kids
                canViewAll: false,             // Cannot see all kids
                canViewKid: (kid, userData) => kid.instructorId === userData?.instructorId, // Only assigned kids
                canViewField: () => true,      // Can see all fields of assigned kids
                canEditField: () => true,      // Can edit assigned kids
                role: 'instructor'
            };

        case 'guest':
        default:
            return {
                // Guest has very limited access
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canViewAll: false,
                canViewKid: () => false,       // Cannot view any kids
                canViewField: () => false,     // Cannot view any fields
                canEditField: () => false,     // Cannot edit anything
                role: 'guest'
            };
    }
};

export const PermissionProvider = ({ children }) => {
    const authContext = useAuth();
    const { user, userRole, loading: authLoading } = authContext;

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

            if (!user) {
                console.log('No user - setting guest permissions');
                setPermissions(createRolePermissions('guest'));
                setUserData(null);
            } else {
                console.log('Loading user data for:', user.uid);

                // Try to get user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        const role = data.role || userRole || 'admin';
                        setPermissions(createRolePermissions(role));
                        console.log('✅ User permissions set for role:', role);
                    } else {
                        // No user doc - default to admin for development
                        const defaultData = { role: userRole || 'admin' };
                        setUserData(defaultData);
                        setPermissions(createRolePermissions(userRole || 'admin'));
                        console.log('✅ Default admin permissions set');
                    }
                } catch (firestoreError) {
                    // Firestore error - fall back to auth role
                    console.warn('Firestore error, using auth role:', firestoreError);
                    const fallbackData = { role: userRole || 'admin' };
                    setUserData(fallbackData);
                    setPermissions(createRolePermissions(userRole || 'admin'));
                }
            }
        } catch (error) {
            console.error('Error in loadUserData:', error);
            setError(error.message);
            // Even on error, provide some permissions
            const fallbackData = { role: userRole || 'admin' };
            setUserData(fallbackData);
            setPermissions(createRolePermissions(userRole || 'admin'));
        } finally {
            setLoading(false);
            setHasInitialized(true);
        }
    }, [user, userRole, authLoading, hasInitialized]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const contextValue = {
        permissions: permissions || createRolePermissions('guest'),
        userRole: userData?.role || userRole || 'guest',
        userData,
        user,
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
        console.warn('usePermissions used outside provider - returning admin fallback');
        return {
            permissions: createRolePermissions('admin'),
            userRole: 'admin',
            userData: { role: 'admin' },
            user: null,
            loading: false,
            error: 'Used outside provider'
        };
    }

    if (!context.permissions) {
        return {
            ...context,
            permissions: createRolePermissions(context.userRole || 'guest')
        };
    }

    return context;
};

// UTILITY FUNCTIONS for easy permission checking
export const canUserAccessKid = (userRole, kid, userData, user) => {
    switch (userRole) {
        case 'admin':
            return true; // Admin can access any kid

        case 'parent':
            return kid.parentInfo?.parentId === user?.uid; // Only their own kids

        case 'instructor':
            return kid.instructorId === userData?.instructorId; // Only assigned kids

        case 'guest':
        default:
            return false; // No access
    }
};

export const canUserEditKid = (userRole, kid, userData, user) => {
    switch (userRole) {
        case 'admin':
            return true; // Admin can edit any kid

        case 'instructor':
            return kid.instructorId === userData?.instructorId; // Only assigned kids

        case 'parent':
        case 'guest':
        default:
            return false; // No editing
    }
};