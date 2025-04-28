import React, { useState } from 'react';
import EventList from '../../components/events/EventList';
import EventForm from '../../components/events/EventForm';

const AdminEvents = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [events, setEvents] = useState([]);

    const handleEventCreated = (newEvent) => {
        setEvents([...events, newEvent]);
        setShowAddForm(false);
    };

    return (
        <div className="admin-events-page">
            <div className="page-header">
                <h1>Event Management</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="add-button"
                >
                    {showAddForm ? 'Cancel' : 'Create New Event'}
                </button>
            </div>

            {showAddForm && (
                <div className="card">
                    <EventForm onEventCreated={handleEventCreated} />
                </div>
            )}

            <div className="card">
                <EventList isAdmin={true} />
            </div>
        </div>
    );
};

export default AdminEvents;