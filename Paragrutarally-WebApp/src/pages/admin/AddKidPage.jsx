// src/pages/admin/AddKidPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import './AddKidPage.css';

const AddKidPage = () => {
    return (
        <Dashboard requiredRole="admin">
            <div className="admin-dashboard">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold text-gray-900">Add New Kid</h1>
                    </div>
                </header>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="recent-activities">
                        <div className="px-4 py-5 sm:p-6">
                            <p className="text-gray-600 mb-4">Add Kid form will be implemented here.</p>
                            <p className="text-sm text-gray-500">
                                This will include fields for:
                                <br />• Personal info (name, date of birth, address)
                                <br />• Parent/guardian information
                                <br />• Medical information
                                <br />• Team assignment
                                <br />• Form status
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default AddKidPage;