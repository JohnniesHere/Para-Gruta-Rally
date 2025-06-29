// src/components/modals/ExportEventsModal.jsx - UPDATED WITH CLEAN MODAL STRUCTURE
import React, { useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconX as X,
    IconDownload as Download,
    IconClock as Clock,
    IconCalendarEvent as CalendarEvent,
    IconFilter as Filter,
    IconSettings as Settings
} from '@tabler/icons-react';

const ExportEventsModal = ({ isOpen, onClose }) => {
    const { t, isRTL, currentLanguage } = useLanguage();
    const [exportOptions, setExportOptions] = useState({
        statusFilter: 'all',
        includeTimestamps: true,
        includeParticipants: true,
        includeTeams: true
    });
    const [isExporting, setIsExporting] = useState(false);

    // Hebrew headers mapping
    const getHeaders = () => {
        if (currentLanguage === 'he') {
            const headers = ['שם האירוע', 'תיאור', 'מקום', 'תאריך', 'סטטוס', 'הערות'];

            if (exportOptions.includeParticipants) {
                headers.push('משתתפים');
            }

            if (exportOptions.includeTeams) {
                headers.push('מספר צוותים');
            }

            if (exportOptions.includeTimestamps) {
                headers.push('נוצר בתאריך', 'עודכן בתאריך');
            }

            return headers;
        } else {
            const headers = [
                t('events.eventName', 'Event Name'),
                t('events.description', 'Description'),
                t('events.location', 'Location'),
                t('events.date', 'Date'),
                t('events.status', 'Status'),
                t('events.notes', 'Notes')
            ];

            if (exportOptions.includeParticipants) {
                headers.push(t('events.participants', 'Participants'));
            }

            if (exportOptions.includeTeams) {
                headers.push(t('exportEvents.teamsCount', 'Teams Count'));
            }

            if (exportOptions.includeTimestamps) {
                headers.push(t('users.createdAt', 'Created At'), t('exportEvents.updatedAt', 'Updated At'));
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
            let eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));

            // Apply status filter if selected
            if (exportOptions.statusFilter !== 'all') {
                eventsQuery = query(
                    collection(db, 'events'),
                    where('status', '==', exportOptions.statusFilter),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(eventsQuery);
            const events = [];

            querySnapshot.forEach((doc) => {
                const eventData = doc.data();
                const event = {
                    name: eventData.name || '',
                    description: eventData.description || '',
                    location: eventData.location || '',
                    date: eventData.date || '',
                    status: eventData.status || '',
                    notes: eventData.notes || '',
                };

                // Include participants if option is selected
                if (exportOptions.includeParticipants) {
                    event.participants = eventData.attendees || 0;
                }

                // Include teams if option is selected
                if (exportOptions.includeTeams) {
                    event.participatingTeams = eventData.participatingTeams ? eventData.participatingTeams.length : 0;
                }

                // Include timestamps if option is selected
                if (exportOptions.includeTimestamps) {
                    event.createdAt = eventData.createdAt?.toDate?.()
                        ? eventData.createdAt.toDate().toLocaleDateString() + ' ' + eventData.createdAt.toDate().toLocaleTimeString()
                        : '';
                    event.updatedAt = eventData.updatedAt?.toDate?.()
                        ? eventData.updatedAt.toDate().toLocaleDateString() + ' ' + eventData.updatedAt.toDate().toLocaleTimeString()
                        : '';
                }

                events.push(event);
            });

            // Create CSV content with proper headers
            const headers = getHeaders();
            let csvContent = headers.join(',') + '\n';

            events.forEach(event => {
                const row = [
                    `"${event.name}"`,
                    `"${event.description}"`,
                    `"${event.location}"`,
                    `"${event.date}"`,
                    `"${event.status}"`,
                    `"${event.notes}"`
                ];

                if (exportOptions.includeParticipants) {
                    row.push(`"${event.participants}"`);
                }

                if (exportOptions.includeTeams) {
                    row.push(`"${event.participatingTeams}"`);
                }

                if (exportOptions.includeTimestamps) {
                    row.push(`"${event.createdAt}"`, `"${event.updatedAt}"`);
                }

                csvContent += row.join(',') + '\n';
            });

            // Format for RTL if Hebrew
            csvContent = formatCsvForRTL(csvContent);

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const statusFilter = exportOptions.statusFilter === 'all' ? 'all' : exportOptions.statusFilter;
            const langSuffix = currentLanguage === 'he' ? '_he' : '';
            const filename = `events_export_${statusFilter}_${timestamp}${langSuffix}.csv`;

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

            onClose();
        } catch (error) {
            console.error('Error exporting events:', error);
            alert(t('exportEvents.exportError', 'Failed to export events. Please try again.'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        if (!isExporting) {
            setExportOptions({
                statusFilter: 'all',
                includeTimestamps: true,
                includeParticipants: true,
                includeTeams: true
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="form-creation-modal-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-creation-modal-content">
                <div className="form-creation-modal-header">
                    <h3>
                        <CalendarEvent size={24} />
                        {t('events.exportEvents', 'Export Events')}
                    </h3>
                    <button
                        className="form-creation-modal-close"
                        onClick={handleClose}
                        disabled={isExporting}
                        type="button"
                        aria-label={t('common.close', 'Close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="form-creation-modal-body">
                    {/* Filter Options */}
                    <div className="form-section">
                        <h4>
                            <Filter size={18} />
                            {t('exportEvents.filterOptions', 'Filter Options')}
                        </h4>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="statusFilter">
                                    {t('exportEvents.filterByStatus', 'Filter by Status')}
                                </label>
                                <select
                                    id="statusFilter"
                                    value={exportOptions.statusFilter}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        statusFilter: e.target.value
                                    }))}
                                    disabled={isExporting}
                                    className="form-select"
                                >
                                    <option value="all">{t('events.allEvents', 'All Events')}</option>
                                    <option value="upcoming">{t('events.upcoming', 'Upcoming')}</option>
                                    <option value="completed">{t('events.completed', 'Completed')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="form-section">
                        <h4>
                            <Settings size={18} />
                            {t('exportEvents.exportOptions', 'Export Options')}
                        </h4>

                        <div className="target-users-grid">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeParticipants}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeParticipants: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                />
                                {t('exportEvents.includeParticipants', 'Include participant count')}
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeTeams}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeTeams: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                />
                                {t('exportEvents.includeTeams', 'Include participating teams count')}
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeTimestamps}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeTimestamps: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                />
                                {t('import.includeTimestamp', 'Include Created At and Updated At timestamps')}
                            </label>
                        </div>
                    </div>

                    {/* Language Notice */}
                    {currentLanguage === 'he' && (
                        <div className="form-section">
                            <div className="info-alert">
                                🌐 {t('export.hebrewNotice', 'הקובץ יוצא עם כותרות בעברית ותמיכה ב-RTL')}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-creation-modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={isExporting}
                    >
                        {t('general.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <div className="loading-spinner-mini" aria-hidden="true"></div>
                                {t('users.exporting', 'Exporting...')}
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                {t('users.exportToCsv', 'Export to CSV')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportEventsModal;