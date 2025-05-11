// src/pages/admin/BackupSyncPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';
import DataSync from '../../components/data/DataSync';

const BackupSyncPage = () => {
    return (
        <Layout userRole="admin">
            <div className="page backup-sync-page">
                <h1>Backup & Sync</h1>
                <DataSync />
            </div>
        </Layout>
    );
};

export default BackupSyncPage;