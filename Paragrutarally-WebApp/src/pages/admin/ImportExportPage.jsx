// src/pages/admin/ImportExportPage.jsx
import React, { useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import './ImportExportPage.css';

const ImportExportPage = () => {
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

    const handleImportSubmit = (e) => {
        e.preventDefault();
        // In a real implementation, this would process the file
        alert(`Importing ${selectedImportType} data from ${importFile?.name}`);
    };

    const handleExportSubmit = (e) => {
        e.preventDefault();
        // In a real implementation, this would generate and download a file
        alert(`Exporting ${selectedExportType} data`);
    };

    return (
        <Dashboard requiredRole="admin">
            <div className="import-export-page">
                <h1>Import/Export Data</h1>

                <div className="content-section">
                    <h2>Import Data</h2>
                    <p>Upload data files to import information into the system.</p>

                    <form onSubmit={handleImportSubmit} className="import-form">
                        <div className="form-group">
                            <label htmlFor="importType">Select Data Type to Import:</label>
                            <select
                                id="importType"
                                value={selectedImportType}
                                onChange={handleImportTypeChange}
                                className="select-input"
                            >
                                <option value="users">Users</option>
                                <option value="kids">Kids</option>
                                <option value="teams">Teams</option>
                                <option value="events">Events</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="file">Select File (CSV or Excel):</label>
                            <input
                                type="file"
                                id="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            {importFile && (
                                <div className="file-info">
                                    <p>Selected file: {importFile.name}</p>
                                    <p>Size: {(importFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                        </div>

                        <div className="import-options">
                            <div className="option">
                                <input type="checkbox" id="overwrite" />
                                <label htmlFor="overwrite">Overwrite existing records</label>
                            </div>
                            <div className="option">
                                <input type="checkbox" id="skipHeader" checked readOnly />
                                <label htmlFor="skipHeader">Skip header row</label>
                            </div>
                        </div>

                        <button type="submit" className="primary-button" disabled={!importFile}>
                            Import Data
                        </button>
                    </form>
                </div>

                <div className="content-section">
                    <h2>Export Data</h2>
                    <p>Download data from the system as CSV or Excel files.</p>

                    <form onSubmit={handleExportSubmit} className="export-form">
                        <div className="form-group">
                            <label htmlFor="exportType">Select Data Type to Export:</label>
                            <select
                                id="exportType"
                                value={selectedExportType}
                                onChange={handleExportTypeChange}
                                className="select-input"
                            >
                                <option value="users">Users</option>
                                <option value="kids">Kids</option>
                                <option value="teams">Teams</option>
                                <option value="events">Events</option>
                                <option value="all">All Data</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="format">Export Format:</label>
                            <div className="format-options">
                                <div className="format-option">
                                    <input type="radio" id="csv" name="format" value="csv" defaultChecked />
                                    <label htmlFor="csv">CSV</label>
                                </div>
                                <div className="format-option">
                                    <input type="radio" id="excel" name="format" value="excel" />
                                    <label htmlFor="excel">Excel</label>
                                </div>
                            </div>
                        </div>

                        <div className="export-options">
                            <div className="option">
                                <input type="checkbox" id="includeHeaders" checked readOnly />
                                <label htmlFor="includeHeaders">Include header row</label>
                            </div>
                            <div className="option">
                                <input type="checkbox" id="includeTimestamp" />
                                <label htmlFor="includeTimestamp">Include timestamp in filename</label>
                            </div>
                        </div>

                        <button type="submit" className="primary-button">
                            Export Data
                        </button>
                    </form>
                </div>

                <div className="content-section">
                    <h2>Recent Activity</h2>

                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-icon import-icon">↓</div>
                            <div className="activity-details">
                                <div className="activity-title">Users Import</div>
                                <div className="activity-meta">
                                    <span className="activity-time">2 days ago</span>
                                    <span className="activity-status success">Success</span>
                                </div>
                                <div className="activity-description">45 records imported</div>
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-icon export-icon">↑</div>
                            <div className="activity-details">
                                <div className="activity-title">Events Export</div>
                                <div className="activity-meta">
                                    <span className="activity-time">3 days ago</span>
                                    <span className="activity-status success">Success</span>
                                </div>
                                <div className="activity-description">Exported as events_202505.csv</div>
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-icon import-icon">↓</div>
                            <div className="activity-details">
                                <div className="activity-title">Teams Import</div>
                                <div className="activity-meta">
                                    <span className="activity-time">1 week ago</span>
                                    <span className="activity-status error">Error</span>
                                </div>
                                <div className="activity-description">Invalid format in row 3</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ImportExportPage;