// src/services/vehicleAssignmentService.js - Updated for Team-Based Vehicle Assignment
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Assign a vehicle to a team (Admin function)
 */
export const assignVehicleToTeam = async (vehicleId, teamId, teamName, assignedBy) => {
    try {
        // Get current vehicle data
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Create history entry for team assignment
        const historyEntry = {
            type: 'team_assignment',
            teamId: teamId,
            teamName: teamName,
            assignedAt: new Date().toISOString(),
            assignedBy: assignedBy
        };

        // Update history array
        const currentHistory = vehicleData.history || [];
        const updatedHistory = [...currentHistory, historyEntry];

        // Update vehicle with team assignment
        await updateDoc(vehicleRef, {
            teamId: teamId,
            currentKidId: null, // Clear any previous kid assignment
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Vehicle ${vehicleId} assigned to team ${teamId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to assign vehicle ${vehicleId} to team ${teamId}:`, error);
        throw new Error(`Failed to assign vehicle to team: ${error.message}`);
    }
};

/**
 * Assign a vehicle to a kid within a team (Instructor function)
 */
export const assignVehicleToKidInTeam = async (vehicleId, kidId, kidName, instructorId, teamId) => {
    try {
        // Get current vehicle data
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Verify vehicle belongs to the instructor's team
        if (vehicleData.teamId !== teamId) {
            throw new Error('Vehicle is not assigned to your team');
        }

        // Create history entry for kid assignment
        const historyEntry = {
            type: 'kid_assignment',
            kidId: kidId,
            kidName: kidName,
            teamId: teamId,
            assignedAt: new Date().toISOString(),
            assignedBy: instructorId
        };

        // Update history array
        const currentHistory = vehicleData.history || [];

        // Remove any existing kid assignment from this team
        const filteredHistory = currentHistory.filter(entry =>
            !(entry.type === 'kid_assignment' && entry.teamId === teamId)
        );

        const updatedHistory = [...filteredHistory, historyEntry];

        // Update vehicle with kid assignment (keep teamId)
        await updateDoc(vehicleRef, {
            currentKidId: kidId,
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Vehicle ${vehicleId} assigned to kid ${kidId} by instructor ${instructorId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to assign vehicle ${vehicleId} to kid ${kidId}:`, error);
        throw new Error(`Failed to assign vehicle to kid: ${error.message}`);
    }
};

/**
 * Unassign a vehicle from a kid (Instructor function - keeps team assignment)
 */
export const unassignVehicleFromKidInTeam = async (vehicleId, instructorId, teamId) => {
    try {
        // Get current vehicle data
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Verify vehicle belongs to the instructor's team
        if (vehicleData.teamId !== teamId) {
            throw new Error('Vehicle is not assigned to your team');
        }

        // Create history entry for unassignment
        const historyEntry = {
            type: 'kid_unassignment',
            previousKidId: vehicleData.currentKidId,
            teamId: teamId,
            unassignedAt: new Date().toISOString(),
            unassignedBy: instructorId
        };

        // Update history
        const currentHistory = vehicleData.history || [];
        const updatedHistory = [...currentHistory, historyEntry];

        // Update vehicle - remove kid but keep team
        await updateDoc(vehicleRef, {
            currentKidId: null,
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Vehicle ${vehicleId} unassigned from kid by instructor ${instructorId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to unassign vehicle ${vehicleId}:`, error);
        throw new Error(`Failed to unassign vehicle from kid: ${error.message}`);
    }
};

/**
 * Unassign a vehicle from a team (Admin function)
 */
export const unassignVehicleFromTeam = async (vehicleId, adminId) => {
    try {
        // Get current vehicle data
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);

        if (!vehicleDoc.exists()) {
            throw new Error('Vehicle not found');
        }

        const vehicleData = vehicleDoc.data();

        // Create history entry for team unassignment
        const historyEntry = {
            type: 'team_unassignment',
            previousTeamId: vehicleData.teamId,
            previousKidId: vehicleData.currentKidId,
            unassignedAt: new Date().toISOString(),
            unassignedBy: adminId
        };

        // Update history
        const currentHistory = vehicleData.history || [];
        const updatedHistory = [...currentHistory, historyEntry];

        // Update vehicle - clear both team and kid assignments
        await updateDoc(vehicleRef, {
            teamId: null,
            currentKidId: null,
            history: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Vehicle ${vehicleId} unassigned from team by admin ${adminId}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to unassign vehicle ${vehicleId} from team:`, error);
        throw new Error(`Failed to unassign vehicle from team: ${error.message}`);
    }
};

/**
 * Update vehicle assignments when team changes (Admin function)
 */
export const updateTeamVehicleAssignments = async (teamId, teamName, assignedBy, newVehicleIds = [], oldVehicleIds = []) => {
    try {
        // Remove team from old vehicles that are no longer assigned
        const vehiclesToRemove = oldVehicleIds.filter(id => !newVehicleIds.includes(id));
        for (const vehicleId of vehiclesToRemove) {
            try {
                await unassignVehicleFromTeam(vehicleId, assignedBy);
            } catch (error) {
                console.warn(`⚠️ Failed to remove team from vehicle ${vehicleId}:`, error);
            }
        }

        // Assign team to new vehicles
        const vehiclesToAdd = newVehicleIds.filter(id => !oldVehicleIds.includes(id));
        for (const vehicleId of vehiclesToAdd) {
            try {
                await assignVehicleToTeam(vehicleId, teamId, teamName, assignedBy);
            } catch (error) {
                console.warn(`⚠️ Failed to assign team to vehicle ${vehicleId}:`, error);
            }
        }

        return true;

    } catch (error) {
        console.error(`❌ Failed to update vehicle assignments for team ${teamId}:`, error);
        throw new Error(`Failed to update vehicle assignments: ${error.message}`);
    }
};

/**
 * Get vehicles assigned to a team that are available for kid assignment
 */
export const getAvailableTeamVehicles = async (teamId) => {
    try {
        const { getVehiclesByTeam } = await import('./vehicleService');
        const teamVehicles = await getVehiclesByTeam(teamId);

        // Return vehicles that are assigned to team but not to any kid
        return teamVehicles.filter(vehicle =>
            vehicle.active === true &&
            vehicle.teamId === teamId &&
            !vehicle.currentKidId
        );

    } catch (error) {
        console.error(`❌ Failed to get available team vehicles for team ${teamId}:`, error);
        throw new Error(`Failed to get available team vehicles: ${error.message}`);
    }
};

/**
 * Get vehicles assigned to kids in a team
 */
export const getAssignedTeamVehicles = async (teamId) => {
    try {
        const { getVehiclesByTeam } = await import('./vehicleService');
        const teamVehicles = await getVehiclesByTeam(teamId);

        // Return vehicles that are assigned to team and to a kid
        return teamVehicles.filter(vehicle =>
            vehicle.active === true &&
            vehicle.teamId === teamId &&
            vehicle.currentKidId
        );

    } catch (error) {
        console.error(`❌ Failed to get assigned team vehicles for team ${teamId}:`, error);
        throw new Error(`Failed to get assigned team vehicles: ${error.message}`);
    }
};

// Backward compatibility exports (deprecated - will show warnings)
export const assignVehicleToKid = async (vehicleId, kidId, kidName, assignedBy) => {
    console.warn('⚠️ assignVehicleToKid is deprecated. Use assignVehicleToKidInTeam instead.');
    throw new Error('Direct kid assignment is no longer supported. Vehicles must be assigned to teams first.');
};

export const unassignVehicleFromKid = async (vehicleId) => {
    console.warn('⚠️ unassignVehicleFromKid is deprecated. Use unassignVehicleFromKidInTeam instead.');
    throw new Error('Direct kid unassignment is no longer supported. Use team-based unassignment.');
};

export const updateKidVehicleAssignments = async (kidId, kidName, assignedBy, newVehicleIds = [], oldVehicleIds = []) => {
    console.warn('⚠️ updateKidVehicleAssignments is deprecated. Use team-based assignment instead.');
    throw new Error('Direct kid vehicle assignments are no longer supported. Use team-based assignment.');
};

export default {
    // New team-based functions
    assignVehicleToTeam,
    assignVehicleToKidInTeam,
    unassignVehicleFromKidInTeam,
    unassignVehicleFromTeam,
    updateTeamVehicleAssignments,
    getAvailableTeamVehicles,
    getAssignedTeamVehicles,

    // Deprecated functions (for backward compatibility)
    assignVehicleToKid,
    unassignVehicleFromKid,
    updateKidVehicleAssignments
};