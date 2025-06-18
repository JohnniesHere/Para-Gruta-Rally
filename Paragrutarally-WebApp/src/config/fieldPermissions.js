// src/config/fieldPermissions.js - Field-Level Permissions Based on Hebrew Document

export const FIELD_PERMISSIONS = {
    admin: {
        // Admins can see and edit most fields
        visible: [
            'participantNumber',
            'personalInfo.firstName',
            'personalInfo.lastName',
            'personalInfo.dateOfBirth',
            'personalInfo.address',
            'personalInfo.capabilities',
            'personalInfo.announcersNotes',
            'personalInfo.photo',
            'parentInfo.name',
            'parentInfo.email',
            'parentInfo.phone',
            'parentInfo.parentId',
            'parentInfo.grandparentsInfo.names',
            'parentInfo.grandparentsInfo.phone',
            'teamId',
            'instructorId',
            'vehicleIds',
            'signedDeclaration',
            'signedFormStatus',
            'additionalComments',
            'comments.organization',
            'comments.teamLeader',
            'comments.parent',
            'comments.familyContact',
            'createdAt',
            'updatedAt'
        ],
        editable: [
            'participantNumber',
            'personalInfo.address',
            'personalInfo.capabilities',
            'personalInfo.announcersNotes',
            'personalInfo.photo',
            'parentInfo.name',
            'parentInfo.phone',
            'parentInfo.parentId',
            'parentInfo.grandparentsInfo.names',
            'parentInfo.grandparentsInfo.phone',
            'teamId',
            'instructorId',
            'vehicleIds',
            'signedDeclaration',
            'signedFormStatus',
            'additionalComments',
            'comments.organization'
        ],
        hidden: [] // Admins can see everything
    },

    instructor: {
        // Team leaders can see kids assigned to them, edit purple fields
        visible: [
            'participantNumber',
            'personalInfo.firstName',
            'personalInfo.lastName',
            'personalInfo.dateOfBirth',
            'personalInfo.capabilities',
            'personalInfo.announcersNotes',
            'parentInfo.name',
            'parentInfo.phone', // Can see parent contact for their kids
            'teamId',
            'instructorId',
            'vehicleIds',
            'signedFormStatus',
            'additionalComments',
            'comments.teamLeader',
            'comments.organization',
            'instructorsComments'
        ],
        editable: [
            'personalInfo.capabilities',
            'personalInfo.announcersNotes',
            'comments.teamLeader',
            'instructorsComments',
            'vehicleIds'
        ],
        hidden: [
            'parentInfo.email', // Red field - hidden from instructors
            'parentInfo.parentId',
            'parentInfo.grandparentsInfo',
            'comments.parent',
            'comments.familyContact',
            'personalInfo.address' // Restricted access
        ]
    },

    parent: {
        // Parents can see ALL details of their own kids only
        visible: [
            'participantNumber',
            'personalInfo.firstName',
            'personalInfo.lastName',
            'personalInfo.dateOfBirth',
            'personalInfo.address',
            'personalInfo.capabilities',
            'personalInfo.announcersNotes',
            'personalInfo.photo',
            'parentInfo.name',
            'parentInfo.email',
            'parentInfo.phone',
            'parentInfo.grandparentsInfo.names',
            'parentInfo.grandparentsInfo.phone',
            'teamId',
            'signedDeclaration',
            'signedFormStatus',
            'additionalComments',
            'comments.parent'
        ],
        editable: [
            'comments.parent' // Parents can only edit their own comments
        ],
        hidden: [
            'parentInfo.parentId', // System field
            'comments.organization', // Red field for parents
            'comments.teamLeader',   // Red field for parents
            'comments.familyContact', // Red field for parents
            'instructorId',
            'instructorsComments'
        ]
    },

    guest: {
        // Temporary guests (kibbutz hosts) - can see only kids registered for events
        visible: [
            'participantNumber',
            'personalInfo.firstName',
            'personalInfo.lastName',
            'personalInfo.capabilities',
            'personalInfo.announcersNotes',
            'teamId',
            'signedFormStatus',
            'additionalComments',
            'comments.organization'
        ],
        editable: [
            'comments.organization' // Guests can edit organization comments
        ],
        hidden: [
            'personalInfo.dateOfBirth', // Red field for guests
            'personalInfo.address',     // Red field for guests
            'personalInfo.photo',       // Red field for guests
            'parentInfo',              // Red field - all parent info hidden
            'instructorId',
            'vehicleIds',
            'signedDeclaration',
            'comments.parent',
            'comments.teamLeader',
            'comments.familyContact',
            'instructorsComments'
        ]
    }
};

// Utility functions for permission checking
export const canViewField = (userRole, fieldPath) => {
    const permissions = FIELD_PERMISSIONS[userRole] || FIELD_PERMISSIONS.guest;

    // Check if field is explicitly hidden
    if (permissions.hidden.includes(fieldPath)) {
        return false;
    }

    // Check if field is in visible list
    return permissions.visible.includes(fieldPath);
};

export const canEditField = (userRole, fieldPath) => {
    const permissions = FIELD_PERMISSIONS[userRole] || FIELD_PERMISSIONS.guest;
    return permissions.editable.includes(fieldPath);
};

export const getVisibleFields = (userRole) => {
    const permissions = FIELD_PERMISSIONS[userRole] || FIELD_PERMISSIONS.guest;
    return permissions.visible;
};

export const getEditableFields = (userRole) => {
    const permissions = FIELD_PERMISSIONS[userRole] || FIELD_PERMISSIONS.guest;
    return permissions.editable;
};

export const getHiddenFields = (userRole) => {
    const permissions = FIELD_PERMISSIONS[userRole] || FIELD_PERMISSIONS.guest;
    return permissions.hidden;
};