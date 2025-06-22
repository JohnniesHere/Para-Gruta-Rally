// src/components/modals/ExportUsersModal.jsx - WITH HEBREW SUPPORT
import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconX as X,
    IconDownload as Download,
    IconClock as Clock
} from '@tabler/icons-react';

const ExportUsersModal = ({ isOpen, onClose }) => {
    const { t, isRTL, currentLanguage } = useLanguage();
    const [exportOptions, setExportOptions] = useState({
        roleFilter: 'all',
        includeTimestamps: true
    });
    const [isExporting, setIsExporting] = useState(false);

    // Hebrew headers mapping
    const getHeaders = () => {
        if (currentLanguage === 'he') {
            const headers = ['שם תצוגה', 'שם מלא', 'אימייל', 'טלפון', 'תפקיד'];
            if (exportOptions.includeTimestamps) {
                headers.push('נוצר בתאריך', 'כניסה אחרונה');
            }
            return headers;
        } else {
            const headers = ['Display Name', 'Full Name', 'Email', 'Phone', 'Role'];
            if (exportOptions.includeTimestamps) {
                headers.push('Created At', 'Last Login');
            }
            return headers;
        }
    };

    // Helper function to format CSV for RTL
    const formatCsvForRTL = (csvContent) => {
        if (currentLanguage !== 'he') return csvContent;

        // Add BOM for proper Hebrew encoding
        const BOM = '\uFEFF';
        return BOM + csvContent;
    };

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

            // Create CSV content with proper headers
            const headers = getHeaders();
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

            // Format for RTL if Hebrew
            csvContent = formatCsvForRTL(csvContent);

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const roleFilter = exportOptions.roleFilter === 'all' ? 'all' : exportOptions.roleFilter;
            const langSuffix = currentLanguage === 'he' ? '_he' : '';
            const filename = `users_export_${roleFilter}_${timestamp}${langSuffix}.csv`;

            // Create and download file
            const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;'
            });
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
                    <h3>
                        <Download size={20} style={{ marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0' }} />
                        {t('users.exportUsers', 'Export Users')}
                    </h3>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isExporting}
                        type="button"
                    >
                        <X size={20} />
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
                                style={{ marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0' }}
                            />
                            {t('users.includeTimestamps', 'Include Created At and Last Login timestamps')}
                        </label>
                    </div>

                    {currentLanguage === 'he' && (
                        <div className="export-notice">
                            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                🌐 {t('export.hebrewNotice', 'הקובץ יוצא עם כותרות בעברית ותמיכה ב-RTL')}
                            </p>
                        </div>
                    )}
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
                        {isExporting ? (
                            <>
                                <Clock className="loading-spinner" size={16} style={{ marginRight: isRTL ? '0' : '6px', marginLeft: isRTL ? '6px' : '0' }} />
                                {t('users.exporting', 'Exporting...')}
                            </>
                        ) : (
                            <>
                                <Download size={16} style={{ marginRight: isRTL ? '0' : '6px', marginLeft: isRTL ? '6px' : '0' }} />
                                {t('users.exportToCsv', 'Export to CSV')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportUsersModal;