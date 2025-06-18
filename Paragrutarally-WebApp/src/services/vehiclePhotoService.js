// src/services/vehiclePhotoService.js - Vehicle Photo Management Service
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

const VEHICLE_PHOTOS_PATH = 'vehicle-photos';

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
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${vehicleId}_${timestamp}.${fileExtension}`;

        // Create storage reference
        const photoRef = ref(storage, `${VEHICLE_PHOTOS_PATH}/${fileName}`);

        // Upload the file
        console.log('📤 Uploading vehicle photo:', fileName);
        const snapshot = await uploadBytes(photoRef, photoFile);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('✅ Vehicle photo uploaded successfully:', downloadURL);

        return downloadURL;
    } catch (error) {
        console.error('❌ Vehicle photo upload failed:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
};

/**
 * Delete vehicle photo from Firebase Storage
 */
export const deleteVehiclePhoto = async (vehicleId, photoUrl) => {
    try {
        if (!photoUrl) {
            console.log('ℹ️ No photo URL provided, skipping deletion');
            return;
        }

        // Extract the file path from the URL
        const url = new URL(photoUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);

        if (!pathMatch) {
            console.warn('⚠️ Could not extract file path from photo URL');
            return;
        }

        const filePath = decodeURIComponent(pathMatch[1]);

        // Create storage reference
        const photoRef = ref(storage, filePath);

        // Delete the file
        console.log('🗑️ Deleting vehicle photo:', filePath);
        await deleteObject(photoRef);
        console.log('✅ Vehicle photo deleted successfully');

    } catch (error) {
        console.error('❌ Vehicle photo deletion failed:', error);
        // Don't throw error for deletion failures - log and continue
        console.warn('⚠️ Photo deletion failed but continuing with operation');
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
 * Update vehicle photo URL in database (helper function)
 */
export const updateVehiclePhotoUrl = async (vehicleId, photoUrl) => {
    try {
        // This would typically be handled by the vehicle service
        // Just a placeholder for consistency
        console.log('📝 Updating vehicle photo URL in database:', vehicleId, photoUrl);

        // You might want to call updateVehicle from vehicleService here
        // await updateVehicle(vehicleId, { photo: photoUrl });

    } catch (error) {
        console.error('❌ Failed to update vehicle photo URL:', error);
        throw error;
    }
};

/**
 * Replace vehicle photo (delete old, upload new)
 */
export const replaceVehiclePhoto = async (vehicleId, newPhotoFile, oldPhotoUrl) => {
    try {
        // Delete old photo first (if exists)
        if (oldPhotoUrl) {
            try {
                await deleteVehiclePhoto(vehicleId, oldPhotoUrl);
            } catch (deleteError) {
                console.warn('⚠️ Failed to delete old photo, continuing with upload:', deleteError);
            }
        }

        // Upload new photo
        const newPhotoUrl = await uploadVehiclePhoto(vehicleId, newPhotoFile);

        return newPhotoUrl;
    } catch (error) {
        console.error('❌ Failed to replace vehicle photo:', error);
        throw error;
    }
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