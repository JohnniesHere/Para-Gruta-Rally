// src/pages/admin/ViewEventsPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';

const ViewEventsPage = () => {
    return (
        <Layout userRole="admin">
            <div className="page view-events-page">
                <h1>View Events</h1>
                {/* Events list with filters */}
            </div>
        </Layout>
    );
};

export default ViewEventsPage;