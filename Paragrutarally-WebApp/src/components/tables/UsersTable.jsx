// src/components/tables/UsersTable.jsx - Fixed with Delete Functionality
import React, { useState, useMemo } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconEdit as Edit,
    IconTrash as Trash,
    IconAlertTriangle as AlertTriangle
} from '@tabler/icons-react';

const UsersTable = ({ users, isLoading, onUpdateUser, onUserDeleted }) => {
    const { t, isRTL } = useLanguage();
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [deletingUser, setDeletingUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

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

    // Removed getRoleIcon function - no symbols needed

    // Sort users based on current sort configuration
    const sortedUsers = useMemo(() => {
        if (!users || !sortConfig.key) return users || [];

        return [...users].sort((a, b) => {
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
    }, [users, sortConfig]);

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

    // Get sort indicator for column headers
    const getSortIndicator = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return ' ↕'; // Default indicator
        }
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    // Delete functionality
    const handleDeleteClick = (user) => {
        console.log('Delete clicked for user:', user.id);
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setDeletingUser(userToDelete.id);

        try {
            console.log('Deleting user:', userToDelete.id, userToDelete.email);

            // Delete user document from Firestore
            const userDocRef = doc(db, 'users', userToDelete.id);
            await deleteDoc(userDocRef);

            console.log('✅ User document deleted from Firestore');

            // Show success message
            alert(
                `✅ ${t('users.deleteSuccess', 'User Deleted Successfully!')}\n\n` +
                `${t('users.userDeleted', 'User has been removed from the system.')}\n\n` +
                `📧 ${t('users.email', 'Email')}: ${userToDelete.email}\n` +
                `👤 ${t('users.name', 'Name')}: ${userToDelete.displayName}\n\n` +
                `⚠️ ${t('users.authNote', 'Note: For complete removal, the authentication account may need to be deleted separately.')}`
            );

            // Notify parent component
            if (onUserDeleted) {
                onUserDeleted();
            }

            setShowDeleteModal(false);
            setUserToDelete(null);

        } catch (error) {
            console.error('Error deleting user:', error);

            let errorMessage = t('users.deleteError', 'Failed to delete user. Please try again.');

            if (error.code === 'permission-denied') {
                errorMessage = t('users.deletePermissionError', 'Permission denied. You may not have rights to delete this user.');
            } else if (error.code === 'not-found') {
                errorMessage = t('users.deleteNotFoundError', 'User not found. They may have already been deleted.');
            }

            alert(`❌ ${t('users.error', 'Error')}\n\n${errorMessage}`);
        } finally {
            setDeletingUser(null);
        }
    };

    const handleDeleteCancel = () => {
        console.log('Delete cancelled');
        setShowDeleteModal(false);
        setUserToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="loading-container" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="loading-spinner"></div>
                <p>{t('users.loadingUsers', 'Loading users...')}</p>
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
        <>
            <div className="table-container" dir={isRTL ? 'rtl' : 'ltr'}>
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
                                <td>
                                    <div className="user-display-name">
                                        {user.displayName || t('common.notAvailable', 'N/A')}
                                    </div>
                                </td>
                                <td>
                                    <div className="user-full-name">
                                        {user.name || t('common.notAvailable', 'N/A')}
                                    </div>
                                </td>
                                <td>
                                    <div className="user-email">
                                        {user.email || t('common.notAvailable', 'N/A')}
                                    </div>
                                </td>
                                <td>
                                    <div className="user-phone">
                                        {user.phone || t('common.notAvailable', 'N/A')}
                                    </div>
                                </td>
                                <td>
                                    <div className="user-role">
                                            <span className={getRoleBadgeClass(user.role)}>
                                                {getRoleDisplayName(user.role)}
                                            </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="user-last-login">
                                        {formatDate(user.lastLogin)}
                                    </div>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <div className="action-buttons">
                                            <button
                                                className="btn-update"
                                                onClick={() => onUpdateUser(user)}
                                                title={t('users.updateUser', 'Update User')}
                                            >
                                                <Edit size={14} />
                                                {t('users.update', 'Update')}
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteClick(user)}
                                                disabled={deletingUser === user.id}
                                                title={t('users.deleteUser', 'Delete User')}
                                            >
                                                {deletingUser === user.id ? (
                                                    <div className="loading-spinner"></div>
                                                ) : (
                                                    <Trash size={14} />
                                                )}
                                                {deletingUser === user.id
                                                    ? t('users.deleting', 'Deleting...')
                                                    : t('users.delete', 'Delete')
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                <div className="empty-state">
                                    <h3>{t('users.noUsersFound', 'No users found')}</h3>
                                    <p>{t('users.createFirstUser', 'Start by creating your first user.')}</p>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="modal-overlay active" onClick={handleDeleteCancel}>
                    <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header danger">
                            <AlertTriangle className="danger-icon" size={24} />
                            <h2>{t('users.deleteUserTitle', 'Delete User')}</h2>
                        </div>

                        <div className="modal-body">
                            <div className="delete-warning">
                                ⚠️ {t('users.deleteWarning', 'This action cannot be undone!')}
                            </div>

                            <div className="user-delete-info">
                                <div className="delete-info-item">
                                    <strong>{t('users.displayName', 'Display Name')}:</strong>
                                    <span>{userToDelete.displayName || t('common.notAvailable', 'N/A')}</span>
                                </div>
                                <div className="delete-info-item">
                                    <strong>{t('users.email', 'Email')}:</strong>
                                    <span>{userToDelete.email}</span>
                                </div>
                                <div className="delete-info-item">
                                    <strong>{t('users.fullName', 'Full Name')}:</strong>
                                    <span>{userToDelete.name || t('common.notAvailable', 'N/A')}</span>
                                </div>
                                <div className="delete-info-item">
                                    <strong>{t('users.role', 'Role')}:</strong>
                                    <span>{getRoleDisplayName(userToDelete.role)}</span>
                                </div>
                            </div>

                            <div className="delete-consequences">
                                <h4>{t('users.deleteConsequences', 'This will permanently delete:')}</h4>
                                <ul>
                                    <li>{t('users.deleteConsequence1', 'User profile and all associated data')}</li>
                                    <li>{t('users.deleteConsequence2', 'All user-generated content and records')}</li>
                                    <li>{t('users.deleteConsequence3', 'User access to the system')}</li>
                                    <li>{t('users.deleteConsequence4', 'All user preferences and settings')}</li>
                                </ul>
                            </div>

                            <p style={{
                                marginTop: '20px',
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}>
                                {t('users.deleteConfirmText', 'Are you absolutely sure you want to delete this user?')}
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleDeleteCancel}
                                disabled={deletingUser === userToDelete.id}
                            >
                                {t('general.cancel', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDeleteConfirm}
                                disabled={deletingUser === userToDelete.id}
                            >
                                {deletingUser === userToDelete.id ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        {t('users.deleting', 'Deleting...')}
                                    </>
                                ) : (
                                    <>
                                        <Trash size={16} />
                                        {t('users.deleteConfirm', 'Yes, Delete User')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersTable;