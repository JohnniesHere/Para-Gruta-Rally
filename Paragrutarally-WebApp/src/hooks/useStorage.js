// src/hooks/useStorage.js
// Custom hook for Firebase Storage operations

import { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Custom hook for file uploads to Firebase Storage
 * @param {string} path - Storage path to upload to
 * @returns {Object} - Upload functions and state
 */
export const useStorage = (path) => {
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [url, setUrl] = useState(null);
    const [isComplete, setIsComplete] = useState(false);

    // Effect to handle file upload
    useEffect(() => {
        if (!file) return;

        // Create storage reference
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);

        // Create upload task
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Set up listeners
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                // Track progress
                const percentage = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                setProgress(percentage);
            },
            (err) => {
                // Handle errors
                console.error('Upload error:', err);
                setError(err);
            },
            async () => {
                // Handle success
                try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    setUrl(downloadUrl);
                    setIsComplete(true);
                } catch (err) {
                    console.error('Download URL error:', err);
                    setError(err);
                }
            }
        );

        // Cleanup function
        return () => {
            // Note: We can't cancel an active upload in Firebase Storage
            // We can only stop tracking it in our state
        };
    }, [file, path]);

    /**
     * Start a file upload
     * @param {File} fileToUpload - File to upload
     */
    const startUpload = (fileToUpload) => {
        setFile(fileToUpload);
        setProgress(0);
        setError(null);
        setUrl(null);
        setIsComplete(false);
    };

    /**
     * Reset the upload state
     */
    const resetUpload = () => {
        setFile(null);
        setProgress(0);
        setError(null);
        setUrl(null);
        setIsComplete(false);
    };

    /**
     * Delete a file from storage
     * @param {string} fileUrl - URL of file to delete
     * @returns {Promise} - Promise that resolves when delete is complete
     */
    const deleteFile = async (fileUrl) => {
        try {
            // Get storage reference from URL
            const fileRef = ref(storage, fileUrl);

            // Delete the file
            await deleteObject(fileRef);

            return true;
        } catch (err) {
            console.error('Delete file error:', err);
            throw err;
        }
    };

    return {
        progress,
        error,
        url,
        isComplete,
        startUpload,
        resetUpload,
        deleteFile
    };
};
