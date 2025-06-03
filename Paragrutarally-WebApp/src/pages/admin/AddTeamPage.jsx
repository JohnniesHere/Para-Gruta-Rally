// src/pages/admin/AddTeamPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';

const AddTeamPage = () => {
    return (
        <Dashboard requiredRole="admin">
            <div className="admin-dashboard">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold text-gray-900">Add New Team</h1>
                    </div>
                </header>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="recent-activities">
                        <div className="px-4 py-5 sm:p-6">
                            <p className="text-gray-600 mb-4">Add Team form will be implemented here.</p>
                            <p className="text-sm text-gray-500">
                                This will include fields for:
                                <br />• Team name and description
                                <br />• Instructor assignment
                                <br />• Capacity limits
                                <br />• Schedule information
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default AddTeamPage;