import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import Tabs from '../common/Tabs';

const FormReview = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Fetch form and submissions
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch form details
                const formDoc = await getDoc(doc(db, 'forms', formId));
                if (!formDoc.exists()) {
                    throw new Error('Form not found');
                }
                setForm(formDoc.data());

                // Fetch form submissions
                const submissionsQuery = query(
                    collection(db, 'form_submissions'),
                    where('formId', '==', formId),
                    orderBy('submittedAt', 'desc')
                );

                const submissionsSnapshot = await getDocs(submissionsQuery);
                const submissionsData = submissionsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSubmissions(submissionsData);
            } catch (err) {
                console.error('Error fetching form data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [formId]);

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Delete submission
    const handleDeleteSubmission = async (submissionId) => {
        try {
            await deleteDoc(doc(db, 'form_submissions', submissionId));
            setSubmissions(prev => prev.filter(submission => submission.id !== submissionId));
            setSelectedSubmission(null);
            setConfirmDelete(null);
        } catch (err) {
            console.error('Error deleting submission:', err);
        }
    };

    // Export submissions as CSV
    const exportCSV = () => {
        if (!form || submissions.length === 0) return;

        // Get all field IDs from form
        const fieldIds = form.fields.map(field => field.id);

        // Create header row
        const headers = ['Submission ID', 'Submitted At', ...form.fields.map(field => field.label)];

        // Create data rows
        const rows = submissions.map(submission => {
            const rowData = [
                submission.id,
                formatDate(submission.submittedAt)
            ];

            // Add field data
            fieldIds.forEach(fieldId => {
                const value = submission.data[fieldId];

                if (Array.isArray(value)) {
                    // Handle checkbox data
                    rowData.push(value.join(', '));
                } else {
                    rowData.push(value || '');
                }
            });

            return rowData;
        });

        // Combine header and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${form.title}_submissions.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!form) return <ErrorMessage message="Form not found" />;

    const tabs = [
        { id: 'all', label: 'All Submissions' },
        { id: 'details', label: 'Submission Details', disabled: !selectedSubmission }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Form Submissions: {form.title}
                </h1>
                <div className="space-x-2">
                    <button
                        onClick={exportCSV}
                        className="bg-indigo-500 text-white px-4 py-2 rounded"
                        disabled={submissions.length === 0}
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => navigate('/forms')}
                        className="bg-gray-200 px-4 py-2 rounded"
                    >
                        Back to Forms
                    </button>
                </div>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6">
                {activeTab === 'all' && (
                    <div>
                        {submissions.length > 0 ? (
                            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submission ID
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted At
                                        </th>
                                        {form.fields.slice(0, 3).map(field => (
                                            <th
                                                key={field.id}
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {field.label}
                                            </th>
                                        ))}
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {submissions.map(submission => (
                                        <tr
                                            key={submission.id}
                                            className={`hover:bg-gray-50 cursor-pointer ${
                                                selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''
                                            }`}
                                            onClick={() => {
                                                setSelectedSubmission(submission);
                                                setActiveTab('details');
                                            }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {submission.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(submission.submittedAt)}
                                            </td>
                                            {form.fields.slice(0, 3).map(field => (
                                                <td
                                                    key={field.id}
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                >
                                                    {renderFieldValue(submission.data[field.id], field.type)}
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSubmission(submission);
                                                        setActiveTab('details');
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    View
                                                </button>
                                                {confirmDelete === submission.id ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteSubmission(submission.id);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 mr-2"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmDelete(null);
                                                            }}
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDelete(submission.id);
                                                        }}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No submissions yet</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'details' && selectedSubmission && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">Submission Details</h2>
                            <div className="space-x-2">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    Back to List
                                </button>
                                {confirmDelete === selectedSubmission.id ? (
                                    <>
                                        <button
                                            onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                                            className="text-red-600 hover:text-red-900 mr-2"
                                        >
                                            Confirm Delete
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(selectedSubmission.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-200 pb-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Submission ID</h3>
                                <p className="mt-1">{selectedSubmission.id}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Submitted At</h3>
                                <p className="mt-1">{formatDate(selectedSubmission.submittedAt)}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {form.fields.map(field => (
                                <div key={field.id} className="border-b border-gray-200 pb-4 last:border-0">
                                    <h3 className="text-sm font-medium text-gray-500">{field.label}</h3>
                                    <div className="mt-2">
                                        {renderDetailedFieldValue(selectedSubmission.data[field.id], field)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to render field value in table
const renderFieldValue = (value, fieldType) => {
    if (value === undefined || value === null || value === '') {
        return <span className="text-gray-400">—</span>;
    }

    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <span className="text-gray-400">—</span>;
    }

    if (fieldType === 'date') {
        return new Date(value).toLocaleDateString();
    }

    return String(value).length > 30
        ? String(value).substring(0, 30) + '...'
        : String(value);
};

// Helper function to render detailed field value
const renderDetailedFieldValue = (value, field) => {
    if (value === undefined || value === null || value === '') {
        return <span className="text-gray-400">Not provided</span>;
    }

    if (field.type === 'checkbox' && Array.isArray(value)) {
        return value.length > 0 ? (
            <ul className="list-disc list-inside">
                {value.map((item, index) => (
                    <li key={index} className="text-gray-900">{item}</li>
                ))}
            </ul>
        ) : (
            <span className="text-gray-400">No options selected</span>
        );
    }

    if (field.type === 'date') {
        return new Date(value).toLocaleDateString();
    }

    if (field.type === 'textarea') {
        return <p className="whitespace-pre-line text-gray-900">{value}</p>;
    }

    return <p className="text-gray-900">{value}</p>;
};

export default FormReview;