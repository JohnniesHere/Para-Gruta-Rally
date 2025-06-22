// src/components/modals/ExportKidsModal.jsx
import React, { useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    IconX as X,
    IconDownload as Download,
    IconClock as Clock,
    IconUserCircle as Baby
} from '@tabler/icons-react';

const ExportKidsModal = ({ isOpen, onClose }) => {
    const { t, isRTL } = useLanguage();
    const { userRole, userData, user } = usePermissions();
    const [exportOptions, setExportOptions] = useState({
        statusFilter: 'all',
        teamFilter: 'all',
        includePersonalInfo: true,
        includeParentInfo: true,
        includeTeamInfo: true,
        includeTimestamps: true,
        includeInstructorInfo: false
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            let kidsQuery = query(collection(db, 'kids'), orderBy('createdAt', 'desc'));

            // Apply role-based filtering
            if (userRole === 'instructor' && userData?.instructorId) {
                kidsQuery = query(
                    collection(db, 'kids'),
                    where('instructorId', '==', userData.instructorId),
                    orderBy('createdAt', 'desc')
                );
            } else if (userRole === 'parent' && user?.uid) {
                kidsQuery = query(
                    collection(db, 'kids'),
                    where('parentInfo.parentId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(kidsQuery);
            const kids = [];

            // Get teams data if needed
            let teamsData = {};
            if (exportOptions.includeTeamInfo) {
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                teamsSnapshot.forEach((doc) => {
                    teamsData[doc.id] = doc.data();
                });
            }

            // Get instructors data if needed
            let instructorsData = {};
            if (exportOptions.includeInstructorInfo) {
                const instructorsSnapshot = await getDocs(collection(db, 'instructors'));
                instructorsSnapshot.forEach((doc) => {
                    instructorsData[doc.id] = doc.data();
                });
            }

            querySnapshot.forEach((doc) => {
                const kidData = doc.data();

                // Apply status filter if selected
                if (exportOptions.statusFilter !== 'all' &&
                    kidData.signedFormStatus?.toLowerCase() !== exportOptions.statusFilter) {
                    return;
                }

                // Apply team filter if selected
                if (exportOptions.teamFilter !== 'all') {
                    if (exportOptions.teamFilter === 'no-team' && kidData.teamId) {
                        return;
                    }
                    if (exportOptions.teamFilter === 'with-team' && !kidData.teamId) {
                        return;
                    }
                }

                const kid = {
                    participantNumber: kidData.participantNumber || '',
                    status: kidData.signedFormStatus || 'pending'
                };

                // Include personal info if option is selected
                if (exportOptions.includePersonalInfo) {
                    kid.firstName = kidData.personalInfo?.firstName || '';
                    kid.lastName = kidData.personalInfo?.lastName || '';
                    kid.dateOfBirth = kidData.personalInfo?.dateOfBirth || '';
                    kid.address = kidData.personalInfo?.address || '';
                    kid.capabilities = kidData.personalInfo?.capabilities || '';
                    kid.announcersNotes = kidData.personalInfo?.announcersNotes || '';

                    // Calculate age if date of birth is available
                    if (kidData.personalInfo?.dateOfBirth) {
                        const today = new Date();
                        const birthDate = new Date(kidData.personalInfo.dateOfBirth);
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                        kid.age = age;
                    }
                }

                // Include parent info if option is selected
                if (exportOptions.includeParentInfo) {
                    kid.parentName = kidData.parentInfo?.name || '';
                    kid.parentEmail = kidData.parentInfo?.email || '';
                    kid.parentPhone = kidData.parentInfo?.phone || '';
                    kid.grandparentsNames = kidData.parentInfo?.grandparentsInfo?.names || '';
                    kid.grandparentsPhone = kidData.parentInfo?.grandparentsInfo?.phone || '';
                }

                // Include team info if option is selected
                if (exportOptions.includeTeamInfo) {
                    if (kidData.teamId && teamsData[kidData.teamId]) {
                        kid.teamName = teamsData[kidData.teamId].name || '';
                        kid.teamDescription = teamsData[kidData.teamId].description || '';
                    } else {
                        kid.teamName = t('teams.noTeam', 'No Team');
                        kid.teamDescription = '';
                    }
                }

                // Include instructor info if option is selected
                if (exportOptions.includeInstructorInfo && kidData.instructorId) {
                    if (instructorsData[kidData.instructorId]) {
                        kid.instructorName = instructorsData[kidData.instructorId].name || '';
                        kid.instructorEmail = instructorsData[kidData.instructorId].email || '';
                    }
                }

                // Include timestamps if option is selected
                if (exportOptions.includeTimestamps) {
                    kid.createdAt = kidData.createdAt?.toDate?.()
                        ? kidData.createdAt.toDate().toLocaleDateString() + ' ' + kidData.createdAt.toDate().toLocaleTimeString()
                        : '';
                    kid.updatedAt = kidData.updatedAt?.toDate?.()
                        ? kidData.updatedAt.toDate().toLocaleDateString() + ' ' + kidData.updatedAt.toDate().toLocaleTimeString()
                        : '';
                }

                // Additional fields
                kid.signedDeclaration = kidData.signedDeclaration ? t('exportKids.yes', 'Yes') : t('exportKids.no', 'No');
                kid.additionalComments = kidData.additionalComments || '';

                kids.push(kid);
            });

            // Create CSV content
            const headers = [
                t('kids.participantNumber', 'Participant Number'),
                t('kids.status', 'Status')
            ];

            if (exportOptions.includePersonalInfo) {
                headers.push(
                    t('editKid.firstName', 'First Name'),
                    t('editKid.lastName', 'Last Name'),
                    t('kids.age', 'Age'),
                    t('common.dateOfBirth', 'Date of Birth'),
                    t('common.address', 'Address'),
                    t('editKid.amazingAbilities', 'Capabilities'),
                    t('editKid.announcerNotes', 'Announcer Notes')
                );
            }

            if (exportOptions.includeParentInfo) {
                headers.push(
                    t('kids.parentName', 'Parent Name'),
                    t('editKid.emailAddress', 'Parent Email'),
                    t('editKid.phoneNumber', 'Parent Phone'),
                    t('editKid.grandparentsNames', 'Grandparents Names'),
                    t('editKid.grandparentsPhone', 'Grandparents Phone')
                );
            }

            if (exportOptions.includeTeamInfo) {
                headers.push(
                    t('exportTeams.teamName', 'Team Name'),
                    t('events.description', 'Team Description')
                );
            }

            if (exportOptions.includeInstructorInfo) {
                headers.push(
                    t('exportTeams.instructorName', 'Instructor Name'),
                    t('exportTeams.instructorEmail', 'Instructor Email')
                );
            }

            headers.push(
                t('exportKids.signedDeclaration', 'Signed Declaration'),
                t('exportKids.additionalComments', 'Additional Comments')
            );

            if (exportOptions.includeTimestamps) {
                headers.push(t('users.createdAt', 'Created At'), t('exportEvents.updatedAt', 'Updated At'));
            }

            let csvContent = headers.join(',') + '\n';

            kids.forEach(kid => {
                const row = [
                    `"${kid.participantNumber}"`,
                    `"${kid.status}"`
                ];

                if (exportOptions.includePersonalInfo) {
                    row.push(
                        `"${kid.firstName || ''}"`,
                        `"${kid.lastName || ''}"`,
                        `"${kid.age || ''}"`,
                        `"${kid.dateOfBirth || ''}"`,
                        `"${kid.address || ''}"`,
                        `"${kid.capabilities || ''}"`,
                        `"${kid.announcersNotes || ''}"`
                    );
                }

                if (exportOptions.includeParentInfo) {
                    row.push(
                        `"${kid.parentName || ''}"`,
                        `"${kid.parentEmail || ''}"`,
                        `"${kid.parentPhone || ''}"`,
                        `"${kid.grandparentsNames || ''}"`,
                        `"${kid.grandparentsPhone || ''}"`
                    );
                }

                if (exportOptions.includeTeamInfo) {
                    row.push(
                        `"${kid.teamName || ''}"`,
                        `"${kid.teamDescription || ''}"`
                    );
                }

                if (exportOptions.includeInstructorInfo) {
                    row.push(
                        `"${kid.instructorName || ''}"`,
                        `"${kid.instructorEmail || ''}"`
                    );
                }

                row.push(
                    `"${kid.signedDeclaration}"`,
                    `"${kid.additionalComments || ''}"`
                );

                if (exportOptions.includeTimestamps) {
                    row.push(`"${kid.createdAt || ''}"`, `"${kid.updatedAt || ''}"`);
                }

                csvContent += row.join(',') + '\n';
            });

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const statusFilter = exportOptions.statusFilter === 'all' ? 'all' : exportOptions.statusFilter;
            const teamFilter = exportOptions.teamFilter === 'all' ? 'all' : exportOptions.teamFilter;
            const rolePrefix = userRole === 'instructor' ? 'instructor_' : userRole === 'parent' ? 'parent_' : '';
            const filename = `${rolePrefix}kids_export_${statusFilter}_${teamFilter}_${timestamp}.csv`;

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

            console.log(`✅ Successfully exported ${kids.length} kids to ${filename}`);
            onClose();
        } catch (error) {
            console.error('Error exporting kids:', error);
            alert(t('exportKids.exportError', 'Failed to export kids. Please try again.'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        if (!isExporting) {
            setExportOptions({
                statusFilter: 'all',
                teamFilter: 'all',
                includePersonalInfo: true,
                includeParentInfo: true,
                includeTeamInfo: true,
                includeTimestamps: true,
                includeInstructorInfo: false
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
                        <Download size={20} style={{ marginRight: '8px' }} />
                        {t('kids.exportKids', 'Export Kids')}
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
                        <label htmlFor="statusFilter">{t('exportKids.filterByStatus', 'Filter by Status')}</label>
                        <select
                            id="statusFilter"
                            value={exportOptions.statusFilter}
                            onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                statusFilter: e.target.value
                            }))}
                            disabled={isExporting}
                            className="filter-select"
                        >
                            <option value="all">{t('kids.allKids', 'All Kids')}</option>
                            <option value="active">{t('status.active', 'Active')}</option>
                            <option value="pending">{t('status.pending', 'Pending')}</option>
                            <option value="completed">{t('status.completed', 'Completed')}</option>
                            <option value="cancelled">{t('status.cancelled', 'Cancelled')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="teamFilter">{t('exportKids.filterByTeam', 'Filter by Team')}</label>
                        <select
                            id="teamFilter"
                            value={exportOptions.teamFilter}
                            onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                teamFilter: e.target.value
                            }))}
                            disabled={isExporting}
                            className="filter-select"
                        >
                            <option value="all">{t('kids.allKids', 'All Kids')}</option>
                            <option value="no-team">{t('kids.kidsWithoutTeams', 'Kids without Teams')}</option>
                            <option value="with-team">{t('kids.kidsWithTeams', 'Kids with Teams')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('exportKids.dataToInclude', 'Data to Include')}</label>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includePersonalInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includePersonalInfo: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                <Baby size={16} style={{ marginRight: '4px' }} />
                                {t('exportKids.includePersonalInfo', 'Include personal information (name, age, address)')}
                            </label>
                        </div>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeParentInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeParentInfo: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                👨‍👩‍👧‍👦 {t('exportKids.includeParentInfo', 'Include parent/guardian information')}
                            </label>
                        </div>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeTeamInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeTeamInfo: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                🏎️ {t('exportKids.includeTeamInfo', 'Include team information')}
                            </label>
                        </div>

                        {(userRole === 'admin' || userRole === 'instructor') && (
                            <div className="checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.includeInstructorInfo}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            includeInstructorInfo: e.target.checked
                                        }))}
                                        disabled={isExporting}
                                        style={{ marginRight: '8px' }}
                                    />
                                    👨‍🏫 {t('exportKids.includeInstructorInfo', 'Include instructor information')}
                                </label>
                            </div>
                        )}

                        <div className="checkbox-group">
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
                                ⏰ {t('import.includeTimestamp', 'Include Created At and Updated At timestamps')}
                            </label>
                        </div>
                    </div>

                    {userRole === 'parent' && (
                        <div className="export-notice">
                            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                📝 {t('exportKids.parentExportNotice', 'You can only export your own kids\' data.')}
                            </p>
                        </div>
                    )}

                    {userRole === 'instructor' && (
                        <div className="export-notice">
                            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                👨‍🏫 {t('exportKids.instructorExportNotice', 'You can only export kids assigned to you.')}
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
                                <Clock className="loading-spinner" size={16} style={{ marginRight: '6px' }} />
                                {t('users.exporting', 'Exporting...')}
                            </>
                        ) : (
                            <>
                                <Download size={16} style={{ marginRight: '6px' }} />
                                {t('users.exportToCsv', 'Export to CSV')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportKidsModal;