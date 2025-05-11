// src/pages/instructor/ViewTeamsPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';

const ViewTeamsPage = () => {
    return (
        <Layout userRole="instructor">
            <div className="page view-teams-page">
                <h1>My Teams</h1>
                {/* Teams list */}
            </div>
        </Layout>
    );
};

export default ViewTeamsPage;