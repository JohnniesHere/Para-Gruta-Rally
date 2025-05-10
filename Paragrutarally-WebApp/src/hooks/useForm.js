// src/hooks/useForm.js
// Custom hook for form handling

import { useState } from 'react';

/**
 * Custom hook for managing form state
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Form validation function
 * @param {Function} submitFn - Form submission function
 * @returns {Object} - Form state and handlers
 */
export const useForm = (initialValues, validateFn = () => ({}), submitFn = () => {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});

    /**
     * Handle input blur
     * @param {Event} e - Input blur event
     */
    const handleBlur = (e) => {
        const { name } = e.target;

        // Mark field as touched
        setTouched({
            ...touched,
            [name]: true
        });

        // Validate on blur
        const fieldErrors = validateFn(values);
        setErrors(fieldErrors);
    };

    /**
     * Reset form to initial values
     */
    const resetForm = () => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    };

    /**
     * Handle form submission
     * @param {Event} e - Form submission event
     */
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Validate all fields
        const formErrors = validateFn(values);
        setErrors(formErrors);

        // Mark all fields as touched
        const allTouched = {};
        Object.keys(values).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);

        // Check if there are any errors
        const hasErrors = Object.keys(formErrors).length > 0;

        if (!hasErrors) {
            setIsSubmitting(true);
            try {
                await submitFn(values);
            } catch (error) {
                console.error('Form submission error:', error);
                // Set submission error if needed
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setValues
    };
};






