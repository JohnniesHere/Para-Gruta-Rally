// src/pages/shared/MyAccountPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';
import UserProfile from '../../components/auth/UserProfile.jsx';

const MyAccountPage = () => {
    return (
        <Layout>
            <div className="page my-account-page">
                <h1>My Account</h1>
                <UserProfile />
            </div>
        </Layout>
    );
};

export default MyAccountPage;