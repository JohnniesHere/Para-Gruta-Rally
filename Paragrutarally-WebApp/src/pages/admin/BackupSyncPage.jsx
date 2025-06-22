// src/pages/admin/BackupSyncPage.jsx - Updated Version
import React, { useEffect, useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import './BackupSyncPage.css';

const BackupSyncPage = () => {
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [backupStatus, setBackupStatus] = useState('');
    const [recentBackups, setRecentBackups] = useState([]);

    // This useEffect will run whenever the component mounts
    useEffect(() => {
        document.title = `${t('backup.title', 'Backup & Sync')} - Charity Racing App`;
        fetchRecentBackups();
    }, [t]);

    // Fetch recent backups from Firebase
    const fetchRecentBackups = async () => {
        try {
            const backupsSnapshot = await getDocs(collection(db, 'backups'));
            const backupsData = backupsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
                .slice(0, 5); // Show only last 5 backups

            setRecentBackups(backupsData);
        } catch (error) {
            console.error('Error fetching backups:', error);
        }
    };

    // Create new backup
    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        setBackupStatus('Creating backup...');

        try {
            // Get all collections data
            const collections = ['kids', 'teams', 'users', 'events', 'forms'];
            const backupData = {};

            for (const collectionName of collections) {
                const snapshot = await getDocs(collection(db, collectionName));
                backupData[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            // Create backup record
            await addDoc(collection(db, 'backups'), {
                data: backupData,
                createdAt: serverTimestamp(),
                size: JSON.stringify(backupData).length,
                collections: collections,
                status: 'completed'
            });

            setBackupStatus('Backup created successfully!');
            fetchRecentBackups(); // Refresh the list

            // Clear status after 3 seconds
            setTimeout(() => setBackupStatus(''), 3000);

        } catch (error) {
            console.error('Error creating backup:', error);
            setBackupStatus('Error creating backup. Please try again.');
        } finally {
            setIsCreatingBackup(false);
        }
    };

    // Format backup date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp.toMillis()).toLocaleString();
    };

    // Format backup size
    const formatSize = (bytes) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`backup-sync-page ${appliedTheme}-mode`}>
                <h1>{t('backup.title', 'Backup & Sync')}</h1>

                <div className="content-section">
                    <h2>{t('backup.databaseBackup', 'Database Backup')}</h2>
                    <p>{t('backup.description', 'Create and manage backups of your application data.')}</p>

                    <div className="action-buttons">
                        <button
                            className="primary-button"
                            onClick={handleCreateBackup}
                            disabled={isCreatingBackup}
                        >
                            {isCreatingBackup
                                ? t('backup.creating', 'Creating...')
                                : t('backup.createNew', 'Create New Backup')
                            }
                        </button>
                    </div>

                    {backupStatus && (
                        <div className={`backup-status ${backupStatus.includes('Error') ? 'error' : 'success'}`}>
                            {backupStatus}
                        </div>
                    )}

                    <div className="backup-history">
                        <h3>{t('backup.recentBackups', 'Recent Backups')}</h3>
                        {recentBackups.length > 0 ? (
                            <div className="backup-list">
                                {recentBackups.map((backup) => (
                                    <div key={backup.id} className="backup-item">
                                        <div className="backup-info">
                                            <span className="backup-date">
                                                {formatDate(backup.createdAt)}
                                            </span>
                                            <span className="backup-size">
                                                {formatSize(backup.size)}
                                            </span>
                                            <span className="backup-collections">
                                                {backup.collections?.length || 0} collections
                                            </span>
                                        </div>
                                        <span className={`backup-status-badge ${backup.status}`}>
                                            {backup.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>{t('backup.noBackups', 'No backups created yet. Click "Create New Backup" to get started.')}</p>
                            </div>
                        )}
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