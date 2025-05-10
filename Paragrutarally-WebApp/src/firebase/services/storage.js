// src/firebase/services/storage.js
// Firebase Storage service wrapper

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../config';

/**
 * Upload a file to Firebase Storage
 * @param {string} path - Storage path
 * @param {File} file - File to upload
 * @param {Object} metadata - File metadata
 * @returns {Promise} - Upload task snapshot
 */
export const uploadFile = async (path, file, metadata = {}) => {
    try {
        const storageRef = ref(storage, path);
        return await uploadBytes(storageRef, file, metadata);
    } catch (error) {
        throw error;
    }
};

/**
 * Get a download URL for a file
 * @param {string} path - Storage path
 * @returns {Promise} - Download URL
 */
export const getFileUrl = async (path) => {
    try {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} path - Storage path
 * @returns {Promise} - Void promise
 */
export const deleteFile = async (path) => {
    try {
        const storageRef = ref(storage, path);
        return await deleteObject(storageRef);
    } catch (error) {
        throw error;
    }
};

/**
 * List all files in a directory
 * @param {string} path - Storage path
 * @returns {Promise} - List of files
 */
export const listFiles = async (path) => {
    try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);

        const files = await Promise.all(
            result.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                return {
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url
                };
            })
        );

        return files;
    } catch (error) {
        throw error;
    }
};

/**
 * Upload an Excel file
 * @param {string} type - Import type (kids, teams, etc.)
 * @param {File} file - Excel file
 * @param {string} userId - ID of user uploading the file
 * @returns {Promise} - Upload result with file URL
 */
export const uploadExcelFile = async (type, file, userId) => {
    try {
        const timestamp = new Date().getTime();
        const filename = `${timestamp}_${file.name}`;
        const path = `imports/${type}/${userId}/${filename}`;

        const uploadResult = await uploadFile(path, file, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            customMetadata: {
                'uploadedBy': userId,
                'importType': type,
                'originalName': file.name
            }
        });

        const url = await getFileUrl(path);

        return {
            path,
            url,
            filename,
            originalName: file.name,
            type,
            timestamp,
            ...uploadResult
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Upload a form attachment
 * @param {string} formId - Form ID
 * @param {File} file - File to upload
 * @param {string} userId - ID of user uploading the file
 * @returns {Promise} - Upload result with file URL
 */
export const uploadFormAttachment = async (formId, file, userId) => {
    try {
        const timestamp = new Date().getTime();
        const filename = `${timestamp}_${file.name}`;
        const path = `forms/${formId}/attachments/${filename}`;

        const uploadResult = await uploadFile(path, file, {
            customMetadata: {
                'uploadedBy': userId,
                'formId': formId,
                'originalName': file.name
            }
        });

        const url = await getFileUrl(path);

        return {
            path,
            url,
            filename,
            originalName: file.name,
            formId,
            timestamp,
            ...uploadResult
        };
    } catch (error) {
        throw error;
    }
};