// src/pages/admin/ImportExportPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';
import DataImport from '../../components/data/DataImport';
import DataExport from '../../components/data/DataExport.jsx';

const ImportExportPage = () => {
    return (
        <Layout userRole="admin">
            <div className="page import-export-page">
                <h1>Import/Export Data</h1>
                <div className="import-section">
                    <h2>Import Data</h2>
                    <DataImport />
                </div>
                <div className="export-section">
                    <h2>Export Data</h2>
                    <DataExport />
                </div>
            </div>
        </Layout>
    );
};

export default ImportExportPage;