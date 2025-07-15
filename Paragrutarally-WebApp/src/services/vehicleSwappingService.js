// src/services/vehicleSwappingService.js - Vehicle Swapping Operations
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Swap vehicles between two kids
 * @param {string} kidId1 - First kid's ID
 * @param {string} kidId2 - Second kid's ID
 * @param {string} teamId - Team ID (for history logging)
 * @param {string} userId - User performing the swap
 * @returns {Promise<Object>} Swap result
 */
export const swapVehiclesBetweenKids = async (kidId1, kidId2, teamId, userId = 'system') => {
    try {
        // Get current kid data
        const { getKidById, updateKid } = await import('./kidService.js');

        const [kid1, kid2] = await Promise.all([
            getKidById(kidId1),
            getKidById(kidId2)
        ]);

        if (!kid1 || !kid2) {
            throw new Error('One or both kids not found');
        }

        const vehicle1Id = kid1.vehicleId;
        const vehicle2Id = kid2.vehicleId;

        // Validate swap is meaningful
        if (vehicle1Id === vehicle2Id) {
            throw new Error('Kids already have the same vehicle assignment');
        }

        // Perform the swap
        const updatePromises = [];

        // Update kid1's vehicle
        updatePromises.push(
            updateKid(kidId1, {
                ...kid1,
                vehicleId: vehicle2Id
            })
        );

        // Update kid2's vehicle
        updatePromises.push(
            updateKid(kidId2, {
                ...kid2,
                vehicleId: vehicle1Id
            })
        );

        await Promise.all(updatePromises);

        // Log swap history for both kids
        try {
            const { logAssignmentChange, createAssignmentLogData } = await import('./assignmentHistoryService.js');

            // Log for kid1
            if (vehicle2Id) {
                const logData1 = await createAssignmentLogData({
                    action: 'swapped',
                    kidId: kidId1,
                    vehicleId: vehicle2Id,
                    teamId,
                    previousVehicleId: vehicle1Id,
                    userId,
                    reason: `Swapped with ${kid2.personalInfo?.firstName || 'another kid'}`
                });
                await logAssignmentChange(logData1);
            } else {
                // Kid1 gets unassigned
                const logData1 = await createAssignmentLogData({
                    action: 'unassigned',
                    kidId: kidId1,
                    vehicleId: vehicle1Id,
                    teamId,
                    userId,
                    reason: `Swapped with ${kid2.personalInfo?.firstName || 'another kid'}`
                });
                await logAssignmentChange(logData1);
            }

            // Log for kid2
            if (vehicle1Id) {
                const logData2 = await createAssignmentLogData({
                    action: 'swapped',
                    kidId: kidId2,
                    vehicleId: vehicle1Id,
                    teamId,
                    previousVehicleId: vehicle2Id,
                    userId,
                    reason: `Swapped with ${kid1.personalInfo?.firstName || 'another kid'}`
                });
                await logAssignmentChange(logData2);
            } else {
                // Kid2 gets unassigned
                const logData2 = await createAssignmentLogData({
                    action: 'unassigned',
                    kidId: kidId2,
                    vehicleId: vehicle2Id,
                    teamId,
                    userId,
                    reason: `Swapped with ${kid1.personalInfo?.firstName || 'another kid'}`
                });
                await logAssignmentChange(logData2);
            }

        } catch (historyError) {
            console.warn('⚠️ Failed to log swap history:', historyError);
        }

        return {
            success: true,
            message: 'Vehicles swapped successfully',
            swapDetails: {
                kid1: {
                    id: kidId1,
                    name: `${kid1.personalInfo?.firstName || ''} ${kid1.personalInfo?.lastName || ''}`.trim(),
                    previousVehicleId: vehicle1Id,
                    newVehicleId: vehicle2Id
                },
                kid2: {
                    id: kidId2,
                    name: `${kid2.personalInfo?.firstName || ''} ${kid2.personalInfo?.lastName || ''}`.trim(),
                    previousVehicleId: vehicle2Id,
                    newVehicleId: vehicle1Id
                }
            }
        };

    } catch (error) {
        console.error('❌ Error swapping vehicles:', error);
        return {
            success: false,
            message: error.message || 'Failed to swap vehicles',
            error: error
        };
    }
};

/**
 * Get swappable kids for a given kid (kids in same team with different vehicles)
 * @param {string} kidId - Current kid's ID
 * @param {Array} allKids - All kids data
 * @param {string} teamId - Team ID
 * @returns {Array} Array of kids that can be swapped with
 */
export const getSwappableKids = (kidId, allKids, teamId) => {
    const currentKid = allKids.find(kid => kid.id === kidId);
    if (!currentKid) return [];

    return allKids.filter(kid => {
        // Must be in same team
        if (kid.teamId !== teamId) return false;

        // Cannot swap with self
        if (kid.id === kidId) return false;

        // Must have different vehicle assignment
        if (kid.vehicleId === currentKid.vehicleId) return false;

        return true;
    });
};

/**
 * Validate if a swap is possible between two kids
 * @param {string} kidId1 - First kid's ID
 * @param {string} kidId2 - Second kid's ID
 * @param {Array} allKids - All kids data
 * @param {string} teamId - Team ID
 * @returns {Object} Validation result
 */
export const validateSwap = (kidId1, kidId2, allKids, teamId) => {
    const kid1 = allKids.find(kid => kid.id === kidId1);
    const kid2 = allKids.find(kid => kid.id === kidId2);

    if (!kid1 || !kid2) {
        return {
            isValid: false,
            message: 'One or both kids not found'
        };
    }

    if (kid1.teamId !== teamId || kid2.teamId !== teamId) {
        return {
            isValid: false,
            message: 'Both kids must be in the same team'
        };
    }

    if (kid1.vehicleId === kid2.vehicleId) {
        return {
            isValid: false,
            message: 'Kids have the same vehicle assignment - nothing to swap'
        };
    }

    return {
        isValid: true,
        message: 'Swap is valid',
        swapInfo: {
            kid1Name: `${kid1.personalInfo?.firstName || ''} ${kid1.personalInfo?.lastName || ''}`.trim(),
            kid2Name: `${kid2.personalInfo?.firstName || ''} ${kid2.personalInfo?.lastName || ''}`.trim(),
            kid1Vehicle: kid1.vehicleId,
            kid2Vehicle: kid2.vehicleId
        }
    };
};

/**
 * Get vehicle info for display in swap UI
 * @param {string} vehicleId - Vehicle ID
 * @param {Array} allVehicles - All vehicles data
 * @returns {Object|null} Vehicle display info
 */
export const getVehicleDisplayInfo = (vehicleId, allVehicles) => {
    if (!vehicleId) {
        return {
            id: null,
            displayName: 'No Vehicle Assigned',
            shortName: 'None',
            color: 'gray'
        };
    }

    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        return {
            id: vehicleId,
            displayName: 'Unknown Vehicle',
            shortName: 'Unknown',
            color: 'red'
        };
    }

    return {
        id: vehicleId,
        displayName: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
        shortName: `${vehicle.make} ${vehicle.model}`,
        licensePlate: vehicle.licensePlate,
        color: vehicle.active ? 'blue' : 'orange'
    };
};

/**
 * Create swap confirmation message
 * @param {Object} swapDetails - Swap details from validateSwap
 * @param {Array} allVehicles - All vehicles data
 * @param {Function} t - Translation function
 * @returns {string} Confirmation message
 */
export const createSwapConfirmationMessage = (swapDetails, allVehicles, t = null) => {
    const { kid1Name, kid2Name, kid1Vehicle, kid2Vehicle } = swapDetails.swapInfo;

    const vehicle1Info = getVehicleDisplayInfo(kid1Vehicle, allVehicles);
    const vehicle2Info = getVehicleDisplayInfo(kid2Vehicle, allVehicles);

    if (t) {
        return t('swap.confirmMessage',
            'Confirm Vehicle Swap:\n\n{kid1} will get: {vehicle2}\n{kid2} will get: {vehicle1}\n\nProceed with swap?',
            {
                kid1: kid1Name,
                kid2: kid2Name,
                vehicle1: vehicle1Info.displayName,
                vehicle2: vehicle2Info.displayName
            }
        );
    }

    return `Confirm Vehicle Swap:

${kid1Name} will get: ${vehicle2Info.displayName}
${kid2Name} will get: ${vehicle1Info.displayName}

Proceed with swap?`;
};