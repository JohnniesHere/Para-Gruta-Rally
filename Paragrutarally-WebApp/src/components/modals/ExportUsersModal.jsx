// src/components/modals/ExportUsersModal.jsx
import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ExcelJS from 'exceljs';

const ExportUsersModal = ({ isOpen, onClose }) => {
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

            // Create workbook and worksheet using ExcelJS
            const workbook = new ExcelJS.Workbook();
            const sheetName = exportOptions.roleFilter === 'all'
                ? 'All Users'
                : `${exportOptions.roleFilter.charAt(0).toUpperCase() + exportOptions.roleFilter.slice(1)} Users`;

            const worksheet = workbook.addWorksheet(sheetName);

            // Define columns
            const columns = [
                { header: 'Display Name', key: 'displayName', width: 20 },
                { header: 'Full Name', key: 'fullName', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Phone', key: 'phone', width: 15 },
                { header: 'Role', key: 'role', width: 12 },
            ];

            if (exportOptions.includeTimestamps) {
                columns.push(
                    { header: 'Created At', key: 'createdAt', width: 20 },
                    { header: 'Last Login', key: 'lastLogin', width: 20 }
                );
            }

            worksheet.columns = columns;

            // Style the header row
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Add data rows
            users.forEach((user) => {
                const row = worksheet.addRow(user);
                // Add borders to data cells
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const roleFilter = exportOptions.roleFilter === 'all' ? 'all' : exportOptions.roleFilter;
            const filename = `users_export_${roleFilter}_${timestamp}.xlsx`;

            // Generate and download file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Error exporting users:', error);
            alert('Failed to export users. Please try again.');
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
        <div className="modal-overlay" onClick={handleClose}>
            <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Export Users</h3>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isExporting}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <div className="export-options">
                    <div className="form-group">
                        <label htmlFor="roleFilter">Filter by Role</label>
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
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
                            <option value="parent">Parent</option>
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
                            Include Created At and Last Login timestamps
                        </label>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={isExporting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exporting...' : 'Export to Excel'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportUsersModal;