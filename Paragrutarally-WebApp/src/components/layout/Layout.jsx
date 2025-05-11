// src/components/layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children, userRole }) => {
    return (
        <div className="app-layout">
            <Navbar userRole={userRole} />
            <div className="main-content">
                <Sidebar userRole={userRole} />
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;