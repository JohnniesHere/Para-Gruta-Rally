// src/pages/admin/UserManagementPage.jsx
import React, { useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import CreateUserModal from '../../components/modals/CreateUserModal';
import './UserManagement.css';

const UserManagementPage = () => {
    const { isDarkMode } = useTheme();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateUser = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleUserCreated = () => {
        // You can add any additional logic here when a user is successfully created
        // For example, refreshing a user list, showing a success message, etc.
        console.log('User created successfully!');
        // If you have a user list, you might want to refresh it here
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`user-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1>User Management</h1>

                <div className="user-management-container">
                    <h2>Manage Users</h2>
                    <p>
                        This page contains user management functionality including:
                    </p>
                    <ul>
                        <li>View all users</li>
                        <li>Add new users</li>
                        <li>Edit user profiles</li>
                        <li>Manage user roles</li>
                        <li>User permissions</li>
                    </ul>

                    <div className="user-management-actions">
                        <button
                            className="btn-primary"
                            onClick={handleCreateUser}
                        >
                            Add New User
                        </button>
                        <button className="btn-secondary">
                            Export Users
                        </button>
                    </div>
                </div>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                onUserCreated={handleUserCreated}
            />
        </Dashboard>
    );
};

export default UserManagementPage;