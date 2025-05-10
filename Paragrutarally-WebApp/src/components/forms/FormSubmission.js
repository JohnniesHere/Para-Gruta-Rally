import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, Timestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';

const FormSubmission = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch form data
    useEffect(() => {
        const fetchForm = async () => {
            try {
                setLoading(true);
                const formDoc = await getDoc(doc(db, 'forms', formId));

                if (formDoc.exists()) {
                    const formData = formDoc.data();

                    // Check if form is active
                    if (formData.status !== 'active') {
                        setError(new Error('This form is not currently active'));
                        return;
                    }

                    setForm(formData);

                    // Initialize form values
                    const initialValues = {};
                    formData.fields.forEach(field => {
                        if (field.type === 'checkbox') {
                            initialValues[field.id] = [];
                        } else {
                            initialValues[field.id] = '';
                        }
                    });
                    setFormData(initialValues);
                } else {
                    setError(new Error('Form not found'));
                }
            } catch (err) {
                console.error('Error fetching form:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [formId]);

    // Handle field change
    const handleFieldChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));

        // Clear validation error for this field
        if (validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    // Handle checkbox change
    const handleCheckboxChange = (fieldId, option, isChecked) => {
        setFormData(prev => {
            const currentSelections = prev[fieldId] || [];

            if (isChecked) {
                // Add option if not already present
                return {
                    ...prev,
                    [fieldId]: currentSelections.includes(option)
                        ? currentSelections
                        : [...currentSelections, option]
                };
            } else {
                // Remove option
                return {
                    ...prev,
                    [fieldId]: currentSelections.filter(selected => selected !== option)
                };
            }
        });

        // Clear validation error for this field
        if (validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!form) return false;

        form.fields.forEach(field => {
            if (field.required) {
                const value = formData[field.id];

                if (field.type === 'checkbox') {
                    if (!value || value.length === 0) {
                        errors[field.id] = 'Please select at least one option';
                    }
                } else if (!value || String(value).trim() === '') {
                    errors[field.id] = 'This field is required';
                }
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = document.querySelector('.field-error');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        try {
            setSubmitting(true);

            // Prepare submission data
            const submission = {
                formId,
                formTitle: form.title,
                data: formData,
                submittedAt: Timestamp.now()
            };

            // Add submission to database
            await addDoc(collection(db, 'form_submissions'), submission);

            // Increment submission count on form
            await updateDoc(doc(db, 'forms', formId), {
                submissionCount: increment(1)
            });

            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!form) return <ErrorMessage message="Form not found" />;

    if (submitted) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
                <div className="text-center py-8">
                    <svg
                        className="mx-auto h-16 w-16 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">Form Submitted Successfully</h2>
                    <p className="mt-2 text-gray-600">Thank you for your submission. Your response has been recorded.</p>
                    <div className="mt-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{form.title}</h1>
            {form.description && (
                <p className="text-gray-600 mb-6">{form.description}</p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {form.fields
                        .sort((a, b) => a.order - b.order)
                        .map(field => (
                            <div key={field.id} className={`field-container ${validationErrors[field.id] ? 'field-error' : ''}`}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                            validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows="3"
                                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                            validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    ></textarea>
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                            validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                )}

                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                            validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                )}

                                {field.type === 'select' && (
                                    <select
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                            validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select an option</option>
                                        {field.options.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'checkbox' && (
                                    <div className="mt-2 space-y-2">
                                        {field.options.map((option, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`${field.id}-${index}`}
                                                    checked={(formData[field.id] || []).includes(option)}
                                                    onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                                                    className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                                        validationErrors[field.id] ? 'border-red-300' : ''
                                                    }`}
                                                />
                                                <label
                                                    htmlFor={`${field.id}-${index}`}
                                                    className="ml-2 block text-sm text-gray-900"
                                                >
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'radio' && (
                                    <div className="mt-2 space-y-2">
                                        {field.options.map((option, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id={`${field.id}-${index}`}
                                                    name={field.id}
                                                    value={option}
                                                    checked={formData[field.id] === option}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    className={`h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                                        validationErrors[field.id] ? 'border-red-300' : ''
                                                    }`}
                                                />
                                                <label
                                                    htmlFor={`${field.id}-${index}`}
                                                    className="ml-2 block text-sm text-gray-900"
                                                >
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {validationErrors[field.id] && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {validationErrors[field.id]}
                                    </p>
                                )}
                            </div>
                        ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormSubmission;