// src/hooks/usePermissions.jsx
import { useState, useEffect, useContext, createContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext'; // Updated to use your contexts path

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const { user, userRole, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user || authLoading) {
                setPermissions(null);
                setUserData(null);
                setLoading(authLoading);
                return;
            }

            try {
                // Get full user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setPermissions(new PermissionService(user, data));
                }
            } catch (error) {
                console.error('Error loading user data for permissions:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [user, userRole, authLoading]);

    return (
        <PermissionContext.Provider value={{
            permissions,
            userRole,
            userData,
            user,
            loading: loading || authLoading
        }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within PermissionProvider');
    }
    return context;
};

class PermissionService {
    constructor(user, userData) {
        this.user = user;
        this.userData = userData;
        this.userRole = userData.role;
    }

    // Check if user can view specific field
    canView(field, context = {}) {
        const { kidData, vehicleData } = context;

        switch (this.userRole) {
            case 'admin':
                return true; // Admins see everything

            case 'parent':
                if (!kidData || kidData.parentInfo?.parentId !== this.user.uid) {
                    return false; // Can only see own kids
                }

                // Fields parents CAN see (adapted to your existing structure)
                const parentCanView = [
                    'participantNumber', 'firstName', 'lastName', 'fullName',
                    'personalInfo.address', 'address', 'personalInfo.dateOfBirth',
                    'dateOfBirth', 'personalInfo.capabilities', 'personalInfo.announcersNotes',
                    'personalInfo.photo', 'parentInfo.name', 'guardianName',
                    'parentInfo.email', 'email', 'parentInfo.phone', 'contactNumber',
                    'parentInfo.grandparentsInfo', 'comments.parent', 'notes',
                    'signedDeclaration', 'signedFormStatus',
                    // Vehicle fields parents can see
                    'vehicle.make', 'vehicle.model', 'vehicle.licensePlate', 'vehicle.photo'
                ];

                // Fields parents CANNOT see (red fields from Hebrew document)
                const parentCannotView = [
                    'comments.organization', 'comments.teamLeader', 'comments.familyContact',
                    'instructorComments', 'medicalNotes', 'emergencyContact', 'emergencyPhone',
                    'vehicle.batteryType', 'vehicle.batteryDate', 'vehicle.driveType',
                    'vehicle.steeringType', 'vehicle.notes', 'vehicle.modifications'
                ];

                if (parentCannotView.includes(field)) return false;
                return parentCanView.some(pattern =>
                    field.startsWith(pattern.replace('.*', '')) || field === pattern
                );

            case 'instructor':
                if (!kidData || kidData.instructorId !== this.userData.instructorId) {
                    return false; // Can only see assigned kids (1-15)
                }
                return true; // Instructors see all fields for their kids

            case 'guest':
                // Guests only see specific fields for event participants
                const guestCanView = [
                    'firstName', 'lastName', 'personalInfo.address', 'address',
                    'personalInfo.capabilities', 'personalInfo.announcersNotes',
                    'parentInfo.name', 'guardianName', 'parentInfo.phone', 'contactNumber',
                    'vehicle.make', 'vehicle.model', 'participantNumber'
                ];

                const guestCannotView = [
                    'parentInfo.email', 'email', 'comments.parent', 'comments.familyContact',
                    'parentInfo.grandparentsInfo', 'signedDeclaration', 'emergencyContact',
                    'emergencyPhone'
                ];

                if (guestCannotView.includes(field)) return false;
                return guestCanView.includes(field);

            default:
                return false;
        }
    }

    // Check if user can edit specific field
    canEdit(field, context = {}) {
        const { kidData, vehicleData } = context;

        switch (this.userRole) {
            case 'admin':
                return true; // Admins can edit everything

            case 'parent':
                if (!kidData || kidData.parentInfo?.parentId !== this.user.uid) {
                    return false;
                }
                // Parents can only edit purple fields from Hebrew document
                return [
                    'comments.parent', 'notes', 'personalInfo.photo',
                    'parentInfo.phone', 'contactNumber', 'parentInfo.grandparentsInfo.names',
                    'parentInfo.grandparentsInfo.phone'
                ].includes(field);

            case 'instructor':
                if (!kidData || kidData.instructorId !== this.userData.instructorId) {
                    return false;
                }
                // Instructors can edit purple fields for their kids
                return [
                    'comments.teamLeader', 'instructorComments', 'medicalNotes',
                    // Vehicle technical specs
                    'vehicle.batteryType', 'vehicle.batteryDate', 'vehicle.driveType',
                    'vehicle.steeringType', 'vehicle.notes', 'vehicle.modifications'
                ].includes(field);

            case 'guest':
                // Guests can edit organization comments only
                return ['comments.organization'].includes(field);

            default:
                return false;
        }
    }

    // Check if user can view this specific kid at all
    canViewKid(kidData) {
        switch (this.userRole) {
            case 'admin':
                return true;
            case 'parent':
                return kidData.parentInfo?.parentId === this.user.uid;
            case 'instructor':
                return kidData.instructorId === this.userData.instructorId;
            case 'guest':
                // For guests, we'd need to check event participation
                // This would require additional logic to check eventParticipants collection
                return true; // Simplified for now
            default:
                return false;
        }
    }

    // Filter entire data object based on permissions
    filterData(data, type = 'kid') {
        if (this.userRole === 'admin') return data;

        const filtered = { ...data };

        // Get all possible fields for this data type
        const fieldsToCheck = type === 'kid' ? this.getKidFields() : this.getVehicleFields();

        fieldsToCheck.forEach(field => {
            if (!this.canView(field, { kidData: data, vehicleData: data })) {
                this.removeNestedField(filtered, field);
            }
        });

        return filtered;
    }

    getKidFields() {
        return [
            'participantNumber', 'personalInfo.address', 'personalInfo.dateOfBirth',
            'personalInfo.capabilities', 'personalInfo.announcersNotes', 'personalInfo.photo',
            'parentInfo.name', 'parentInfo.email', 'parentInfo.phone',
            'parentInfo.grandparentsInfo', 'comments.parent', 'comments.organization',
            'comments.teamLeader', 'comments.familyContact', 'instructorComments',
            'signedDeclaration', 'signedFormStatus'
        ];
    }

    getVehicleFields() {
        return [
            'make', 'model', 'licensePlate', 'batteryType', 'batteryDate',
            'driveType', 'steeringType', 'photo', 'notes', 'modifications'
        ];
    }

    removeNestedField(obj, path) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return;
            current = current[keys[i]];
        }

        delete current[keys[keys.length - 1]];
    }
}