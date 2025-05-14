// src/firebase/services/instructors.js
// Instructors management service for Firestore

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Create or update an instructor profile
 * @param {string} userId - User ID (must match a user in auth)
 * @param {Object} instructorData - Instructor profile data
 * @returns {Promise} - Instructor data
 */
export const upsertInstructor = async (userId, instructorData) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);
        
        // Set defaults and metadata
        const instructor = {
            ...instructorData,
            userId,
            updatedAt: serverTimestamp()
        };
        
        if (!instructorSnap.exists()) {
            // Create new instructor
            instructor.createdAt = serverTimestamp();
            instructor.isActive = instructorData.isActive !== undefined ? instructorData.isActive : true;
            
            await setDoc(instructorRef, instructor);
        } else {
            // Update existing instructor
            const { createdAt, ...updateData } = instructor;
            await updateDoc(instructorRef, updateData);
        }
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Get an instructor by user ID
 * @param {string} userId - User ID
 * @returns {Promise} - Instructor data
 */
export const getInstructor = async (userId) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);

        if (instructorSnap.exists()) {
            return { id: instructorSnap.id, ...instructorSnap.data() };
        } else {
            throw new Error('Instructor profile not found');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Update an instructor's active status
 * @param {string} userId - User ID
 * @param {boolean} isActive - Active status
 * @returns {Promise} - Updated instructor data
 */
export const updateInstructorStatus = async (userId, isActive) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        
        await updateDoc(instructorRef, {
            isActive,
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all instructors with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise} - Array of instructors
 */
export const getInstructors = async (options = {}) => {
    try {
        const {
            isActive,
            specialties,
            orderField = 'lastName',
            orderDirection = 'asc',
            limitCount = 50,
            lastVisible = null
        } = options;

        // Start building the query
        let instructorsQuery = collection(db, 'instructors');
        const queryConstraints = [];

        // Add filters if provided
        if (isActive !== undefined) {
            queryConstraints.push(where('isActive', '==', isActive));
        }

        if (specialties && specialties.length > 0) {
            // This only works for exact specialty match
            queryConstraints.push(where('specialties', 'array-contains-any', specialties));
        }

        // Add ordering
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount));
        
        // Add pagination if a last document is provided
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        // Build the final query
        const q = query(instructorsQuery, ...queryConstraints);
        
        // Execute the query
        const querySnapshot = await getDocs(q);
        
        // Transform the results
        const instructors = [];
        querySnapshot.forEach(doc => {
            instructors.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Return the results with the last visible document for pagination
        return {
            instructors,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Add a certification to an instructor's profile
 * @param {string} userId - User ID
 * @param {Object} certification - Certification data
 * @returns {Promise} - Updated instructor data
 */
export const addInstructorCertification = async (userId, certification) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);
        
        if (!instructorSnap.exists()) {
            throw new Error('Instructor profile not found');
        }
        
        // Generate a unique ID for this certification
        certification.id = Date.now().toString();
        
        // Update certifications array
        const certifications = instructorSnap.data().certifications || [];
        
        await updateDoc(instructorRef, {
            certifications: [...certifications, certification],
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Update an instructor's certification
 * @param {string} userId - User ID
 * @param {string} certificationId - Certification ID
 * @param {Object} updatedCertification - Updated certification data
 * @returns {Promise} - Updated instructor data
 */
export const updateInstructorCertification = async (userId, certificationId, updatedCertification) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);
        
        if (!instructorSnap.exists()) {
            throw new Error('Instructor profile not found');
        }
        
        // Update the specific certification in the array
        const certifications = instructorSnap.data().certifications || [];
        const updatedCertifications = certifications.map(cert => {
            if (cert.id === certificationId) {
                return { ...cert, ...updatedCertification, id: certificationId };
            }
            return cert;
        });
        
        await updateDoc(instructorRef, {
            certifications: updatedCertifications,
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Remove a certification from an instructor's profile
 * @param {string} userId - User ID
 * @param {string} certificationId - Certification ID to remove
 * @returns {Promise} - Updated instructor data
 */
export const removeInstructorCertification = async (userId, certificationId) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);
        
        if (!instructorSnap.exists()) {
            throw new Error('Instructor profile not found');
        }
        
        // Filter out the certification by ID
        const certifications = instructorSnap.data().certifications || [];
        const updatedCertifications = certifications.filter(cert => cert.id !== certificationId);
        
        await updateDoc(instructorRef, {
            certifications: updatedCertifications,
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Update an instructor's background check date
 * @param {string} userId - User ID
 * @param {Date} backgroundCheckDate - Background check date
 * @returns {Promise} - Updated instructor data
 */
export const updateBackgroundCheckDate = async (userId, backgroundCheckDate) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        
        await updateDoc(instructorRef, {
            backgroundCheckDate,
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Assign an instructor to a team
 * @param {string} userId - Instructor User ID
 * @param {string} teamId - Team ID
 * @returns {Promise} - Updated instructor data
 */
export const assignInstructorToTeam = async (userId, teamId) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);
        
        if (!instructorSnap.exists()) {
            throw new Error('Instructor profile not found');
        }
        
        // Get the current assigned teams
        const assignedTeamIds = instructorSnap.data().assignedTeamIds || [];
        
        // If already assigned, no need to update
        if (assignedTeamIds.includes(teamId)) {
            return await getInstructor(userId);
        }
        
        // Update the team assignments
        await updateDoc(instructorRef, {
            assignedTeamIds: arrayUnion(teamId),
            updatedAt: serverTimestamp()
        });
        
        // Also update the team document to add this instructor
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            instructorIds: arrayUnion(userId),
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Remove an instructor from a team
 * @param {string} userId - Instructor User ID
 * @param {string} teamId - Team ID
 * @returns {Promise} - Updated instructor data
 */
export const removeInstructorFromTeam = async (userId, teamId) => {
    try {
        const instructorRef = doc(db, 'instructors', userId);
        const instructorSnap = await getDoc(instructorRef);
        
        if (!instructorSnap.exists()) {
            throw new Error('Instructor profile not found');
        }
        
        // Get the current assigned teams
        const assignedTeamIds = instructorSnap.data().assignedTeamIds || [];
        
        // If not assigned, no need to update
        if (!assignedTeamIds.includes(teamId)) {
            return await getInstructor(userId);
        }
        
        // Update the team assignments
        await updateDoc(instructorRef, {
            assignedTeamIds: arrayRemove(teamId),
            updatedAt: serverTimestamp()
        });
        
        // Also update the team document to remove this instructor
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            instructorIds: arrayRemove(userId),
            updatedAt: serverTimestamp()
        });
        
        return await getInstructor(userId);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all teams assigned to an instructor
 * @param {string} userId - Instructor User ID
 * @returns {Promise} - Array of teams
 */
export const getInstructorTeams = async (userId) => {
    try {
        const instructorSnap = await getDoc(doc(db, 'instructors', userId));
        
        if (!instructorSnap.exists()) {
            throw new Error('Instructor profile not found');
        }
        
        const assignedTeamIds = instructorSnap.data().assignedTeamIds || [];
        
        if (assignedTeamIds.length === 0) {
            return [];
        }
        
        // Handle Firestore's "in" operator limit (max 10 values)
        const teams = [];
        for (let i = 0; i < assignedTeamIds.length; i += 10) {
            const batch = assignedTeamIds.slice(i, i + 10);
            const q = query(
                collection(db, 'teams'),
                where('__name__', 'in', batch)
            );
            
            const snapshot = await getDocs(q);
            
            snapshot.forEach(doc => {
                teams.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        return teams;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all instructors assigned to a team
 * @param {string} teamId - Team ID
 * @returns {Promise} - Array of instructors
 */
export const getTeamInstructors = async (teamId) => {
    try {
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        
        if (!teamSnap.exists()) {
            throw new Error('Team not found');
        }
        
        const instructorIds = teamSnap.data().instructorIds || [];
        
        if (instructorIds.length === 0) {
            return [];
        }
        
        // Handle Firestore's "in" operator limit (max 10 values)
        const instructors = [];
        for (let i = 0; i < instructorIds.length; i += 10) {
            const batch = instructorIds.slice(i, i + 10);
            const q = query(
                collection(db, 'instructors'),
                where('__name__', 'in', batch)
            );
            
            const snapshot = await getDocs(q);
            
            snapshot.forEach(doc => {
                instructors.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        return instructors;
    } catch (error) {
        throw error;
    }
};

export default {
    upsertInstructor,
    getInstructor,
    updateInstructorStatus,
    getInstructors,
    addInstructorCertification,
    updateInstructorCertification,
    removeInstructorCertification,
    updateBackgroundCheckDate,
    assignInstructorToTeam,
    removeInstructorFromTeam,
    getInstructorTeams,
    getTeamInstructors
};