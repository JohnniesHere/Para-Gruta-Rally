// src/pages/admin/ViewKidPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import './ViewKidPage.css';

const ViewKidPage = () => {
    const { id } = useParams();

    return (
        <Dashboard requiredRole="admin">
            <div className="admin-dashboard">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold text-gray-900">View Kid Details</h1>
                        <p className="mt-1 text-sm text-gray-600">Kid ID: {id}</p>
                    </div>
                </header>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="recent-activities">
                        <div className="px-4 py-5 sm:p-6">
                            <p className="text-gray-600 mb-4">Kid details will be displayed here.</p>
                            <p className="text-sm text-gray-500">
                                This will show all kid information including:
                                <br />• Personal details
                                <br />• Parent/guardian contact info
                                <br />• Medical information
                                <br />• Team assignment
                                <br />• Form status and history
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ViewKidPage;