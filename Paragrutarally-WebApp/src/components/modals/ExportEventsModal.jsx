// src/components/modals/ExportEventsModal.jsx
import React, { useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconX as X,
    IconDownload as Download,
    IconClock as Clock
} from '@tabler/icons-react';

const ExportEventsModal = ({ isOpen, onClose }) => {
    const { t, isRTL } = useLanguage();
    const [exportOptions, setExportOptions] = useState({
        statusFilter: 'all',
        includeTimestamps: true,
        includeParticipants: true,
        includeTeams: true
    });
    const [isExporting, setIsExporting] = useState(false);

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

            // Create CSV content
            const headers = ['Event Name', 'Description', 'Location', 'Date', 'Status', 'Notes'];

            if (exportOptions.includeParticipants) {
                headers.push('Participants');
            }

            if (exportOptions.includeTeams) {
                headers.push('Teams Count');
            }

            if (exportOptions.includeTimestamps) {
                headers.push('Created At', 'Updated At');
            }

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

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const statusFilter = exportOptions.statusFilter === 'all' ? 'all' : exportOptions.statusFilter;
            const filename = `events_export_${statusFilter}_${timestamp}.csv`;

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

            console.log(`✅ Successfully exported ${events.length} events to ${filename}`);
            onClose();
        } catch (error) {
            console.error('Error exporting events:', error);
            alert(t('events.exportError', 'Failed to export events. Please try again.'));
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
        <div className="modal-overlay active" onClick={handleClose} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        <Download size={20} style={{ marginRight: '8px' }} />
                        {t('events.exportEvents', 'Export Events')}
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
                        <label htmlFor="statusFilter">{t('events.filterByStatus', 'Filter by Status')}</label>
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
                            <option value="all">{t('events.allEvents', 'All Events')}</option>
                            <option value="upcoming">{t('events.upcoming', 'Upcoming')}</option>
                            <option value="completed">{t('events.completed', 'Completed')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={exportOptions.includeParticipants}
                                onChange={(e) => setExportOptions(prev => ({
                                    ...prev,
                                    includeParticipants: e.target.checked
                                }))}
                                disabled={isExporting}
                                style={{ marginRight: '8px' }}
                            />
                            {t('events.includeParticipants', 'Include participant count')}
                        </label>
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={exportOptions.includeTeams}
                                onChange={(e) => setExportOptions(prev => ({
                                    ...prev,
                                    includeTeams: e.target.checked
                                }))}
                                disabled={isExporting}
                                style={{ marginRight: '8px' }}
                            />
                            {t('events.includeTeams', 'Include participating teams count')}
                        </label>
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
                            {t('events.includeTimestamps', 'Include Created At and Updated At timestamps')}
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
                        {isExporting ? (
                            <>
                                <Clock className="loading-spinner" size={16} style={{ marginRight: '6px' }} />
                                {t('events.exporting', 'Exporting...')}
                            </>
                        ) : (
                            <>
                                <Download size={16} style={{ marginRight: '6px' }} />
                                {t('events.exportToCsv', 'Export to CSV')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportEventsModal;