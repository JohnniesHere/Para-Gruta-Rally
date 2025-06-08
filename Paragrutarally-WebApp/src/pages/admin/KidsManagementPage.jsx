// src/pages/admin/KidsManagementPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import KidsManagement from '../../components/kids/KidsManagement';
import './KidsManagementPage.css';

const KidsManagementPage = () => {
    return (
        <Dashboard requiredRole="admin">
            <KidsManagement />
        </Dashboard>
    );
};

export default KidsManagementPage;