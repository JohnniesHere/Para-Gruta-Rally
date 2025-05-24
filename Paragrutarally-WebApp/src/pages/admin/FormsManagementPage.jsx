// src/pages/admin/FormsManagementPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';

const FormsManagementPage = () => {
    const { isDarkMode } = useTheme(); // Added theme integration

    return (
        <Dashboard requiredRole="admin">
            <div className={`forms-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`} style={{ padding: '20px' }}>
                <h1 style={{ color: 'var(--text-primary)', marginBottom: '30px' }}>Forms Management</h1>

                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Manage Forms</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        This page will contain form management functionality including:
                    </p>
                    <ul style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
                        <li>Create new forms</li>
                        <li>Edit existing forms</li>
                        <li>View form submissions</li>
                        <li>Form templates</li>
                        <li>Form analytics</li>
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
                            Create New Form
                        </button>
                        <button style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            padding: '10px 20px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}>
                            View Templates
                        </button>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default FormsManagementPage;