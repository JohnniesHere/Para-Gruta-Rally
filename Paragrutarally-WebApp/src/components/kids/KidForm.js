// src/components/kids/KidForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

function KidForm() {
    const { kidId } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!kidId;

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        teamId: '',
        notes: '',
    });

    // Additional state
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(isEditMode);
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);

    // Fetch kid data if in edit mode
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch teams for the dropdown
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeams(teamsData);

                // If editing an existing kid, fetch their data
                if (isEditMode) {
                    const kidDoc = await getDoc(doc(db, 'kids', kidId));
                    if (kidDoc.exists()) {
                        const kidData = kidDoc.data();
                        setFormData({
                            firstName: kidData.firstName || '',
                            lastName: kidData.lastName || '',
                            age: kidData.age ? kidData.age.toString() : '',
                            gender: kidData.gender || '',
                            email: kidData.email || '',
                            phone: kidData.phone || '',
                            address: kidData.address || '',
                            emergencyContact: kidData.emergencyContact || '',
                            emergencyPhone: kidData.emergencyPhone || '',
                            teamId: kidData.teamId || '',
                            notes: kidData.notes || '',
                        });
                    } else {
                        setError('Kid not found');
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setFetchingData(false);
            }
        };

        fetchData();
    }, [kidId, isEditMode]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate inputs
            if (!formData.firstName || !formData.lastName) {
                throw new Error('First name and last name are required');
            }

            // Convert age to number
            const processedData = {
                ...formData,
                age: formData.age ? parseInt(formData.age, 10) : null,
                updatedAt: serverTimestamp(),
            };

            if (isEditMode) {
                // Update existing kid
                await setDoc(doc(db, 'kids', kidId), processedData, { merge: true });
            } else {
                // Add new kid
                processedData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'kids'), processedData);
            }

            // Redirect back to kids list
            navigate('/kids');
        } catch (err) {
            console.error('Error saving kid:', err);
            setError(err.message || 'Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <div className="flex justify-center items-center h-96">
                <svg
                    className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <span className="text-gray-600">Loading...</span>
            </div>
        );
    }

    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Kid' : 'Add New Kid'}
                    </h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="px-4 py-5 sm:p-6">
                                {error && (
                                    <div className="rounded-md bg-red-50 p-4 mb-6">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-5 w-5 text-red-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-red-800">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    {/* First Name */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                            First name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="firstName"
                                                id="firstName"
                                                autoComplete="given-name"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Last Name */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                            Last name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="lastName"
                                                id="lastName"
                                                autoComplete="family-name"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Age */}
                                    <div className="sm:col-span-2">
                                        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                                            Age
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="number"
                                                name="age"
                                                id="age"
                                                min="0"
                                                max="100"
                                                value={formData.age}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="sm:col-span-2">
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                            Gender
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Team */}
                                    <div className="sm:col-span-2">
                                        <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                                            Team
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="teamId"
                                                name="teamId"
                                                value={formData.teamId}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            >
                                                <option value="">No Team</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>
                                                        {team.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                autoComplete="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                            Phone number
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="phone"
                                                id="phone"
                                                autoComplete="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                            Address
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="address"
                                                id="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                                            Emergency Contact
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="emergencyContact"
                                                id="emergencyContact"
                                                value={formData.emergencyContact}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Emergency Phone */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
                                            Emergency Phone
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="emergencyPhone"
                                                id="emergencyPhone"
                                                value={formData.emergencyPhone}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                            Notes
                                        </label>
                                        <div className="mt-1">
                      <textarea
                          id="notes"
                          name="notes"
                          rows="3"
                          value={formData.notes}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/kids')}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KidForm;