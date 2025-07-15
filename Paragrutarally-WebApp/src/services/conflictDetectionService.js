// src/services/conflictDetectionService.js - Vehicle Assignment Conflict Detection
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Check if a vehicle is already assigned to another team or kid
 * @param {string} vehicleId - Vehicle ID to check
 * @param {string} excludeTeamId - Current team ID to exclude from conflict check
 * @returns {Promise<Object>} Conflict information
 */
export const checkVehicleConflicts = async (vehicleId, excludeTeamId = null) => {
    try {
        const conflicts = {
            hasConflict: false,
            conflictType: null,
            conflictDetails: null,
            canProceed: true,
            warningMessage: null
        };

        // Check if vehicle is assigned to other teams
        const teamsQuery = query(
            collection(db, 'teams'),
            where('vehicleIds', 'array-contains', vehicleId)
        );

        const teamsSnapshot = await getDocs(teamsQuery);
        const conflictingTeams = [];

        teamsSnapshot.forEach(doc => {
            const team = { id: doc.id, ...doc.data() };
            // Exclude current team from conflicts
            if (team.id !== excludeTeamId) {
                conflictingTeams.push(team);
            }
        });

        // Check if vehicle is assigned to kids in other teams
        const kidsQuery = query(
            collection(db, 'kids'),
            where('vehicleId', '==', vehicleId)
        );

        const kidsSnapshot = await getDocs(kidsQuery);
        const conflictingKids = [];

        kidsSnapshot.forEach(doc => {
            const kid = { id: doc.id, ...doc.data() };
            // Only count as conflict if kid is in different team
            if (kid.teamId !== excludeTeamId) {
                conflictingKids.push(kid);
            }
        });

        // Determine conflict severity and type
        if (conflictingTeams.length > 0 || conflictingKids.length > 0) {
            conflicts.hasConflict = true;

            if (conflictingKids.length > 0) {
                conflicts.conflictType = 'kid_assignment';
                conflicts.conflictDetails = {
                    kids: conflictingKids,
                    teams: conflictingTeams
                };

                const kidNames = conflictingKids.map(kid =>
                    `${kid.personalInfo?.firstName || 'Unknown'} ${kid.personalInfo?.lastName || ''} (#${kid.participantNumber})`
                ).join(', ');

                conflicts.warningMessage = `🚨 Vehicle is currently assigned to: ${kidNames}`;
                conflicts.canProceed = false; // Block assignment to avoid double-booking
            }
            else if (conflictingTeams.length > 0) {
                conflicts.conflictType = 'team_assignment';
                conflicts.conflictDetails = {
                    teams: conflictingTeams,
                    kids: []
                };

                const teamNames = conflictingTeams.map(team =>
                    `${team.name} (${team.active ? 'Active' : 'Inactive'})`
                ).join(', ');

                conflicts.warningMessage = `⚠️ Vehicle is assigned to team(s): ${teamNames}`;
                conflicts.canProceed = true; // Allow but warn
            }
        }

        return conflicts;

    } catch (error) {
        console.error('❌ Error checking vehicle conflicts:', error);
        return {
            hasConflict: false,
            conflictType: 'error',
            conflictDetails: null,
            canProceed: true,
            warningMessage: '⚠️ Could not check for conflicts. Proceeding with caution.'
        };
    }
};

/**
 * Check for multiple vehicle conflicts at once
 * @param {Array<string>} vehicleIds - Array of vehicle IDs to check
 * @param {string} excludeTeamId - Current team ID to exclude
 * @returns {Promise<Object>} Map of vehicle ID to conflict info
 */
export const checkMultipleVehicleConflicts = async (vehicleIds, excludeTeamId = null) => {
    try {
        const conflictPromises = vehicleIds.map(vehicleId =>
            checkVehicleConflicts(vehicleId, excludeTeamId)
        );

        const conflictResults = await Promise.all(conflictPromises);

        const conflictMap = {};
        vehicleIds.forEach((vehicleId, index) => {
            conflictMap[vehicleId] = conflictResults[index];
        });

        return conflictMap;
    } catch (error) {
        console.error('❌ Error checking multiple vehicle conflicts:', error);
        return {};
    }
};

/**
 * Get detailed conflict summary for UI display
 * @param {Object} conflicts - Conflict object from checkVehicleConflicts
 * @returns {Object} UI-friendly conflict summary
 */
export const getConflictSummary = (conflicts) => {
    if (!conflicts.hasConflict) {
        return {
            severity: 'none',
            title: '✅ No Conflicts',
            message: 'Vehicle is available for assignment',
            action: 'proceed',
            buttonText: 'Assign Vehicle',
            buttonColor: 'success'
        };
    }

    if (conflicts.conflictType === 'kid_assignment') {
        return {
            severity: 'critical',
            title: '🚨 Critical Conflict',
            message: conflicts.warningMessage,
            action: 'block',
            buttonText: 'Cannot Assign',
            buttonColor: 'danger',
            suggestion: 'Remove vehicle from other kid first, or choose a different vehicle.'
        };
    }

    if (conflicts.conflictType === 'team_assignment') {
        return {
            severity: 'warning',
            title: '⚠️ Team Conflict',
            message: conflicts.warningMessage,
            action: 'warn',
            buttonText: 'Assign Anyway',
            buttonColor: 'warning',
            suggestion: 'This will move the vehicle from the other team to this team.'
        };
    }

    return {
        severity: 'unknown',
        title: '❓ Unknown Conflict',
        message: 'Unable to determine conflict status',
        action: 'caution',
        buttonText: 'Proceed with Caution',
        buttonColor: 'secondary'
    };
};