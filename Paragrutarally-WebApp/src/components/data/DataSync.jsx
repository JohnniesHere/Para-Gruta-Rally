import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Custom hook for real-time data sync with Firebase
export const useFirestoreCollection = (collectionName, queryConstraints = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);

        const collectionRef = collection(db, collectionName);
        const queryRef = query(collectionRef, ...queryConstraints);

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            queryRef,
            (snapshot) => {
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setData(items);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching collection:", err);
                setError(err);
                setLoading(false);
            }
        );

        // Clean up listener on unmount
        return () => unsubscribe();
    }, [collectionName, JSON.stringify(queryConstraints)]);

    return { data, loading, error };
};

// CRUD operations for Firestore
export const FirestoreService = {
    // Create or update a document
    saveDocument: async (collectionName, documentData, documentId = null) => {
        try {
            if (documentId) {
                // Update existing document
                await updateDoc(doc(db, collectionName, documentId), documentData);
                return { success: true, id: documentId };
            } else {
                // Create new document with auto-generated ID
                const docRef = doc(collection(db, collectionName));
                await setDoc(docRef, documentData);
                return { success: true, id: docRef.id };
            }
        } catch (error) {
            console.error("Error saving document:", error);
            return { success: false, error };
        }
    },

    // Delete a document
    deleteDocument: async (collectionName, documentId) => {
        try {
            await deleteDoc(doc(db, collectionName, documentId));
            return { success: true };
        } catch (error) {
            console.error("Error deleting document:", error);
            return { success: false, error };
        }
    },

    // Batch operations for performance
    batchUpdate: async (operations) => {
        // Implementation for batch operations
        // This would be expanded based on specific needs
    }
};

// Export DataSync component for direct use in other components
const DataSync = ({ children, collectionName, queryConstraints = [], onDataChange }) => {
    const { data, loading, error } = useFirestoreCollection(collectionName, queryConstraints);

    useEffect(() => {
        if (!loading && !error && onDataChange) {
            onDataChange(data);
        }
    }, [data, loading, error, onDataChange]);

    return children({ data, loading, error });
};

export default DataSync;