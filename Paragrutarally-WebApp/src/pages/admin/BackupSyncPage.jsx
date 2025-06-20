// src/pages/admin/BackupSyncPage.jsx - Full Translation Support
import React, { useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext';
import './BackupSyncPage.css';

const BackupSyncPage = () => {
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();

    // This useEffect will run whenever the component mounts
    useEffect(() => {
        document.title = `${t('backup.title', 'Backup & Sync')} - Charity Racing App`;
        // You could fetch data or initialize state here
    }, [t]);

    return (
        <Dashboard requiredRole="admin">
            <div className={`backup-sync-page ${appliedTheme}-mode`}>
                <h1>{t('backup.title', 'Backup & Sync')}</h1>

                <div className="content-section">
                    <h2>{t('backup.databaseBackup', 'Database Backup')}</h2>
                    <p>{t('backup.description', 'Create and manage backups of your application data.')}</p>

                    <div className="action-buttons">
                        <button className="primary-button">{t('backup.createNew', 'Create New Backup')}</button>
                        <button className="secondary-button">{t('backup.viewHistory', 'View Backup History')}</button>
                    </div>

                    <div className="backup-history">
                        <h3>{t('backup.recentBackups', 'Recent Backups')}</h3>
                        <div className="empty-state">
                            <p>{t('backup.noBackups', 'No backups created yet. Click "Create New Backup" to get started.')}</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <h2>{t('backup.cloudSync', 'Cloud Sync Settings')}</h2>
                    <p>{t('backup.configureSync', 'Configure synchronization with cloud storage services.')}</p>

                    <div className="sync-options">
                        <div className="sync-option">
                            <h3>{t('backup.googleDrive', 'Google Drive')}</h3>
                            <p>{t('backup.status', 'Status')}: {t('backup.notConnected', 'Not Connected')}</p>
                            <button className="secondary-button">{t('backup.connect', 'Connect')}</button>
                        </div>

                        <div className="sync-option">
                            <h3>{t('backup.dropbox', 'Dropbox')}</h3>
                            <p>{t('backup.status', 'Status')}: {t('backup.notConnected', 'Not Connected')}</p>
                            <button className="secondary-button">{t('backup.connect', 'Connect')}</button>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <h2>{t('backup.automatedSchedule', 'Automated Backup Schedule')}</h2>
                    <p>{t('backup.setSchedule', 'Set up automated backups on a regular schedule.')}</p>

                    <div className="schedule-options">
                        <div className="schedule-option">
                            <input type="radio" id="daily" name="schedule" />
                            <label htmlFor="daily">{t('backup.daily', 'Daily')}</label>
                        </div>

                        <div className="schedule-option">
                            <input type="radio" id="weekly" name="schedule" />
                            <label htmlFor="weekly">{t('backup.weekly', 'Weekly')}</label>
                        </div>

                        <div className="schedule-option">
                            <input type="radio" id="monthly" name="schedule" />
                            <label htmlFor="monthly">{t('backup.monthly', 'Monthly')}</label>
                        </div>

                        <div className="schedule-option">
                            <input type="radio" id="custom" name="schedule" />
                            <label htmlFor="custom">{t('backup.custom', 'Custom')}</label>
                        </div>
                    </div>

                    <button className="primary-button">{t('backup.saveSettings', 'Save Settings')}</button>
                </div>
            </div>
        </Dashboard>
    );
};

export default BackupSyncPage;