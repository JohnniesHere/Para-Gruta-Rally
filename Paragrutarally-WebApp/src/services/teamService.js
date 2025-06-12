// src/services/teamService.js
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

/**
 * Get all teams with optional filtering
 * @param {Object} filters - Optional filters for querying
 * @returns {Promise<Array>} Array of teams
 */
export const getAllTeams = async (filters = {}) => {
    try {
        let teamsQuery = collection(db, 'teams');

        // Apply filters if provided
        if (filters.active !== undefined) {
            teamsQuery = query(teamsQuery, where('active', '==', filters.active));
        }

        if (filters.teamLeaderId) {
            teamsQuery = query(teamsQuery, where('teamLeaderId', '==', filters.teamLeaderId));
        }

        // Always order by name
        teamsQuery = query(teamsQuery, orderBy('name', 'asc'));

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
        console.error('Error getting teams:', error);
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
        console.error('Error getting team:', error);
        throw new Error(`Failed to fetch team: ${error.message}`);
    }
};

/**
 * Get teams where user is an instructor
 * @param {string} instructorId - The instructor's ID
 * @returns {Promise<Array>} Array of teams where user is instructor
 */
export const getTeamsByInstructor = async (instructorId) => {
    try {
        const teamsQuery = query(
            collection(db, 'teams'),
            where('instructorIds', 'array-contains', instructorId),
            orderBy('name', 'asc')
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
        console.error('Error getting teams by instructor:', error);
        throw new Error(`Failed to fetch instructor's teams: ${error.message}`);
    }
};

/**
 * Get team with detailed kids and instructors data
 * @param {string} teamId - The team's document ID
 * @returns {Promise<Object|null>} Team with populated data
 */
export const getTeamWithDetails = async (teamId) => {
    try {
        const team = await getTeamById(teamId);
        if (!team) return null;

        // Get kids data
        let kids = [];
        if (team.kidIds && team.kidIds.length > 0) {
            const kidsPromises = team.kidIds.map(kidId => getDoc(doc(db, 'kids', kidId)));
            const kidsSnapshots = await Promise.all(kidsPromises);

            kids = kidsSnapshots
                .filter(snapshot => snapshot.exists())
                .map(snapshot => ({
                    id: snapshot.id,
                    ...snapshot.data()
                }));
        }

        // Get instructors data
        let instructors = [];
        if (team.instructorIds && team.instructorIds.length > 0) {
            const instructorsPromises = team.instructorIds.map(instructorId =>
                getDoc(doc(db, 'instructors', instructorId))
            );
            const instructorsSnapshots = await Promise.all(instructorsPromises);

            instructors = instructorsSnapshots
                .filter(snapshot => snapshot.exists())
                .map(snapshot => ({
                    id: snapshot.id,
                    ...snapshot.data()
                }));
        }

        // Get team leader data
        let teamLeader = null;
        if (team.teamLeaderId) {
            const leaderDoc = await getDoc(doc(db, 'instructors', team.teamLeaderId));
            if (leaderDoc.exists()) {
                teamLeader = {
                    id: leaderDoc.id,
                    ...leaderDoc.data()
                };
            }
        }

        return {
            ...team,
            kids,
            instructors,
            teamLeader
        };
    } catch (error) {
        console.error('Error getting team with details:', error);
        throw new Error(`Failed to fetch team details: ${error.message}`);
    }
};

/**
 * Add a new team
 * @param {Object} teamData - The team data to add
 * @returns {Promise<string>} The new team's document ID
 */
export const addTeam = async (teamData) => {
    try {
        const newTeam = {
            name: teamData.name || '',
            active: teamData.active !== undefined ? teamData.active : true,
            instructorIds: teamData.instructorIds || [],
            kidIds: teamData.kidIds || [],
            teamLeaderId: teamData.teamLeaderId || '',
            maxCapacity: teamData.maxCapacity || 15, // Default capacity
            description: teamData.description || '',
            notes: teamData.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'teams'), newTeam);

        // Update instructors' teamId if provided
        if (newTeam.instructorIds.length > 0) {
            await updateInstructorsTeamAssignment(newTeam.instructorIds, docRef.id, 'add');
        }

        // Update kids' teamId if provided
        if (newTeam.kidIds.length > 0) {
            await updateKidsTeamAssignment(newTeam.kidIds, docRef.id);
        }

        return docRef.id;
    } catch (error) {
        console.error('Error adding team:', error);
        throw new Error(`Failed to add team: ${error.message}`);
    }
};

/**
 * Update an existing team
 * @param {string} teamId - The team's document ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updateTeam = async (teamId, updateData) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        // Get current team data to check for changes
        const currentTeam = await getDoc(teamRef);
        const currentData = currentTeam.data();

        const updatedData = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        await updateDoc(teamRef, updatedData);

        // Handle instructor changes
        if (updateData.instructorIds !== undefined) {
            const oldInstructorIds = currentData.instructorIds || [];
            const newInstructorIds = updateData.instructorIds || [];

            // Remove from old instructors
            const removedInstructors = oldInstructorIds.filter(id => !newInstructorIds.includes(id));
            if (removedInstructors.length > 0) {
                await updateInstructorsTeamAssignment(removedInstructors, teamId, 'remove');
            }

            // Add to new instructors
            const addedInstructors = newInstructorIds.filter(id => !oldInstructorIds.includes(id));
            if (addedInstructors.length > 0) {
                await updateInstructorsTeamAssignment(addedInstructors, teamId, 'add');
            }
        }

        // Handle kids changes
        if (updateData.kidIds !== undefined) {
            const oldKidIds = currentData.kidIds || [];
            const newKidIds = updateData.kidIds || [];

            // Update kids who were removed from team
            const removedKids = oldKidIds.filter(id => !newKidIds.includes(id));
            if (removedKids.length > 0) {
                await updateKidsTeamAssignment(removedKids, null);
            }

            // Update kids who were added to team
            const addedKids = newKidIds.filter(id => !oldKidIds.includes(id));
            if (addedKids.length > 0) {
                await updateKidsTeamAssignment(addedKids, teamId);
            }
        }

    } catch (error) {
        console.error('Error updating team:', error);
        throw new Error(`Failed to update team: ${error.message}`);
    }
};

/**
 * Delete a team
 * @param {string} teamId - The team's document ID
 * @returns {Promise<void>}
 */
export const deleteTeam = async (teamId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        // Get team data to handle cleanup
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
            const teamData = teamDoc.data();

            // Remove team assignment from instructors
            if (teamData.instructorIds && teamData.instructorIds.length > 0) {
                await updateInstructorsTeamAssignment(teamData.instructorIds, teamId, 'remove');
            }

            // Remove team assignment from kids
            if (teamData.kidIds && teamData.kidIds.length > 0) {
                await updateKidsTeamAssignment(teamData.kidIds, null);
            }
        }

        await deleteDoc(teamRef);
    } catch (error) {
        console.error('Error deleting team:', error);
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

        // Update the kid's teamId
        await updateKidsTeamAssignment([kidId], teamId);
    } catch (error) {
        console.error('Error adding kid to team:', error);
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

        // Remove the kid's teamId
        await updateKidsTeamAssignment([kidId], null);
    } catch (error) {
        console.error('Error removing kid from team:', error);
        throw new Error(`Failed to remove kid from team: ${error.message}`);
    }
};

/**
 * Add an instructor to a team
 * @param {string} teamId - The team's document ID
 * @param {string} instructorId - The instructor's document ID
 * @returns {Promise<void>}
 */
export const addInstructorToTeam = async (teamId, instructorId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        await updateDoc(teamRef, {
            instructorIds: arrayUnion(instructorId),
            updatedAt: serverTimestamp()
        });

        // Update the instructor's teamId
        await updateInstructorsTeamAssignment([instructorId], teamId, 'add');
    } catch (error) {
        console.error('Error adding instructor to team:', error);
        throw new Error(`Failed to add instructor to team: ${error.message}`);
    }
};

/**
 * Remove an instructor from a team
 * @param {string} teamId - The team's document ID
 * @param {string} instructorId - The instructor's document ID
 * @returns {Promise<void>}
 */
export const removeInstructorFromTeam = async (teamId, instructorId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        await updateDoc(teamRef, {
            instructorIds: arrayRemove(instructorId),
            updatedAt: serverTimestamp()
        });

        // Remove the instructor's teamId
        await updateInstructorsTeamAssignment([instructorId], teamId, 'remove');
    } catch (error) {
        console.error('Error removing instructor from team:', error);
        throw new Error(`Failed to remove instructor from team: ${error.message}`);
    }
};

/**
 * Get teams summary for dashboard
 * @returns {Promise<Object>} Teams summary data
 */
export const getTeamsSummary = async () => {
    try {
        const teams = await getAllTeams();

        const summary = {
            totalTeams: teams.length,
            activeTeams: teams.filter(team => team.active).length,
            totalKids: teams.reduce((sum, team) => sum + (team.kidIds?.length || 0), 0),
            totalInstructors: new Set(
                teams.flatMap(team => team.instructorIds || [])
            ).size,
            teamsList: teams.map(team => ({
                id: team.id,
                name: team.name,
                active: team.active,
                kidsCount: team.kidIds?.length || 0,
                instructorsCount: team.instructorIds?.length || 0,
                teamLeaderId: team.teamLeaderId
            }))
        };

        return summary;
    } catch (error) {
        console.error('Error getting teams summary:', error);
        throw new Error(`Failed to get teams summary: ${error.message}`);
    }
};

/**
 * Helper function to update instructors' team assignment
 * @param {Array} instructorIds - Array of instructor IDs
 * @param {string} teamId - The team's document ID
 * @param {string} action - 'add' or 'remove'
 * @returns {Promise<void>}
 */
const updateInstructorsTeamAssignment = async (instructorIds, teamId, action) => {
    try {
        const promises = instructorIds.map(async (instructorId) => {
            const instructorRef = doc(db, 'instructors', instructorId);

            if (action === 'add') {
                await updateDoc(instructorRef, {
                    teamId: teamId,
                    updatedAt: serverTimestamp()
                });
            } else if (action === 'remove') {
                await updateDoc(instructorRef, {
                    teamId: '',
                    updatedAt: serverTimestamp()
                });
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error updating instructors team assignment:', error);
        // Don't throw here as it's a secondary operation
    }
};

/**
 * Helper function to update kids' team assignment
 * @param {Array} kidIds - Array of kid IDs
 * @param {string|null} teamId - The team's document ID or null to remove
 * @returns {Promise<void>}
 */
const updateKidsTeamAssignment = async (kidIds, teamId) => {
    try {
        const promises = kidIds.map(async (kidId) => {
            const kidRef = doc(db, 'kids', kidId);
            await updateDoc(kidRef, {
                teamId: teamId || '',
                updatedAt: serverTimestamp()
            });
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error updating kids team assignment:', error);
        // Don't throw here as it's a secondary operation
    }
};

/**
 * Search teams by name
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of matching teams
 */
export const searchTeams = async (searchTerm, filters = {}) => {
    try {
        const allTeams = await getAllTeams(filters);

        if (!searchTerm) return allTeams;

        const searchLower = searchTerm.toLowerCase();

        return allTeams.filter(team => {
            const name = team.name?.toLowerCase() || '';
            return name.includes(searchLower);
        });
    } catch (error) {
        console.error('Error searching teams:', error);
        throw new Error(`Failed to search teams: ${error.message}`);
    }
};