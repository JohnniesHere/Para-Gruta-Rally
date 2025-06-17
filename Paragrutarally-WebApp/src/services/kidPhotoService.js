// src/services/kidPhotoService.js - Kid Photo Management Service
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { updateKid, getKidById } from './kidService';

/**
 * Upload a kid's profile photo
 * @param {string} kidId - The kid's document ID
 * @param {File} photoFile - The photo file to upload
 * @returns {Promise<string>} - The download URL of the uploaded photo
 */
export const uploadKidPhoto = async (kidId, photoFile) => {
    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(photoFile.type)) {
            throw new Error('Please upload a JPEG, PNG, or WebP image file.');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (photoFile.size > maxSize) {
            throw new Error('Photo file size must be less than 5MB.');
        }

        // Create unique filename
        const timestamp = Date.now();
        const fileExtension = photoFile.name.split('.').pop().toLowerCase();
        const filename = `${kidId}_${timestamp}.${fileExtension}`;

        // Create storage reference
        const photoRef = ref(storage, `kidsPFP/${filename}`);

        console.log(`🔄 Uploading photo for kid ${kidId}:`, filename);

        // Upload file
        const uploadResult = await uploadBytes(photoRef, photoFile, {
            contentType: photoFile.type,
            customMetadata: {
                'kidId': kidId,
                'uploadedAt': new Date().toISOString(),
                'originalName': photoFile.name
            }
        });

        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);

        console.log(`✅ Photo uploaded successfully:`, downloadURL);

        // Update kid document with photo URL
        const kid = await getKidById(kidId);
        const updatedKidData = {
            ...kid,
            personalInfo: {
                ...kid.personalInfo,
                photo: downloadURL
            }
        };

        await updateKid(kidId, updatedKidData);

        console.log(`✅ Kid document updated with photo URL`);

        return downloadURL;

    } catch (error) {
        console.error('💥 Error uploading kid photo:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
};

/**
 * Delete a kid's profile photo
 * @param {string} kidId - The kid's document ID
 * @param {string} photoUrl - The current photo URL
 * @returns {Promise<void>}
 */
export const deleteKidPhoto = async (kidId, photoUrl) => {
    try {
        if (!photoUrl) return;

        console.log(`🔄 Deleting photo for kid ${kidId}`);

        // Extract filename from URL
        const url = new URL(photoUrl);
        const pathParts = url.pathname.split('/');
        const encodedFilename = pathParts[pathParts.length - 1];
        const filename = decodeURIComponent(encodedFilename.split('?')[0]);

        // Create storage reference
        const photoRef = ref(storage, `kidsPFP/${filename}`);

        // Delete file from storage
        await deleteObject(photoRef);

        // Update kid document to remove photo URL
        const kid = await getKidById(kidId);
        const updatedKidData = {
            ...kid,
            personalInfo: {
                ...kid.personalInfo,
                photo: ''
            }
        };

        await updateKid(kidId, updatedKidData);

        console.log(`✅ Photo deleted successfully for kid ${kidId}`);

    } catch (error) {
        console.error('💥 Error deleting kid photo:', error);
        // Don't throw error if file doesn't exist
        if (error.code !== 'storage/object-not-found') {
            throw new Error(`Failed to delete photo: ${error.message}`);
        }
    }
};

/**
 * Get kid's photo URL or return placeholder info
 * @param {Object} kid - Kid object
 * @returns {Object} - Photo info with URL or placeholder data
 */
export const getKidPhotoInfo = (kid) => {
    const photoUrl = kid.personalInfo?.photo;

    if (photoUrl) {
        return {
            hasPhoto: true,
            url: photoUrl,
            placeholder: null
        };
    }

    // Generate placeholder initials
    const firstName = kid.personalInfo?.firstName || '';
    const lastName = kid.personalInfo?.lastName || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || kid.participantNumber?.charAt(0) || '?';

    return {
        hasPhoto: false,
        url: null,
        placeholder: initials
    };
};

/**
 * Validate photo file before upload
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export const validatePhotoFile = (file) => {
    const result = {
        isValid: true,
        errors: []
    };

    // Check if file exists
    if (!file) {
        result.isValid = false;
        result.errors.push('Please select a file to upload.');
        return result;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        result.isValid = false;
        result.errors.push('Please upload a JPEG, PNG, or WebP image file.');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        result.isValid = false;
        result.errors.push('Photo file size must be less than 5MB.');
    }

    // Check minimum dimensions (optional)
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            if (img.width < 50 || img.height < 50) {
                result.isValid = false;
                result.errors.push('Photo must be at least 50x50 pixels.');
            }
            resolve(result);
        };
        img.onerror = () => {
            result.isValid = false;
            result.errors.push('Invalid image file.');
            resolve(result);
        };
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Resize image file before upload (optional optimization)
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Resized image blob
 */
export const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw and resize image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };

        img.src = URL.createObjectURL(file);
    });
};

export default {
    uploadKidPhoto,
    deleteKidPhoto,
    getKidPhotoInfo,
    validatePhotoFile,
    resizeImage
};