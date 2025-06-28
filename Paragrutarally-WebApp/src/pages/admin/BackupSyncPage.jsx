// src/pages/admin/BackupSyncPage.jsx - Reorganized Layout Version
import React, { useEffect, useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import googleDriveService from '../../services/GoogleDriveService';
import './BackupSyncPage.css';

const BackupSyncPage = () => {
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupStatus, setBackupStatus] = useState('');
    const [recentBackups, setRecentBackups] = useState([]);
    const [googleDriveStatus, setGoogleDriveStatus] = useState({
        isConnected: false,
        userEmail: null,
        isConnecting: false
    });
    const [driveBackups, setDriveBackups] = useState([]);
    const [storageInfo, setStorageInfo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const [automatedBackup, setAutomatedBackup] = useState({
        enabled: false,
        frequency: 'weekly',
        nextBackup: null,
        lastBackup: null
    });

    useEffect(() => {
        document.title = `${t('backup.title', 'Backup & Sync')} - Charity Racing App`;
        fetchRecentBackups();
        checkGoogleDriveStatus();
        loadAutomatedBackupSettings();
        setupAutomatedBackup();
    }, [t]);

    // Check Google Drive connection status
    const checkGoogleDriveStatus = async () => {
        try {
            const status = googleDriveService.getConnectionStatus();
            setGoogleDriveStatus(prev => ({
                ...prev,
                isConnected: status.isConnected,
                userEmail: status.userEmail
            }));

            if (status.isConnected && googleDriveService.isSignedIn) {
                try {
                    const storage = await googleDriveService.getStorageInfo();
                    setStorageInfo(storage);

                    const backups = await googleDriveService.listBackups();
                    setDriveBackups(backups);
                } catch (error) {
                    console.error('Error checking Google Drive:', error);
                    setGoogleDriveStatus(prev => ({ ...prev, isConnected: false, userEmail: null }));
                }
            }
        } catch (error) {
            console.error('Error checking Google Drive status:', error);
        }
    };

    // Connect to Google Drive
    const handleConnectGoogleDrive = async () => {
        setGoogleDriveStatus(prev => ({ ...prev, isConnecting: true }));

        try {
            await googleDriveService.signIn();
            await checkGoogleDriveStatus();
            setBackupStatus(t('backup.successfullyConnected', 'Successfully connected to Google Drive!'));
            setTimeout(() => setBackupStatus(''), 3000);
        } catch (error) {
            console.error('Error connecting to Google Drive:', error);
            setBackupStatus(t('backup.errorConnecting', 'Error connecting to Google Drive: {error}', { error: error.message }));
            setTimeout(() => setBackupStatus(''), 5000);
        } finally {
            setGoogleDriveStatus(prev => ({ ...prev, isConnecting: false }));
        }
    };

    // Disconnect from Google Drive
    const handleDisconnectGoogleDrive = async () => {
        try {
            await googleDriveService.signOut();
            setGoogleDriveStatus({
                isConnected: false,
                userEmail: null,
                isConnecting: false
            });
            setDriveBackups([]);
            setStorageInfo(null);
            setBackupStatus(t('backup.disconnectedFromGoogleDrive', 'Disconnected from Google Drive'));
            setTimeout(() => setBackupStatus(''), 3000);
        } catch (error) {
            console.error('Error disconnecting from Google Drive:', error);
            setBackupStatus(t('backup.errorDisconnecting', 'Error disconnecting: {error}', { error: error.message }));
            setTimeout(() => setBackupStatus(''), 5000);
        }
    };

    // Load automated backup settings
    const loadAutomatedBackupSettings = () => {
        const settings = localStorage.getItem('automatedBackupSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            setAutomatedBackup(parsed);
        }
    };

    // Save automated backup settings
    const saveAutomatedBackupSettings = (settings) => {
        localStorage.setItem('automatedBackupSettings', JSON.stringify(settings));
        setAutomatedBackup(settings);
    };

    // Setup automated backup
    const setupAutomatedBackup = () => {
        // Clear any existing interval
        if (window.backupInterval) {
            clearInterval(window.backupInterval);
        }

        const settings = JSON.parse(localStorage.getItem('automatedBackupSettings') || '{}');
        if (!settings.enabled || !googleDriveStatus.isConnected) {
            return;
        }

        // Calculate interval based on frequency
        let intervalMs;
        switch (settings.frequency) {
            case 'daily':
                intervalMs = 24 * 60 * 60 * 1000; // 24 hours
                break;
            case 'weekly':
                intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
                break;
            case 'monthly':
                intervalMs = 30 * 24 * 60 * 60 * 1000; // 30 days
                break;
            default:
                return;
        }

        // Check if it's time for next backup
        const now = new Date().getTime();
        const nextBackupTime = settings.nextBackup ? new Date(settings.nextBackup).getTime() : now;

        if (now >= nextBackupTime) {
            // Time for backup
            performAutomatedBackup();
        }

        // Set up interval for future backups
        window.backupInterval = setInterval(() => {
            performAutomatedBackup();
        }, intervalMs);
    };

    // Perform automated backup
    const performAutomatedBackup = async () => {
        if (!googleDriveStatus.isConnected) {
            console.log('Automated backup skipped: Google Drive not connected');
            return;
        }

        try {
            console.log('Performing automated backup...');
            await handleCreateBackup(true, true); // true for Google Drive, true for automated

            // Update next backup time
            const settings = JSON.parse(localStorage.getItem('automatedBackupSettings') || '{}');
            const now = new Date();
            let nextBackup = new Date(now);

            switch (settings.frequency) {
                case 'daily':
                    nextBackup.setDate(nextBackup.getDate() + 1);
                    break;
                case 'weekly':
                    nextBackup.setDate(nextBackup.getDate() + 7);
                    break;
                case 'monthly':
                    nextBackup.setMonth(nextBackup.getMonth() + 1);
                    break;
            }

            const updatedSettings = {
                ...settings,
                lastBackup: now.toISOString(),
                nextBackup: nextBackup.toISOString()
            };

            saveAutomatedBackupSettings(updatedSettings);
            console.log('Automated backup completed');
        } catch (error) {
            console.error('Automated backup failed:', error);
        }
    };

    // Handle automated backup settings change
    const handleAutomatedBackupChange = (field, value) => {
        const currentSettings = JSON.parse(localStorage.getItem('automatedBackupSettings') || '{}');
        const updatedSettings = {
            ...currentSettings,
            [field]: value
        };

        // If enabling, set next backup time
        if (field === 'enabled' && value && googleDriveStatus.isConnected) {
            const now = new Date();
            const nextBackup = new Date(now);

            switch (updatedSettings.frequency || 'weekly') {
                case 'daily':
                    nextBackup.setDate(nextBackup.getDate() + 1);
                    break;
                case 'weekly':
                    nextBackup.setDate(nextBackup.getDate() + 7);
                    break;
                case 'monthly':
                    nextBackup.setMonth(nextBackup.getMonth() + 1);
                    break;
            }

            updatedSettings.nextBackup = nextBackup.toISOString();
        }

        saveAutomatedBackupSettings(updatedSettings);

        // Re-setup automated backup
        setupAutomatedBackup();

        setBackupStatus(value ? t('backup.automatedBackupEnabled', 'Automated backup enabled') : t('backup.automatedBackupDisabled', 'Automated backup disabled'));
        setTimeout(() => setBackupStatus(''), 3000);
    };

    // Fetch recent backups from Firebase
    const fetchRecentBackups = async () => {
        try {
            const backupsSnapshot = await getDocs(collection(db, 'backups'));
            const backupsData = backupsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

            setRecentBackups(backupsData);
        } catch (error) {
            console.error('Error fetching backups:', error);
        }
    };

    // Create new backup
    const handleCreateBackup = async (uploadToGoogleDrive = false, isAutomated = false) => {
        if (!isAutomated) {
            setIsCreatingBackup(true);
            setBackupStatus(t('backup.creatingBackup', 'Creating backup...'));
        }

        try {
            const collections = ['kids', 'teams', 'users', 'events', 'forms', 'instructors', 'eventParticipants', 'reports', 'vehicles'];
            const backupData = {};

            for (const collectionName of collections) {
                const snapshot = await getDocs(collection(db, collectionName));
                backupData[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            const backupMetadata = {
                timestamp: new Date().toISOString(),
                collections: collections,
                version: '1.0',
                appName: 'Charity Racing App',
                isAutomated: isAutomated
            };

            const completeBackup = {
                metadata: backupMetadata,
                data: backupData
            };

            const backupRecord = {
                data: backupData,
                createdAt: serverTimestamp(),
                size: JSON.stringify(completeBackup).length,
                collections: collections,
                status: 'completed', // Store as raw status key
                uploadedToGoogleDrive: uploadToGoogleDrive,
                isAutomated: isAutomated
            };

            const docRef = await addDoc(collection(db, 'backups'), backupRecord);

            if (uploadToGoogleDrive && googleDriveStatus.isConnected) {
                if (!isAutomated) {
                    setBackupStatus(t('backup.uploadingToGoogleDrive', 'Uploading to Google Drive...'));
                }

                const filename = `charity-backup-${new Date().toISOString().split('T')[0]}-${docRef.id}${isAutomated ? '-auto' : ''}.json`;
                await googleDriveService.uploadBackup(completeBackup, filename);

                const backups = await googleDriveService.listBackups();
                setDriveBackups(backups);

                if (!isAutomated) {
                    setBackupStatus(t('backup.backupCreatedAndUploaded', 'Backup created and uploaded to Google Drive successfully!'));
                }
            } else {
                if (!isAutomated) {
                    setBackupStatus(t('backup.backupCreatedSuccessfully', 'Backup created successfully!'));
                }
            }

            fetchRecentBackups();

            if (!isAutomated) {
                setTimeout(() => setBackupStatus(''), 3000);
            }

        } catch (error) {
            console.error('Error creating backup:', error);
            if (!isAutomated) {
                setBackupStatus(t('backup.errorCreatingBackup', 'Error creating backup: {error}', { error: error.message }));
                setTimeout(() => setBackupStatus(''), 5000);
            }
        } finally {
            if (!isAutomated) {
                setIsCreatingBackup(false);
            }
        }
    };

    // Handle file selection for restore
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            setSelectedFile(file);
        } else {
            setBackupStatus('Please select a valid JSON backup file');
            setTimeout(() => setBackupStatus(''), 3000);
        }
    };

    // Restore from local file
    const handleRestoreFromFile = async () => {
        if (!selectedFile) {
            setBackupStatus(t('backup.selectBackupFile', 'Please select a backup file first'));
            setTimeout(() => setBackupStatus(''), 3000);
            return;
        }

        setIsRestoring(true);
        setBackupStatus(t('backup.restoreFromFile', 'Restoring from backup file...'));

        try {
            const fileContent = await selectedFile.text();
            const backupData = JSON.parse(fileContent);

            await restoreBackupData(backupData);
        } catch (error) {
            console.error('Error restoring from file:', error);
            setBackupStatus(t('backup.errorCreatingBackup', 'Error restoring backup: {error}', { error: error.message }));
            setTimeout(() => setBackupStatus(''), 5000);
        } finally {
            setIsRestoring(false);
            setSelectedFile(null);
            // Reset file input
            const fileInput = document.getElementById('backup-file-input');
            if (fileInput) fileInput.value = '';
        }
    };

    // Restore from Google Drive backup
    const handleRestoreFromDrive = async (fileId, fileName) => {
        if (!window.confirm(t('backup.restoreWarning', 'Are you sure you want to restore from "{fileName}"? This will overwrite existing data.', { fileName }))) {
            return;
        }

        setIsRestoring(true);
        setBackupStatus(t('backup.restoreFromDrive', 'Downloading and restoring from Google Drive...'));

        try {
            const backupData = await googleDriveService.downloadBackup(fileId);
            await restoreBackupData(backupData);
        } catch (error) {
            console.error('Error restoring from Google Drive:', error);
            setBackupStatus(t('backup.errorCreatingBackup', 'Error restoring backup: {error}', { error: error.message }));
            setTimeout(() => setBackupStatus(''), 5000);
        } finally {
            setIsRestoring(false);
        }
    };

    // Common restore logic
    const restoreBackupData = async (backupData) => {
        try {
            const results = await googleDriveService.restoreBackup(backupData);

            if (results.errors.length > 0) {
                setBackupStatus(t('backup.restoreCompleted', 'Restore completed: {restoredDocuments}/{totalDocuments} documents restored. {errors} errors occurred. Check console for details.', {
                    restoredDocuments: results.restoredDocuments,
                    totalDocuments: results.totalDocuments,
                    errors: results.errors.length
                }));
                console.error('Restore errors:', results.errors);
            } else {
                setBackupStatus(t('backup.successfullyRestored', 'Successfully restored {restoredDocuments} documents across {collections} collections!', {
                    restoredDocuments: results.restoredDocuments,
                    collections: results.success.length
                }));
            }

            console.log('Restore results:', results);

        } catch (error) {
            throw error; // Re-throw to be handled by calling function
        }

        // Refresh backup list and clear status after delay
        setTimeout(() => {
            fetchRecentBackups();
            setBackupStatus('');
        }, 5000); // Longer delay to read the success message
    };

    // Format helpers
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp.toMillis()).toLocaleString();
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    // Translate status helper
    const getTranslatedStatus = (status) => {
        const statusTranslations = {
            'completed': t('status.completed', 'Completed'),
            'pending': t('status.pending', 'Pending'),
            'failed': t('status.failed', 'Failed'),
            'in-progress': t('status.inProgress', 'In Progress')
        };
        return statusTranslations[status] || status;
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`backup-sync-page ${appliedTheme}-mode`}>
                <h1 className="page-title">{t('backup.title', 'Backup & Sync')}</h1>

                {/* Status Message */}
                {backupStatus && (
                    <div className={`backup-status ${backupStatus.includes('Error') ? 'error' : 'success'}`}>
                        {backupStatus}
                    </div>
                )}

                {/* 1. GOOGLE DRIVE CONNECTION - FIRST */}
                <div className="content-section">
                    <h2>{t('backup.cloudSync', 'Cloud Sync Settings')}</h2>
                    <p>{t('backup.configureSync', 'Configure synchronization with cloud storage services.')}</p>

                    <div className="sync-options">
                        <div className="sync-option">
                            <h3>{t('backup.googleDrive', 'Google Drive')}</h3>
                            <div className="connection-status">
                                <p>
                                    <span className="status-label">{t('backup.status', 'Status')}:</span>
                                    <span className={`status-indicator ${googleDriveStatus.isConnected ? 'connected' : 'disconnected'}`}>
                                        {googleDriveStatus.isConnected
                                            ? t('backup.connected', 'Connected')
                                            : t('backup.notConnected', 'Not Connected')
                                        }
                                    </span>
                                </p>
                                {googleDriveStatus.userEmail && (
                                    <p className="user-email">{googleDriveStatus.userEmail}</p>
                                )}
                                {storageInfo && (
                                    <div className="storage-info">
                                        <p>Storage: {formatSize(storageInfo.usage)} / {formatSize(storageInfo.limit)}</p>
                                        <div className="storage-bar">
                                            <div
                                                className="storage-fill"
                                                style={{ width: `${(storageInfo.usage / storageInfo.limit) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {googleDriveStatus.isConnected ? (
                                <button
                                    className="secondary-button disconnect-btn"
                                    onClick={handleDisconnectGoogleDrive}
                                    disabled={googleDriveStatus.isConnecting || isCreatingBackup || isRestoring}
                                >
                                    {t('backup.disconnect', 'Disconnect')}
                                </button>
                            ) : (
                                <button
                                    className="secondary-button connect-btn"
                                    onClick={handleConnectGoogleDrive}
                                    disabled={googleDriveStatus.isConnecting || isCreatingBackup || isRestoring}
                                >
                                    {googleDriveStatus.isConnecting
                                        ? t('backup.connecting', 'Connecting...')
                                        : t('backup.connect', 'Connect')
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. CREATE BACKUP - SECOND */}
                <div className="content-section">
                    <h2>{t('backup.databaseBackup', 'Database Backup')}</h2>
                    <p>{t('backup.description', 'Create and manage backups of your application data.')}</p>

                    <div className="action-buttons">
                        {googleDriveStatus.isConnected ? (
                            <button
                                className="primary-button google-drive-btn"
                                onClick={() => handleCreateBackup(true)}
                                disabled={isCreatingBackup || isRestoring}
                            >
                                {isCreatingBackup
                                    ? t('backup.uploading', 'Uploading...')
                                    : t('backup.createAndUpload', 'Create & Upload to Drive')
                                }
                            </button>
                        ) : (
                            <div className="backup-notice">
                                <p>{t('backup.connectToCreateBackups', 'Connect to Google Drive to create backups')}</p>
                            </div>
                        )}
                    </div>

                    <div className="backup-history">
                        <h3>{t('backup.recentBackups', 'Recent Backups')}</h3>
                        {recentBackups.length > 0 ? (
                            <div className="backup-list-container">
                                <div className="backup-list">
                                    {recentBackups.map((backup) => (
                                        <div key={backup.id} className="backup-item">
                                            <div className="backup-info">
                                                <span className="backup-date">
                                                    {formatDate(backup.createdAt)}
                                                    {backup.isAutomated && <span className="auto-badge">AUTO</span>}
                                                </span>
                                                <span className="backup-size">
                                                    {formatSize(backup.size)}
                                                </span>
                                                <span className="backup-collections">
                                                    {backup.collections?.length || 0} collections
                                                </span>
                                            </div>
                                            <span className={`backup-status-badge ${backup.status}`}>
                                                {getTranslatedStatus(backup.status)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>{t('backup.noBackups', 'No backups created yet. Connect to Google Drive and create your first backup!')}</p>
                            </div>
                        )}
                    </div>

                    {googleDriveStatus.isConnected && driveBackups.length > 0 && (
                        <div className="google-drive-backups">
                            <h3>{t('backup.googleDriveBackups', 'Google Drive Backups')}</h3>
                            <div className="backup-list">
                                {driveBackups.map((backup) => (
                                    <div key={backup.id} className="backup-item google-drive">
                                        <div className="backup-info">
                                            <span className="backup-name">{backup.name}</span>
                                            <span className="backup-date">
                                                {backup.createdAt.toLocaleDateString()}
                                            </span>
                                            <span className="backup-size">
                                                {formatSize(backup.size)}
                                            </span>
                                        </div>
                                        <div className="backup-actions">
                                            <button
                                                className="restore-button"
                                                onClick={() => handleRestoreFromDrive(backup.id, backup.name)}
                                                disabled={isRestoring || isCreatingBackup}
                                            >
                                                {isRestoring ? 'Restoring...' : 'Restore'}
                                            </button>
                                            <a
                                                href={backup.webViewLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="view-button"
                                            >
                                                {t('backup.view', 'View')}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. RESTORE - THIRD */}
                <div className="content-section">
                    <h2>{t('backup.restore', 'Restore from Backup')}</h2>
                    <p>{t('backup.restoreDescription', 'Restore your application data from a backup file.')}</p>

                    <div className="restore-section">
                        <div className="file-upload">
                            <input
                                type="file"
                                id="backup-file-input"
                                accept=".json"
                                onChange={handleFileSelect}
                                disabled={isRestoring || isCreatingBackup}
                            />
                            <label htmlFor="backup-file-input" className="file-input-label">
                                {selectedFile ? selectedFile.name : t('backup.chooseBackupFile', 'Choose backup file...')}
                            </label>
                        </div>

                        <button
                            className="secondary-button restore-btn"
                            onClick={handleRestoreFromFile}
                            disabled={!selectedFile || isRestoring || isCreatingBackup}
                        >
                            {isRestoring ? t('backup.restoring', 'Restoring...') : t('backup.restoreFromFile', 'Restore from File')}
                        </button>
                    </div>
                </div>

                {/* 4. AUTOMATED BACKUP - FOURTH */}
                <div className="content-section">
                    <h2>{t('backup.automatedSchedule', 'Automated Backup Schedule')}</h2>
                    <p>{t('backup.setSchedule', 'Set up automated backups on a regular schedule.')}</p>

                    <div className="schedule-options">
                        <div className="schedule-option">
                            <input
                                type="radio"
                                id="daily"
                                name="schedule"
                                checked={automatedBackup.frequency === 'daily'}
                                onChange={() => handleAutomatedBackupChange('frequency', 'daily')}
                                disabled={!googleDriveStatus.isConnected}
                            />
                            <label htmlFor="daily">{t('backup.daily', 'Daily')}</label>
                        </div>

                        <div className="schedule-option">
                            <input
                                type="radio"
                                id="weekly"
                                name="schedule"
                                checked={automatedBackup.frequency === 'weekly'}
                                onChange={() => handleAutomatedBackupChange('frequency', 'weekly')}
                                disabled={!googleDriveStatus.isConnected}
                            />
                            <label htmlFor="weekly">{t('backup.weekly', 'Weekly')}</label>
                        </div>

                        <div className="schedule-option">
                            <input
                                type="radio"
                                id="monthly"
                                name="schedule"
                                checked={automatedBackup.frequency === 'monthly'}
                                onChange={() => handleAutomatedBackupChange('frequency', 'monthly')}
                                disabled={!googleDriveStatus.isConnected}
                            />
                            <label htmlFor="monthly">{t('backup.monthly', 'Monthly')}</label>
                        </div>
                    </div>

                    <div className="automated-backup-controls">
                        <div className="backup-toggle">
                            <input
                                type="checkbox"
                                id="enable-automated"
                                checked={automatedBackup.enabled}
                                onChange={(e) => handleAutomatedBackupChange('enabled', e.target.checked)}
                                disabled={!googleDriveStatus.isConnected}
                            />
                            <label htmlFor="enable-automated">
                                {t('backup.enableAutomated', 'Enable Automated Backups')}
                            </label>
                        </div>

                        {automatedBackup.enabled && (
                            <div className="backup-schedule-info">
                                {automatedBackup.nextBackup && (
                                    <p>{t('backup.nextBackup', 'Next backup: {date}', {date: new Date(automatedBackup.nextBackup).toLocaleString()})}</p>
                                )}
                                {automatedBackup.lastBackup && (
                                    <p>{t('backup.lastBackup', 'Last backup: {date}', {date: new Date(automatedBackup.lastBackup).toLocaleString()})}</p>
                                )}
                            </div>
                        )}

                        {!googleDriveStatus.isConnected && (
                            <p className="warning-text">{t('backup.connectToEnableAutomated', 'Connect to Google Drive to enable automated backups')}</p>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default BackupSyncPage;