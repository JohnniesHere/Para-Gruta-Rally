// src/pages/admin/UserManagementPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';

const UserManagementPage = () => {
    return (
        <Layout userRole="admin">
            <div className="page user-management-page">
                <h1>User Management</h1>
                {/* User CRUD operations */}
            </div>
        </Layout>
    );
};

export default UserManagementPage;