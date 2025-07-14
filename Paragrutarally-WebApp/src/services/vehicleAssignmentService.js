// src/services/vehicleAssignmentService.js - Updated for Team-based Vehicle Assignment
import { doc, updateDoc, serverTimestamp, getDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Assign a vehicle to a team
 * Updates both vehicle.teamId and team.vehicleIds
 */
export const assignVehicleToTeam = async (vehicleId, teamId) => {
    try {
        console.log(`🔄 Assigning vehicle ${vehicleId} to team ${teamId}`);

        // Get current vehicle data
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // If vehicle is already assigned to a different team, remove it from that team first
        if (vehicleData.teamId && vehicleData.teamId !== teamId) {
            await removeVehicleFromTeam(vehicleId, vehicleData.teamId);
        }

        // Update vehicle to point to new team and clear kid assignments
        await updateDoc(vehicleRef, {
            teamId: teamId,
            currentKidIds: [], // Clear kid assignments when reassigning to different team
            updatedAt: serverTimestamp()
        });

        // Add vehicle to team's vehicle list
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            vehicleIds: arrayUnion(vehicleId),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Successfully assigned vehicle ${vehicleId} to team ${teamId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to assign vehicle ${vehicleId} to team ${teamId}:`, error);
        throw new Error(`Failed to assign vehicle to team: ${error.message}`);
    }
};

/**
 * Remove a vehicle from a team
 * Updates both vehicle.teamId and team.vehicleIds, and resets all kid assignments
 */
export const removeVehicleFromTeam = async (vehicleId, teamId = null) => {
    try {
        console.log(`🔄 Removing vehicle ${vehicleId} from team`);

        // Get current vehicle data if teamId not provided
        if (!teamId) {
            const vehicleRef = doc(db, 'vehicles', vehicleId);
            const vehicleDoc = await getDoc(vehicleRef);
            if (!vehicleDoc.exists()) {
                throw new Error('Vehicle not found');
            }
            teamId = vehicleDoc.data().teamId;
        }

        if (!teamId) {
            console.log(`⚠️ Vehicle ${vehicleId} is not assigned to any team`);
            return true;
        }

        // Get all kids currently assigned to this vehicle and reset their assignments
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (vehicleDoc.exists()) {
            const vehicleData = vehicleDoc.data();
            const assignedKids = vehicleData.currentKidIds || [];

            // Reset vehicle assignments for all kids using this vehicle
            if (assignedKids.length > 0) {
                await resetKidsVehicleAssignments(assignedKids, vehicleId);
            }
        }

        // Update vehicle to remove team assignment and clear kid assignments
        await updateDoc(vehicleRef, {
            teamId: null,
            currentKidIds: [],
            updatedAt: serverTimestamp()
        });

        // Remove vehicle from team's vehicle list
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            vehicleIds: arrayRemove(vehicleId),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Successfully removed vehicle ${vehicleId} from team ${teamId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to remove vehicle ${vehicleId} from team:`, error);
        throw new Error(`Failed to remove vehicle from team: ${error.message}`);
    }
};

/**
 * Alias for removeVehicleFromTeam to match import expectations
 * (Used by VehiclesPage.jsx)
 */
export const unassignVehicleFromTeam = removeVehicleFromTeam;

/**
 * Assign a kid to a vehicle (within their team)
 * Updates both kid.vehicleId and vehicle.currentKidIds
 */
export const assignKidToVehicle = async (kidId, vehicleId) => {
    try {
        console.log(`🔄 Assigning kid ${kidId} to vehicle ${vehicleId}`);

        // Get kid's current vehicle assignment and reset it if exists
        const kidRef = doc(db, 'kids', kidId);
        const kidDoc = await getDoc(kidRef);

        if (!kidDoc.exists()) {
            throw new Error('Kid not found');
        }

        const kidData = kidDoc.data();
        const currentVehicleId = kidData.vehicleId;

        // If kid is already assigned to a different vehicle, remove them from that vehicle
        if (currentVehicleId && currentVehicleId !== vehicleId) {
            await removeKidFromVehicle(kidId, currentVehicleId);
        }

        // Verify the vehicle exists and is assigned to the same team as the kid
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Validate that the vehicle is assigned to the same team as the kid
        if (vehicleData.teamId !== kidData.teamId) {
            throw new Error('Vehicle is not assigned to the same team as the kid');
        }

        // Update kid's vehicle assignment
        await updateDoc(kidRef, {
            vehicleId: vehicleId,
            updatedAt: serverTimestamp()
        });

        // Add kid to vehicle's current kid list
        await updateDoc(vehicleRef, {
            currentKidIds: arrayUnion(kidId),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Successfully assigned kid ${kidId} to vehicle ${vehicleId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to assign kid ${kidId} to vehicle ${vehicleId}:`, error);
        throw new Error(`Failed to assign kid to vehicle: ${error.message}`);
    }
};

/**
 * Remove a kid from a vehicle
 * Updates both kid.vehicleId and vehicle.currentKidIds
 */
export const removeKidFromVehicle = async (kidId, vehicleId = null) => {
    try {
        console.log(`🔄 Removing kid ${kidId} from vehicle`);

        // Get current kid data if vehicleId not provided
        if (!vehicleId) {
            const kidRef = doc(db, 'kids', kidId);
            const kidDoc = await getDoc(kidRef);
            if (!kidDoc.exists()) {
                throw new Error('Kid not found');
            }
            vehicleId = kidDoc.data().vehicleId;
        }

        if (!vehicleId) {
            console.log(`⚠️ Kid ${kidId} is not assigned to any vehicle`);
            return true;
        }

        // Update kid to remove vehicle assignment
        const kidRef = doc(db, 'kids', kidId);
        await updateDoc(kidRef, {
            vehicleId: null,
            updatedAt: serverTimestamp()
        });

        // Remove kid from vehicle's current kid list
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        await updateDoc(vehicleRef, {
            currentKidIds: arrayRemove(kidId),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Successfully removed kid ${kidId} from vehicle ${vehicleId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to remove kid ${kidId} from vehicle:`, error);
        throw new Error(`Failed to remove kid from vehicle: ${error.message}`);
    }
};

/**
 * Alias for removeKidFromVehicle to match import expectations
 */
export const unassignVehicleFromKid = removeKidFromVehicle;

/**
 * Reset vehicle assignments for multiple kids (used when vehicle is removed from team)
 */
export const resetKidsVehicleAssignments = async (kidIds, vehicleId) => {
    try {
        console.log(`🔄 Resetting vehicle assignments for ${kidIds.length} kids`);

        const resetPromises = kidIds.map(async (kidId) => {
            try {
                const kidRef = doc(db, 'kids', kidId);
                await updateDoc(kidRef, {
                    vehicleId: null,
                    updatedAt: serverTimestamp()
                });
                console.log(`✅ Reset vehicle assignment for kid ${kidId}`);
            } catch (error) {
                console.warn(`⚠️ Failed to reset vehicle assignment for kid ${kidId}:`, error);
            }
        });

        await Promise.all(resetPromises);
        console.log(`✅ Successfully reset vehicle assignments for all kids`);

    } catch (error) {
        console.error(`❌ Failed to reset kids vehicle assignments:`, error);
        throw new Error(`Failed to reset kids vehicle assignments: ${error.message}`);
    }
};

/**
 * Handle team changes for kids (reset vehicle assignment when kid changes teams)
 */
export const handleKidTeamChange = async (kidId, newTeamId, oldTeamId) => {
    try {
        console.log(`🔄 Handling team change for kid ${kidId}: ${oldTeamId} → ${newTeamId}`);

        // If kid had a vehicle assigned, remove them from it
        await removeKidFromVehicle(kidId);

        console.log(`✅ Successfully handled team change for kid ${kidId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to handle team change for kid ${kidId}:`, error);
        throw new Error(`Failed to handle team change: ${error.message}`);
    }
};

/**
 * Update team vehicle assignments (used when editing teams)
 * Handles adding/removing vehicles from teams with proper kid reassignment
 */
export const updateTeamVehicleAssignments = async (teamId, newVehicleIds, oldVehicleIds = []) => {
    try {
        console.log(`🔄 Updating vehicle assignments for team ${teamId}`);

        // Remove vehicles that are no longer assigned to this team
        const vehiclesToRemove = oldVehicleIds.filter(id => !newVehicleIds.includes(id));
        for (const vehicleId of vehiclesToRemove) {
            try {
                await removeVehicleFromTeam(vehicleId, teamId);
                console.log(`✅ Removed vehicle ${vehicleId} from team ${teamId}`);
            } catch (error) {
                console.warn(`⚠️ Failed to remove vehicle ${vehicleId} from team ${teamId}:`, error);
            }
        }

        // Add vehicles that are newly assigned to this team
        const vehiclesToAdd = newVehicleIds.filter(id => !oldVehicleIds.includes(id));
        for (const vehicleId of vehiclesToAdd) {
            try {
                await assignVehicleToTeam(vehicleId, teamId);
                console.log(`✅ Added vehicle ${vehicleId} to team ${teamId}`);
            } catch (error) {
                console.warn(`⚠️ Failed to add vehicle ${vehicleId} to team ${teamId}:`, error);
            }
        }

        console.log(`✅ Successfully updated vehicle assignments for team ${teamId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to update team vehicle assignments for team ${teamId}:`, error);
        throw new Error(`Failed to update team vehicle assignments: ${error.message}`);
    }
};

/**
 * Get all kids assigned to a specific vehicle
 * @param {string} vehicleId - The vehicle ID
 * @returns {Promise<Array>} Array of kid objects assigned to the vehicle
 */
export const getKidsAssignedToVehicle = async (vehicleId) => {
    try {
        // Get the vehicle first
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleSnap = await getDoc(vehicleRef);

        if (!vehicleSnap.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleSnap.data();
        const kidIds = vehicleData.currentKidIds || [];

        if (kidIds.length === 0) {
            return [];
        }

        // Get all assigned kids
        const kidPromises = kidIds.map(kidId => getDoc(doc(db, 'kids', kidId)));
        const kidSnaps = await Promise.all(kidPromises);

        const kids = kidSnaps
            .filter(snap => snap.exists())
            .map(snap => ({
                id: snap.id,
                ...snap.data()
            }));

        return kids;

    } catch (error) {
        console.error('❌ Error getting kids assigned to vehicle:', error);
        throw error;
    }
};

/**
 * Reassign a vehicle from one team to another
 * @param {string} vehicleId - The vehicle ID
 * @param {string} newTeamId - The new team ID
 * @returns {Promise<void>}
 */
export const reassignVehicleToTeam = async (vehicleId, newTeamId) => {
    try {
        // First unassign from current team
        await removeVehicleFromTeam(vehicleId);

        // Then assign to new team
        await assignVehicleToTeam(vehicleId, newTeamId);

        console.log('✅ Vehicle reassigned to new team successfully');

    } catch (error) {
        console.error('❌ Error reassigning vehicle to team:', error);
        throw error;
    }
};

export default {
    assignVehicleToTeam,
    removeVehicleFromTeam,
    unassignVehicleFromTeam, // Alias
    assignKidToVehicle,
    removeKidFromVehicle,
    unassignVehicleFromKid, // Alias
    resetKidsVehicleAssignments,
    handleKidTeamChange,
    updateTeamVehicleAssignments,
    getKidsAssignedToVehicle,
    reassignVehicleToTeam
};