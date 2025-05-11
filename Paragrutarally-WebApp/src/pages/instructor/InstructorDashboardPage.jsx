// src/pages/instructor/InstructorDashboardPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';
import Dashboard from '../../components/dashboard/Dashboard.jsx';

const InstructorDashboardPage = () => {
    return (
        <Layout userRole="instructor">
            <div className="page instructor-dashboard-page">
                <Dashboard />
            </div>
        </Layout>
    );
};

export default InstructorDashboardPage;