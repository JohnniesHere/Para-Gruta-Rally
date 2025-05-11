// src/pages/admin/FormsManagementPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';

const FormsManagementPage = () => {
    return (
        <Layout userRole="admin">
            <div className="page forms-management-page">
                <h1>Forms Management</h1>
                {/* Forms CRUD operations */}
            </div>
        </Layout>
    );
};

export default FormsManagementPage;