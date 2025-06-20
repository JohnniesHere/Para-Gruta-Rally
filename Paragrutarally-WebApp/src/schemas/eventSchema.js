// src/schemas/eventSchema.js
import { z } from 'zod';

export const eventSchema = z.object({
    // Basic event information
    name: z.string()
        .min(1, 'Event name is required')
        .max(100, 'Event name must be less than 100 characters')
        .trim(),

    description: z.string()
        .min(1, 'Event description is required')
        .max(1000, 'Description must be less than 1000 characters')
        .trim(),

    // Event type/category - UPDATED: Removed practice, workshop
    type: z.enum(['race', 'newcomers', 'social'], {
        errorMap: () => ({ message: 'Invalid event type' })
    }).default('race'),

    // Date and time
    date: z.string()
        .min(1, 'Event date is required')
        .refine(
            (val) => !isNaN(Date.parse(val)),
            'Invalid date format'
        )
        .refine(
            (val) => new Date(val) > new Date(),
            'Event date must be in the future'
        ),

    time: z.string()
        .min(1, 'Event time is required')
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),

    // Location information
    location: z.string()
        .min(1, 'Event location is required')
        .max(100, 'Location must be less than 100 characters')
        .trim(),

    address: z.string()
        .min(1, 'Event address is required')
        .max(200, 'Address must be less than 200 characters')
        .trim(),

    // Organizer information
    organizer: z.string()
        .min(1, 'Organizer name is required')
        .max(100, 'Organizer name must be less than 100 characters')
        .trim(),

    // UPDATED: Teams participating in the event - now array of team IDs
    participatingTeams: z.array(z.string())
        .default([]),

    // REMOVED: attendees field - not needed

    // Event status
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled'], {
        errorMap: () => ({ message: 'Invalid event status' })
    }).default('upcoming'),

    // Media and documentation
    image: z.string()
        .url('Invalid image URL')
        .optional()
        .nullable()
        .or(z.literal('')), // Allow empty string

    // Additional information
    notes: z.string()
        .max(500, 'Notes must be less than 500 characters')
        .optional()
        .nullable()
        .or(z.literal('')), // Allow empty string

    requirements: z.string()
        .max(500, 'Requirements must be less than 500 characters')
        .optional()
        .nullable()
        .or(z.literal('')), // Allow empty string

    // Gallery integration
    hasGalleryFolder: z.boolean()
        .default(false),

    createGalleryFolder: z.boolean()
        .default(true)
        .optional(), // Only used during creation

    // Pricing (optional)
    price: z.number()
        .min(0, 'Price cannot be negative')
        .optional()
        .nullable(),

    currency: z.string()
        .length(3, 'Currency must be 3 characters (e.g., USD, EUR)')
        .optional()
        .nullable(),

    // Registration settings
    registrationOpen: z.boolean()
        .default(true),

    registrationDeadline: z.string()
        .optional()
        .nullable()
        .refine(
            (val) => !val || !isNaN(Date.parse(val)),
            'Invalid registration deadline format'
        ),

    // Contact information
    contactEmail: z.string()
        .email('Invalid email format')
        .optional()
        .nullable()
        .or(z.literal('')),

    contactPhone: z.string()
        .max(20, 'Phone number must be less than 20 characters')
        .optional()
        .nullable()
        .or(z.literal('')),

    // Event visibility and permissions
    isPublic: z.boolean()
        .default(true),

    allowParentRegistration: z.boolean()
        .default(true),

    // Weather considerations
    weatherDependent: z.boolean()
        .default(true),

    backupPlan: z.string()
        .max(300, 'Backup plan must be less than 300 characters')
        .optional()
        .nullable()
        .or(z.literal('')),

    // Timestamps (handled by Firestore)
    createdAt: z.any().optional(),
    updatedAt: z.any().optional()
});

// Schema for creating new events (excludes timestamps)
export const createEventSchema = eventSchema.omit({
    createdAt: true,
    updatedAt: true
}).extend({
    // Allow date validation to be bypassed during editing
    date: z.string()
        .min(1, 'Event date is required')
        .refine(
            (val) => !isNaN(Date.parse(val)),
            'Invalid date format'
        )
});

// Schema for updating events (all fields optional except basic required ones)
export const updateEventSchema = eventSchema.partial().extend({
    name: z.string()
        .min(1, 'Event name is required')
        .max(100, 'Event name must be less than 100 characters')
        .trim(),

    description: z.string()
        .min(1, 'Event description is required')
        .max(1000, 'Description must be less than 1000 characters')
        .trim(),

    location: z.string()
        .min(1, 'Event location is required')
        .max(100, 'Location must be less than 100 characters')
        .trim(),

    organizer: z.string()
        .min(1, 'Organizer name is required')
        .max(100, 'Organizer name must be less than 100 characters')
        .trim(),

    // Do NOT allow past dates for editing
    date: z.string()
        .min(1, 'Event date is required')
        .refine(
            (val) => !isNaN(Date.parse(val)),
            'Invalid date format'
        )
        .refine(
            (val) => new Date(val) > new Date(),
            'Event date must be in the future'
        )
});

// Function to validate event data
export const validateEvent = (data, isUpdate = false) => {
    try {
        const schema = isUpdate ? updateEventSchema : createEventSchema;
        return {
            success: true,
            data: schema.parse(data),
            errors: null
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            errors: error.errors
        };
    }
};

// Function to format validation errors for display
export const formatEventValidationErrors = (errors) => {
    const formattedErrors = {};

    errors.forEach(error => {
        const field = error.path[0];
        formattedErrors[field] = error.message;
    });

    return formattedErrors;
};

// Function to check event name uniqueness (optional - events can have similar names)
export const checkEventNameUniqueness = async (eventName, excludeEventId = null) => {
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');

        const normalizedName = eventName.trim().toLowerCase();

        let eventsQuery = query(
            collection(db, 'events'),
            where('name', '==', eventName.trim())
        );

        const querySnapshot = await getDocs(eventsQuery);

        // If we're updating an event, exclude it from the check
        if (excludeEventId) {
            const existingEvents = querySnapshot.docs.filter(doc => doc.id !== excludeEventId);
            return existingEvents.length === 0;
        }

        return querySnapshot.empty;
    } catch (error) {
        console.error('Error checking event name uniqueness:', error);
        throw new Error('Failed to validate event name uniqueness');
    }
};

// Function to check if event is in the past
export const isEventInPast = (eventDate, eventTime) => {
    try {
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        return eventDateTime < new Date();
    } catch (error) {
        return false;
    }
};

// Function to validate event scheduling conflicts
export const checkEventConflicts = async (date, time, location, excludeEventId = null) => {
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');

        // Check for events on the same date, time, and location
        let eventsQuery = query(
            collection(db, 'events'),
            where('date', '==', date),
            where('time', '==', time),
            where('location', '==', location),
            where('status', 'in', ['upcoming', 'ongoing'])
        );

        const querySnapshot = await getDocs(eventsQuery);

        // If we're updating an event, exclude it from the check
        if (excludeEventId) {
            const conflictingEvents = querySnapshot.docs.filter(doc => doc.id !== excludeEventId);
            return {
                hasConflicts: conflictingEvents.length > 0,
                conflictingEvents: conflictingEvents.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }))
            };
        }

        return {
            hasConflicts: !querySnapshot.empty,
            conflictingEvents: querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }))
        };
    } catch (error) {
        console.error('Error checking event conflicts:', error);
        throw new Error('Failed to check for event scheduling conflicts');
    }
};

// Function to calculate event duration (if end time is added later)
export const calculateEventDuration = (startTime, endTime) => {
    try {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);

        if (end <= start) {
            throw new Error('End time must be after start time');
        }

        const durationMs = end - start;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes, valid: true };
    } catch (error) {
        return { valid: false, message: error.message };
    }
};