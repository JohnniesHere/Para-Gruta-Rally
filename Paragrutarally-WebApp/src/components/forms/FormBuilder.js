import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { FirestoreService } from '../dataSync';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import { v4 as uuidv4 } from 'uuid';

const FormBuilder = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const isEditing = formId !== 'new';

    const [form, setForm] = useState({
        title: '',
        description: '',
        status: 'draft',
        fields: [],
        createdAt: null,
        updatedAt: null
    });

    const [loading, setLoading] = useState(isEditing);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Fetch form data if editing
    useEffect(() => {
        const fetchForm = async () => {
            try {
                setLoading(true);
                const formDoc = await getDoc(doc(db, 'forms', formId));

                if (formDoc.exists()) {
                    setForm(formDoc.data());
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

        if (isEditing) {
            fetchForm();
        }
    }, [formId, isEditing]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add a new field
    const addField = (type) => {
        const newField = {
            id: uuidv4(),
            type,
            label: '',
            placeholder: '',
            required: false,
            options: type === 'select' || type === 'checkbox' || type === 'radio' ? ['Option 1'] : [],
            order: form.fields.length
        };

        setForm(prev => ({
            ...prev,
            fields: [...prev.fields, newField]
        }));
    };

    // Update field
    const updateField = (fieldId, updates) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.map(field =>
                field.id === fieldId ? { ...field, ...updates } : field
            )
        }));
    };

    // Remove field
    const removeField = (fieldId) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.filter(field => field.id !== fieldId)
        }));
    };

    // Reorder fields
    const moveField = (fieldId, direction) => {
        const fieldIndex = form.fields.findIndex(field => field.id === fieldId);
        if (fieldIndex === -1) return;

        const newIndex = direction === 'up' ? Math.max(0, fieldIndex - 1) : Math.min(form.fields.length - 1, fieldIndex + 1);
        if (newIndex === fieldIndex) return;

        const newFields = [...form.fields];
        const [movedField] = newFields.splice(fieldIndex, 1);
        newFields.splice(newIndex, 0, movedField);

        // Update field orders
        const fieldsWithOrder = newFields.map((field, index) => ({
            ...field,
            order: index
        }));

        setForm(prev => ({
            ...prev,
            fields: fieldsWithOrder
        }));
    };

    // Add option to select/checkbox/radio field
    const addOption = (fieldId) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.map(field => {
                if (field.id === fieldId) {
                    return {
                        ...field,
                        options: [...field.options, `Option ${field.options.length + 1}`]
                    };
                }
                return field;
            })
        }));
    };

    // Update option
    const updateOption = (fieldId, optionIndex, newValue) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.map(field => {
                if (field.id === fieldId) {
                    const updatedOptions = [...field.options];
                    updatedOptions[optionIndex] = newValue;
                    return {
                        ...field,
                        options: updatedOptions
                    };
                }
                return field;
            })
        }));
    };

    // Remove option
    const removeOption = (fieldId, optionIndex) => {
        setForm(prev => ({
            ...prev,
            fields: prev.fields.map(field => {
                if (field.id === fieldId && field.options.length > 1) {
                    const updatedOptions = [...field.options];
                    updatedOptions.splice(optionIndex, 1);
                    return {
                        ...field,
                        options: updatedOptions
                    };
                }
                return field;
            })
        }));
    };

    // Save form
    const handleSave = async (status = form.status) => {
        try {
            setSaving(true);

            const now = Timestamp.now();
            const formToSave = {
                ...form,
                status,
                updatedAt: now
            };

            if (!isEditing) {
                formToSave.createdAt = now;
                formToSave.submissionCount = 0;
            }

            const formRef = isEditing
                ? doc(db, 'forms', formId)
                : doc(collection(db, 'forms'));

            await setDoc(formRef, formToSave);

            navigate('/forms');
        } catch (err) {
            console.error('Error saving form:', err);
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    // Toggle preview mode
    const togglePreview = () => {
        setPreviewMode(!previewMode);
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {isEditing ? `Edit Form: ${form.title}` : 'Create New Form'}
                </h1>
                <div className="space-x-2">
                    <button
                        onClick={togglePreview}
                        className="bg-indigo-500 text-white px-4 py-2 rounded"
                        disabled={saving}
                    >
                        {previewMode ? 'Edit Form' : 'Preview Form'}
                    </button>
                    <button
                        onClick={() => navigate('/forms')}
                        className="bg-gray-200 px-4 py-2 rounded"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSave('draft')}
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                        disabled={saving || !form.title}
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={() => handleSave('active')}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        disabled={saving || !form.title || form.fields.length === 0}
                    >
                        {saving ? 'Saving...' : 'Publish Form'}
                    </button>
                </div>
            </div>

            {previewMode ? (
                <div className="mt-6 border-2 border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">{form.title}</h2>
                    {form.description && (
                        <p className="text-gray-600 mb-6">{form.description}</p>
                    )}

                    <div className="space-y-6">
                        {form.fields.sort((a, b) => a.order - b.order).map(field => (
                            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        placeholder={field.placeholder}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        disabled
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        placeholder={field.placeholder}
                                        rows="3"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        disabled
                                    ></textarea>
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        placeholder={field.placeholder}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        disabled
                                    />
                                )}

                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        disabled
                                    />
                                )}

                                {field.type === 'select' && (
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        disabled
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
                                                    disabled
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <label className="ml-2 block text-sm text-gray-900">
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
                                                    disabled
                                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <label className="ml-2 block text-sm text-gray-900">
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {form.fields.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No fields added yet</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Form Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={form.title}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Provide instructions or additional information for this form"
                        ></textarea>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">Form Fields</h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => addField('text')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Text Field
                            </button>
                            <button
                                onClick={() => addField('textarea')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Textarea
                            </button>
                            <button
                                onClick={() => addField('number')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Number Field
                            </button>
                            <button
                                onClick={() => addField('date')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Date Field
                            </button>
                            <button
                                onClick={() => addField('select')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Dropdown
                            </button>
                            <button
                                onClick={() => addField('checkbox')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Checkboxes
                            </button>
                            <button
                                onClick={() => addField('radio')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                                Add Radio Buttons
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {form.fields.sort((a, b) => a.order - b.order).map(field => (
                            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-md font-semibold">
                                        {field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field
                                    </h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => moveField(field.id, 'up')}
                                            className="text-gray-500 hover:text-gray-700"
                                            disabled={field.order === 0}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveField(field.id, 'down')}
                                            className="text-gray-500 hover:text-gray-700"
                                            disabled={field.order === form.fields.length - 1}
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={() => removeField(field.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Label
                                        </label>
                                        <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>

                                    {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Placeholder
                                            </label>
                                            <input
                                                type="text"
                                                value={field.placeholder || ''}
                                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`required-${field.id}`}
                                            checked={field.required}
                                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`required-${field.id}`} className="ml-2 block text-sm text-gray-900">
                                            Required Field
                                        </label>
                                    </div>
                                </div>

                                {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Options
                                            </label>
                                            <button
                                                onClick={() => addOption(field.id)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                + Add Option
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {field.options.map((option, index) => (
                                                <div key={index} className="flex items-center">
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => updateOption(field.id, index, e.target.value)}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={() => removeOption(field.id, index)}
                                                        className="ml-2 text-red-500 hover:text-red-700"
                                                        disabled={field.options.length <= 1}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {form.fields.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Add fields to your form using the buttons above</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FormBuilder;