// src/services/vehicleService.js - Vehicle Management Service
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

const VEHICLES_COLLECTION = 'vehicles';

/**
 * Get all vehicles (Admin only)
 */
export const getAllVehicles = async () => {
    try {
        const vehiclesQuery = query(
            collection(db, VEHICLES_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(vehiclesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
    } catch (error) {
        console.error('Error fetching all vehicles:', error);
        throw new Error('Failed to fetch vehicles');
    }
};

/**
 * Get vehicles by team (Team Leaders)
 */
export const getVehiclesByTeam = async (teamName) => {
    try {
        const vehiclesQuery = query(
            collection(db, VEHICLES_COLLECTION),
            where('teamName', '==', teamName),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(vehiclesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
    } catch (error) {
        console.error('Error fetching vehicles by team:', error);
        throw new Error('Failed to fetch team vehicles');
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

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
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

        return {
            id: vehicleDoc.id,
            ...vehicleDoc.data(),
            createdAt: vehicleDoc.data().createdAt?.toDate(),
            updatedAt: vehicleDoc.data().updatedAt?.toDate()
        };
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        throw new Error('Failed to fetch vehicle details');
    }
};

/**
 * Create a new vehicle
 */
export const addVehicle = async (vehicleData) => {
    try {
        const vehicleWithTimestamps = {
            ...vehicleData,
            active: vehicleData.active !== undefined ? vehicleData.active : true,
            history: vehicleData.history || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), vehicleWithTimestamps);
        console.log('Vehicle created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding vehicle:', error);
        throw new Error('Failed to create vehicle');
    }
};

/**
 * Update an existing vehicle
 */
export const updateVehicle = async (vehicleId, updates) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        await updateDoc(vehicleRef, updateData);
        console.log('Vehicle updated successfully:', vehicleId);

        return vehicleId;
    } catch (error) {
        console.error('Error updating vehicle:', error);
        throw new Error('Failed to update vehicle');
    }
};

/**
 * Assign vehicle to a kid
 */
export const assignVehicleToKid = async (vehicleId, kidId) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();
        const currentHistory = vehicleData.history || [];

        // Add previous kid to history if there was one
        const updatedHistory = vehicleData.currentKidId
            ? [...currentHistory, vehicleData.currentKidId]
            : currentHistory;

        await updateDoc(vehicleRef, {
            currentKidId: kidId,
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log('Vehicle assigned successfully:', vehicleId, 'to kid:', kidId);
        return vehicleId;
    } catch (error) {
        console.error('Error assigning vehicle:', error);
        throw new Error('Failed to assign vehicle');
    }
};

/**
 * Unassign vehicle from current kid
 */
export const unassignVehicle = async (vehicleId) => {
    try {
        const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();
        const currentHistory = vehicleData.history || [];

        // Add current kid to history
        const updatedHistory = vehicleData.currentKidId
            ? [...currentHistory, vehicleData.currentKidId]
            : currentHistory;

        await updateDoc(vehicleRef, {
            currentKidId: null,
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log('Vehicle unassigned successfully:', vehicleId);
        return vehicleId;
    } catch (error) {
        console.error('Error unassigning vehicle:', error);
        throw new Error('Failed to unassign vehicle');
    }
};

/**
 * Delete a vehicle (Admin only)
 */
export const deleteVehicle = async (vehicleId) => {
    try {
        await deleteDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
        console.log('Vehicle deleted successfully:', vehicleId);
        return vehicleId;
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        throw new Error('Failed to delete vehicle');
    }
};

/**
 * Get available vehicles (not assigned to any kid)
 */
export const getAvailableVehicles = async (teamName = null) => {
    try {
        let vehiclesQuery;

        if (teamName) {
            vehiclesQuery = query(
                collection(db, VEHICLES_COLLECTION),
                where('active', '==', true),
                where('teamName', '==', teamName),
                where('currentKidId', '==', null)
            );
        } else {
            vehiclesQuery = query(
                collection(db, VEHICLES_COLLECTION),
                where('active', '==', true),
                where('currentKidId', '==', null)
            );
        }

        const snapshot = await getDocs(vehiclesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
    } catch (error) {
        console.error('Error fetching available vehicles:', error);
        throw new Error('Failed to fetch available vehicles');
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

        console.log('Vehicle battery updated successfully:', vehicleId);
        return vehicleId;
    } catch (error) {
        console.error('Error updating vehicle battery:', error);
        throw new Error('Failed to update battery information');
    }
};

/**
 * Get vehicles statistics - CLEAN VERSION
 */
export const getVehicleStats = async (teamName = null) => {
    try {
        let vehicles;

        if (teamName) {
            vehicles = await getVehiclesByTeam(teamName);
        } else {
            vehicles = await getAllVehicles();
        }

        const stats = {
            total: vehicles.length,
            active: vehicles.filter(v => v.active === true).length,
            inactive: vehicles.filter(v => v.active === false).length,
            inUse: vehicles.filter(v => v.currentKidId && v.active === true).length,
            available: vehicles.filter(v => !v.currentKidId && v.active === true).length,
            needsMaintenance: vehicles.filter(v => {
                // Check if battery date is old (example: older than 6 months)
                if (!v.batteryDate) return false;
                const batteryDate = new Date(v.batteryDate);
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return batteryDate < sixMonthsAgo;
            }).length
        };

        return stats;
    } catch (error) {
        console.error('Error calculating vehicle stats:', error);
        throw new Error('Failed to calculate vehicle statistics');
    }
};

/**
 * Search vehicles by various criteria
 */
export const searchVehicles = async (searchTerm, filters = {}) => {
    try {
        // Start with all vehicles or filtered by team
        let vehicles = filters.teamName
            ? await getVehiclesByTeam(filters.teamName)
            : await getAllVehicles();

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            vehicles = vehicles.filter(vehicle =>
                vehicle.make?.toLowerCase().includes(term) ||
                vehicle.model?.toLowerCase().includes(term) ||
                vehicle.licensePlate?.toLowerCase().includes(term) ||
                vehicle.teamName?.toLowerCase().includes(term) ||
                vehicle.notes?.toLowerCase().includes(term)
            );
        }

        // Apply additional filters
        if (filters.active !== undefined) {
            vehicles = vehicles.filter(v => v.active === filters.active);
        }

        if (filters.inUse !== undefined) {
            if (filters.inUse) {
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