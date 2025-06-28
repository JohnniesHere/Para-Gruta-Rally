// src/services/formService.js - Form Firestore Operations
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
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

/**
 * Create a new form
 * @param {Object} formData - Form data
 * @param {string} createdBy - User ID who created the form
 * @returns {Promise<string>} Form document ID
 */
export const createForm = async (formData, createdBy) => {
    try {
        const formToSave = {
            ...formData,
            createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            submissionCount: 0,
            viewCount: 0
        };

        const docRef = await addDoc(collection(db, 'forms'), formToSave);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating form:', error);
        throw new Error(`Failed to create form: ${error.message}`);
    }
};

/**
 * Get all forms with optional filtering
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of forms
 */
export const getAllForms = async (options = {}) => {
    try {
        let formsQuery = collection(db, 'forms');

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
 * Get form by ID
 * @param {string} formId - Form document ID
 * @returns {Promise<Object>} Form data
 */
export const getFormById = async (formId) => {
    try {
        const formDoc = await getDoc(doc(db, 'forms', formId));

        if (!formDoc.exists()) {
            throw new Error('Form not found');
        }

        const formData = {
            id: formDoc.id,
            ...formDoc.data(),
            createdAt: formDoc.data().createdAt?.toDate(),
            updatedAt: formDoc.data().updatedAt?.toDate()
        };

        return formData;
    } catch (error) {
        console.error('❌ Error getting form:', error);
        throw new Error(`Failed to get form: ${error.message}`);
    }
};

/**
 * Update form
 * @param {string} formId - Form document ID
 * @param {Object} updates - Form updates
 * @returns {Promise<void>}
 */
export const updateForm = async (formId, updates) => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'forms', formId), updateData);
    } catch (error) {
        console.error('❌ Error updating form:', error);
        throw new Error(`Failed to update form: ${error.message}`);
    }
};

/**
 * Delete form
 * @param {string} formId - Form document ID
 * @returns {Promise<void>}
 */
export const deleteForm = async (formId) => {
    try {
        await deleteDoc(doc(db, 'forms', formId));
    } catch (error) {
        console.error('❌ Error deleting form:', error);
        throw new Error(`Failed to delete form: ${error.message}`);
    }
};

/**
 * Send form to users (create form assignments)
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
 * Submit form response
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

        const docRef = await addDoc(collection(db, 'form_submissions'), submission);

        // Update form submission count
        const formRef = doc(db, 'forms', submissionData.formId);
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
 * Get form submissions
 * @param {string} formId - Form document ID (optional)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of submissions
 */
export const getFormSubmissions = async (formId = null, options = {}) => {
    try {
        let submissionsQuery = collection(db, 'form_submissions');

        // Filter by form ID if provided
        if (formId) {
            submissionsQuery = query(submissionsQuery, where('formId', '==', formId));
        }

        // Filter by submitter if provided
        if (options.submitterId) {
            submissionsQuery = query(submissionsQuery, where('submitterId', '==', options.submitterId));
        }

        // Filter by form type if provided
        if (options.formType) {
            submissionsQuery = query(submissionsQuery, where('formType', '==', options.formType));
        }

        // Add ordering
        submissionsQuery = query(submissionsQuery, orderBy('submittedAt', 'desc'));

        // Add limit
        if (options.limit) {
            submissionsQuery = query(submissionsQuery, limit(options.limit));
        }

        const querySnapshot = await getDocs(submissionsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
    } catch (error) {
        console.error('❌ Error getting form submissions:', error);
        throw new Error(`Failed to get form submissions: ${error.message}`);
    }
};

/**
 * Get user's form assignments
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of form assignments
 */
export const getUserFormAssignments = async (userId, options = {}) => {
    try {
        let assignmentsQuery = query(
            collection(db, 'form_assignments'),
            where('userId', '==', userId)
        );

        // Filter by status if provided
        if (options.status) {
            assignmentsQuery = query(assignmentsQuery, where('status', '==', options.status));
        }

        // Add ordering
        assignmentsQuery = query(assignmentsQuery, orderBy('assignedAt', 'desc'));

        const querySnapshot = await getDocs(assignmentsQuery);
        const assignments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            assignedAt: doc.data().assignedAt?.toDate()
        }));

        // Get form details for each assignment
        const assignmentsWithForms = await Promise.all(
            assignments.map(async (assignment) => {
                try {
                    const form = await getFormById(assignment.formId);
                    return {
                        ...assignment,
                        form
                    };
                } catch (error) {
                    console.warn(`Failed to get form ${assignment.formId}:`, error);
                    return assignment;
                }
            })
        );

        return assignmentsWithForms;
    } catch (error) {
        console.error('❌ Error getting user form assignments:', error);
        throw new Error(`Failed to get form assignments: ${error.message}`);
    }
};

/**
 * Upload signed declaration file
 * @param {File} file - File to upload
 * @param {string} userId - User ID for file organization
 * @returns {Promise<string>} Download URL
 */
export const uploadSignedDeclaration = async (file, userId) => {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const fileRef = ref(storage, `signedParentsDeclarations/${userId}/${fileName}`);

        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

/**
 * Get forms analytics
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
 * Mark form assignment as completed
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

/**
 * Get forms for specific user role
 * @param {string} userRole - User role (parent, instructor, host)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of forms
 */
export const getFormsForRole = async (userRole, options = {}) => {
    try {
        let formsQuery = query(
            collection(db, 'forms'),
            where('targetUsers', 'array-contains', userRole),
            where('status', '==', 'active')
        );

        // Add ordering
        formsQuery = query(formsQuery, orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(formsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
    } catch (error) {
        console.error('❌ Error getting forms for role:', error);
        throw new Error(`Failed to get forms for role: ${error.message}`);
    }
};



// Export all functions
export default {
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