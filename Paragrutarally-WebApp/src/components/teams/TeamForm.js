// src/components/teams/TeamForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

function TeamForm() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!teamId;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        instructorId: '',
        type: 'regular',
        maxCapacity: '',
        meetingDays: '',
        meetingTime: '',
        location: '',
        notes: '',
    });

    // Additional state
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(isEditMode);
    const [error, setError] = useState('');
    const [instructors, setInstructors] = useState([]);

    // Fetch team data if in edit mode
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch instructors (staff users)
                const instructorsQuery = query(
                    collection(db, 'users'),
                    where('role', 'in', ['staff', 'admin'])
                );
                const instructorsSnapshot = await getDocs(instructorsQuery);
                const instructorsData = instructorsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInstructors(instructorsData);

                // If editing an existing team, fetch its data
                if (isEditMode) {
                    const teamDoc = await getDoc(doc(db, 'teams', teamId));
                    if (teamDoc.exists()) {
                        const teamData = teamDoc.data();
                        setFormData({
                            name: teamData.name || '',
                            description: teamData.description || '',
                            instructorId: teamData.instructorId || '',
                            type: teamData.type || 'regular',
                            maxCapacity: teamData.maxCapacity ? teamData.maxCapacity.toString() : '',
                            meetingDays: teamData.meetingDays || '',
                            meetingTime: teamData.meetingTime || '',
                            location: teamData.location || '',
                            notes: teamData.notes || '',
                        });
                    } else {
                        setError('Team not found');
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
    }, [teamId, isEditMode]);

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
            if (!formData.name) {
                throw new Error('Team name is required');
            }

            // Convert numeric fields
            const processedData = {
                ...formData,
                maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity, 10) : null,
                updatedAt: serverTimestamp(),
            };

            if (isEditMode) {
                // Update existing team
                await setDoc(doc(db, 'teams', teamId), processedData, { merge: true });
            } else {
                // Add new team
                processedData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'teams'), processedData);
            }

            // Redirect back to teams list
            navigate('/teams');
        } catch (err) {
            console.error('Error saving team:', err);
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
                        {isEditMode ? 'Edit Team' : 'Add New Team'}
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
                                    {/* Team Name */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Team Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Team Type */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                            Team Type
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="type"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            >
                                                <option value="regular">Regular</option>
                                                <option value="advanced">Advanced</option>
                                                <option value="beginner">Beginner</option>
                                                <option value="special">Special</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Instructor */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="instructorId" className="block text-sm font-medium text-gray-700">
                                            Instructor
                                        </label>
                                        <div className="mt-1">
                                            <select
                                                id="instructorId"
                                                name="instructorId"
                                                value={formData.instructorId}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            >
                                                <option value="">Select an Instructor</option>
                                                {instructors.map(instructor => (
                                                    <option key={instructor.id} value={instructor.id}>
                                                        {instructor.displayName || instructor.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Max Capacity */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700">
                                            Maximum Capacity
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="number"
                                                name="maxCapacity"
                                                id="maxCapacity"
                                                min="1"
                                                max="100"
                                                value={formData.maxCapacity}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Meeting Days */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="meetingDays" className="block text-sm font-medium text-gray-700">
                                            Meeting Days
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="meetingDays"
                                                id="meetingDays"
                                                value={formData.meetingDays}
                                                onChange={handleChange}
                                                placeholder="e.g. Monday, Wednesday, Friday"
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Meeting Time */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700">
                                            Meeting Time
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="meetingTime"
                                                id="meetingTime"
                                                value={formData.meetingTime}
                                                onChange={handleChange}
                                                placeholder="e.g. 4:00 PM - 5:30 PM"
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                            Location
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="location"
                                                id="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <div className="mt-1">
                      <textarea
                          id="description"
                          name="description"
                          rows="3"
                          value={formData.description}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      ></textarea>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">
                                            Brief description of the team, its goals, and activities.
                                        </p>
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
                                        <p className="mt-2 text-sm text-gray-500">
                                            Additional notes, special requirements, or other information about this team.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/teams')}
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

export default TeamForm;