// src/components/modals/ExportUsersModal.jsx - FIXED VERSION
import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';

const ExportUsersModal = ({ isOpen, onClose }) => {
    const { t, isRTL } = useLanguage();
    const [exportOptions, setExportOptions] = useState({
        roleFilter: 'all',
        includeTimestamps: true
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            let usersQuery = collection(db, 'users');

            // Apply role filter if selected
            if (exportOptions.roleFilter !== 'all') {
                usersQuery = query(usersQuery, where('role', '==', exportOptions.roleFilter));
            }

            const querySnapshot = await getDocs(usersQuery);
            const users = [];

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const user = {
                    displayName: userData.displayName || '',
                    fullName: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    role: userData.role || '',
                };

                // Include timestamps if option is selected
                if (exportOptions.includeTimestamps) {
                    user.createdAt = userData.createdAt?.toDate?.()
                        ? userData.createdAt.toDate().toLocaleDateString() + ' ' + userData.createdAt.toDate().toLocaleTimeString()
                        : '';
                    user.lastLogin = userData.lastLogin?.toDate?.()
                        ? userData.lastLogin.toDate().toLocaleDateString() + ' ' + userData.lastLogin.toDate().toLocaleTimeString()
                        : '';
                }

                users.push(user);
            });

            // Create CSV content instead of Excel (simpler approach)
            const headers = ['Display Name', 'Full Name', 'Email', 'Phone', 'Role'];
            if (exportOptions.includeTimestamps) {
                headers.push('Created At', 'Last Login');
            }

            let csvContent = headers.join(',') + '\n';

            users.forEach(user => {
                const row = [
                    `"${user.displayName}"`,
                    `"${user.fullName}"`,
                    `"${user.email}"`,
                    `"${user.phone}"`,
                    `"${user.role}"`
                ];

                if (exportOptions.includeTimestamps) {
                    row.push(`"${user.createdAt}"`, `"${user.lastLogin}"`);
                }

                csvContent += row.join(',') + '\n';
            });

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const roleFilter = exportOptions.roleFilter === 'all' ? 'all' : exportOptions.roleFilter;
            const filename = `users_export_${roleFilter}_${timestamp}.csv`;

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log(`✅ Successfully exported ${users.length} users to ${filename}`);
            onClose();
        } catch (error) {
            console.error('Error exporting users:', error);
            alert(t('users.exportError', 'Failed to export users. Please try again.'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        if (!isExporting) {
            setExportOptions({
                roleFilter: 'all',
                includeTimestamps: true
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={handleClose} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('users.exportUsers', 'Export Users')}</h3>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isExporting}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="roleFilter">{t('users.filterByRole', 'Filter by Role')}</label>
                        <select
                            id="roleFilter"
                            value={exportOptions.roleFilter}
                            onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                roleFilter: e.target.value
                            }))}
                            disabled={isExporting}
                            className="filter-select"
                        >
                            <option value="all">{t('users.allRoles', 'All Roles')}</option>
                            <option value="admin">{t('users.admin', 'Admin')}</option>
                            <option value="instructor">{t('users.instructor', 'Instructor')}</option>
                            <option value="parent">{t('users.parent', 'Parent')}</option>
                            <option value="host">{t('users.host', 'Host')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={exportOptions.includeTimestamps}
                                onChange={(e) => setExportOptions(prev => ({
                                    ...prev,
                                    includeTimestamps: e.target.checked
                                }))}
                                disabled={isExporting}
                                style={{ marginRight: '8px' }}
                            />
                            {t('users.includeTimestamps', 'Include Created At and Last Login timestamps')}
                        </label>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={isExporting}
                    >
                        {t('general.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? t('users.exporting', 'Exporting...') : t('users.exportToCsv', 'Export to CSV')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportUsersModal;