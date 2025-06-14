// src/services/kidService.js
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
    limit,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';


/**
 * Get all kids with optional filtering
 * @param {Object} filters - Optional filters for querying
 * @returns {Promise<Array>} Array of kids
 */
export const getAllKids = async (filters = {}) => {
    try {
        let kidsQuery = collection(db, 'kids');

        // Apply filters if provided
        if (filters.teamId) {
            kidsQuery = query(kidsQuery, where('teamId', '==', filters.teamId));
        }

        if (filters.instructorId) {
            kidsQuery = query(kidsQuery, where('instructorId', '==', filters.instructorId));
        }

        if (filters.parentId) {
            kidsQuery = query(kidsQuery, where('parentInfo.parentId', '==', filters.parentId));
        }

        // Always order by participant number
        kidsQuery = query(kidsQuery, orderBy('participantNumber', 'asc'));

        const querySnapshot = await getDocs(kidsQuery);
        const kids = [];

        querySnapshot.forEach((doc) => {
            kids.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return kids;
    } catch (error) {
        console.error('Error getting kids:', error);
        throw new Error(`Failed to fetch kids: ${error.message}`);
    }
};

/**
 * Get a single kid by ID
 * @param {string} kidId - The kid's document ID
 * @returns {Promise<Object|null>} Kid data or null if not found
 */
export const getKidById = async (kidId) => {
    try {
        const kidDoc = await getDoc(doc(db, 'kids', kidId));

        if (kidDoc.exists()) {
            return {
                id: kidDoc.id,
                ...kidDoc.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting kid:', error);
        throw new Error(`Failed to fetch kid: ${error.message}`);
    }
};

/**
 * Get kids by instructor ID (for instructor role)
 * @param {string} instructorId - The instructor's ID
 * @returns {Promise<Array>} Array of kids assigned to instructor
 */
export const getKidsByInstructor = async (instructorId) => {
    try {
        const kidsQuery = query(
            collection(db, 'kids'),
            where('instructorId', '==', instructorId),
            orderBy('participantNumber', 'asc')
        );

        const querySnapshot = await getDocs(kidsQuery);
        const kids = [];

        querySnapshot.forEach((doc) => {
            kids.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return kids;
    } catch (error) {
        console.error('Error getting kids by instructor:', error);
        throw new Error(`Failed to fetch instructor's kids: ${error.message}`);
    }
};

/**
 * Get kids by parent ID (for parent role)
 * @param {string} parentId - The parent's user ID
 * @returns {Promise<Array>} Array of kids belonging to parent
 */
export const getKidsByParent = async (parentId) => {
    try {
        const kidsQuery = query(
            collection(db, 'kids'),
            where('parentInfo.parentId', '==', parentId),
            orderBy('participantNumber', 'asc')
        );

        const querySnapshot = await getDocs(kidsQuery);
        const kids = [];

        querySnapshot.forEach((doc) => {
            kids.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return kids;
    } catch (error) {
        console.error('Error getting kids by parent:', error);
        throw new Error(`Failed to fetch parent's kids: ${error.message}`);
    }
};

/**
 * Add a new kid
 * @param {Object} kidData - The kid data to add
 * @returns {Promise<string>} The new kid's document ID
 */
export const addKid = async (kidData) => {
    try {
        // Ensure required structure
        const newKid = {
            participantNumber: kidData.participantNumber || '',
            personalInfo: {
                address: kidData.personalInfo?.address || '',
                dateOfBirth: kidData.personalInfo?.dateOfBirth || '',
                capabilities: kidData.personalInfo?.capabilities || '',
                announcersNotes: kidData.personalInfo?.announcersNotes || '',
                photo: kidData.personalInfo?.photo || ''
            },
            parentInfo: {
                name: kidData.parentInfo?.name || '',
                email: kidData.parentInfo?.email || '',
                phone: kidData.parentInfo?.phone || '',
                parentId: kidData.parentInfo?.parentId || '',
                grandparentsInfo: {
                    names: kidData.parentInfo?.grandparentsInfo?.names || '',
                    phone: kidData.parentInfo?.grandparentsInfo?.phone || ''
                }
            },
            comments: {
                parent: kidData.comments?.parent || '',
                organization: kidData.comments?.organization || '',
                teamLeader: kidData.comments?.teamLeader || '',
                familyContact: kidData.comments?.familyContact || ''
            },
            instructorComments: kidData.instructorComments || [],
            instructorId: kidData.instructorId || '',
            teamId: kidData.teamId || '',
            vehicleIds: kidData.vehicleIds || [],
            signedDeclaration: kidData.signedDeclaration || false,
            signedFormStatus: kidData.signedFormStatus || 'Pending',
            additionalComments: kidData.additionalComments || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'kids'), newKid);

        // Update team's kidIds array if teamId is provided
        if (newKid.teamId) {
            await updateTeamKidsList(newKid.teamId, docRef.id, 'add');
        }

        return docRef.id;
    } catch (error) {
        console.error('Error adding kid:', error);
        throw new Error(`Failed to add kid: ${error.message}`);
    }
};

/**
 * Update an existing kid
 * @param {string} kidId - The kid's document ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updateKid = async (kidId, updateData) => {
    try {
        const kidRef = doc(db, 'kids', kidId);

        // Get current kid data to check for team changes
        const currentKid = await getDoc(kidRef);
        const currentData = currentKid.data();

        const updatedData = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        await updateDoc(kidRef, updatedData);

        // Handle team changes
        if (updateData.teamId !== undefined && updateData.teamId !== currentData.teamId) {
            // Remove from old team
            if (currentData.teamId) {
                await updateTeamKidsList(currentData.teamId, kidId, 'remove');
            }

            // Add to new team
            if (updateData.teamId) {
                await updateTeamKidsList(updateData.teamId, kidId, 'add');
            }
        }

    } catch (error) {
        console.error('Error updating kid:', error);
        throw new Error(`Failed to update kid: ${error.message}`);
    }
};

export const updateKidTeam = async (kidId, teamId) => {
    try {
        const kidRef = doc(db, 'kids', kidId);

        await updateDoc(kidRef, {
            teamId: teamId || null, // null if removing from team
            updatedAt: new Date()
        });

        console.log(`✅ Updated kid ${kidId} team to ${teamId || 'no team'}`);
        return true;
    } catch (error) {
        console.error('Error updating kid team:', error);
        throw error;
    }
};

/**
 * Delete a kid
 * @param {string} kidId - The kid's document ID
 * @returns {Promise<void>}
 */
export const deleteKid = async (kidId) => {
    try {
        const kidRef = doc(db, 'kids', kidId);

        // Get kid data to handle team cleanup
        const kidDoc = await getDoc(kidRef);
        if (kidDoc.exists()) {
            const kidData = kidDoc.data();

            // Remove from team's kidIds array
            if (kidData.teamId) {
                await updateTeamKidsList(kidData.teamId, kidId, 'remove');
            }
        }

        await deleteDoc(kidRef);
    } catch (error) {
        console.error('Error deleting kid:', error);
        throw new Error(`Failed to delete kid: ${error.message}`);
    }
};

/**
 * Add instructor comment to a kid
 * @param {string} kidId - The kid's document ID
 * @param {string} instructorId - The instructor's ID
 * @param {string} comment - The comment text
 * @returns {Promise<void>}
 */
export const addInstructorComment = async (kidId, instructorId, comment) => {
    try {
        const kidRef = doc(db, 'kids', kidId);

        const newComment = {
            instructorId,
            comment,
            timestamp: serverTimestamp()
        };

        await updateDoc(kidRef, {
            instructorComments: arrayUnion(newComment),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error adding instructor comment:', error);
        throw new Error(`Failed to add comment: ${error.message}`);
    }
};

/**
 * Update a specific comment field (parent, organization, teamLeader, familyContact)
 * @param {string} kidId - The kid's document ID
 * @param {string} commentType - Type of comment (parent, organization, teamLeader, familyContact)
 * @param {string} comment - The comment text
 * @returns {Promise<void>}
 */
export const updateKidComment = async (kidId, commentType, comment) => {
    try {
        const kidRef = doc(db, 'kids', kidId);

        const updateData = {
            [`comments.${commentType}`]: comment,
            updatedAt: serverTimestamp()
        };

        await updateDoc(kidRef, updateData);
    } catch (error) {
        console.error('Error updating kid comment:', error);
        throw new Error(`Failed to update comment: ${error.message}`);
    }
};

/**
 * Get next available participant number
 * @returns {Promise<string>} Next participant number (padded with zeros)
 */
export const getNextParticipantNumber = async () => {
    try {
        const kidsQuery = query(
            collection(db, 'kids'),
            orderBy('participantNumber', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(kidsQuery);

        if (querySnapshot.empty) {
            return '001'; // First participant
        }

        const lastKid = querySnapshot.docs[0].data();
        const lastNumber = parseInt(lastKid.participantNumber) || 0;
        const nextNumber = lastNumber + 1;

        // Pad with zeros (001, 002, etc.)
        return nextNumber.toString().padStart(3, '0');
    } catch (error) {
        console.error('Error getting next participant number:', error);
        // Return a safe default
        return '001';
    }
};

/**
 * Helper function to update team's kidIds array
 * @param {string} teamId - The team's document ID
 * @param {string} kidId - The kid's document ID
 * @param {string} action - 'add' or 'remove'
 * @returns {Promise<void>}
 */
const updateTeamKidsList = async (teamId, kidId, action) => {
    try {
        const teamRef = doc(db, 'teams', teamId);

        if (action === 'add') {
            await updateDoc(teamRef, {
                kidIds: arrayUnion(kidId),
                updatedAt: serverTimestamp()
            });
        } else if (action === 'remove') {
            await updateDoc(teamRef, {
                kidIds: arrayRemove(kidId),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating team kids list:', error);
        // Don't throw here as it's a secondary operation
    }
};

/**
 * Search kids by name or participant number
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of matching kids
 */
export const searchKids = async (searchTerm, filters = {}) => {
    try {
        // For now, get all kids and filter on client side
        // Firestore doesn't have great text search capabilities
        const allKids = await getAllKids(filters);

        if (!searchTerm) return allKids;

        const searchLower = searchTerm.toLowerCase();

        return allKids.filter(kid => {
            const name = `${kid.personalInfo?.firstName || ''} ${kid.personalInfo?.lastName || ''}`.toLowerCase();
            const participantNumber = kid.participantNumber?.toLowerCase() || '';

            return name.includes(searchLower) || participantNumber.includes(searchLower);
        });
    } catch (error) {
        console.error('Error searching kids:', error);
        throw new Error(`Failed to search kids: ${error.message}`);
    }
};