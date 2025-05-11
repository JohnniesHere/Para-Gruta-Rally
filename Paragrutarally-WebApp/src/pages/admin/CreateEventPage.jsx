// src/pages/admin/CreateEventPage.jsx
import React from 'react';
import Layout from '../../components/layout/Layout';

const CreateEventPage = () => {
    return (
        <Layout userRole="admin">
            <div className="page create-event-page">
                <h1>Create Event</h1>
                {/* Event creation form */}
            </div>
        </Layout>
    );
};

export default CreateEventPage;