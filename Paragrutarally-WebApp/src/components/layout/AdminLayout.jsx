import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import Footer from './Footer';

const AdminLayout = () => {
    return (
        <div className="app-container admin-layout">
            <AdminHeader />
            <div className="admin-content">
                <AdminSidebar />
                <main className="admin-main">
                    <div className="page-container">
                        <Outlet />
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default AdminLayout;