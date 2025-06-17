// src/schemas/kidSchema.js
import { Timestamp } from 'firebase/firestore';

/**
 * Kid Schema Definition
 * Based on the Firestore structure and AddKidPage form
 */

// Default/empty kid object
export const createEmptyKid = () => ({
    // Basic identifiers
    participantNumber: '',

    // Personal Information
    personalInfo: {
        firstName: '',
        lastName: '',
        address: '',
        dateOfBirth: '', // ISO date string (YYYY-MM-DD)
        capabilities: '',
        announcersNotes: '',
        photo: '' // URL or base64 string
    },

    // Parent/Guardian Information
    parentInfo: {
        name: '',
        email: '',
        phone: '',
        parentId: '', // Reference to parent user document
        grandparentsInfo: {
            names: '',
            phone: ''
        }
    },

    // Comments from different roles
    comments: {
        parent: '',
        organization: '',
        teamLeader: '',
        familyContact: ''
    },

    // Assignments
    instructorId: '', // Reference to instructor document
    teamId: '', // Reference to team document
    vehicleIds: [], // Array of vehicle document references

    // Status and Forms
    signedDeclaration: false,
    signedFormStatus: 'pending', // 'pending', 'completed', 'needs_review', 'cancelled'

    // Additional Information
    additionalComments: '',

    // Instructor Comments (from Firestore structure)
    instructorsComments: [],

    // Timestamps (auto-generated)
    createdAt: null,
    updatedAt: null
});

// Validation rules
export const kidValidationRules = {
    required: [
        'participantNumber',
        'personalInfo.firstName',
        'personalInfo.lastName',
        'personalInfo.dateOfBirth',
        'parentInfo.name',
        'parentInfo.email',
        'parentInfo.phone'
    ],

    email: [
        'parentInfo.email'
    ],

    phone: [
        'parentInfo.phone',
        'parentInfo.grandparentsInfo.phone'
    ],

    date: [
        'personalInfo.dateOfBirth'
    ],

    maxLength: {
        'personalInfo.firstName': 50,
        'personalInfo.lastName': 50,
        'personalInfo.address': 200,
        'personalInfo.capabilities': 500,
        'personalInfo.announcersNotes': 500,
        'parentInfo.name': 100,
        'parentInfo.email': 100,
        'parentInfo.phone': 20,
        'parentInfo.grandparentsInfo.names': 200,
        'parentInfo.grandparentsInfo.phone': 20,
        'additionalComments': 1000
    }
};

// Form status options
export const formStatusOptions = [
    { value: 'pending', label: '⏳ Pending - Getting Ready', color: '#F59E0B' },
    { value: 'completed', label: '✅ Completed - Ready to Race!', color: '#10B981' },
    { value: 'needs_review', label: '🔍 Needs Review', color: '#EF4444' },
    { value: 'cancelled', label: '❌ Cancelled', color: '#6B7280' }
];

/**
 * Validate a kid object against the schema
 * @param {Object} kidData - The kid data to validate
 * @returns {Object} - { isValid: boolean, errors: {} }
 */
export const validateKid = (kidData) => {
    const errors = {};

    // Helper function to get nested value
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    // Check required fields
    kidValidationRules.required.forEach(field => {
        const value = getNestedValue(kidData, field);
        if (!value || (typeof value === 'string' && !value.trim())) {
            errors[field] = `${field.split('.').pop()} is required`;
        }
    });

    // Validate email format
    kidValidationRules.email.forEach(field => {
        const value = getNestedValue(kidData, field);
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field] = 'Please enter a valid email address';
        }
    });

    // Validate phone format (basic)
    kidValidationRules.phone.forEach(field => {
        const value = getNestedValue(kidData, field);
        if (value && value.length > 0 && !/^[+]?[\d\s\-\(\)]{7,20}$/.test(value)) {
            errors[field] = 'Please enter a valid phone number';
        }
    });

    // Validate date of birth
    if (kidData.personalInfo?.dateOfBirth) {
        const birthDate = new Date(kidData.personalInfo.dateOfBirth);
        const today = new Date();
        if (birthDate >= today) {
            errors['personalInfo.dateOfBirth'] = 'Date of birth must be in the past';
        }

        // Check if child is not too old (e.g., under 18)
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age > 18) {
            errors['personalInfo.dateOfBirth'] = 'Participant must be under 18 years old';
        }
    }

    // Validate max lengths
    Object.entries(kidValidationRules.maxLength).forEach(([field, maxLength]) => {
        const value = getNestedValue(kidData, field);
        if (value && value.length > maxLength) {
            errors[field] = `Must be ${maxLength} characters or less`;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Prepare kid data for Firestore (add timestamps, clean up)
 * @param {Object} kidData - The kid data to prepare
 * @param {boolean} isUpdate - Whether this is an update (preserve createdAt)
 * @returns {Object} - Cleaned kid data ready for Firestore
 */
export const prepareKidForFirestore = (kidData, isUpdate = false) => {
    const cleanData = { ...kidData };

    // Add/update timestamps
    if (!isUpdate) {
        cleanData.createdAt = Timestamp.now();
    }
    cleanData.updatedAt = Timestamp.now();

    // Convert date string to proper format if needed
    if (cleanData.personalInfo?.dateOfBirth) {
        // Keep as string for now, but ensure it's in ISO format
        const date = new Date(cleanData.personalInfo.dateOfBirth);
        if (!isNaN(date.getTime())) {
            cleanData.personalInfo.dateOfBirth = date.toISOString().split('T')[0];
        }
    }

    // Clean up empty strings and null values
    const cleanObject = (obj) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) {
                continue;
            }
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
                const cleanedNested = cleanObject(value);
                if (Object.keys(cleanedNested).length > 0) {
                    cleaned[key] = cleanedNested;
                }
            } else if (value !== '') {
                cleaned[key] = value;
            }
        }
        return cleaned;
    };

    return cleanObject(cleanData);
};

/**
 * Convert Firestore document to kid object
 * @param {Object} doc - Firestore document
 * @returns {Object} - Kid object with proper data types
 */
export const convertFirestoreToKid = (doc) => {
    const data = doc.data();
    const kid = createEmptyKid();

    // Merge with default structure to ensure all fields exist
    const mergedData = {
        ...kid,
        ...data,
        id: doc.id
    };

    // Convert Firestore Timestamps to Date objects for display
    if (mergedData.createdAt?.toDate) {
        mergedData.createdAt = mergedData.createdAt.toDate();
    }
    if (mergedData.updatedAt?.toDate) {
        mergedData.updatedAt = mergedData.updatedAt.toDate();
    }

    return mergedData;
};

/**
 * Get kid's full name
 * @param {Object} kid - Kid object
 * @returns {string} - Full name
 */
export const getKidFullName = (kid) => {
    const firstName = kid.personalInfo?.firstName || '';
    const lastName = kid.personalInfo?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unnamed Racer';
};

/**
 * Get kid's age from date of birth
 * @param {Object} kid - Kid object
 * @returns {number|null} - Age in years
 */
export const getKidAge = (kid) => {
    if (!kid.personalInfo?.dateOfBirth) return null;

    const birthDate = new Date(kid.personalInfo.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Get form status info
 * @param {string} status - Status value
 * @returns {Object} - Status info with label and color
 */
export const getFormStatusInfo = (status) => {
    return formStatusOptions.find(option => option.value === status) || formStatusOptions[0];
};

// Export the schema for use in forms and validation
export default {
    createEmptyKid,
    validateKid,
    prepareKidForFirestore,
    convertFirestoreToKid,
    getKidFullName,
    getKidAge,
    getFormStatusInfo,
    formStatusOptions,
    kidValidationRules
};