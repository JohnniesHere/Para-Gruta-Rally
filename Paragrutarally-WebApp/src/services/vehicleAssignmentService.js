// src/services/vehicleAssignmentService.js - Dedicated Vehicle Assignment Handler
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Assign a vehicle to a kid (bypasses schema validation for assignment fields)
 */
export const assignVehicleToKid = async (vehicleId, kidId, kidName, assignedBy) => {
    try {
        console.log(`🚗 Assigning vehicle ${vehicleId} to kid ${kidId}`);

        // Get current vehicle data
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Create history entry
        const historyEntry = {
            kidId: kidId,
            kidName: kidName,
            assignedAt: new Date().toISOString(),
            assignedBy: assignedBy
        };

        // Update history array (make sure we don't duplicate)
        const currentHistory = vehicleData.history || [];
        const existingEntryIndex = currentHistory.findIndex(entry => entry.kidId === kidId);

        let updatedHistory;
        if (existingEntryIndex === -1) {
            // Add new entry
            updatedHistory = [...currentHistory, historyEntry];
        } else {
            // Update existing entry
            updatedHistory = [...currentHistory];
            updatedHistory[existingEntryIndex] = historyEntry;
        }

        // Update vehicle directly without schema validation
        await updateDoc(vehicleRef, {
            currentKidId: kidId,
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Vehicle ${vehicleId} successfully assigned to kid ${kidId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to assign vehicle ${vehicleId} to kid ${kidId}:`, error);
        throw new Error(`Failed to assign vehicle: ${error.message}`);
    }
};

/**
 * Unassign a vehicle from a kid
 */
export const unassignVehicleFromKid = async (vehicleId) => {
    try {
        console.log(`🚗 Unassigning vehicle ${vehicleId}`);

        // Update vehicle directly without schema validation
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        await updateDoc(vehicleRef, {
            currentKidId: null,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Vehicle ${vehicleId} successfully unassigned`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to unassign vehicle ${vehicleId}:`, error);
        throw new Error(`Failed to unassign vehicle: ${error.message}`);
    }
};

/**
 * Update vehicle assignments when kid changes (handles multiple vehicles)
 */
export const updateKidVehicleAssignments = async (kidId, kidName, assignedBy, newVehicleIds = [], oldVehicleIds = []) => {
    try {
        console.log(`🔄 Updating vehicle assignments for kid ${kidId}`);
        console.log(`Old vehicles: ${oldVehicleIds.join(', ')}`);
        console.log(`New vehicles: ${newVehicleIds.join(', ')}`);

        // Remove kid from old vehicles that are no longer assigned
        const vehiclesToRemove = oldVehicleIds.filter(id => !newVehicleIds.includes(id));
        for (const vehicleId of vehiclesToRemove) {
            try {
                await unassignVehicleFromKid(vehicleId);
                console.log(`✅ Removed kid ${kidId} from vehicle ${vehicleId}`);
            } catch (error) {
                console.warn(`⚠️ Failed to remove kid from vehicle ${vehicleId}:`, error);
            }
        }

        // Assign kid to new vehicles
        const vehiclesToAdd = newVehicleIds.filter(id => !oldVehicleIds.includes(id));
        for (const vehicleId of vehiclesToAdd) {
            try {
                await assignVehicleToKid(vehicleId, kidId, kidName, assignedBy);
                console.log(`✅ Assigned kid ${kidId} to vehicle ${vehicleId}`);
            } catch (error) {
                console.warn(`⚠️ Failed to assign kid to vehicle ${vehicleId}:`, error);
            }
        }

        console.log(`✅ Vehicle assignments updated successfully for kid ${kidId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to update vehicle assignments for kid ${kidId}:`, error);
        throw new Error(`Failed to update vehicle assignments: ${error.message}`);
    }
};

export default {
    assignVehicleToKid,
    unassignVehicleFromKid,
    updateKidVehicleAssignments
};