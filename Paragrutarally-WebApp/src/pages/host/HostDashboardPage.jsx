// src/pages/host/HostDashboardPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';
import Dashboard from '../../components/dashboard/Dashboard.jsx';

const HostDashboardPage = () => {
    return (
        <Layout userRole="host">
            <div className="page host-dashboard-page">
                <Dashboard />
            </div>
        </Layout>
    );
};

export default HostDashboardPage;