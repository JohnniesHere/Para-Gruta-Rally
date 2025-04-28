import React from 'react';
import { Outlet } from 'react-router-dom';
import ParentHeader from './ParentHeader';
import Footer from './Footer';

const ParentLayout = () => {
    return (
        <div className="app-container parent-layout">
            <ParentHeader />
            <main className="page-container">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default ParentLayout;