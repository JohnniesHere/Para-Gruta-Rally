// src/services/assignmentHistoryService.js - Vehicle Assignment History Tracking
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Log a vehicle assignment change
 * @param {Object} assignmentData - Assignment change data
 * @returns {Promise<string>} Document ID of the history entry
 */
export const logAssignmentChange = async (assignmentData) => {
    try {
        const historyEntry = {
            // Core assignment data
            kidId: assignmentData.kidId || null,
            vehicleId: assignmentData.vehicleId || null, // null for unassignment
            teamId: assignmentData.teamId || null,

            // Previous state (for swaps and changes)
            previousVehicleId: assignmentData.previousVehicleId || null,
            previousTeamId: assignmentData.previousTeamId || null,

            // Action type
            action: assignmentData.action, // 'assigned', 'unassigned', 'swapped', 'team_changed'

            // Context information
            userId: assignmentData.userId || 'system', // Who made the change
            reason: assignmentData.reason || null, // Optional reason

            // Enhanced metadata
            metadata: {
                kidName: assignmentData.kidName || null,
                vehicleName: assignmentData.vehicleName || null,
                teamName: assignmentData.teamName || null,
                previousVehicleName: assignmentData.previousVehicleName || null,
                previousTeamName: assignmentData.previousTeamName || null,

                // Technical details
                source: assignmentData.source || 'web', // 'web', 'api', 'import', etc.
                sessionId: assignmentData.sessionId || null,
                ipAddress: assignmentData.ipAddress || null
            },

            // Timestamps
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'vehicleAssignmentHistory'), historyEntry);
        console.log(`📝 Assignment history logged: ${assignmentData.action} - ${docRef.id}`);

        return docRef.id;
    } catch (error) {
        console.error('❌ Error logging assignment history:', error);
        // Don't throw - history logging shouldn't break main operations
        return null;
    }
};

/**
 * Get assignment history for a specific kid
 * @param {string} kidId - Kid's document ID
 * @param {number} limitCount - Number of entries to retrieve
 * @returns {Promise<Array>} Array of history entries
 */
export const getKidAssignmentHistory = async (kidId, limitCount = 50) => {
    try {
        const historyQuery = query(
            collection(db, 'vehicleAssignmentHistory'),
            where('kidId', '==', kidId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(historyQuery);
        const history = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                // Convert Firestore timestamps to Date objects
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        return history;
    } catch (error) {
        console.error('❌ Error getting kid assignment history:', error);
        return [];
    }
};

/**
 * Get assignment history for a specific vehicle
 * @param {string} vehicleId - Vehicle's document ID
 * @param {number} limitCount - Number of entries to retrieve
 * @returns {Promise<Array>} Array of history entries
 */
export const getVehicleAssignmentHistory = async (vehicleId, limitCount = 50) => {
    try {
        const historyQuery = query(
            collection(db, 'vehicleAssignmentHistory'),
            where('vehicleId', '==', vehicleId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(historyQuery);
        const history = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        return history;
    } catch (error) {
        console.error('❌ Error getting vehicle assignment history:', error);
        return [];
    }
};

/**
 * Get assignment history for a specific team
 * @param {string} teamId - Team's document ID
 * @param {number} limitCount - Number of entries to retrieve
 * @returns {Promise<Array>} Array of history entries
 */
export const getTeamAssignmentHistory = async (teamId, limitCount = 100) => {
    try {
        const historyQuery = query(
            collection(db, 'vehicleAssignmentHistory'),
            where('teamId', '==', teamId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(historyQuery);
        const history = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        return history;
    } catch (error) {
        console.error('❌ Error getting team assignment history:', error);
        return [];
    }
};

/**
 * Get recent assignment activity across all teams
 * @param {number} limitCount - Number of entries to retrieve
 * @returns {Promise<Array>} Array of recent history entries
 */
export const getRecentAssignmentActivity = async (limitCount = 20) => {
    try {
        const historyQuery = query(
            collection(db, 'vehicleAssignmentHistory'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(historyQuery);
        const history = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            });
        });

        return history;
    } catch (error) {
        console.error('❌ Error getting recent assignment activity:', error);
        return [];
    }
};

/**
 * Format history entry for display
 * @param {Object} historyEntry - History entry object
 * @param {Function} t - Translation function
 * @returns {Object} Formatted display data
 */
export const formatHistoryEntry = (historyEntry, t = null) => {
    const { action, metadata, timestamp } = historyEntry;

    const kidName = metadata?.kidName || `Kid #${historyEntry.kidId?.slice(-4) || 'Unknown'}`;
    const vehicleName = metadata?.vehicleName || `Vehicle #${historyEntry.vehicleId?.slice(-4) || 'Unknown'}`;
    const teamName = metadata?.teamName || `Team #${historyEntry.teamId?.slice(-4) || 'Unknown'}`;

    const previousVehicleName = metadata?.previousVehicleName || 'Unknown Vehicle';
    const previousTeamName = metadata?.previousTeamName || 'Unknown Team';

    let actionText = '';
    let actionIcon = '';
    let actionColor = '';

    switch (action) {
        case 'assigned':
            actionText = t ? t('history.assigned', '{kid} was assigned {vehicle}', { kid: kidName, vehicle: vehicleName })
                : `${kidName} was assigned ${vehicleName}`;
            actionIcon = '🏎️';
            actionColor = 'success';
            break;

        case 'unassigned':
            actionText = t ? t('history.unassigned', '{kid} was unassigned from {vehicle}', { kid: kidName, vehicle: vehicleName })
                : `${kidName} was unassigned from ${vehicleName}`;
            actionIcon = '🚫';
            actionColor = 'warning';
            break;

        case 'swapped':
            actionText = t ? t('history.swapped', '{kid} swapped from {prev} to {new}', {
                    kid: kidName, prev: previousVehicleName, new: vehicleName })
                : `${kidName} swapped from ${previousVehicleName} to ${vehicleName}`;
            actionIcon = '🔄';
            actionColor = 'info';
            break;

        case 'team_changed':
            actionText = t ? t('history.teamChanged', '{kid} moved from {prevTeam} to {newTeam}', {
                    kid: kidName, prevTeam: previousTeamName, newTeam: teamName })
                : `${kidName} moved from ${previousTeamName} to ${teamName}`;
            actionIcon = '👥';
            actionColor = 'primary';
            break;

        default:
            actionText = t ? t('history.unknown', 'Unknown action for {kid}', { kid: kidName })
                : `Unknown action for ${kidName}`;
            actionIcon = '❓';
            actionColor = 'secondary';
    }

    return {
        id: historyEntry.id,
        actionText,
        actionIcon,
        actionColor,
        timestamp,
        timeAgo: getTimeAgo(timestamp),
        user: historyEntry.userId || 'System',
        details: {
            kidName,
            vehicleName,
            teamName,
            action
        }
    };
};

/**
 * Helper function to get human-readable time ago
 * @param {Date} timestamp - Timestamp to compare
 * @returns {string} Human-readable time difference
 */
const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    const now = new Date();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return timestamp.toLocaleDateString();
};

/**
 * Helper function to create assignment data for logging
 * @param {Object} params - Assignment parameters
 * @returns {Object} Formatted assignment data for logging
 */
export const createAssignmentLogData = async (params) => {
    const {
        action,
        kidId,
        vehicleId,
        teamId,
        previousVehicleId = null,
        previousTeamId = null,
        userId = 'system',
        reason = null
    } = params;

    try {
        // Get display names for better history readability
        let kidName = null;
        let vehicleName = null;
        let teamName = null;
        let previousVehicleName = null;
        let previousTeamName = null;

        // Dynamically import services to get display names
        if (kidId) {
            try {
                const { getKidById } = await import('./kidService.js');
                const kid = await getKidById(kidId);
                if (kid) {
                    kidName = `${kid.personalInfo?.firstName || ''} ${kid.personalInfo?.lastName || ''}`.trim() || `#${kid.participantNumber}`;
                }
            } catch (e) { /* ignore */ }
        }

        if (vehicleId) {
            try {
                const { getVehicleById } = await import('./vehicleService.js');
                const vehicle = await getVehicleById(vehicleId);
                if (vehicle) {
                    vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`;
                }
            } catch (e) { /* ignore */ }
        }

        if (teamId) {
            try {
                const { getTeamById } = await import('./teamService.js');
                const team = await getTeamById(teamId);
                if (team) {
                    teamName = team.name;
                }
            } catch (e) { /* ignore */ }
        }

        // Get previous names if needed
        if (previousVehicleId) {
            try {
                const { getVehicleById } = await import('./vehicleService.js');
                const prevVehicle = await getVehicleById(previousVehicleId);
                if (prevVehicle) {
                    previousVehicleName = `${prevVehicle.make} ${prevVehicle.model} (${prevVehicle.licensePlate})`;
                }
            } catch (e) { /* ignore */ }
        }

        if (previousTeamId) {
            try {
                const { getTeamById } = await import('./teamService.js');
                const prevTeam = await getTeamById(previousTeamId);
                if (prevTeam) {
                    previousTeamName = prevTeam.name;
                }
            } catch (e) { /* ignore */ }
        }

        return {
            action,
            kidId,
            vehicleId,
            teamId,
            previousVehicleId,
            previousTeamId,
            userId,
            reason,
            kidName,
            vehicleName,
            teamName,
            previousVehicleName,
            previousTeamName,
            source: 'web'
        };

    } catch (error) {
        console.error('❌ Error creating assignment log data:', error);
        // Return minimal data if enrichment fails
        return {
            action,
            kidId,
            vehicleId,
            teamId,
            previousVehicleId,
            previousTeamId,
            userId,
            reason,
            source: 'web'
        };
    }
};