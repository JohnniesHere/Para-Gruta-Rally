import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFirestoreCollection } from '../dataSync';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import SearchBar from '../common/SearchBar';

const FormsManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredForms, setFilteredForms] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Fetch all forms
    const { data: forms, loading, error } = useFirestoreCollection('forms', [orderBy('createdAt', 'desc')]);

    // Filter forms based on search term
    useEffect(() => {
        if (forms) {
            const filtered = forms.filter(form =>
                form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                form.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredForms(filtered);
        }
    }, [forms, searchTerm]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Delete a form
    const handleDelete = async (formId) => {
        try {
            await deleteDoc(doc(db, 'forms', formId));
            setConfirmDelete(null);
        } catch (err) {
            console.error('Error deleting form:', err);
        }
    };

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get form status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
            case 'draft':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Draft</span>;
            case 'archived':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Archived</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{status}</span>;
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Forms Management</h1>
                <button
                    onClick={() => navigate('/forms/new')}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Create New Form
                </button>
            </div>

            <div className="mb-6">
                <SearchBar
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {filteredForms.length > 0 ? (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Form Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submissions
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredForms.map(form => (
                            <tr key={form.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            <Link to={`/forms/${form.id}`} className="hover:text-blue-600">
                                                {form.title}
                                            </Link>
                                        </div>
                                        {form.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {form.description}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(form.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(form.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {form.submissionCount || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={`/forms/${form.id}/submissions`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                        View Submissions
                                    </Link>
                                    <Link to={`/forms/${form.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                                        Edit
                                    </Link>
                                    {confirmDelete === form.id ? (
                                        <>
                                            <button
                                                onClick={() => handleDelete(form.id)}
                                                className="text-red-600 hover:text-red-900 mr-2"
                                            >
                                                Confirm
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
                                            onClick={() => setConfirmDelete(form.id)}
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
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No forms found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'No forms match your search criteria.' : 'Get started by creating a new form.'}
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/forms/new')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg
                                className="-ml-1 mr-2 h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            New Form
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormsManagement;