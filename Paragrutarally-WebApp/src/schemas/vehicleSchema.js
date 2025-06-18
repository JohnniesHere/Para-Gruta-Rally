// src/schemas/vehicleSchema.js
import { z } from 'zod';

export const vehicleSchema = z.object({
    // Basic vehicle information
    make: z.string()
        .min(1, 'Vehicle make is required')
        .max(50, 'Make must be less than 50 characters')
        .trim(),

    model: z.string()
        .min(1, 'Vehicle model is required')
        .max(50, 'Model must be less than 50 characters')
        .trim(),

    licensePlate: z.string()
        .min(1, 'License plate is required')
        .max(20, 'License plate must be less than 20 characters')
        .trim()
        .transform(val => val.toUpperCase()), // Always uppercase for consistency

    // Team assignment (optional - vehicles can be unassigned/idle)
    teamId: z.string()
        .optional()
        .nullable(),

    // Technical specifications (optional fields)
    driveType: z.string()
        .optional()
        .nullable(),

    steeringType: z.string()
        .optional()
        .nullable(),

    batteryType: z.string()
        .optional()
        .nullable(),

    batteryDate: z.string()
        .optional()
        .nullable()
        .refine(
            (val) => !val || !isNaN(Date.parse(val)),
            'Invalid battery date format'
        ),

    // Current assignment
    currentKidId: z.string()
        .optional()
        .nullable(),

    // History and tracking (no validation on array items)
    history: z.array(z.string())
        .default([]),

    // Notes and modifications
    modifications: z.string()
        .optional()
        .nullable(),

    notes: z.string()
        .optional()
        .nullable(),

    // Photo
    photo: z.string()
        .url('Invalid photo URL')
        .optional()
        .nullable()
        .or(z.literal('')), // Allow empty string

    // Status
    active: z.boolean()
        .default(true),

    // Timestamps (handled by Firestore)
    createdAt: z.any().optional(),
    updatedAt: z.any().optional()
});

// Schema for creating new vehicles (excludes timestamps)
export const createVehicleSchema = vehicleSchema.omit({
    createdAt: true,
    updatedAt: true
});

// Schema for updating vehicles (all fields optional except basic required ones)
export const updateVehicleSchema = vehicleSchema.partial().extend({
    make: z.string().min(1, 'Vehicle make is required').trim(),
    model: z.string().min(1, 'Vehicle model is required').trim(),
    licensePlate: z.string()
        .min(1, 'License plate is required')
        .transform(val => val.toUpperCase())
});

// Function to validate vehicle data
export const validateVehicle = (data, isUpdate = false) => {
    try {
        const schema = isUpdate ? updateVehicleSchema : createVehicleSchema;
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
export const formatVehicleValidationErrors = (errors) => {
    const formattedErrors = {};

    errors.forEach(error => {
        const field = error.path[0];
        formattedErrors[field] = error.message;
    });

    return formattedErrors;
};

// Function to check license plate uniqueness
export const checkLicensePlateUniqueness = async (licensePlate, excludeVehicleId = null) => {
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');

        const normalizedPlate = licensePlate.toUpperCase().trim();

        let vehiclesQuery = query(
            collection(db, 'vehicles'),
            where('licensePlate', '==', normalizedPlate)
        );

        const querySnapshot = await getDocs(vehiclesQuery);

        // If we're updating a vehicle, exclude it from the check
        if (excludeVehicleId) {
            const existingVehicles = querySnapshot.docs.filter(doc => doc.id !== excludeVehicleId);
            return existingVehicles.length === 0;
        }

        return querySnapshot.empty;
    } catch (error) {
        console.error('Error checking license plate uniqueness:', error);
        throw new Error('Failed to validate license plate uniqueness');
    }
};