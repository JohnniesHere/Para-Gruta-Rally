// src/pages/admin/UserManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import CreateUserModal from '../../components/modals/CreateUserModal';
import ExportUsersModal from '../../components/modals/ExportUsersModal';
import UpdateUserModal from '../../components/modals/UpdateUserModal';
import UsersTable from '../../components/tables/UsersTable';
import { db } from '../../firebase/config';
import './UserManagement.css';

const UserManagementPage = () => {
    const { isDarkMode } = useTheme();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');

    // Fetch users from Firestore
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(usersQuery);
            const usersData = [];

            querySnapshot.forEach((doc) => {
                usersData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter users by role
    const filterUsersByRole = (role) => {
        if (role === 'all') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => user.role === role);
            setFilteredUsers(filtered);
        }
    };

    // Handle role filter change
    const handleRoleFilterChange = (e) => {
        const selectedRole = e.target.value;
        setRoleFilter(selectedRole);
        filterUsersByRole(selectedRole);
    };

    // Modal handlers
    const handleCreateUser = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleUserCreated = () => {
        // Refresh users list after creating a new user
        fetchUsers();
        console.log('User created successfully!');
    };

    const handleUserUpdated = () => {
        // Refresh users list after updating a user
        fetchUsers();
        setSelectedUser(null);
        console.log('User updated successfully!');
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedUser(null);
    };

    const handleExportUsers = () => {
        setIsExportModalOpen(true);
    };

    const handleCloseExportModal = () => {
        setIsExportModalOpen(false);
    };

    const handleUpdateUser = (user) => {
        setSelectedUser(user);
        setIsUpdateModalOpen(true);
    };

    // Load users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Re-filter when users change
    useEffect(() => {
        filterUsersByRole(roleFilter);
    }, [users, roleFilter]);

    return (
        <Dashboard requiredRole="admin">
            <div className={`user-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1>User Management</h1>

                <div className="user-management-container">
                    <div className="user-management-header">
                        <div className="user-management-actions">
                            <button
                                className="btn-primary"
                                onClick={handleCreateUser}
                            >
                                Create User
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={handleExportUsers}
                            >
                                Export Users
                            </button>
                        </div>

                        <div className="filter-section">
                            <label htmlFor="roleFilter">Filter by Role:</label>
                            <select
                                id="roleFilter"
                                className="filter-select"
                                value={roleFilter}
                                onChange={handleRoleFilterChange}
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="instructor">Instructor</option>
                                <option value="parent">Parent</option>
                            </select>
                        </div>
                    </div>

                    <UsersTable
                        users={filteredUsers}
                        isLoading={isLoading}
                        onUpdateUser={handleUpdateUser}
                    />
                </div>
            </div>

            {/* Modals */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onUserCreated={handleUserCreated}
            />

            <ExportUsersModal
                isOpen={isExportModalOpen}
                onClose={handleCloseExportModal}
            />

            <UpdateUserModal
                isOpen={isUpdateModalOpen}
                onClose={handleCloseUpdateModal}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />
        </Dashboard>
    );
};

export default UserManagementPage;