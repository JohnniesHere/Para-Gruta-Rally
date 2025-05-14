// src/firebase/services/forms.js
// Forms management service for Firestore

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    increment,
    writeBatch,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../config';
import { getStorage } from './storage';

/**
 * Create a new form template
 * @param {Object} formData - Form data including title, description, and fields
 * @param {string} userId - User ID creating the form
 * @returns {Promise} - Document reference
 */
export const createForm = async (formData, userId) => {
    try {
        // Set defaults and metadata
        const form = {
            ...formData,
            isActive: formData.isActive !== undefined ? formData.isActive : true,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Add the form to Firestore
        const formRef = await addDoc(collection(db, 'forms'), form);
        
        return { id: formRef.id, ...form };
    } catch (error) {
        throw error;
    }
};

/**
 * Get a form by ID
 * @param {string} formId - Form ID
 * @returns {Promise} - Form data
 */
export const getForm = async (formId) => {
    try {
        const formRef = doc(db, 'forms', formId);
        const formSnap = await getDoc(formRef);

        if (formSnap.exists()) {
            return { id: formSnap.id, ...formSnap.data() };
        } else {
            throw new Error('Form not found');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Update a form
 * @param {string} formId - Form ID
 * @param {Object} formData - Data to update
 * @returns {Promise} - Updated form
 */
export const updateForm = async (formId, formData) => {
    try {
        const formRef = doc(db, 'forms', formId);
        
        // Remove fields that shouldn't be updated directly
        const { createdAt, createdBy, ...updateData } = formData;
        
        // Add updated timestamp
        updateData.updatedAt = serverTimestamp();

        await updateDoc(formRef, updateData);
        
        // Get the updated form
        return await getForm(formId);
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a form
 * @param {string} formId - Form ID
 * @returns {Promise} - Void promise
 */
export const deleteForm = async (formId) => {
    try {
        // Check if there are any submissions
        const submissionsQuery = query(
            collection(db, 'form_submissions'),
            where('formId', '==', formId)
        );
        
        const submissionsSnap = await getDocs(submissionsQuery);
        
        if (!submissionsSnap.empty) {
            throw new Error('Cannot delete form with existing submissions');
        }
        
        const formRef = doc(db, 'forms', formId);
        return await deleteDoc(formRef);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all forms with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise} - Array of forms
 */
export const getForms = async (options = {}) => {
    try {
        const {
            type,
            isActive,
            targetAudience,
            eventId,
            createdBy,
            orderField = 'createdAt',
            orderDirection = 'desc',
            limitCount = 20,
            lastVisible = null
        } = options;

        // Start building the query
        let formsQuery = collection(db, 'forms');
        const queryConstraints = [];

        // Add filters if provided
        if (type) {
            queryConstraints.push(where('type', '==', type));
        }

        if (isActive !== undefined) {
            queryConstraints.push(where('isActive', '==', isActive));
        }

        if (targetAudience) {
            queryConstraints.push(where('targetAudience', '==', targetAudience));
        }

        if (eventId) {
            queryConstraints.push(where('eventId', '==', eventId));
        }

        if (createdBy) {
            queryConstraints.push(where('createdBy', '==', createdBy));
        }

        // Add ordering
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount));
        
        // Add pagination if a last document is provided
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        // Build the final query
        const q = query(formsQuery, ...queryConstraints);
        
        // Execute the query
        const querySnapshot = await getDocs(q);
        
        // Transform the results
        const forms = [];
        querySnapshot.forEach(doc => {
            forms.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Return the results with the last visible document for pagination
        return {
            forms,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Submit a form
 * @param {string} formId - Form ID
 * @param {Object} responses - Form responses by field ID
 * @param {string} submittedBy - User ID submitting the form
 * @param {Object} metadata - Additional metadata (kidId, eventId, etc.)
 * @returns {Promise} - Submission data
 */
export const submitForm = async (formId, responses, submittedBy, metadata = {}) => {
    try {
        // Check if form exists
        const formRef = doc(db, 'forms', formId);
        const formSnap = await getDoc(formRef);
        
        if (!formSnap.exists()) {
            throw new Error('Form not found');
        }
        
        const formData = formSnap.data();
        
        // If form is not active, reject submission
        if (formData.isActive === false) {
            throw new Error('Form is not active');
        }
        
        // Validate responses against form fields (basic validation)
        if (formData.fields) {
            for (const field of formData.fields) {
                // If field is required, ensure response exists
                if (field.required && !responses[field.id]) {
                    throw new Error(`Required field ${field.label} is missing`);
                }
                
                // TODO: Add more validation based on field types
            }
        }
        
        // Create submission
        const submissionData = {
            formId,
            submittedBy,
            submittedAt: serverTimestamp(),
            responses,
            status: 'pending',
            ...metadata,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Add the submission to Firestore
        const submissionRef = await addDoc(collection(db, 'form_submissions'), submissionData);
        
        return { id: submissionRef.id, ...submissionData };
    } catch (error) {
        throw error;
    }
};

/**
 * Get a form submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise} - Submission data
 */
export const getFormSubmission = async (submissionId) => {
    try {
        const submissionRef = doc(db, 'form_submissions', submissionId);
        const submissionSnap = await getDoc(submissionRef);

        if (submissionSnap.exists()) {
            return { id: submissionSnap.id, ...submissionSnap.data() };
        } else {
            throw new Error('Form submission not found');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Update a form submission status
 * @param {string} submissionId - Submission ID
 * @param {string} status - New status ('pending', 'approved', 'rejected')
 * @param {string} reviewedBy - User ID reviewing the submission
 * @param {string} notes - Review notes
 * @returns {Promise} - Updated submission
 */
export const updateSubmissionStatus = async (submissionId, status, reviewedBy, notes = '') => {
    try {
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            throw new Error('Invalid status');
        }
        
        const submissionRef = doc(db, 'form_submissions', submissionId);
        const submissionSnap = await getDoc(submissionRef);
        
        if (!submissionSnap.exists()) {
            throw new Error('Form submission not found');
        }
        
        // Update submission
        await updateDoc(submissionRef, {
            status,
            reviewedBy,
            reviewedAt: serverTimestamp(),
            notes,
            updatedAt: serverTimestamp()
        });
        
        // Get updated submission
        return await getFormSubmission(submissionId);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all submissions for a form
 * @param {string} formId - Form ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of submissions
 */
export const getFormSubmissions = async (formId, options = {}) => {
    try {
        const {
            status,
            kidId,
            eventId,
            submittedBy,
            orderField = 'submittedAt',
            orderDirection = 'desc',
            limitCount = 20,
            lastVisible = null
        } = options;
        
        // Build query
        let submissionsQuery = collection(db, 'form_submissions');
        const queryConstraints = [where('formId', '==', formId)];
        
        if (status) {
            queryConstraints.push(where('status', '==', status));
        }
        
        if (kidId) {
            queryConstraints.push(where('kidId', '==', kidId));
        }
        
        if (eventId) {
            queryConstraints.push(where('eventId', '==', eventId));
        }
        
        if (submittedBy) {
            queryConstraints.push(where('submittedBy', '==', submittedBy));
        }
        
        // Add ordering
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount));
        
        // Add pagination if a last document is provided
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }
        
        const q = query(submissionsQuery, ...queryConstraints);
        
        // Execute query
        const querySnapshot = await getDocs(q);
        
        // Transform results
        const submissions = [];
        querySnapshot.forEach(doc => {
            submissions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Return the results with the last visible document for pagination
        return {
            submissions,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all submissions by a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of submissions
 */
export const getUserSubmissions = async (userId, options = {}) => {
    try {
        const {
            status,
            formType,
            orderField = 'submittedAt',
            orderDirection = 'desc',
            limitCount = 20,
            lastVisible = null
        } = options;
        
        // Build query
        let submissionsQuery = collection(db, 'form_submissions');
        const queryConstraints = [where('submittedBy', '==', userId)];
        
        if (status) {
            queryConstraints.push(where('status', '==', status));
        }
        
        // Add ordering
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount));
        
        // Add pagination if a last document is provided
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }
        
        const q = query(submissionsQuery, ...queryConstraints);
        
        // Execute query
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return {
                submissions: [],
                lastVisible: null
            };
        }
        
        // Transform results
        const submissions = [];
        const formIds = new Set();
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            submissions.push({
                id: doc.id,
                ...data
            });
            
            if (data.formId) {
                formIds.add(data.formId);
            }
        });
        
        // If formType filter is provided, we need to fetch the forms and filter
        if (formType && formIds.size > 0) {
            // Get all the forms
            const formPromises = Array.from(formIds).map(id => getForm(id));
            const forms = await Promise.all(formPromises);
            
            // Create a map of form types
            const formTypeMap = {};
            forms.forEach(form => {
                formTypeMap[form.id] = form.type;
            });
            
            // Filter submissions by form type
            const filteredSubmissions = submissions.filter(submission => {
                return formTypeMap[submission.formId] === formType;
            });
            
            return {
                submissions: filteredSubmissions,
                lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        }
        
        return {
            submissions,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all submissions for a child
 * @param {string} kidId - Child ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of submissions
 */
export const getChildSubmissions = async (kidId, options = {}) => {
    try {
        const {
            status,
            formType,
            orderField = 'submittedAt',
            orderDirection = 'desc',
            limitCount = 20,
            lastVisible = null
        } = options;
        
        // Build query
        let submissionsQuery = collection(db, 'form_submissions');
        const queryConstraints = [where('kidId', '==', kidId)];
        
        if (status) {
            queryConstraints.push(where('status', '==', status));
        }
        
        // Add ordering
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount));
        
        // Add pagination if a last document is provided
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }
        
        const q = query(submissionsQuery, ...queryConstraints);
        
        // Execute query
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return {
                submissions: [],
                lastVisible: null
            };
        }
        
        // Transform results
        const submissions = [];
        const formIds = new Set();
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            submissions.push({
                id: doc.id,
                ...data
            });
            
            if (data.formId) {
                formIds.add(data.formId);
            }
        });
        
        // If formType filter is provided, we need to fetch the forms and filter
        if (formType && formIds.size > 0) {
            // Get all the forms
            const formPromises = Array.from(formIds).map(id => getForm(id));
            const forms = await Promise.all(formPromises);
            
            // Create a map of form types
            const formTypeMap = {};
            forms.forEach(form => {
                formTypeMap[form.id] = form.type;
            });
            
            // Filter submissions by form type
            const filteredSubmissions = submissions.filter(submission => {
                return formTypeMap[submission.formId] === formType;
            });
            
            return {
                submissions: filteredSubmissions,
                lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        }
        
        return {
            submissions,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Add an attachment to a form submission
 * @param {string} submissionId - Submission ID
 * @param {Object} attachment - Attachment data (name, url, type)
 * @returns {Promise} - Updated submission
 */
export const addSubmissionAttachment = async (submissionId, attachment) => {
    try {
        const submissionRef = doc(db, 'form_submissions', submissionId);
        
        await updateDoc(submissionRef, {
            attachments: arrayUnion(attachment),
            updatedAt: serverTimestamp()
        });
        
        return await getFormSubmission(submissionId);
    } catch (error) {
        throw error;
    }
};

/**
 * Remove an attachment from a form submission
 * @param {string} submissionId - Submission ID
 * @param {Object} attachment - Attachment data to remove
 * @returns {Promise} - Updated submission
 */
export const removeSubmissionAttachment = async (submissionId, attachment) => {
    try {
        const submissionRef = doc(db, 'form_submissions', submissionId);
        
        await updateDoc(submissionRef, {
            attachments: arrayRemove(attachment),
            updatedAt: serverTimestamp()
        });
        
        return await getFormSubmission(submissionId);
    } catch (error) {
        throw error;
    }
};

/**
 * Duplicate a form template
 * @param {string} formId - Source form ID
 * @param {string} userId - User ID creating the duplicate
 * @param {Object} overrides - Fields to override in the duplicate
 * @returns {Promise} - New form data
 */
export const duplicateForm = async (formId, userId, overrides = {}) => {
    try {
        // Get the source form
        const sourceForm = await getForm(formId);
        
        if (!sourceForm) {
            throw new Error('Source form not found');
        }
        
        // Create a new form based on the source
        const { id, createdAt, createdBy, updatedAt, ...formData } = sourceForm;
        
        const newForm = {
            ...formData,
            ...overrides,
            title: overrides.title || `${formData.title} (Copy)`,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        return await createForm(newForm, userId);
    } catch (error) {
        throw error;
    }
};

export default {
    createForm,
    getForm,
    updateForm,
    deleteForm,
    getForms,
    submitForm,
    getFormSubmission,
    updateSubmissionStatus,
    getFormSubmissions,
    getUserSubmissions,
    getChildSubmissions,
    addSubmissionAttachment,
    removeSubmissionAttachment,
    duplicateForm
};