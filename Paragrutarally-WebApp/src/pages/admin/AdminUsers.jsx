import React from 'react';
import UserManagement from '../../components/admin/UserManagement';

const AdminUsers = () => {
    return (
        <div className="admin-users-page">
            <h1>User Management</h1>
            <div className="card">
                <UserManagement />
            </div>
        </div>
    );
};

export default AdminUsers;