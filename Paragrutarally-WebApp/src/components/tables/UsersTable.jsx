// src/components/tables/UsersTable.jsx
import React, { useState, useMemo } from 'react';

const UsersTable = ({ users, isLoading, onUpdateUser }) => {
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [searchTerm, setSearchTerm] = useState('');

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

    // Filter users based on search term
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        if (!searchTerm.trim()) return users;

        const lowercaseSearch = searchTerm.toLowerCase().trim();

        return users.filter(user => {
            const searchableFields = [
                user.displayName,
                user.name,
                user.email,
                user.phone,
                user.role
            ];

            return searchableFields.some(field =>
                field && field.toString().toLowerCase().includes(lowercaseSearch)
            );
        });
    }, [users, searchTerm]);

    // Sort users based on current sort configuration
    const sortedUsers = useMemo(() => {
        if (!filteredUsers || !sortConfig.key) return filteredUsers;

        return [...filteredUsers].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle special cases for different data types
            if (sortConfig.key === 'createdAt' || sortConfig.key === 'lastLogin') {
                // Handle timestamp sorting
                aValue = aValue?.toDate?.() || new Date(0);
                bValue = bValue?.toDate?.() || new Date(0);
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                // Handle string sorting (case insensitive)
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
            if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

            // Compare values
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredUsers, sortConfig]);

    // Handle column header click
    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) {
                // Same column clicked - toggle direction or reset
                if (prevConfig.direction === 'asc') {
                    return { key, direction: 'desc' };
                } else if (prevConfig.direction === 'desc') {
                    return { key: null, direction: 'asc' }; // Reset sorting
                }
            }
            // New column clicked - start with ascending
            return { key, direction: 'asc' };
        });
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Get sort indicator for column headers
    const getSortIndicator = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return ' ↕️'; // Default indicator
        }
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
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
        <div>
            {/* Search Input */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search in users"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                {searchTerm && (
                    <button
                        className="clear-search"
                        onClick={clearSearch}
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
                <div className="search-results-info">
                    {searchTerm ? (
                        `${sortedUsers.length} of ${users.length} users`
                    ) : (
                        `${users.length} users total`
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                    <tr>
                        <th
                            onClick={() => handleSort('displayName')}
                            className="sortable-header"
                            title="Click to sort by Display Name"
                        >
                            Display Name{getSortIndicator('displayName')}
                        </th>
                        <th
                            onClick={() => handleSort('name')}
                            className="sortable-header"
                            title="Click to sort by Full Name"
                        >
                            Full Name{getSortIndicator('name')}
                        </th>
                        <th
                            onClick={() => handleSort('email')}
                            className="sortable-header"
                            title="Click to sort by Email"
                        >
                            Email{getSortIndicator('email')}
                        </th>
                        <th
                            onClick={() => handleSort('phone')}
                            className="sortable-header"
                            title="Click to sort by Phone"
                        >
                            Phone{getSortIndicator('phone')}
                        </th>
                        <th
                            onClick={() => handleSort('role')}
                            className="sortable-header"
                            title="Click to sort by Role"
                        >
                            Role{getSortIndicator('role')}
                        </th>
                        <th
                            onClick={() => handleSort('createdAt')}
                            className="sortable-header"
                            title="Click to sort by Created Date"
                        >
                            Created At{getSortIndicator('createdAt')}
                        </th>
                        <th
                            onClick={() => handleSort('lastLogin')}
                            className="sortable-header"
                            title="Click to sort by Last Login"
                        >
                            Last Login{getSortIndicator('lastLogin')}
                        </th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedUsers.length > 0 ? (
                        sortedUsers.map((user) => (
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                <div className="empty-state">
                                    {searchTerm ? (
                                        <>
                                            <h3>No users found</h3>
                                            <p>No users match your search: "{searchTerm}"</p>
                                            <button
                                                className="btn-secondary"
                                                onClick={clearSearch}
                                                style={{ marginTop: '10px' }}
                                            >
                                                Clear Search
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3>No users found</h3>
                                            <p>Start by creating your first user.</p>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersTable;