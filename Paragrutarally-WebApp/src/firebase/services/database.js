// src/firebase/services/database.js
// Firestore database service wrapper

import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Generic function to add a document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise} - Document reference
 */
export const addDocument = async (collectionName, data) => {
    try {
        // Add timestamps
        const dataWithTimestamps = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        return await addDoc(collection(db, collectionName), dataWithTimestamps);
    } catch (error) {
        throw error;
    }
};

/**
 * Generic function to get a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @returns {Promise} - Document data
 */
export const getDocument = async (collectionName, documentId) => {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Document not found');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Generic function to update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise} - Void promise
 */
export const updateDocument = async (collectionName, documentId, data) => {
    try {
        const docRef = doc(db, collectionName, documentId);

        // Add updated timestamp
        const dataWithTimestamp = {
            ...data,
            updatedAt: serverTimestamp()
        };

        return await updateDoc(docRef, dataWithTimestamp);
    } catch (error) {
        throw error;
    }
};

/**
 * Generic function to delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @returns {Promise} - Void promise
 */
export const deleteDocument = async (collectionName, documentId) => {
    try {
        const docRef = doc(db, collectionName, documentId);
        return await deleteDoc(docRef);
    } catch (error) {
        throw error;
    }
};

/**
 * Generic function to get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} options - Query options (orderField, orderDirection, limitCount)
 * @returns {Promise} - Array of documents
 */
export const getCollection = async (collectionName, options = {}) => {
    try {
        const {
            orderField = 'createdAt',
            orderDirection = 'desc',
            limitCount = 100
        } = options;

        const colRef = collection(db, collectionName);
        const q = query(
            colRef,
            orderBy(orderField, orderDirection),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
};

/**
 * Query documents from a collection with filters
 * @param {string} collectionName - Name of the collection
 * @param {Array} filters - Array of filter objects {field, operator, value}
 * @param {Object} options - Query options (orderField, orderDirection, limitCount)
 * @returns {Promise} - Array of documents
 */
export const queryDocuments = async (collectionName, filters = [], options = {}) => {
    try {
        const {
            orderField = 'createdAt',
            orderDirection = 'desc',
            limitCount = 100,
            paginationStartAfter = null
        } = options;

        const colRef = collection(db, collectionName);

        // Build query constraints
        const queryConstraints = [
            ...filters.map(filter => where(filter.field, filter.operator, filter.value)),
            orderBy(orderField, orderDirection),
            limit(limitCount)
        ];

        // Add pagination if startAfter is provided
        if (paginationStartAfter) {
            queryConstraints.push(startAfter(paginationStartAfter));
        }

        const q = query(colRef, ...queryConstraints);

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
};

// Kid-specific functions

/**
 * Add a new kid
 * @param {Object} kidData - Kid data
 * @returns {Promise} - Document reference
 */
export const addKid = async (kidData) => {
    return addDocument('kids', kidData);
};

/**
 * Get a kid by ID
 * @param {string} kidId - Kid ID
 * @returns {Promise} - Kid data
 */
export const getKid = async (kidId) => {
    return getDocument('kids', kidId);
};

/**
 * Update a kid
 * @param {string} kidId - Kid ID
 * @param {Object} kidData - Kid data to update
 * @returns {Promise} - Void promise
 */
export const updateKid = async (kidId, kidData) => {
    return updateDocument('kids', kidId, kidData);
};

/**
 * Delete a kid
 * @param {string} kidId - Kid ID
 * @returns {Promise} - Void promise
 */
export const deleteKid = async (kidId) => {
    return deleteDocument('kids', kidId);
};

/**
 * Get all kids
 * @param {Object} options - Query options
 * @returns {Promise} - Array of kids
 */
export const getKids = async (options = {}) => {
    return getCollection('kids', options);
};

/**
 * Get kids by team
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of kids
 */
export const getKidsByTeam = async (teamId, options = {}) => {
    const filters = [
        { field: 'teamId', operator: '==', value: teamId }
    ];
    return queryDocuments('kids', filters, options);
};

// Team-specific functions

/**
 * Add a new team
 * @param {Object} teamData - Team data
 * @returns {Promise} - Document reference
 */
export const addTeam = async (teamData) => {
    return addDocument('teams', teamData);
};

/**
 * Get a team by ID
 * @param {string} teamId - Team ID
 * @returns {Promise} - Team data
 */
export const getTeam = async (teamId) => {
    return getDocument('teams', teamId);
};

/**
 * Update a team
 * @param {string} teamId - Team ID
 * @param {Object} teamData - Team data to update
 * @returns {Promise} - Void promise
 */
export const updateTeam = async (teamId, teamData) => {
    return updateDocument('teams', teamId, teamData);
};

/**
 * Delete a team
 * @param {string} teamId - Team ID
 * @returns {Promise} - Void promise
 */
export const deleteTeam = async (teamId) => {
    return deleteDocument('teams', teamId);
};

/**
 * Get all teams
 * @param {Object} options - Query options
 * @returns {Promise} - Array of teams
 */
export const getTeams = async (options = {}) => {
    return getCollection('teams', options);
};


