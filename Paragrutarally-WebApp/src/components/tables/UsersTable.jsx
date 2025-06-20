// src/components/tables/UsersTable.jsx - With Translation Support
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const UsersTable = ({ users, isLoading, onUpdateUser }) => {
    const { t, isRTL } = useLanguage();
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return t('common.notAvailable', 'N/A');
        const date = timestamp.toDate();
        return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US') + ' ' + date.toLocaleTimeString([], {
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
            case 'host':
                return 'role-badge host';
            default:
                return 'role-badge';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return t('users.admin', 'Admin');
            case 'instructor':
                return t('users.instructor', 'Instructor');
            case 'parent':
                return t('users.parent', 'Parent');
            case 'host':
                return t('users.host', 'Host');
            default:
                return role || t('common.notAvailable', 'N/A');
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
            return ' ↕'; // Default indicator
        }
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    if (isLoading) {
        return (
            <div className="loading-container" dir={isRTL ? 'rtl' : 'ltr'}>
                <div>{t('users.loadingUsers', 'Loading users...')}</div>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="empty-state" dir={isRTL ? 'rtl' : 'ltr'}>
                <h3>{t('users.noUsersFound', 'No users found')}</h3>
                <p>{t('users.createFirstUser', 'Start by creating your first user.')}</p>
            </div>
        );
    }

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Search Input */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder={t('users.searchInUsers', 'Search in users')}
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                {searchTerm && (
                    <button
                        className="clear-search"
                        onClick={clearSearch}
                        title={t('users.clearSearch', 'Clear search')}
                    >
                        ✕
                    </button>
                )}
                <div className="search-results-info">
                    {searchTerm ? (
                        t('users.searchResults', '{count} of {total} users', {
                            count: sortedUsers.length,
                            total: users.length
                        })
                    ) : (
                        t('users.totalUsersCount', '{count} users total', {
                            count: users.length
                        })
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
                            title={t('users.sortByDisplayName', 'Click to sort by Display Name')}
                        >
                            {t('users.displayName', 'Display Name')}{getSortIndicator('displayName')}
                        </th>
                        <th
                            onClick={() => handleSort('name')}
                            className="sortable-header"
                            title={t('users.sortByFullName', 'Click to sort by Full Name')}
                        >
                            {t('users.fullName', 'Full Name')}{getSortIndicator('name')}
                        </th>
                        <th
                            onClick={() => handleSort('email')}
                            className="sortable-header"
                            title={t('users.sortByEmail', 'Click to sort by Email')}
                        >
                            {t('users.email', 'Email')}{getSortIndicator('email')}
                        </th>
                        <th
                            onClick={() => handleSort('phone')}
                            className="sortable-header"
                            title={t('users.sortByPhone', 'Click to sort by Phone')}
                        >
                            {t('users.phone', 'Phone')}{getSortIndicator('phone')}
                        </th>
                        <th
                            onClick={() => handleSort('role')}
                            className="sortable-header"
                            title={t('users.sortByRole', 'Click to sort by Role')}
                        >
                            {t('users.role', 'Role')}{getSortIndicator('role')}
                        </th>
                        <th
                            onClick={() => handleSort('createdAt')}
                            className="sortable-header"
                            title={t('users.sortByCreatedDate', 'Click to sort by Created Date')}
                        >
                            {t('users.createdAt', 'Created At')}{getSortIndicator('createdAt')}
                        </th>
                        <th
                            onClick={() => handleSort('lastLogin')}
                            className="sortable-header"
                            title={t('users.sortByLastLogin', 'Click to sort by Last Login')}
                        >
                            {t('users.lastLogin', 'Last Login')}{getSortIndicator('lastLogin')}
                        </th>
                        <th>{t('users.actions', 'Actions')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedUsers.length > 0 ? (
                        sortedUsers.map((user) => (
                            <tr key={user.id}>
                                <td>{user.displayName || t('common.notAvailable', 'N/A')}</td>
                                <td>{user.name || t('common.notAvailable', 'N/A')}</td>
                                <td>{user.email || t('common.notAvailable', 'N/A')}</td>
                                <td>{user.phone || t('common.notAvailable', 'N/A')}</td>
                                <td>
                                    <span className={getRoleBadgeClass(user.role)}>
                                        {getRoleDisplayName(user.role)}
                                    </span>
                                </td>
                                <td>{formatDate(user.createdAt)}</td>
                                <td>{formatDate(user.lastLogin)}</td>
                                <td>
                                    <button
                                        className="btn-update"
                                        onClick={() => onUpdateUser(user)}
                                        title={t('users.updateUser', 'Update user')}
                                    >
                                        {t('users.update', 'Update')}
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
                                            <h3>{t('users.noUsersFound', 'No users found')}</h3>
                                            <p>{t('users.noSearchResults', 'No users match your search: "{searchTerm}"', { searchTerm })}</p>
                                            <button
                                                className="btn-secondary"
                                                onClick={clearSearch}
                                                style={{ marginTop: '10px' }}
                                            >
                                                {t('users.clearSearchButton', 'Clear Search')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3>{t('users.noUsersFound', 'No users found')}</h3>
                                            <p>{t('users.createFirstUser', 'Start by creating your first user.')}</p>
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