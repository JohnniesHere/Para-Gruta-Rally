// src/components/modals/ExportTeamsModal.jsx
import React, { useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    IconX as X,
    IconDownload as Download,
    IconClock as Clock,
    IconUsers as Team
} from '@tabler/icons-react';

const ExportTeamsModal = ({ isOpen, onClose }) => {
    const { t, isRTL } = useLanguage();
    const { userRole, userData, user } = usePermissions();
    const [exportOptions, setExportOptions] = useState({
        statusFilter: 'all',
        capacityFilter: 'all',
        includeBasicInfo: true,
        includeInstructorInfo: true,
        includeMemberInfo: true,
        includeCapacityInfo: true,
        includeTimestamps: true,
        includeKidsDetails: false
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Get teams data
            const teamsQuery = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
            const teamsSnapshot = await getDocs(teamsQuery);

            // Get instructors data if needed
            let instructorsData = {};
            if (exportOptions.includeInstructorInfo) {
                const instructorsSnapshot = await getDocs(collection(db, 'instructors'));
                instructorsSnapshot.forEach((doc) => {
                    instructorsData[doc.id] = doc.data();
                });
            }

            // Get kids data if needed
            let kidsData = {};
            if (exportOptions.includeMemberInfo || exportOptions.includeKidsDetails) {
                const kidsSnapshot = await getDocs(collection(db, 'kids'));
                kidsSnapshot.forEach((doc) => {
                    kidsData[doc.id] = doc.data();
                });
            }

            const teams = [];

            teamsSnapshot.forEach((doc) => {
                const teamData = doc.data();

                // Apply status filter if selected
                const teamStatus = teamData.active !== false ? 'active' : 'inactive';
                if (exportOptions.statusFilter !== 'all' && teamStatus !== exportOptions.statusFilter) {
                    return;
                }

                // Calculate current members
                const currentMembers = teamData.kidIds ? teamData.kidIds.length : 0;
                const maxMembers = teamData.maxCapacity || 15;

                // Apply capacity filter if selected
                if (exportOptions.capacityFilter !== 'all') {
                    if (exportOptions.capacityFilter === 'empty' && currentMembers > 0) {
                        return;
                    }
                    if (exportOptions.capacityFilter === 'available' && currentMembers >= maxMembers) {
                        return;
                    }
                    if (exportOptions.capacityFilter === 'full' && currentMembers < maxMembers) {
                        return;
                    }
                }

                const team = {};

                // Include basic info if option is selected
                if (exportOptions.includeBasicInfo) {
                    team.teamName = teamData.name || '';
                    team.description = teamData.description || '';
                    team.status = teamStatus;
                }

                // Include instructor info if option is selected
                if (exportOptions.includeInstructorInfo) {
                    if (teamData.instructorIds && teamData.instructorIds.length > 0) {
                        const primaryInstructorId = teamData.teamLeaderId || teamData.instructorIds[0];
                        const instructor = instructorsData[primaryInstructorId];

                        if (instructor) {
                            team.instructorName = instructor.displayName || instructor.name || instructor.email || '';
                            team.instructorEmail = instructor.email || '';
                            team.instructorPhone = instructor.phone || '';
                        } else {
                            team.instructorName = 'Unknown Instructor';
                            team.instructorEmail = '';
                            team.instructorPhone = '';
                        }

                        // Include all instructors if there are multiple
                        if (teamData.instructorIds.length > 1) {
                            const allInstructorNames = teamData.instructorIds
                                .map(id => {
                                    const inst = instructorsData[id];
                                    return inst ? (inst.displayName || inst.name || inst.email) : 'Unknown';
                                })
                                .join(', ');
                            team.allInstructors = allInstructorNames;
                        } else {
                            team.allInstructors = team.instructorName || '';
                        }
                    } else {
                        team.instructorName = 'No Instructor';
                        team.instructorEmail = '';
                        team.instructorPhone = '';
                        team.allInstructors = 'No Instructor';
                    }
                }

                // Include capacity info if option is selected
                if (exportOptions.includeCapacityInfo) {
                    team.currentMembers = currentMembers;
                    team.maxCapacity = maxMembers;
                    team.availableSpots = Math.max(0, maxMembers - currentMembers);
                    team.capacityPercentage = maxMembers > 0 ? Math.round((currentMembers / maxMembers) * 100) : 0;
                }

                // Include member info if option is selected
                if (exportOptions.includeMemberInfo) {
                    if (teamData.kidIds && teamData.kidIds.length > 0) {
                        const memberNames = teamData.kidIds
                            .map(kidId => {
                                const kid = kidsData[kidId];
                                if (kid && kid.personalInfo) {
                                    const firstName = kid.personalInfo.firstName || '';
                                    const lastName = kid.personalInfo.lastName || '';
                                    return `${firstName} ${lastName}`.trim() || kid.participantNumber || 'Unknown';
                                }
                                return 'Unknown';
                            })
                            .join(', ');
                        team.memberNames = memberNames;
                    } else {
                        team.memberNames = 'No Members';
                    }
                }

                // Include detailed kids info if option is selected
                if (exportOptions.includeKidsDetails && teamData.kidIds && teamData.kidIds.length > 0) {
                    const kidsDetails = teamData.kidIds
                        .map(kidId => {
                            const kid = kidsData[kidId];
                            if (kid) {
                                const firstName = kid.personalInfo?.firstName || '';
                                const lastName = kid.personalInfo?.lastName || '';
                                const parentName = kid.parentInfo?.name || '';
                                const age = kid.personalInfo?.dateOfBirth ?
                                    new Date().getFullYear() - new Date(kid.personalInfo.dateOfBirth).getFullYear() : '';

                                return `${firstName} ${lastName} (Age: ${age}, Parent: ${parentName})`.trim();
                            }
                            return 'Unknown Kid';
                        })
                        .join(' | ');
                    team.kidsDetails = kidsDetails;
                }

                // Include timestamps if option is selected
                if (exportOptions.includeTimestamps) {
                    team.createdAt = teamData.createdAt?.toDate?.()
                        ? teamData.createdAt.toDate().toLocaleDateString() + ' ' + teamData.createdAt.toDate().toLocaleTimeString()
                        : '';
                    team.updatedAt = teamData.updatedAt?.toDate?.()
                        ? teamData.updatedAt.toDate().toLocaleDateString() + ' ' + teamData.updatedAt.toDate().toLocaleTimeString()
                        : '';
                }

                teams.push(team);
            });

            // Create CSV content
            const headers = [];

            if (exportOptions.includeBasicInfo) {
                headers.push('Team Name', 'Description', 'Status');
            }

            if (exportOptions.includeInstructorInfo) {
                headers.push('Primary Instructor', 'Instructor Email', 'Instructor Phone', 'All Instructors');
            }

            if (exportOptions.includeCapacityInfo) {
                headers.push('Current Members', 'Max Capacity', 'Available Spots', 'Capacity %');
            }

            if (exportOptions.includeMemberInfo) {
                headers.push('Member Names');
            }

            if (exportOptions.includeKidsDetails) {
                headers.push('Kids Details');
            }

            if (exportOptions.includeTimestamps) {
                headers.push('Created At', 'Updated At');
            }

            let csvContent = headers.join(',') + '\n';

            teams.forEach(team => {
                const row = [];

                if (exportOptions.includeBasicInfo) {
                    row.push(
                        `"${team.teamName || ''}"`,
                        `"${team.description || ''}"`,
                        `"${team.status || ''}"`
                    );
                }

                if (exportOptions.includeInstructorInfo) {
                    row.push(
                        `"${team.instructorName || ''}"`,
                        `"${team.instructorEmail || ''}"`,
                        `"${team.instructorPhone || ''}"`,
                        `"${team.allInstructors || ''}"`
                    );
                }

                if (exportOptions.includeCapacityInfo) {
                    row.push(
                        `"${team.currentMembers || 0}"`,
                        `"${team.maxCapacity || 0}"`,
                        `"${team.availableSpots || 0}"`,
                        `"${team.capacityPercentage || 0}%"`
                    );
                }

                if (exportOptions.includeMemberInfo) {
                    row.push(`"${team.memberNames || ''}"`);
                }

                if (exportOptions.includeKidsDetails) {
                    row.push(`"${team.kidsDetails || ''}"`);
                }

                if (exportOptions.includeTimestamps) {
                    row.push(`"${team.createdAt || ''}"`, `"${team.updatedAt || ''}"`);
                }

                csvContent += row.join(',') + '\n';
            });

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const statusFilter = exportOptions.statusFilter === 'all' ? 'all' : exportOptions.statusFilter;
            const capacityFilter = exportOptions.capacityFilter === 'all' ? 'all' : exportOptions.capacityFilter;
            const filename = `teams_export_${statusFilter}_${capacityFilter}_${timestamp}.csv`;

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

            console.log(`✅ Successfully exported ${teams.length} teams to ${filename}`);
            onClose();
        } catch (error) {
            console.error('Error exporting teams:', error);
            alert(t('teams.exportError', 'Failed to export teams. Please try again.'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        if (!isExporting) {
            setExportOptions({
                statusFilter: 'all',
                capacityFilter: 'all',
                includeBasicInfo: true,
                includeInstructorInfo: true,
                includeMemberInfo: true,
                includeCapacityInfo: true,
                includeTimestamps: true,
                includeKidsDetails: false
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
                        {t('teams.exportTeams', 'Export Teams')}
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
                        <label htmlFor="statusFilter">{t('teams.filterByStatus', 'Filter by Status')}</label>
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
                            <option value="all">{t('teams.allTeams', 'All Teams')}</option>
                            <option value="active">{t('teams.active', 'Active')}</option>
                            <option value="inactive">{t('teams.inactive', 'Inactive')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="capacityFilter">{t('teams.filterByCapacity', 'Filter by Capacity')}</label>
                        <select
                            id="capacityFilter"
                            value={exportOptions.capacityFilter}
                            onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                capacityFilter: e.target.value
                            }))}
                            disabled={isExporting}
                            className="filter-select"
                        >
                            <option value="all">{t('teams.allTeams', 'All Teams')}</option>
                            <option value="empty">{t('teams.emptyTeams', 'Empty Teams')}</option>
                            <option value="available">{t('teams.availableSpots', 'Teams with Available Spots')}</option>
                            <option value="full">{t('teams.fullTeams', 'Full Teams')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('teams.dataToInclude', 'Data to Include')}</label>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeBasicInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeBasicInfo: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                <Team size={16} style={{ marginRight: '4px' }} />
                                {t('teams.includeBasicInfo', 'Include basic information (name, description, status)')}
                            </label>
                        </div>

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
                                👨‍🏫 {t('teams.includeInstructorInfo', 'Include instructor information')}
                            </label>
                        </div>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeCapacityInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeCapacityInfo: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                📊 {t('teams.includeCapacityInfo', 'Include capacity and member count')}
                            </label>
                        </div>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeMemberInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeMemberInfo: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                👥 {t('teams.includeMemberInfo', 'Include member names list')}
                            </label>
                        </div>

                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeKidsDetails}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeKidsDetails: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    style={{ marginRight: '8px' }}
                                />
                                🎯 {t('teams.includeKidsDetails', 'Include detailed kids information (age, parent)')}
                            </label>
                        </div>

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
                                ⏰ {t('teams.includeTimestamps', 'Include Created At and Updated At timestamps')}
                            </label>
                        </div>
                    </div>

                    {userRole === 'instructor' && (
                        <div className="export-notice">
                            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                👨‍🏫 {t('teams.instructorExportNotice', 'You can export all teams data based on your instructor permissions.')}
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
                                {t('teams.exporting', 'Exporting...')}
                            </>
                        ) : (
                            <>
                                <Download size={16} style={{ marginRight: '6px' }} />
                                {t('teams.exportToCsv', 'Export to CSV')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportTeamsModal;