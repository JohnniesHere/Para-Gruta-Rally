// src/pages/admin/TeamsManagementPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import './TeamsManagementPage.css';

const TeamsManagementPage = () => {
    return (
        <Dashboard requiredRole="admin">
            <div className="admin-dashboard">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Manage and organize your program teams
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                Export CSV
                            </button>
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                Refresh
                            </button>
                            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                Add New Team
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* Stats Dashboard */}
                    <div className="dashboard-stats mb-6">
                        <div className="stat-card">
                            <h3>Total Teams</h3>
                            <div className="stat-value">0</div>
                        </div>
                        <div className="stat-card">
                            <h3>Active Teams</h3>
                            <div className="stat-value" style={{ color: 'var(--success-color, #10b981)' }}>
                                0
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Teams with Kids</h3>
                            <div className="stat-value">0</div>
                        </div>
                        <div className="stat-card">
                            <h3>Avg Kids/Team</h3>
                            <div className="stat-value" style={{ color: 'var(--info-color, #3b82f6)' }}>
                                0
                            </div>
                        </div>
                    </div>

                    <div className="recent-activities">
                        <div className="px-4 py-5 sm:p-6">
                            {/* Search and filters */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="search"
                                            id="search"
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Search by name or description"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="instructor-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                        Instructor
                                    </label>
                                    <select
                                        id="instructor-filter"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">All Instructors</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        id="status-filter"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                            {/* Placeholder content */}
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Ready for Firebase Integration</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Dashboard wrapper is working! Next we'll add Firebase data loading.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default TeamsManagementPage;