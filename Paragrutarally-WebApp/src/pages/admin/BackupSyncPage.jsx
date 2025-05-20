// src/pages/admin/BackupSyncPage.jsx
import React, { useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import './BackupSyncPage.css';

const BackupSyncPage = () => {
    const { isDark } = useTheme();

    // This useEffect will run whenever the component mounts
    useEffect(() => {
        document.title = "Backup & Sync - Charity Racing App";
        // You could fetch data or initialize state here
    }, []);

    return (
        <Dashboard requiredRole="admin">
            <div className={`backup-sync-page ${isDark ? 'dark-mode' : 'light-mode'}`}>
                <h1>Backup & Sync</h1>

                <div className="content-section">
                    <h2>Database Backup</h2>
                    <p>Create and manage backups of your application data.</p>

                    <div className="action-buttons">
                        <button className="primary-button">Create New Backup</button>
                        <button className="secondary-button">View Backup History</button>
                    </div>

                    <div className="backup-history">
                        <h3>Recent Backups</h3>
                        <div className="empty-state">
                            <p>No backups created yet. Click "Create New Backup" to get started.</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <h2>Cloud Sync Settings</h2>
                    <p>Configure synchronization with cloud storage services.</p>

                    <div className="sync-options">
                        <div className="sync-option">
                            <h3>Google Drive</h3>
                            <p>Status: Not Connected</p>
                            <button className="secondary-button">Connect</button>
                        </div>

                        <div className="sync-option">
                            <h3>Dropbox</h3>
                            <p>Status: Not Connected</p>
                            <button className="secondary-button">Connect</button>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <h2>Automated Backup Schedule</h2>
                    <p>Set up automated backups on a regular schedule.</p>

                    <div className="schedule-options">
                        <div className="schedule-option">
                            <input type="radio" id="daily" name="schedule" />
                            <label htmlFor="daily">Daily</label>
                        </div>

                        <div className="schedule-option">
                            <input type="radio" id="weekly" name="schedule" />
                            <label htmlFor="weekly">Weekly</label>
                        </div>

                        <div className="schedule-option">
                            <input type="radio" id="monthly" name="schedule" />
                            <label htmlFor="monthly">Monthly</label>
                        </div>

                        <div className="schedule-option">
                            <input type="radio" id="custom" name="schedule" />
                            <label htmlFor="custom">Custom</label>
                        </div>
                    </div>

                    <button className="primary-button">Save Settings</button>
                </div>
            </div>
        </Dashboard>
    );
};

export default BackupSyncPage;