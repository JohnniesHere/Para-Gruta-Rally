// src/hooks/useFirestore.js
// Custom hook for Firestore operations

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Custom hook for retrieving a collection with optional filtering and pagination
 * @param {string} collectionName - Name of Firestore collection
 * @param {Array} filters - Array of filter objects {field, operator, value}
 * @param {Object} options - Query options {orderField, orderDirection, limitCount}
 * @returns {Object} - Collection data, loading state, error, and pagination functions
 */
export const useCollection = (collectionName, filters = [], options = {}) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // Set default options
    const {
        orderField = 'createdAt',
        orderDirection = 'desc',
        limitCount = 20,
        realtime = false
    } = options;

    // Effect to fetch data
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Create query
        let q = collection(db, collectionName);

        // Add filters
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                q = query(q, where(filter.field, filter.operator, filter.value));
            });
        }

        // Add ordering
        q = query(q, orderBy(orderField, orderDirection));

        // Add limit
        q = query(q, limit(limitCount));

        // Function to handle retrieved data
        const processData = (querySnapshot) => {
            const docs = [];
            querySnapshot.forEach(doc => {
                docs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setDocuments(docs);
            setLoading(false);
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
            setHasMore(querySnapshot.docs.length === limitCount);
        };

        try {
            // Set up real-time listener or one-time fetch
            if (realtime) {
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    processData(querySnapshot);
                }, (err) => {
                    console.error('Collection listener error:', err);
                    setError('Failed to listen to collection updates');
                    setLoading(false);
                });

                // Cleanup function
                return () => unsubscribe();
            } else {
                // One-time fetch
                getDocs(q)
                    .then(processData)
                    .catch(err => {
                        console.error('Collection fetch error:', err);
                        setError('Failed to fetch collection data');
                        setLoading(false);
                    });
            }
        } catch (err) {
            console.error('Collection hook error:', err);
            setError('Error setting up collection query');
            setLoading(false);
        }
    }, [collectionName, JSON.stringify(filters), orderField, orderDirection, limitCount, realtime]);

    /**
     * Fetch next page of documents
     */
    const loadMore = async () => {
        if (!hasMore || !lastDoc) return;

        setLoading(true);

        try {
            // Create query with startAfter
            let q = collection(db, collectionName);

            // Add filters
            if (filters && filters.length > 0) {
                filters.forEach(filter => {
                    q = query(q, where(filter.field, filter.operator, filter.value));
                });
            }

            // Add ordering
            q = query(q, orderBy(orderField, orderDirection));

            // Add pagination
            q = query(q, startAfter(lastDoc), limit(limitCount));

            // Execute query
            const querySnapshot = await getDocs(q);

            // Process results
            const newDocs = [];
            querySnapshot.forEach(doc => {
                newDocs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Update state
            setDocuments([...documents, ...newDocs]);
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
            setHasMore(querySnapshot.docs.length === limitCount);
        } catch (err) {
            console.error('Load more error:', err);
            setError('Failed to load more data');
        } finally {
            setLoading(false);
        }
    };

    return { documents, loading, error, hasMore, loadMore };
};
