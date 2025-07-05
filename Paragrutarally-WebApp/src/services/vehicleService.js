// src/services/vehicleService.js - Updated for Team-Based Vehicle Assignment
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
 * Get vehicles by team (Team Leaders/Instructors)
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
 * Get vehicles assigned to specific kids (Parents)
 */
export const getVehiclesByKids = async (kidIds) => {
    try {
        if (!kidIds || kidIds.length === 0) {
            return [];
        }

        const vehiclesQuery = query(
            collection(db, VEHICLES_COLLECTION),
            where('currentKidId', 'in', kidIds)
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
            history: validatedData.history || [],
            currentKidId: null, // Always start unassigned to kids
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Step 4: Add to Firestore
        const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), vehicleWithTimestamps);
        return docRef.id;
    } catch (error) {
        console.error('💥 Error adding vehicle:', error);
        throw new Error(`Failed to create vehicle: ${error.message}`);
    }
};

/**
 * Update an existing vehicle with schema validation
 */
export const updateVehicle = async (vehicleId, updates) => {
    try {
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

        // Step 3: Prepare the update document
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const updateData = {
            ...validatedData,
            updatedAt: serverTimestamp()
        };

        // Step 4: Update in Firestore
        await updateDoc(vehicleRef, updateData);

        return vehicleId;
    } catch (error) {
        console.error('💥 Error updating vehicle:', error);
        throw new Error(`Failed to update vehicle: ${error.message}`);
    }
};

/**
 * Assign vehicle to a team (Admin function)
 * UPDATED: Now uses team-based assignment
 */
export const assignVehicleToTeam = async (vehicleId, teamId) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        await updateDoc(vehicleRef, {
            teamId: teamId,
            currentKidId: null, // Clear any kid assignment when reassigning teams
            updatedAt: serverTimestamp()
        });

        return vehicleId;
    } catch (error) {
        console.error('Error assigning vehicle to team:', error);
        throw new Error('Failed to assign vehicle to team');
    }
};

/**
 * Assign vehicle to a kid within a team (Instructor function)
 * UPDATED: Now requires team verification
 */
export const assignVehicleToKidInTeam = async (vehicleId, kidId, teamId) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Verify vehicle belongs to the team
        if (vehicleData.teamId !== teamId) {
            throw new Error('Vehicle is not assigned to your team');
        }

        await updateDoc(vehicleRef, {
            currentKidId: kidId,
            updatedAt: serverTimestamp()
        });

        return vehicleId;
    } catch (error) {
        console.error('Error assigning vehicle to kid:', error);
        throw new Error('Failed to assign vehicle to kid');
    }
};

/**
 * Unassign vehicle from current kid (Instructor function)
 * UPDATED: Keeps team assignment
 */
export const unassignVehicleFromKid = async (vehicleId, teamId) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Verify vehicle belongs to the team
        if (vehicleData.teamId !== teamId) {
            throw new Error('Vehicle is not assigned to your team');
        }

        await updateDoc(vehicleRef, {
            currentKidId: null,
            updatedAt: serverTimestamp()
        });

        return vehicleId;
    } catch (error) {
        console.error('Error unassigning vehicle from kid:', error);
        throw new Error('Failed to unassign vehicle from kid');
    }
};

/**
 * Unassign vehicle from team (Admin function)
 * UPDATED: Clears both team and kid assignments
 */
export const unassignVehicleFromTeam = async (vehicleId) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        await updateDoc(vehicleRef, {
            teamId: null,
            currentKidId: null,
            updatedAt: serverTimestamp()
        });

        return vehicleId;
    } catch (error) {
        console.error('Error unassigning vehicle from team:', error);
        throw new Error('Failed to unassign vehicle from team');
    }
};

/**
 * Delete a vehicle (Admin only)
 */
export const deleteVehicle = async (vehicleId) => {
    try {
        await deleteDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
        return vehicleId;
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        throw new Error('Failed to delete vehicle');
    }
};

/**
 * Get available vehicles for team assignment (Admin function)
 * UPDATED: Returns vehicles not assigned to any team
 */
export const getAvailableVehiclesForTeams = async () => {
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
        console.error('Error fetching available vehicles for teams:', error);
        throw new Error('Failed to fetch available vehicles for teams');
    }
};

/**
 * Get available vehicles within a team for kid assignment (Instructor function)
 * UPDATED: Returns team vehicles not assigned to any kid
 */
export const getAvailableVehiclesInTeam = async (teamId) => {
    try {
        const vehiclesQuery = query(
            collection(db, VEHICLES_COLLECTION),
            where('active', '==', true),
            where('teamId', '==', teamId),
            where('currentKidId', '==', null)
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
        console.error('Error fetching available vehicles in team:', error);
        throw new Error('Failed to fetch available vehicles in team');
    }
};

/**
 * Get vehicle history (kids who used this vehicle)
 */
export const getVehicleHistory = async (vehicleId) => {
    try {
        const vehicle = await getVehicleById(vehicleId);
        return vehicle.history || [];
    } catch (error) {
        console.error('Error fetching vehicle history:', error);
        throw new Error('Failed to fetch vehicle history');
    }
};

/**
 * Update vehicle battery information
 */
export const updateVehicleBattery = async (vehicleId, batteryType, batteryDate) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);

        await updateDoc(vehicleRef, {
            batteryType,
            batteryDate,
            updatedAt: serverTimestamp()
        });

        return vehicleId;
    } catch (error) {
        console.error('Error updating vehicle battery:', error);
        throw new Error('Failed to update battery information');
    }
};

/**
 * Get vehicles statistics
 * UPDATED: Now includes team-based statistics
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
            assignedToTeams: vehicles.filter(v => v.teamId && v.active === true).length,
            unassignedToTeams: vehicles.filter(v => !v.teamId && v.active === true).length,
            inUseByKids: vehicles.filter(v => v.currentKidId && v.active === true).length,
            availableInTeams: vehicles.filter(v => v.teamId && !v.currentKidId && v.active === true).length,
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
            assignedToTeams: 0,
            unassignedToTeams: 0,
            inUseByKids: 0,
            availableInTeams: 0,
            needsMaintenance: 0
        };
    }
};

/**
 * Search vehicles by various criteria
 * UPDATED: Now includes team-based filtering
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

        if (filters.assignedToTeam !== undefined) {
            if (filters.assignedToTeam) {
                vehicles = vehicles.filter(v => v.teamId);
            } else {
                vehicles = vehicles.filter(v => !v.teamId);
            }
        }

        if (filters.assignedToKid !== undefined) {
            if (filters.assignedToKid) {
                vehicles = vehicles.filter(v => v.currentKidId);
            } else {
                vehicles = vehicles.filter(v => !v.currentKidId);
            }
        }

        return vehicles;
    } catch (error) {
        console.error('Error searching vehicles:', error);
        throw new Error('Failed to search vehicles');
    }
};

// DEPRECATED FUNCTIONS - Kept for backward compatibility but will show warnings

/**
 * @deprecated Use assignVehicleToTeam instead
 */
export const assignVehicleToKid = async (vehicleId, kidId) => {
    console.warn('⚠️ assignVehicleToKid is deprecated. Use assignVehicleToTeam and assignVehicleToKidInTeam instead.');
    throw new Error('Direct kid assignment is no longer supported. Vehicles must be assigned to teams first.');
};

/**
 * @deprecated Use unassignVehicleFromKid or unassignVehicleFromTeam instead
 */
export const unassignVehicle = async (vehicleId) => {
    console.warn('⚠️ unassignVehicle is deprecated. Use unassignVehicleFromKid or unassignVehicleFromTeam instead.');
    throw new Error('Generic vehicle unassignment is no longer supported. Use specific team-based unassignment.');
};

/**
 * @deprecated Use getAvailableVehiclesForTeams or getAvailableVehiclesInTeam instead
 */
export const getAvailableVehicles = async (teamId = null) => {
    console.warn('⚠️ getAvailableVehicles is deprecated. Use getAvailableVehiclesForTeams or getAvailableVehiclesInTeam instead.');
    if (teamId) {
        return getAvailableVehiclesInTeam(teamId);
    } else {
        return getAvailableVehiclesForTeams();
    }
};

// Export all functions
export default {
    // Core CRUD operations
    getAllVehicles,
    getVehicleById,
    addVehicle,
    updateVehicle,
    deleteVehicle,

    // Team-based assignment (NEW)
    getVehiclesByTeam,
    assignVehicleToTeam,
    unassignVehicleFromTeam,
    getAvailableVehiclesForTeams,

    // Kid assignment within teams (UPDATED)
    assignVehicleToKidInTeam,
    unassignVehicleFromKid,
    getAvailableVehiclesInTeam,

    // Parent view (unchanged)
    getVehiclesByKids,

    // Utility functions
    getVehicleHistory,
    updateVehicleBattery,
    getVehicleStats,
    searchVehicles,

    // Deprecated functions (for backward compatibility)
    assignVehicleToKid,
    unassignVehicle,
    getAvailableVehicles
};