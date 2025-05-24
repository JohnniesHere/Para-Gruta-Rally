// src/pages/admin/UserManagementPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';

const UserManagementPage = () => {
    const { isDarkMode } = useTheme();

    return (
        <Dashboard requiredRole="admin">
            <div className={`user-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`} style={{ padding: '20px' }}>
                <h1 style={{ color: 'var(--text-primary)', marginBottom: '30px' }}>User Management</h1>

                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Manage Users</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        This page will contain user management functionality including:
                    </p>
                    <ul style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
                        <li>View all users</li>
                        <li>Add new users</li>
                        <li>Edit user profiles</li>
                        <li>Manage user roles</li>
                        <li>User permissions</li>
                    </ul>

                    <div style={{ marginTop: '20px' }}>
                        <button style={{
                            backgroundColor: 'var(--accent-color)',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}>
                            Add New User
                        </button>
                        <button style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            padding: '10px 20px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}>
                            Export Users
                        </button>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default UserManagementPage;