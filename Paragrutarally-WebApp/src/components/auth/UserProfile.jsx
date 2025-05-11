// src/components/auth/UserProfile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../layout/LoadingSpinner';

function UserProfile() {
    const { currentUser, updateProfile } = useAuth();
    const { notifySuccess, notifyError } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phoneNumber: '',
        photoURL: ''
    });

    // Load user data when component mounts
    useEffect(() => {
        if (currentUser) {
            setFormData({
                displayName: currentUser.displayName || '',
                email: currentUser.email || '',
                phoneNumber: currentUser.phoneNumber || '',
                photoURL: currentUser.photoURL || ''
            });
        }
    }, [currentUser]);

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

        try {
            // Update user profile
            await updateProfile({
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                photoURL: formData.photoURL
            });

            notifySuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            notifyError('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" text="Loading profile..." />
            </div>
        );
    }

    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Personal Information
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Update your profile details.
                            </p>
                        </div>

                        <div className="border-t border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-6 gap-6">
                                        {/* Display Name */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                                                Display Name
                                            </label>
                                            <input
                                                type="text"
                                                name="displayName"
                                                id="displayName"
                                                value={formData.displayName}
                                                onChange={handleChange}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={formData.email}
                                                disabled
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Email cannot be changed directly. Please contact an administrator.
                                            </p>
                                        </div>

                                        {/* Phone Number */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                id="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>

                                        {/* Photo URL */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700">
                                                Photo URL
                                            </label>
                                            <input
                                                type="text"
                                                name="photoURL"
                                                id="photoURL"
                                                value={formData.photoURL}
                                                onChange={handleChange}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>

                                        {/* Role */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                                Role
                                            </label>
                                            <input
                                                type="text"
                                                name="role"
                                                id="role"
                                                value={currentUser.role}
                                                disabled
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Security
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Manage your account security settings.
                            </p>
                        </div>

                        <div className="border-t border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                                            <p>Update your password to maintain account security.</p>
                                        </div>
                                        <div className="mt-3">
                                            <a
                                                href="/reset-password"
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Reset Password
                                            </a>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900">Last Login</h3>
                                            <p className="text-sm text-gray-500">
                                                {currentUser.lastLogin ? new Date(currentUser.lastLogin.seconds * 1000).toLocaleString() : 'Not available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;