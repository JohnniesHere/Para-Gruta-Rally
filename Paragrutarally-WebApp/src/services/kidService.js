// src/services/kidService.js - FIXED VERSION with Enhanced updateKid function
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
    createEmptyKid,
    validateKid,
    prepareKidForFirestore,
    convertFirestoreToKid,
    getKidFullName
} from '../schemas/kidSchema';

/**
 * Get the next available participant number
 * @returns {Promise<string>} Next participant number (e.g., "004")
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

        // Pad with zeros to make it 3 digits
        return nextNumber.toString().padStart(3, '0');
    } catch (error) {
        console.error('Error getting next participant number:', error);
        // Return a timestamp-based number as fallback
        const timestamp = Date.now().toString().slice(-3);
        return timestamp.padStart(3, '0');
    }
};

/**
 * Add a new kid to the database
 * @param {Object} kidData - Kid data from the form
 * @returns {Promise<string>} The ID of the created kid document
 */
export const addKid = async (kidData) => {
    try {
        // Validate the data first
        const validation = validateKid(kidData);
        if (!validation.isValid) {
            const errorMessages = Object.values(validation.errors).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
        }

        // Check if participant number is already taken
        const existingKidQuery = query(
            collection(db, 'kids'),
            where('participantNumber', '==', kidData.participantNumber)
        );
        const existingKidSnapshot = await getDocs(existingKidQuery);

        if (!existingKidSnapshot.empty) {
            // Get next available number
            const nextNumber = await getNextParticipantNumber();
            kidData.participantNumber = nextNumber;
            console.warn(`Participant number was taken, assigned new number: ${nextNumber}`);
        }

        // Prepare data for Firestore
        const preparedData = prepareKidForFirestore(kidData, false);

        console.log('Adding kid to Firestore:', preparedData);

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'kids'), preparedData);

        console.log('Kid added successfully with ID:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('Error adding kid:', error);
        throw new Error(`Failed to add kid: ${error.message}`);
    }
};

/**
 * Get a kid by ID
 * @param {string} kidId - The kid's document ID
 * @returns {Promise<Object>} Kid data
 */
export const getKidById = async (kidId) => {
    try {
        console.log('🔍 Getting kid by ID:', kidId);
        const kidDoc = await getDoc(doc(db, 'kids', kidId));

        if (!kidDoc.exists()) {
            throw new Error('Kid not found');
        }

        const kidData = convertFirestoreToKid(kidDoc);
        console.log('✅ Kid retrieved successfully:', kidData);
        return kidData;
    } catch (error) {
        console.error('❌ Error getting kid:', error);
        throw new Error(`Failed to get kid: ${error.message}`);
    }
};

/**
 * Update a kid - ENHANCED VERSION with better error handling
 * @param {string} kidId - The kid's document ID
 * @param {Object} updates - Updated kid data
 * @returns {Promise<Object>} Updated kid data
 */
export const updateKid = async (kidId, updates) => {
    try {
        console.log('🔄 Starting kid update for ID:', kidId);
        console.log('📝 Update data received:', updates);

        // Validate the updated data
        console.log('🔍 Validating update data...');
        const validation = validateKid(updates);

        if (!validation.isValid) {
            console.error('❌ Validation failed:', validation.errors);
            const errorMessages = Object.values(validation.errors).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
        }

        console.log('✅ Validation passed');

        // Prepare data for Firestore
        console.log('🔧 Preparing data for Firestore...');
        const preparedData = prepareKidForFirestore(updates, true);
        console.log('📦 Prepared data:', preparedData);

        // Update in Firestore
        console.log('💾 Updating document in Firestore...');
        const kidRef = doc(db, 'kids', kidId);
        await updateDoc(kidRef, preparedData);

        console.log('✅ Kid updated successfully in Firestore');

        // Fetch and return the updated document to verify
        console.log('🔍 Fetching updated document...');
        const updatedDoc = await getDoc(kidRef);

        if (!updatedDoc.exists()) {
            throw new Error('Kid document not found after update');
        }

        const updatedKidData = convertFirestoreToKid(updatedDoc);
        console.log('✅ Update complete. Final data:', updatedKidData);

        return updatedKidData;

    } catch (error) {
        console.error('❌ Error updating kid:', error);

        // Provide more specific error messages
        if (error.code === 'permission-denied') {
            throw new Error('Permission denied. You do not have access to update this kid.');
        } else if (error.code === 'not-found') {
            throw new Error('Kid not found. It may have been deleted.');
        } else if (error.code === 'unavailable') {
            throw new Error('Database temporarily unavailable. Please try again.');
        } else if (error.message.includes('Validation failed')) {
            // Re-throw validation errors as-is
            throw error;
        } else {
            throw new Error(`Failed to update kid: ${error.message}`);
        }
    }
};

/**
 * Delete a kid
 * @param {string} kidId - The kid's document ID
 * @returns {Promise<void>}
 */
export const deleteKid = async (kidId) => {
    try {
        await deleteDoc(doc(db, 'kids', kidId));
        console.log('Kid deleted successfully');
    } catch (error) {
        console.error('Error deleting kid:', error);
        throw new Error(`Failed to delete kid: ${error.message}`);
    }
};

/**
 * Get all kids
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of kids
 */
export const getAllKids = async (options = {}) => {
    try {
        let kidsQuery = collection(db, 'kids');

        // Add ordering
        if (options.orderBy) {
            kidsQuery = query(kidsQuery, orderBy(options.orderBy, options.order || 'asc'));
        } else {
            // Default ordering by participant number
            kidsQuery = query(kidsQuery, orderBy('participantNumber', 'asc'));
        }

        // Add limit if specified
        if (options.limit) {
            kidsQuery = query(kidsQuery, limit(options.limit));
        }

        const querySnapshot = await getDocs(kidsQuery);

        return querySnapshot.docs.map(doc => convertFirestoreToKid(doc));
    } catch (error) {
        console.error('Error getting kids:', error);
        throw new Error(`Failed to get kids: ${error.message}`);
    }
};

/**
 * Get kids by team
 * @param {string} teamId - The team's document ID
 * @returns {Promise<Array>} Array of kids in the team
 */
export const getKidsByTeam = async (teamId) => {
    try {
        const kidsQuery = query(
            collection(db, 'kids'),
            where('teamId', '==', teamId),
            orderBy('participantNumber', 'asc')
        );

        const querySnapshot = await getDocs(kidsQuery);

        return querySnapshot.docs.map(doc => convertFirestoreToKid(doc));
    } catch (error) {
        console.error('Error getting kids by team:', error);
        throw new Error(`Failed to get kids by team: ${error.message}`);
    }
};

/**
 * Get kids by instructor
 * @param {string} instructorId - The instructor's document ID
 * @returns {Promise<Array>} Array of kids with the instructor
 */
export const getKidsByInstructor = async (instructorId) => {
    try {
        const kidsQuery = query(
            collection(db, 'kids'),
            where('instructorId', '==', instructorId),
            orderBy('participantNumber', 'asc')
        );

        const querySnapshot = await getDocs(kidsQuery);

        return querySnapshot.docs.map(doc => convertFirestoreToKid(doc));
    } catch (error) {
        console.error('Error getting kids by instructor:', error);
        throw new Error(`Failed to get kids by instructor: ${error.message}`);
    }
};

/**
 * Search kids by name or participant number
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching kids
 */
export const searchKids = async (searchTerm) => {
    try {
        // Get all kids and filter in memory (Firestore has limited text search)
        const allKids = await getAllKids();

        const searchLower = searchTerm.toLowerCase();

        return allKids.filter(kid => {
            const fullName = getKidFullName(kid).toLowerCase();
            const participantNumber = kid.participantNumber?.toLowerCase() || '';

            return fullName.includes(searchLower) ||
                participantNumber.includes(searchLower);
        });
    } catch (error) {
        console.error('Error searching kids:', error);
        throw new Error(`Failed to search kids: ${error.message}`);
    }
};

/**
 * Update a kid's team assignment
 * @param {string} kidId - The kid's document ID
 * @param {string|null} teamId - The new team ID (null to remove team)
 * @returns {Promise<void>}
 */
export const updateKidTeam = async (kidId, teamId) => {
    try {
        const updateData = {
            teamId: teamId || null,
            updatedAt: Timestamp.now()
        };

        await updateDoc(doc(db, 'kids', kidId), updateData);
        console.log(`Kid team updated successfully: ${kidId} -> ${teamId || 'No Team'}`);
    } catch (error) {
        console.error('Error updating kid team:', error);
        throw new Error(`Failed to update kid team: ${error.message}`);
    }
};

/**
 * Get kids by parent
 * @param {string} parentId - The parent's user ID
 * @returns {Promise<Array>} Array of kids belonging to the parent
 */
export const getKidsByParent = async (parentId) => {
    try {
        const kidsQuery = query(
            collection(db, 'kids'),
            where('parentInfo.parentId', '==', parentId),
            orderBy('participantNumber', 'asc')
        );

        const querySnapshot = await getDocs(kidsQuery);

        return querySnapshot.docs.map(doc => convertFirestoreToKid(doc));
    } catch (error) {
        console.error('Error getting kids by parent:', error);
        throw new Error(`Failed to get kids by parent: ${error.message}`);
    }
};

export const getKidsStats = async () => {
    try {
        const allKids = await getAllKids();

        const stats = {
            total: allKids.length,
            byStatus: {},
            byTeam: {},
            averageAge: 0,
            signedDeclarations: 0
        };

        let totalAge = 0;
        let kidsWithAge = 0;

        allKids.forEach(kid => {
            // Count by status
            const status = kid.signedFormStatus || 'pending';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Count by team
            if (kid.teamId) {
                stats.byTeam[kid.teamId] = (stats.byTeam[kid.teamId] || 0) + 1;
            }

            // Calculate age
            if (kid.personalInfo?.dateOfBirth) {
                const birthDate = new Date(kid.personalInfo.dateOfBirth);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                if (age > 0 && age < 100) { // Sanity check
                    totalAge += age;
                    kidsWithAge++;
                }
            }

            // Count signed declarations
            if (kid.signedDeclaration) {
                stats.signedDeclarations++;
            }
        });

        if (kidsWithAge > 0) {
            stats.averageAge = Math.round(totalAge / kidsWithAge);
        }

        return stats;
    } catch (error) {
        console.error('Error getting kids stats:', error);
        throw new Error(`Failed to get kids statistics: ${error.message}`);
    }
};

// Export all functions
export default {
    getNextParticipantNumber,
    addKid,
    getKidById,
    updateKid,
    updateKidTeam,
    deleteKid,
    getAllKids,
    getKidsByTeam,
    getKidsByInstructor,
    getKidsByParent,
    searchKids,
    getKidsStats
};