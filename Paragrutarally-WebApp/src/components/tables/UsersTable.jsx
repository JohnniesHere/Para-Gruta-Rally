// src/components/tables/UsersTable.jsx
import React from 'react';

const UsersTable = ({ users, isLoading, onUpdateUser }) => {
    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadgeClass = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return 'role-badge admin';
            case 'instructor':
                return 'role-badge instructor';
            case 'parent':
                return 'role-badge parent';
            default:
                return 'role-badge';
        }
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div>Loading users...</div>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="empty-state">
                <h3>No users found</h3>
                <p>Start by creating your first user.</p>
            </div>
        );
    }

    return (
        <div className="users-table-container">
            <table className="users-table">
                <thead>
                <tr>
                    <th>Display Name</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.displayName || 'N/A'}</td>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                                <span className={getRoleBadgeClass(user.role)}>
                                    {user.role || 'N/A'}
                                </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>{formatDate(user.lastLogin)}</td>
                        <td>
                            <button
                                className="btn-update"
                                onClick={() => onUpdateUser(user)}
                                title="Update user"
                            >
                                Update
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default UsersTable;