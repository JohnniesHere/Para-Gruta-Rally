import React from 'react';
import EventList from '../../components/events/EventList';

const EventsPage = () => {
    return (
        <div className="events-page">
            <div className="page-header">
                <h1>Upcoming Events</h1>
            </div>

            <div className="card">
                <EventList isPublic={true} />
            </div>
        </div>
    );
};

export default EventsPage;