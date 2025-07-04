// src/services/formService.js - Updated Form Service
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
    serverTimestamp,
    writeBatch,
    Timestamp,
    increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Collections
const FORMS_COLLECTION = 'forms';
const FORM_SUBMISSIONS_COLLECTION = 'form_submissions';
const STORAGE_DECLARATIONS_PATH = 'signedParentsDeclarations';

// ========================================
// FORM MANAGEMENT
// ========================================

/**
 * Get active forms for a specific user type
 * @param {string} userType - 'parent' or 'instructor'
 * @returns {Promise<Array>} List of active forms
 */
export const getActiveForms = async (userType) => {
    try {
        const formsRef = collection(db, FORMS_COLLECTION);
        // More lenient query for debugging
        const q = query(
            formsRef,
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const forms = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Filter in JavaScript for better debugging
            if (data.targetUsers && data.targetUsers.includes(userType)) {
                forms.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    eventDetails: {
                        ...data.eventDetails,
                        eventDate: data.eventDetails?.eventDate
                    }
                });
            }
        });

        console.log(`✅ Retrieved ${forms.length} active forms for ${userType}`);
        return forms;
    } catch (error) {
        console.error('❌ Error getting active forms:', error);
        throw error;
    }
};

/**
 * Get all forms with optional filtering (keeping existing function)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of forms
 */
export const getAllForms = async (options = {}) => {
    try {
        let formsQuery = collection(db, FORMS_COLLECTION);

        // Add filters
        if (options.status) {
            formsQuery = query(formsQuery, where('status', '==', options.status));
        }

        if (options.type) {
            formsQuery = query(formsQuery, where('type', '==', options.type));
        }

        // Add ordering
        formsQuery = query(formsQuery, orderBy('createdAt', 'desc'));

        // Add limit
        if (options.limit) {
            formsQuery = query(formsQuery, limit(options.limit));
        }

        const querySnapshot = await getDocs(formsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
    } catch (error) {
        console.error('❌ Error getting forms:', error);
        throw new Error(`Failed to get forms: ${error.message}`);
    }
};

/**
 * Get all forms for a specific role (backwards compatibility)
 * @param {string} role - 'parent' or 'instructor'
 * @returns {Promise<Array>} List of forms
 */
export const getFormsForRole = async (userRole, options = {}) => {
    try {
        console.log('🔍 DEBUG: getFormsForRole called with userRole:', userRole);
        let formsQuery = query(
            collection(db, FORMS_COLLECTION),
            where('targetUsers', 'array-contains', userRole),
            where('status', '==', 'active')
        );

        // Add ordering without dates to avoid timestamp issues
        formsQuery = query(formsQuery, orderBy('title', 'asc'));

        const querySnapshot = await getDocs(formsQuery);
        console.log('🔍 DEBUG: getFormsForRole query executed, docs found:', querySnapshot.size);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('🔍 DEBUG: Processing getFormsForRole document:', doc.id, data);

            // Just return the data as-is, no date processing
            return {
                id: doc.id,
                ...data
            };
        });
    } catch (error) {
        console.error('❌ Error getting forms for role:', error);
        throw new Error(`Failed to get forms for role: ${error.message}`);
    }
};

/**
 * Get a specific form by ID
 * @param {string} formId - Form document ID
 * @returns {Promise<Object>} Form data
 */
export const getFormById = async (formId) => {
    try {
        const formRef = doc(db, FORMS_COLLECTION, formId);
        const formSnap = await getDoc(formRef);

        if (!formSnap.exists()) {
            throw new Error('Form not found');
        }

        const data = formSnap.data();
        return {
            id: formSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            eventDetails: {
                ...data.eventDetails,
                eventDate: data.eventDetails?.eventDate?.toDate()
            }
        };
    } catch (error) {
        console.error('❌ Error getting form by ID:', error);
        throw error;
    }
};

/**
 * Increment form view count
 * @param {string} formId - Form document ID
 * @returns {Promise<void>}
 */
export const incrementFormViewCount = async (formId) => {
    try {
        const formRef = doc(db, FORMS_COLLECTION, formId);
        await updateDoc(formRef, {
            viewCount: increment(1),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Incremented view count for form ${formId}`);
    } catch (error) {
        console.error('❌ Error incrementing view count:', error);
        throw error;
    }
};

/**
 * Create a new form
 * @param {Object} formData - Form data
 * @returns {Promise<string>} Created form ID
 */
export const createForm = async (formData) => {
    try {
        const formsRef = collection(db, FORMS_COLLECTION);
        const docRef = await addDoc(formsRef, {
            ...formData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            viewCount: 0,
            submissionCount: 0
        });

        console.log(`✅ Created form with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating form:', error);
        throw error;
    }
};

/**
 * Update an existing form
 * @param {string} formId - Form document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateForm = async (formId, updateData) => {
    try {
        const formRef = doc(db, FORMS_COLLECTION, formId);
        await updateDoc(formRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Updated form ${formId}`);
    } catch (error) {
        console.error('❌ Error updating form:', error);
        throw error;
    }
};

/**
 * Delete a form
 * @param {string} formId - Form document ID
 * @returns {Promise<void>}
 */
export const deleteForm = async (formId) => {
    try {
        const formRef = doc(db, FORMS_COLLECTION, formId);
        await deleteDoc(formRef);

        console.log(`✅ Deleted form ${formId}`);
    } catch (error) {
        console.error('❌ Error deleting form:', error);
        throw error;
    }
};

// ========================================
// FORM SUBMISSIONS
// ========================================

/**
 * Create a new form submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<string>} Created submission ID
 */
export const createFormSubmission = async (submissionData) => {
    try {
        console.log('🔥 createFormSubmission called with:', submissionData);

        const submissionsRef = collection(db, FORM_SUBMISSIONS_COLLECTION);

        // Prepare data with server timestamps
        const dataToSubmit = {
            ...submissionData,
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        console.log('🔥 Data to submit:', dataToSubmit);

        const docRef = await addDoc(submissionsRef, dataToSubmit);
        console.log('🔥 Document added with ID:', docRef.id);

        // Increment form submission count
        if (submissionData.formId) {
            console.log('🔥 Incrementing form submission count...');
            const formRef = doc(db, FORMS_COLLECTION, submissionData.formId);
            await updateDoc(formRef, {
                submissionCount: increment(1),
                updatedAt: serverTimestamp()
            });
            console.log('🔥 Form count incremented');
        }

        console.log(`✅ Created form submission with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating form submission:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * Submit form response (keeping existing function for compatibility)
 * @param {Object} submissionData - Form submission data
 * @returns {Promise<string>} Submission document ID
 */
export const submitFormResponse = async (submissionData) => {
    try {
        const submission = {
            ...submissionData,
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, FORM_SUBMISSIONS_COLLECTION), submission);

        // Update form submission count
        const formRef = doc(db, FORMS_COLLECTION, submissionData.formId);
        const formDoc = await getDoc(formRef);
        if (formDoc.exists()) {
            const currentCount = formDoc.data().submissionCount || 0;
            await updateDoc(formRef, {
                submissionCount: currentCount + 1
            });
        }

        return docRef.id;
    } catch (error) {
        console.error('❌ Error submitting form:', error);
        throw new Error(`Failed to submit form: ${error.message}`);
    }
};

/**
 * Get form submissions with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} List of submissions
 */
export const getFormSubmissions = async (filters = {}) => {
    try {
        const submissionsRef = collection(db, FORM_SUBMISSIONS_COLLECTION);
        let q = query(submissionsRef, orderBy('submittedAt', 'desc'));

        // Apply filters
        if (filters.submitterId) {
            q = query(submissionsRef,
                where('submitterId', '==', filters.submitterId),
                orderBy('submittedAt', 'desc')
            );
        }

        if (filters.formId) {
            q = query(submissionsRef,
                where('formId', '==', filters.formId),
                orderBy('submittedAt', 'desc')
            );
        }

        if (filters.formType) {
            q = query(submissionsRef,
                where('formType', '==', filters.formType),
                orderBy('submittedAt', 'desc')
            );
        }

        if (filters.confirmationStatus) {
            q = query(submissionsRef,
                where('confirmationStatus', '==', filters.confirmationStatus),
                orderBy('submittedAt', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        const submissions = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            submissions.push({
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            });
        });

        console.log(`✅ Retrieved ${submissions.length} form submissions`);
        return submissions;
    } catch (error) {
        console.error('❌ Error getting form submissions:', error);
        throw error;
    }
};

/**
 * Get user form assignments (backwards compatibility)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of assignments
 */
export const getUserFormAssignments = async (userId) => {
    // For now, return empty array as this might not be used in the new system
    console.log(`📝 Getting form assignments for user ${userId}`);
    return [];
};

/**
 * Update a form submission
 * @param {string} submissionId - Submission document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateFormSubmission = async (submissionId, updateData) => {
    try {
        const submissionRef = doc(db, FORM_SUBMISSIONS_COLLECTION, submissionId);
        await updateDoc(submissionRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Updated form submission ${submissionId}`);
    } catch (error) {
        console.error('❌ Error updating form submission:', error);
        throw error;
    }
};

/**
 * Delete a form submission
 * @param {string} submissionId - Submission document ID
 * @returns {Promise<void>}
 */
export const deleteFormSubmission = async (submissionId) => {
    try {
        const submissionRef = doc(db, FORM_SUBMISSIONS_COLLECTION, submissionId);
        await deleteDoc(submissionRef);

        console.log(`✅ Deleted form submission ${submissionId}`);
    } catch (error) {
        console.error('❌ Error deleting form submission:', error);
        throw error;
    }
};

// ========================================
// FILE UPLOAD
// ========================================

/**
 * Upload declaration file to storage
 * @param {File} file - File to upload
 * @param {string} userId - User ID
 * @param {string} formId - Form ID
 * @returns {Promise<string>} Download URL
 */
export const uploadDeclarationFile = async (file, userId, formId) => {
    try {
        // Create unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${userId}_${formId}_${timestamp}.${fileExtension}`;

        // Create storage reference
        const storageRef = ref(storage, `${STORAGE_DECLARATIONS_PATH}/${fileName}`);

        // Upload file
        const uploadResult = await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);

        console.log(`✅ Uploaded declaration file: ${fileName}`);
        return downloadURL;
    } catch (error) {
        console.error('❌ Error uploading declaration file:', error);
        throw error;
    }
};

/**
 * Upload signed declaration file (keeping existing function for compatibility)
 * @param {File} file - File to upload
 * @param {string} userId - User ID for file organization
 * @returns {Promise<string>} Download URL
 */
export const uploadSignedDeclaration = async (file, userId) => {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const fileRef = ref(storage, `${STORAGE_DECLARATIONS_PATH}/${userId}/${fileName}`);

        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

/**
 * Delete declaration file from storage
 * @param {string} fileUrl - File URL to delete
 * @returns {Promise<void>}
 */
export const deleteDeclarationFile = async (fileUrl) => {
    try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);

        console.log(`✅ Deleted declaration file: ${fileUrl}`);
    } catch (error) {
        console.error('❌ Error deleting declaration file:', error);
        throw error;
    }
};

// ========================================
// STATISTICS AND ANALYTICS
// ========================================

/**
 * Get form statistics
 * @param {string} formId - Form document ID
 * @returns {Promise<Object>} Form statistics
 */
export const getFormStatistics = async (formId) => {
    try {
        // Get form basic info
        const form = await getFormById(formId);

        // Get submissions for this form
        const submissions = await getFormSubmissions({ formId });

        // Calculate statistics
        const stats = {
            totalViews: form.viewCount || 0,
            totalSubmissions: submissions.length,
            attendingCount: submissions.filter(s => s.confirmationStatus === 'attending').length,
            notAttendingCount: submissions.filter(s => s.confirmationStatus === 'not attending').length,
            undecidedCount: submissions.filter(s => s.confirmationStatus === 'needs to decide').length,
            totalAttendees: submissions.reduce((sum, s) => sum + (s.attendeesCount || 0), 0),
            parentSubmissions: submissions.filter(s => s.formType === 'parent').length,
            instructorSubmissions: submissions.filter(s => s.formType === 'instructor').length,
            submissionsWithDeclarations: submissions.filter(s => s.declarationUploaded).length
        };

        console.log(`✅ Retrieved statistics for form ${formId}`);
        return stats;
    } catch (error) {
        console.error('❌ Error getting form statistics:', error);
        throw error;
    }
};

/**
 * Get user submission summary
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User submission summary
 */
export const getUserSubmissionSummary = async (userId) => {
    try {
        const submissions = await getFormSubmissions({ submitterId: userId });

        const summary = {
            totalSubmissions: submissions.length,
            attendingEvents: submissions.filter(s => s.confirmationStatus === 'attending').length,
            pendingDecisions: submissions.filter(s => s.confirmationStatus === 'needs to decide').length,
            recentSubmissions: submissions.slice(0, 5), // Last 5 submissions
            totalAttendees: submissions.reduce((sum, s) => sum + (s.attendeesCount || 0), 0)
        };

        console.log(`✅ Retrieved submission summary for user ${userId}`);
        return summary;
    } catch (error) {
        console.error('❌ Error getting user submission summary:', error);
        throw error;
    }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if user has submitted a specific form
 * @param {string} userId - User ID
 * @param {string} formId - Form ID
 * @returns {Promise<boolean>} Whether user has submitted the form
 */
export const hasUserSubmittedForm = async (userId, formId) => {
    try {
        const submissionsRef = collection(db, FORM_SUBMISSIONS_COLLECTION);
        const q = query(
            submissionsRef,
            where('submitterId', '==', userId),
            where('formId', '==', formId),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('❌ Error checking user form submission:', error);
        throw error;
    }
};

/**
 * Get user's submission for a specific form
 * @param {string} userId - User ID
 * @param {string} formId - Form ID
 * @returns {Promise<Object|null>} User's submission or null
 */
export const getUserFormSubmission = async (userId, formId) => {
    try {
        const submissionsRef = collection(db, FORM_SUBMISSIONS_COLLECTION);
        const q = query(
            submissionsRef,
            where('submitterId', '==', userId),
            where('formId', '==', formId),
            orderBy('submittedAt', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
        };
    } catch (error) {
        console.error('❌ Error getting user form submission:', error);
        throw error;
    }
};

/**
 * Send form to users (create form assignments) - keeping existing function
 * @param {string} formId - Form document ID
 * @param {Array} targetUsers - Array of user objects
 * @returns {Promise<number>} Number of assignments created
 */
export const sendFormToUsers = async (formId, targetUsers) => {
    try {
        const batch = writeBatch(db);
        const assignmentsRef = collection(db, 'form_assignments');

        targetUsers.forEach(user => {
            const assignmentRef = doc(assignmentsRef);
            batch.set(assignmentRef, {
                formId,
                userId: user.id,
                userRole: user.role,
                status: 'pending',
                assignedAt: serverTimestamp(),
                notificationSent: false,
                remindersSent: 0
            });
        });

        await batch.commit();
        return targetUsers.length;
    } catch (error) {
        console.error('❌ Error sending form:', error);
        throw new Error(`Failed to send form: ${error.message}`);
    }
};

/**
 * Get forms analytics - keeping existing function
 * @returns {Promise<Object>} Analytics data
 */
export const getFormsAnalytics = async () => {
    try {
        const [forms, submissions] = await Promise.all([
            getAllForms(),
            getFormSubmissions()
        ]);

        const analytics = {
            totalForms: forms.length,
            totalSubmissions: submissions.length,
            pendingReviews: submissions.filter(s => s.confirmationStatus === 'needs to decide').length,
            completionRate: forms.length > 0 ? Math.round((submissions.length / forms.length) * 100) : 0,
            byFormType: {},
            byStatus: {}
        };

        // Count by form type
        submissions.forEach(submission => {
            const formType = submission.formType || 'unknown';
            analytics.byFormType[formType] = (analytics.byFormType[formType] || 0) + 1;
        });

        // Count by confirmation status
        submissions.forEach(submission => {
            const status = submission.confirmationStatus || 'unknown';
            analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
        });

        return analytics;
    } catch (error) {
        console.error('❌ Error getting forms analytics:', error);
        throw new Error(`Failed to get forms analytics: ${error.message}`);
    }
};

/**
 * Mark form assignment as completed - keeping existing function
 * @param {string} assignmentId - Assignment document ID
 * @returns {Promise<void>}
 */
export const markAssignmentCompleted = async (assignmentId) => {
    try {
        await updateDoc(doc(db, 'form_assignments', assignmentId), {
            status: 'completed',
            completedAt: serverTimestamp()
        });

    } catch (error) {
        console.error('❌ Error marking assignment completed:', error);
        throw new Error(`Failed to mark assignment completed: ${error.message}`);
    }
};

// Export all functions
export default {
    // New functions
    getActiveForms,
    incrementFormViewCount,
    createFormSubmission,
    uploadDeclarationFile,
    deleteDeclarationFile,
    getFormStatistics,
    getUserSubmissionSummary,
    hasUserSubmittedForm,
    getUserFormSubmission,

    // Existing functions (keeping for compatibility)
    createForm,
    getAllForms,
    getFormById,
    updateForm,
    deleteForm,
    sendFormToUsers,
    submitFormResponse,
    getFormSubmissions,
    getUserFormAssignments,
    uploadSignedDeclaration,
    getFormsAnalytics,
    markAssignmentCompleted,
    getFormsForRole
};