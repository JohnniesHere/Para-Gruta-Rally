// src/services/vehiclePhotoService.js - Vehicle Photo Management Service (Updated)
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { updateVehicle, getVehicleById } from './vehicleService';

const VEHICLE_PHOTOS_PATH = 'vehiclePhotos';

/**
 * Validate photo file before upload
 */
export const validatePhotoFile = async (file) => {
    const errors = [];

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        errors.push('Please upload a JPEG, PNG, or WebP image file.');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        errors.push('Photo file size must be less than 5MB.');
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
        errors.push('Please upload a valid image file.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Resize image if needed (optional optimization)
 */
export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(resolve, file.type, quality);
        };

        img.src = URL.createObjectURL(file);
    });
};

/**
 * Upload vehicle photo to Firebase Storage
 */
export const uploadVehiclePhoto = async (vehicleId, photoFile) => {
    try {
        // Validate the file first
        const validation = await validatePhotoFile(photoFile);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(' '));
        }

        // Create a unique filename
        const timestamp = Date.now();
        const fileExtension = photoFile.name.split('.').pop().toLowerCase();
        const fileName = `${vehicleId}_${timestamp}.${fileExtension}`;

        // Create storage reference
        const photoRef = ref(storage, `${VEHICLE_PHOTOS_PATH}/${fileName}`);

        // Upload the file with metadata
        console.log('📤 Uploading vehicle photo:', fileName);
        const uploadResult = await uploadBytes(photoRef, photoFile, {
            contentType: photoFile.type,
            customMetadata: {
                'vehicleId': vehicleId,
                'uploadedAt': new Date().toISOString(),
                'originalName': photoFile.name
            }
        });

        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log('✅ Vehicle photo uploaded successfully:', downloadURL);

        // Update vehicle document with photo URL
        const vehicle = await getVehicleById(vehicleId);
        const updatedVehicleData = {
            ...vehicle,
            photo: downloadURL
        };

        await updateVehicle(vehicleId, updatedVehicleData);
        console.log('✅ Vehicle document updated with photo URL');

        return downloadURL;
    } catch (error) {
        console.error('❌ Vehicle photo upload failed:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
};

/**
 * Delete vehicle photo from Firebase Storage (Updated to match kids service)
 */
export const deleteVehiclePhoto = async (vehicleId, photoUrl) => {
    try {
        if (!photoUrl) {
            console.log('ℹ️ No photo URL provided, skipping deletion');
            return;
        }

        console.log(`🔄 Deleting photo for vehicle ${vehicleId}`);

        // Extract filename from URL (same method as kids service)
        const url = new URL(photoUrl);
        const pathParts = url.pathname.split('/');
        const encodedFilename = pathParts[pathParts.length - 1];
        const filename = decodeURIComponent(encodedFilename.split('?')[0]);

        // Create storage reference
        const photoRef = ref(storage, filename);

        // Delete file from storage
        await deleteObject(photoRef);

        // Update vehicle document to remove photo URL
        const vehicle = await getVehicleById(vehicleId);
        const updatedVehicleData = {
            ...vehicle,
            photo: ''
        };

        await updateVehicle(vehicleId, updatedVehicleData);

        console.log(`✅ Photo deleted successfully for vehicle ${vehicleId}`);

    } catch (error) {
        console.error('❌ Vehicle photo deletion failed:', error);
        // Don't throw error if file doesn't exist (same as kids service)
        if (error.code !== 'storage/object-not-found') {
            throw new Error(`Failed to delete photo: ${error.message}`);
        }
    }
};

/**
 * Replace vehicle photo (delete old, upload new) - Updated
 */
export const replaceVehiclePhoto = async (vehicleId, newPhotoFile, oldPhotoUrl) => {
    try {
        console.log(`🔄 Replacing photo for vehicle ${vehicleId}`);

        // Delete old photo first (if exists)
        if (oldPhotoUrl) {
            try {
                await deleteVehiclePhoto(vehicleId, oldPhotoUrl);
                console.log('✅ Old photo deleted successfully');
            } catch (deleteError) {
                console.warn('⚠️ Failed to delete old photo, continuing with upload:', deleteError);
            }
        }

        // Upload new photo
        const newPhotoUrl = await uploadVehiclePhoto(vehicleId, newPhotoFile);
        console.log('✅ New photo uploaded successfully');

        return newPhotoUrl;
    } catch (error) {
        console.error('❌ Failed to replace vehicle photo:', error);
        throw error;
    }
};

/**
 * Update vehicle photo (handles both new uploads and replacements)
 */
export const updateVehiclePhoto = async (vehicleId, newPhotoFile) => {
    try {
        // Get current vehicle data
        const vehicle = await getVehicleById(vehicleId);
        const currentPhotoUrl = vehicle.photo;

        // If there's an existing photo, replace it; otherwise, just upload new one
        if (currentPhotoUrl) {
            return await replaceVehiclePhoto(vehicleId, newPhotoFile, currentPhotoUrl);
        } else {
            return await uploadVehiclePhoto(vehicleId, newPhotoFile);
        }
    } catch (error) {
        console.error('❌ Failed to update vehicle photo:', error);
        throw error;
    }
};

/**
 * Remove vehicle photo completely (delete from storage and update document)
 */
export const removeVehiclePhoto = async (vehicleId) => {
    try {
        // Get current vehicle data
        const vehicle = await getVehicleById(vehicleId);
        const currentPhotoUrl = vehicle.photo;

        if (!currentPhotoUrl) {
            console.log('ℹ️ No photo to remove for this vehicle');
            return;
        }

        // Delete the photo
        await deleteVehiclePhoto(vehicleId, currentPhotoUrl);
        console.log('✅ Vehicle photo removed successfully');

    } catch (error) {
        console.error('❌ Failed to remove vehicle photo:', error);
        throw error;
    }
};

/**
 * Get vehicle photo info
 */
export const getVehiclePhotoInfo = (vehicle) => {
    if (!vehicle) {
        return {
            hasPhoto: false,
            url: null,
            placeholder: 'V'
        };
    }

    if (vehicle.photo && vehicle.photo.trim()) {
        return {
            hasPhoto: true,
            url: vehicle.photo,
            placeholder: null
        };
    }

    // Generate placeholder from make/model
    const make = vehicle.make || '';
    const model = vehicle.model || '';
    const initials = (make.charAt(0) + model.charAt(0)).toUpperCase() || 'V';

    return {
        hasPhoto: false,
        url: null,
        placeholder: initials
    };
};

/**
 * Bulk photo operations for multiple vehicles
 */
export const bulkDeleteVehiclePhotos = async (vehiclePhotos) => {
    const results = [];

    for (const { vehicleId, photoUrl } of vehiclePhotos) {
        try {
            await deleteVehiclePhoto(vehicleId, photoUrl);
            results.push({ vehicleId, success: true });
        } catch (error) {
            console.error(`❌ Failed to delete photo for vehicle ${vehicleId}:`, error);
            results.push({ vehicleId, success: false, error: error.message });
        }
    }

    return results;
};

/**
 * Check if photo URL is valid Firebase Storage URL
 */
export const isValidPhotoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('firebasestorage.googleapis.com');
    } catch {
        return false;
    }
};

/**
 * Generate vehicle photo thumbnail (for list views)
 */
export const generatePhotoThumbnail = (photoUrl, size = 'small') => {
    if (!isValidPhotoUrl(photoUrl)) return photoUrl;

    // Firebase Storage supports image transformations
    const sizeParams = {
        small: 'w_150,h_150,c_fill',
        medium: 'w_300,h_300,c_fill',
        large: 'w_600,h_600,c_fill'
    };

    const transform = sizeParams[size] || sizeParams.small;

    try {
        const url = new URL(photoUrl);
        // Add transformation parameters if supported
        return `${photoUrl}&${transform}`;
    } catch {
        return photoUrl;
    }
};

// Export default object for consistency
export default {
    uploadVehiclePhoto,
    deleteVehiclePhoto,
    replaceVehiclePhoto,
    updateVehiclePhoto,
    removeVehiclePhoto,
    getVehiclePhotoInfo,
    validatePhotoFile,
    resizeImage,
    bulkDeleteVehiclePhotos,
    isValidPhotoUrl,
    generatePhotoThumbnail
};