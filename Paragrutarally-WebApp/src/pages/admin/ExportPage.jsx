// src/pages/admin/ExportPage.jsx - Full Translation Support
import React, { useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import './ExportPage.css';

const ExportPage = () => {
    const { isDarkMode, appliedTheme } = useTheme(); // Added theme integration
    const { t } = useLanguage();
    const [selectedImportType, setSelectedImportType] = useState('users');
    const [selectedExportType, setSelectedExportType] = useState('users');
    const [importFile, setImportFile] = useState(null);

    const handleImportTypeChange = (e) => {
        setSelectedImportType(e.target.value);
    };

    const handleExportTypeChange = (e) => {
        setSelectedExportType(e.target.value);
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setImportFile(e.target.files[0]);
        }
    };

    // Get translated data type labels
    const getDataTypeLabel = (type) => {
        switch (type) {
            case 'users':
                return t('import.users', 'Users');
            case 'kids':
                return t('import.kids', 'Kids');
            case 'teams':
                return t('import.teams', 'Teams');
            case 'events':
                return t('import.events', 'Events');
            case 'all':
                return t('import.allData', 'All Data');
            default:
                return type;
        }
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        // In a real implementation, this would process the file - TRANSLATED
        alert(t('import.importingData', 'Importing {type} data from {filename}', {
            type: getDataTypeLabel(selectedImportType),
            filename: importFile?.name
        }));
    };

    const handleExportSubmit = (e) => {
        e.preventDefault();
        // In a real implementation, this would generate and download a file - TRANSLATED
        alert(t('import.exportingData', 'Exporting {type} data', {
            type: getDataTypeLabel(selectedExportType)
        }));
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`import-export-page ${appliedTheme}-mode`}>
                <h1>{t('import.title', 'Import/Export Data')}</h1>

                <div className="content-section">
                    <h2>{t('import.importData', 'Import Data')}</h2>
                    <p>{t('import.importDescription', 'Upload data files to import information into the system.')}</p>

                    <form onSubmit={handleImportSubmit} className="import-form">
                        <div className="form-group">
                            <label htmlFor="importType">{t('import.selectDataType', 'Select Data Type to Import:')}</label>
                            <select
                                id="importType"
                                value={selectedImportType}
                                onChange={handleImportTypeChange}
                                className="select-input"
                            >
                                <option value="users">{t('import.users', 'Users')}</option>
                                <option value="kids">{t('import.kids', 'Kids')}</option>
                                <option value="teams">{t('import.teams', 'Teams')}</option>
                                <option value="events">{t('import.events', 'Events')}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="file">{t('import.selectFile', 'Select File (CSV or Excel):')}</label>
                            <input
                                type="file"
                                id="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            {importFile && (
                                <div className="file-info">
                                    <p>{t('import.selectedFile', 'Selected file:')} {importFile.name}</p>
                                    <p>{t('import.size', 'Size:')} {(importFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                        </div>

                        <div className="import-options">
                            <div className="option">
                                <input type="checkbox" id="overwrite" />
                                <label htmlFor="overwrite">{t('import.overwriteRecords', 'Overwrite existing records')}</label>
                            </div>
                            <div className="option">
                                <input type="checkbox" id="skipHeader" checked readOnly />
                                <label htmlFor="skipHeader">{t('import.skipHeader', 'Skip header row')}</label>
                            </div>
                        </div>

                        <button type="submit" className="primary-button" disabled={!importFile}>
                            {t('import.importButton', 'Import Data')}
                        </button>
                    </form>
                </div>

                <div className="content-section">
                    <h2>{t('import.exportData', 'Export Data')}</h2>
                    <p>{t('import.exportDescription', 'Download data from the system as CSV or Excel files.')}</p>

                    <form onSubmit={handleExportSubmit} className="export-form">
                        <div className="form-group">
                            <label htmlFor="exportType">{t('import.selectExportType', 'Select Data Type to Export:')}</label>
                            <select
                                id="exportType"
                                value={selectedExportType}
                                onChange={handleExportTypeChange}
                                className="select-input"
                            >
                                <option value="users">{t('import.users', 'Users')}</option>
                                <option value="kids">{t('import.kids', 'Kids')}</option>
                                <option value="teams">{t('import.teams', 'Teams')}</option>
                                <option value="events">{t('import.events', 'Events')}</option>
                                <option value="all">{t('import.allData', 'All Data')}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="format">{t('import.exportFormat', 'Export Format:')}</label>
                            <div className="format-options">
                                <div className="format-option">
                                    <input type="radio" id="csv" name="format" value="csv" defaultChecked />
                                    <label htmlFor="csv">{t('import.csv', 'CSV')}</label>
                                </div>
                                <div className="format-option">
                                    <input type="radio" id="excel" name="format" value="excel" />
                                    <label htmlFor="excel">{t('import.excel', 'Excel')}</label>
                                </div>
                            </div>
                        </div>

                        <div className="export-options">
                            <div className="option">
                                <input type="checkbox" id="includeHeaders" checked readOnly />
                                <label htmlFor="includeHeaders">{t('import.includeHeaders', 'Include header row')}</label>
                            </div>
                            <div className="option">
                                <input type="checkbox" id="includeTimestamp" />
                                <label htmlFor="includeTimestamp">{t('import.includeTimestamp', 'Include timestamp in filename')}</label>
                            </div>
                        </div>

                        <button type="submit" className="primary-button">
                            {t('import.exportButton', 'Export Data')}
                        </button>
                    </form>
                </div>

                <div className="content-section">
                    <h2>{t('import.recentActivity', 'Recent Activity')}</h2>

                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-icon import-icon">↓</div>
                            <div className="activity-details">
                                <div className="activity-title">{t('import.usersImport', 'Users Import')}</div>
                                <div className="activity-meta">
                                    <span className="activity-time">{t('import.daysAgo', '{count} days ago', { count: 2 })}</span>
                                    <span className="activity-status success">{t('import.success', 'Success')}</span>
                                </div>
                                <div className="activity-description">{t('import.recordsImported', '{count} records imported', { count: 45 })}</div>
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-icon export-icon">↑</div>
                            <div className="activity-details">
                                <div className="activity-title">{t('import.eventsExport', 'Events Export')}</div>
                                <div className="activity-meta">
                                    <span className="activity-time">{t('import.daysAgo', '{count} days ago', { count: 3 })}</span>
                                    <span className="activity-status success">{t('import.success', 'Success')}</span>
                                </div>
                                <div className="activity-description">{t('import.exportedAs', 'Exported as {filename}', { filename: 'events_202505.csv' })}</div>
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-icon import-icon">↓</div>
                            <div className="activity-details">
                                <div className="activity-title">{t('import.teamsImport', 'Teams Import')}</div>
                                <div className="activity-meta">
                                    <span className="activity-time">{t('import.weekAgo', '1 week ago')}</span>
                                    <span className="activity-status error">{t('import.error', 'Error')}</span>
                                </div>
                                <div className="activity-description">{t('import.invalidFormat', 'Invalid format in row {row}', { row: 3 })}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ExportPage;