// src/services/vehicleService.js - Updated for Team-based Assignment
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
    validateVehicle,
    formatVehicleValidationErrors,
    checkLicensePlateUniqueness
} from '../schemas/vehicleSchema';

const VEHICLES_COLLECTION = 'vehicles';

/**
 * Get all vehicles (Admin only)
 */
export const getAllVehicles = async () => {
    try {
        // Simple query without ordering to avoid index issues
        const vehiclesRef = collection(db, VEHICLES_COLLECTION);
        const snapshot = await getDocs(vehiclesRef);

        if (snapshot.empty) {
            return [];
        }

        const vehicles = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || null)
            };
        });

        // Sort in JavaScript instead of Firestore to avoid index requirements
        vehicles.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA; // Descending order (newest first)
        });

        return vehicles;
    } catch (error) {
        console.error('❌ Error fetching all vehicles:', error);

        // Handle specific error cases
        if (error.code === 'failed-precondition') {
            return [];
        }

        if (error.code === 'permission-denied') {
            throw new Error('Permission denied: Please check your authentication and Firestore rules');
        }

        // For other errors, return empty array to prevent app crash
        return [];
    }
};

/**
 * Get vehicles by team (Team Leaders and for team management)
 */
export const getVehiclesByTeam = async (teamId) => {
    try {
        const vehiclesRef = collection(db, VEHICLES_COLLECTION);
        const vehiclesQuery = query(vehiclesRef, where('teamId', '==', teamId));
        const snapshot = await getDocs(vehiclesQuery);

        if (snapshot.empty) {
            return [];
        }

        const vehicles = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || null)
            };
        });

        // Sort in JavaScript
        vehicles.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        return vehicles;
    } catch (error) {
        console.error('❌ Error fetching vehicles by team:', error);
        return [];
    }
};

/**
 * Get vehicles assigned to specific kids (Parents - now gets vehicles through team)
 * UPDATED: Gets vehicles by looking up kid's team, then team's vehicles
 */
export const getVehiclesByKids = async (kidIds) => {
    try {
        if (!kidIds || kidIds.length === 0) {
            return [];
        }

        // Get kids to find their teams
        const kidsPromises = kidIds.map(async (kidId) => {
            try {
                const kidDoc = await getDoc(doc(db, 'kids', kidId));
                return kidDoc.exists() ? { id: kidDoc.id, ...kidDoc.data() } : null;
            } catch (error) {
                console.warn(`⚠️ Error fetching kid ${kidId}:`, error);
                return null;
            }
        });

        const kids = (await Promise.all(kidsPromises)).filter(kid => kid !== null);

        // Get unique team IDs
        const teamIds = [...new Set(kids.map(kid => kid.teamId).filter(teamId => teamId))];

        if (teamIds.length === 0) {
            return [];
        }

        // Get vehicles for these teams
        const vehiclesPromises = teamIds.map(teamId => getVehiclesByTeam(teamId));
        const teamVehicles = await Promise.all(vehiclesPromises);

        // Flatten and deduplicate vehicles
        const allVehicles = teamVehicles.flat();
        const uniqueVehicles = allVehicles.filter((vehicle, index, self) =>
            index === self.findIndex(v => v.id === vehicle.id)
        );

        return uniqueVehicles;
    } catch (error) {
        console.error('Error fetching vehicles by kids:', error);
        throw new Error('Failed to fetch assigned vehicles');
    }
};

/**
 * Get a single vehicle by ID
 */
export const getVehicleById = async (vehicleId) => {
    try {
        const vehicleDoc = await getDoc(doc(db, VEHICLES_COLLECTION, vehicleId));

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const data = vehicleDoc.data();

        return {
            id: vehicleDoc.id,
            ...data,
            // Safe timestamp conversion - handle both Firestore timestamps and existing Date objects
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || null)
        };
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        throw new Error('Failed to fetch vehicle details');
    }
};

/**
 * Create a new vehicle with schema validation
 */
export const addVehicle = async (vehicleData) => {
    try {
        // Step 1: Validate the data against schema
        const validation = validateVehicle(vehicleData, false);
        if (!validation.success) {
            const errors = formatVehicleValidationErrors(validation.errors);
            console.error('❌ Vehicle validation failed:', errors);
            throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
        }

        const validatedData = validation.data;

        // Step 2: Check license plate uniqueness
        const isUnique = await checkLicensePlateUniqueness(validatedData.licensePlate);
        if (!isUnique) {
            throw new Error(`License plate "${validatedData.licensePlate}" is already in use by another vehicle.`);
        }

        // Step 3: Prepare the vehicle document
        const vehicleWithTimestamps = {
            ...validatedData,
            active: validatedData.active !== undefined ? validatedData.active : true,
            currentKidIds: validatedData.currentKidIds || [], // Initialize as empty array
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Step 4: Add to Firestore
        const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), vehicleWithTimestamps);

        // Step 5: If vehicle was assigned to a team, update team's vehicle list
        if (validatedData.teamId) {
            try {
                const { assignVehicleToTeam } = await import('./vehicleAssignmentService');
                await assignVehicleToTeam(docRef.id, validatedData.teamId);
            } catch (teamError) {
                console.warn('⚠️ Failed to assign vehicle to team during creation:', teamError);
                // Don't fail vehicle creation if team assignment fails
            }
        }

        return docRef.id;
    } catch (error) {
        console.error('💥 Error adding vehicle:', error);
        throw new Error(`Failed to create vehicle: ${error.message}`);
    }
};

/**
 * Update an existing vehicle with schema validation
 * UPDATED: Handles team assignment changes
 */
export const updateVehicle = async (vehicleId, updates) => {
    try {
        // Get current vehicle data to compare team assignments
        const currentVehicle = await getVehicleById(vehicleId);

        // Step 1: Validate the update data against schema
        const validation = validateVehicle(updates, true);
        if (!validation.success) {
            const errors = formatVehicleValidationErrors(validation.errors);
            console.error('❌ Vehicle update validation failed:', errors);
            throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
        }

        const validatedData = validation.data;

        // Step 2: Check license plate uniqueness if license plate is being updated
        if (validatedData.licensePlate) {
            const isUnique = await checkLicensePlateUniqueness(validatedData.licensePlate, vehicleId);
            if (!isUnique) {
                throw new Error(`License plate "${validatedData.licensePlate}" is already in use by another vehicle.`);
            }
        }

        // Step 3: Handle team assignment changes
        const oldTeamId = currentVehicle.teamId;
        const newTeamId = validatedData.teamId;

        if (oldTeamId !== newTeamId) {
            try {
                const { assignVehicleToTeam, removeVehicleFromTeam } = await import('./vehicleAssignmentService');

                // Remove from old team if it existed
                if (oldTeamId) {
                    await removeVehicleFromTeam(vehicleId, oldTeamId);
                }

                // Assign to new team if specified
                if (newTeamId) {
                    await assignVehicleToTeam(vehicleId, newTeamId);
                }
            } catch (teamError) {
                console.warn('⚠️ Failed to update team assignment during vehicle update:', teamError);
                // Continue with vehicle update even if team assignment fails
            }
        }

        // Step 4: Prepare the update document
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const updateData = {
            ...validatedData,
            updatedAt: serverTimestamp()
        };

        // Step 5: Update in Firestore
        await updateDoc(vehicleRef, updateData);

        return vehicleId;
    } catch (error) {
        console.error('💥 Error updating vehicle:', error);
        throw new Error(`Failed to update vehicle: ${error.message}`);
    }
};

/**
 * Delete a vehicle (Admin only)
 * UPDATED: Handles team and kid assignment cleanup
 */
export const deleteVehicle = async (vehicleId) => {
    try {
        // Get vehicle data before deletion for cleanup
        const vehicle = await getVehicleById(vehicleId);

        // Clean up team assignment
        if (vehicle.teamId) {
            try {
                const { removeVehicleFromTeam } = await import('./vehicleAssignmentService');
                await removeVehicleFromTeam(vehicleId, vehicle.teamId);
            } catch (teamError) {
                console.warn('⚠️ Failed to clean up team assignment during vehicle deletion:', teamError);
            }
        }

        // Clean up kid assignments
        if (vehicle.currentKidIds && vehicle.currentKidIds.length > 0) {
            try {
                const { resetKidsVehicleAssignments } = await import('./vehicleAssignmentService');
                await resetKidsVehicleAssignments(vehicle.currentKidIds, vehicleId);
            } catch (kidError) {
                console.warn('⚠️ Failed to clean up kid assignments during vehicle deletion:', kidError);
            }
        }

        await deleteDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
        return vehicleId;
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        throw new Error('Failed to delete vehicle');
    }
};

/**
 * Get available vehicles (not assigned to any team)
 */
export const getAvailableVehicles = async () => {
    try {
        const vehiclesQuery = query(
            collection(db, VEHICLES_COLLECTION),
            where('active', '==', true),
            where('teamId', '==', null)
        );

        const snapshot = await getDocs(vehiclesQuery);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || null)
            };
        });
    } catch (error) {
        console.error('Error fetching available vehicles:', error);
        throw new Error('Failed to fetch available vehicles');
    }
};

/**
 * Get vehicles statistics - UPDATED for team-based system
 */
export const getVehicleStats = async (teamId = null) => {
    try {
        let vehicles;
        if (teamId) {
            vehicles = await getVehiclesByTeam(teamId);
        } else {
            vehicles = await getAllVehicles();
        }

        const stats = {
            total: vehicles.length,
            active: vehicles.filter(v => v.active === true).length,
            inactive: vehicles.filter(v => v.active === false).length,
            assigned: vehicles.filter(v => v.teamId && v.active === true).length, // UPDATED: assigned to teams
            available: vehicles.filter(v => !v.teamId && v.active === true).length, // UPDATED: not assigned to any team
            inUse: vehicles.filter(v => v.currentKidIds && v.currentKidIds.length > 0 && v.active === true).length, // UPDATED: being used by kids
            needsMaintenance: vehicles.filter(v => {
                if (!v.batteryDate) return false;
                try {
                    const batteryDate = new Date(v.batteryDate);
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                    return batteryDate < sixMonthsAgo;
                } catch (error) {
                    return false;
                }
            }).length
        };

        return stats;
    } catch (error) {
        console.error('❌ Error calculating vehicle stats:', error);
        // Return default stats to prevent dashboard crash
        return {
            total: 0,
            active: 0,
            inactive: 0,
            assigned: 0,
            available: 0,
            inUse: 0,
            needsMaintenance: 0
        };
    }
};

/**
 * Search vehicles by various criteria
 */
export const searchVehicles = async (searchTerm, filters = {}) => {
    try {
        // Start with all vehicles or filtered by team
        let vehicles = filters.teamId
            ? await getVehiclesByTeam(filters.teamId)
            : await getAllVehicles();

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            vehicles = vehicles.filter(vehicle =>
                vehicle.make?.toLowerCase().includes(term) ||
                vehicle.model?.toLowerCase().includes(term) ||
                vehicle.licensePlate?.toLowerCase().includes(term) ||
                vehicle.notes?.toLowerCase().includes(term)
            );
        }

        // Apply additional filters
        if (filters.active !== undefined) {
            vehicles = vehicles.filter(v => v.active === filters.active);
        }

        if (filters.assigned !== undefined) {
            if (filters.assigned) {
                vehicles = vehicles.filter(v => v.teamId);
            } else {
                vehicles = vehicles.filter(v => !v.teamId);
            }
        }

        if (filters.inUse !== undefined) {
            if (filters.inUse) {
                vehicles = vehicles.filter(v => v.currentKidIds && v.currentKidIds.length > 0);
            } else {
                vehicles = vehicles.filter(v => !v.currentKidIds || v.currentKidIds.length === 0);
            }
        }

        return vehicles;
    } catch (error) {
        console.error('Error searching vehicles:', error);
        throw new Error('Failed to search vehicles');
    }
};