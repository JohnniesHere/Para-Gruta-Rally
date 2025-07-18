// src/services/teamService.js - Updated with Vehicle Assignment Support
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
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { createEmptyTeam, validateTeam } from '../schemas/teamSchema';

/**
 * Get all teams with optional filtering
 * Handles empty collection gracefully
 * @param {Object} filters - Optional filters for querying
 * @returns {Promise<Array>} Array of teams
 */
export const getAllTeams = async (filters = {}) => {
    try {
        // Start with basic collection reference
        let teamsQuery = collection(db, 'teams');

        // Apply filters if provided
        if (filters.instructorId) {
            teamsQuery = query(teamsQuery, where('teamLeaderId', '==', filters.instructorId));
        }

        if (filters.active !== undefined) {
            teamsQuery = query(teamsQuery, where('active', '==', filters.active));
        }

        // Try to add ordering - handle empty collection case
        try {
            teamsQuery = query(teamsQuery, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(teamsQuery);

            const teams = [];
            querySnapshot.forEach((doc) => {
                teams.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return teams;

        } catch (orderError) {
            // If ordering fails (likely because collection is empty), try without ordering
            const querySnapshot = await getDocs(collection(db, 'teams'));
            const teams = [];

            querySnapshot.forEach((doc) => {
                teams.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return teams;
        }

    } catch (error) {
        // If collection doesn't exist, return empty array
        if (error.code === 'not-found' || error.message.includes('collection')) {
            return [];
        }

        throw new Error(`Failed to fetch teams: ${error.message}`);
    }
};

/**
 * Get a single team by ID
 * @param {string} teamId - The team's document ID
 * @returns {Promise<Object|null>} Team data or null if not found
 */
export const getTeamById = async (teamId) => {
    try {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));

        if (teamDoc.exists()) {
            return {
                id: teamDoc.id,
                ...teamDoc.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting team:', error);
        throw new Error(`Failed to fetch team: ${error.message}`);
    }
};

/**
 * Get user by ID from users collection (instructor/team leader)
 * @param {string} userId - The user's document ID
 * @returns {Promise<Object|null>} User data formatted for team display
 */
const getUserById = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
                id: userDoc.id,
                name: userData.displayName || userData.name || userData.email || 'Unknown User',
                displayName: userData.displayName,
                fullName: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        return null;
    }
};

/**
 * Get vehicle by ID from vehicles collection
 * @param {string} vehicleId - The vehicle's document ID
 * @returns {Promise<Object|null>} Vehicle data formatted for team display
 */
const getVehicleById = async (vehicleId) => {
    try {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
        if (vehicleDoc.exists()) {
            const vehicleData = vehicleDoc.data();
            return {
                id: vehicleDoc.id,
                ...vehicleData,
                // Safe timestamp conversion
                createdAt: vehicleData.createdAt?.toDate ? vehicleData.createdAt.toDate() : (vehicleData.createdAt || null),
                updatedAt: vehicleData.updatedAt?.toDate ? vehicleData.updatedAt.toDate() : (vehicleData.updatedAt || null)
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Error fetching vehicle:', error);
        return null;
    }
};

/**
 * Get a team with detailed information (kids, instructors, team leader, vehicles)
 * UPDATED VERSION - Now includes vehicle details
 * @param {string} teamId - The team's document ID
 * @returns {Promise<Object|null>} Team data with details or null if not found
 */
export const getTeamWithDetails = async (teamId) => {
    try {
        // Get the basic team data
        const team = await getTeamById(teamId);
        if (!team) {
            return null;
        }

        // Initialize the detailed team object
        const teamWithDetails = {
            ...team,
            kids: [],
            instructors: [],
            teamLeader: null,
            vehicles: [] // NEW: Include vehicles array
        };

        // Fetch kids assigned to this team by kidIds array
        if (team.kidIds && team.kidIds.length > 0) {
            try {
                const kidsPromises = team.kidIds.map(async (kidId) => {
                    try {
                        const kidDoc = await getDoc(doc(db, 'kids', kidId));
                        if (kidDoc.exists()) {
                            return {
                                id: kidDoc.id,
                                ...kidDoc.data()
                            };
                        }
                        console.warn(`⚠️ Kid with ID ${kidId} not found`);
                        return null;
                    } catch (error) {
                        console.warn(`⚠️ Error fetching kid ${kidId}:`, error);
                        return null;
                    }
                });

                const kidsResults = await Promise.all(kidsPromises);
                teamWithDetails.kids = kidsResults.filter(kid => kid !== null);
            } catch (kidError) {
                console.warn('⚠️ Could not load kids:', kidError);
                teamWithDetails.kids = [];
            }
        }

        // Fetch instructors from users collection (based on instructorIds array)
        if (team.instructorIds && team.instructorIds.length > 0) {
            try {
                const instructorsPromises = team.instructorIds.map(instructorId => getUserById(instructorId));
                const instructorsResults = await Promise.all(instructorsPromises);
                teamWithDetails.instructors = instructorsResults.filter(instructor => instructor !== null);
            } catch (instructorError) {
                console.warn('⚠️ Could not load instructors:', instructorError);
                teamWithDetails.instructors = [];
            }
        }

        // Get team leader if specified
        if (team.teamLeaderId) {
            try {
                const leader = await getUserById(team.teamLeaderId);
                if (leader) {
                    teamWithDetails.teamLeader = leader;
                }
            } catch (leaderError) {
                console.warn('⚠️ Could not load team leader:', leaderError);
            }
        }

        // NEW: Fetch vehicles assigned to this team
        if (team.vehicleIds && team.vehicleIds.length > 0) {
            try {
                const vehiclesPromises = team.vehicleIds.map(vehicleId => getVehicleById(vehicleId));
                const vehiclesResults = await Promise.all(vehiclesPromises);
                teamWithDetails.vehicles = vehiclesResults.filter(vehicle => vehicle !== null);
            } catch (vehicleError) {
                console.warn('⚠️ Could not load vehicles:', vehicleError);
                teamWithDetails.vehicles = [];
            }
        }

        return teamWithDetails;
    } catch (error) {
        console.error('💥 Error getting team with details:', error);
        throw new Error(`Failed to fetch team details: ${error.message}`);
    }
};

/**
 * Get teams by instructor ID (for instructor role)
 * @param {string} instructorId - The instructor's ID
 * @returns {Promise<Array>} Array of teams assigned to instructor
 */
export const getTeamsByInstructor = async (instructorId) => {
    try {
        const teamsQuery = query(
            collection(db, 'teams'),
            where('instructorIds', 'array-contains', instructorId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(teamsQuery);
        const teams = [];

        querySnapshot.forEach((doc) => {
            teams.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return teams;
    } catch (error) {
        console.error('❌ Error getting teams by instructor:', error);
        throw new Error(`Failed to fetch instructor's teams: ${error.message}`);
    }
};

/**
 * Get all instructors from users collection
 * @returns {Promise<Array>} Array of users with instructor role
 */
export const getAllInstructors = async () => {
    try {
        const instructorsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'instructor')
        );

        const querySnapshot = await getDocs(instructorsQuery);
        const instructors = [];

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            instructors.push({
                id: doc.id,
                name: userData.displayName || userData.name || userData.email || 'Unknown Instructor',
                displayName: userData.displayName,
                fullName: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                ...userData // Include all other user data
            });
        });

        return instructors;
    } catch (error) {
        console.error('❌ Error getting instructors:', error);
        throw new Error(`Failed to fetch instructors: ${error.message}`);
    }
};

/**
 * Add a new team with schema validation
 * Handles creating the collection if it doesn't exist
 * @param {Object} teamData - The team data to add
 * @returns {Promise<string>} The new team's document ID
 */
export const addTeam = async (teamData) => {
    try {
        // Validate team data using schema
        const validation = validateTeam(teamData, false); // false = not an update

        if (!validation.isValid) {
            console.error('❌ Team validation failed:', validation.errors);
            throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
        }

        // Prepare team data with timestamps
        const newTeam = {
            ...validation.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // This will create the collection if it doesn't exist
        const docRef = await addDoc(collection(db, 'teams'), newTeam);

        // Handle vehicle assignments if any were specified
        if (newTeam.vehicleIds && newTeam.vehicleIds.length > 0) {
            try {
                const { updateTeamVehicleAssignments } = await import('./vehicleAssignmentService');
                await updateTeamVehicleAssignments(docRef.id, newTeam.vehicleIds, []);
            } catch (vehicleError) {
                console.warn('⚠️ Failed to assign vehicles during team creation:', vehicleError);
                // Don't fail team creation if vehicle assignment fails
            }
        }

        return docRef.id;

    } catch (error) {
        console.error('❌ Error adding team:', error);
        throw new Error(`Failed to add team: ${error.message}`);
    }
};

/**
 * Update an existing team with schema validation
 * UPDATED VERSION - Now handles vehicle assignment changes
 * @param {string} teamId - The team's document ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updateTeam = async (teamId, updateData) => {
    try {
        // Get current team data to compare vehicle assignments
        const currentTeam = await getTeamById(teamId);
        if (!currentTeam) {
            throw new Error('Team not found');
        }

        // Validate team data using schema
        const validation = validateTeam(updateData, true); // true = is an update

        if (!validation.isValid) {
            console.error('❌ Team validation failed:', validation.errors);
            throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
        }

        const teamRef = doc(db, 'teams', teamId);

        const updatedData = {
            ...validation.data,
            updatedAt: serverTimestamp()
        };

        // Update the team document
        await updateDoc(teamRef, updatedData);

        // Handle vehicle assignment changes if vehicleIds were updated
        if ('vehicleIds' in updatedData) {
            const oldVehicleIds = currentTeam.vehicleIds || [];
            const newVehicleIds = updatedData.vehicleIds || [];

            if (JSON.stringify(oldVehicleIds.sort()) !== JSON.stringify(newVehicleIds.sort())) {
                try {
                    const { updateTeamVehicleAssignments } = await import('./vehicleAssignmentService');
                    await updateTeamVehicleAssignments(teamId, newVehicleIds, oldVehicleIds);
                } catch (vehicleError) {
                    console.warn('⚠️ Failed to update vehicle assignments during team update:', vehicleError);
                    // Don't fail team update if vehicle assignment fails
                }
            }
        }

    } catch (error) {
        console.error('❌ Error updating team:', error);
        throw new Error(`Failed to update team: ${error.message}`);
    }
};

/**
 * Delete a team
 * UPDATED VERSION - Now handles vehicle cleanup
 * @param {string} teamId - The team's document ID
 * @returns {Promise<void>}
 */
export const deleteTeam = async (teamId) => {
    try {
        // Get team data before deletion to handle cleanup
        const team = await getTeamById(teamId);

        if (team) {
            // Handle vehicle assignment cleanup
            if (team.vehicleIds && team.vehicleIds.length > 0) {
                try {
                    const { updateTeamVehicleAssignments } = await import('./vehicleAssignmentService');
                    await updateTeamVehicleAssignments(teamId, [], team.vehicleIds);
                } catch (vehicleError) {
                    console.warn('⚠️ Failed to clean up vehicle assignments during team deletion:', vehicleError);
                }
            }

            // Reset team assignment for all kids in this team
            if (team.kidIds && team.kidIds.length > 0) {
                try {
                    const kidUpdatePromises = team.kidIds.map(async (kidId) => {
                        try {
                            const kidRef = doc(db, 'kids', kidId);
                            await updateDoc(kidRef, {
                                teamId: null,
                                vehicleId: null, // Also reset vehicle assignment
                                updatedAt: serverTimestamp()
                            });
                        } catch (error) {
                            console.warn(`⚠️ Failed to reset team assignment for kid ${kidId}:`, error);
                        }
                    });
                    await Promise.all(kidUpdatePromises);
                } catch (kidError) {
                    console.warn('⚠️ Failed to reset kid team assignments during team deletion:', kidError);
                }
            }
        }

        // Delete the team document
        const teamRef = doc(db, 'teams', teamId);
        await deleteDoc(teamRef);

    } catch (error) {
        console.error('❌ Error deleting team:', error);
        throw new Error(`Failed to delete team: ${error.message}`);
    }
};

/**
 * Add a kid to a team
 * @param {string} teamId - The team's document ID
 * @param {string} kidId - The kid's document ID
 * @returns {Promise<void>}
 */
export const addKidToTeam = async (teamId, kidId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        await updateDoc(teamRef, {
            kidIds: arrayUnion(kidId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('❌ Error adding kid to team:', error);
        throw new Error(`Failed to add kid to team: ${error.message}`);
    }
};

/**
 * Remove a kid from a team
 * @param {string} teamId - The team's document ID
 * @param {string} kidId - The kid's document ID
 * @returns {Promise<void>}
 */
export const removeKidFromTeam = async (teamId, kidId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        await updateDoc(teamRef, {
            kidIds: arrayRemove(kidId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('❌ Error removing kid from team:', error);
        throw new Error(`Failed to remove kid from team: ${error.message}`);
    }
};

/**
 * Add a vehicle to a team (used by vehicleAssignmentService)
 * @param {string} teamId - The team's document ID
 * @param {string} vehicleId - The vehicle's document ID
 * @returns {Promise<void>}
 */
export const addVehicleToTeam = async (teamId, vehicleId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        await updateDoc(teamRef, {
            vehicleIds: arrayUnion(vehicleId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('❌ Error adding vehicle to team:', error);
        throw new Error(`Failed to add vehicle to team: ${error.message}`);
    }
};

/**
 * Remove a vehicle from a team (used by vehicleAssignmentService)
 * @param {string} teamId - The team's document ID
 * @param {string} vehicleId - The vehicle's document ID
 * @returns {Promise<void>}
 */
export const removeVehicleFromTeam = async (teamId, vehicleId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        await updateDoc(teamRef, {
            vehicleIds: arrayRemove(vehicleId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('❌ Error removing vehicle from team:', error);
        throw new Error(`Failed to remove vehicle from team: ${error.message}`);
    }
};

/**
 * Update a kid's team assignment (for the TeamChangeModal and EditKidPage)
 * This function ONLY handles team array management, NOT the kid document
 * The kid document should be updated separately
 * @param {string} kidId - The kid's document ID
 * @param {string|null} newTeamId - The new team ID, or null to remove from team
 * @param {string|null} currentTeamId - The current team ID (to avoid extra database reads)
 * @returns {Promise<void>}
 */
export const updateKidTeam = async (kidId, newTeamId, currentTeamId = null) => {
    try {
        // If we don't know the current team, get it from the kid document
        let oldTeamId = currentTeamId;
        if (oldTeamId === null) {
            const kidDoc = await getDoc(doc(db, 'kids', kidId));
            if (kidDoc.exists()) {
                oldTeamId = kidDoc.data().teamId || null;
            }
        }

        // Skip if no change
        if (oldTeamId === newTeamId) {
            return;
        }

        // Remove kid from current team if they have one
        if (oldTeamId) {
            try {
                await removeKidFromTeam(oldTeamId, kidId);
            } catch (removeError) {
                console.warn('⚠️ Failed to remove from old team:', removeError.message);
                // Continue anyway - the add operation might still work
            }
        }

        // Add kid to new team if specified
        if (newTeamId) {
            try {
                await addKidToTeam(newTeamId, kidId);
            } catch (addError) {
                console.error('❌ Failed to add to new team:', addError.message);
                throw addError; // This is more critical - throw the error
            }
        }

    } catch (error) {
        console.error('❌ Error updating kid team assignments:', error);
        throw new Error(`Failed to update team assignments: ${error.message}`);
    }
};

/**
 * Search teams by name or description
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of matching teams
 */
export const searchTeams = async (searchTerm, filters = {}) => {
    try {
        // For now, get all teams and filter on client side
        // Firestore doesn't have great text search capabilities
        const allTeams = await getAllTeams(filters);

        if (!searchTerm) return allTeams;

        const searchLower = searchTerm.toLowerCase();

        return allTeams.filter(team => {
            const name = team.name?.toLowerCase() || '';
            const description = team.description?.toLowerCase() || '';

            return name.includes(searchLower) || description.includes(searchLower);
        });
    } catch (error) {
        console.error('❌ Error searching teams:', error);
        throw new Error(`Failed to search teams: ${error.message}`);
    }
};

/**
 * Get teams summary statistics
 * @returns {Promise<Object>} Summary statistics
 */
export const getTeamsSummary = async () => {
    try {
        const teams = await getAllTeams();

        return {
            total: teams.length,
            active: teams.filter(t => t.active !== false).length,
            withInstructors: teams.filter(t => t.instructorIds && t.instructorIds.length > 0).length,
            withVehicles: teams.filter(t => t.vehicleIds && t.vehicleIds.length > 0).length, // NEW: Count teams with vehicles
            averageKidsPerTeam: teams.length > 0 ?
                Math.round(teams.reduce((sum, t) => sum + (t.kidIds?.length || 0), 0) / teams.length) : 0,
            averageVehiclesPerTeam: teams.length > 0 ?
                Math.round(teams.reduce((sum, t) => sum + (t.vehicleIds?.length || 0), 0) / teams.length) : 0 // NEW: Average vehicles per team
        };
    } catch (error) {
        console.error('❌ Error getting teams summary:', error);
        throw new Error(`Failed to get teams summary: ${error.message}`);
    }
};