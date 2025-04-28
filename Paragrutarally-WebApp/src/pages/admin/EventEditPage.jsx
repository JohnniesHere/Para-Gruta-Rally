import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import EventForm from '../../components/events/EventForm';

const EventEditPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                if (eventDoc.exists()) {
                    setEvent({ id: eventDoc.id, ...eventDoc.data() });
                } else {
                    setError('Event not found');
                }
            } catch (err) {
                setError('Failed to load event');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    const handleEventUpdated = () => {
        navigate(`/admin/events/${eventId}`);
    };

    if (loading) return <div>Loading event...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="event-edit-page">
            <div className="page-header">
                <div className="breadcrumbs">
                    <Link to="/admin/events">Events</Link> / <Link to={`/admin/events/${eventId}`}>{event?.name}</Link> / Edit
                </div>
            </div>

            <div className="card">
                <h1>Edit Event</h1>
                <EventForm
                    event={event}
                    isEditing={true}
                    onEventUpdated={handleEventUpdated}
                />
            </div>
        </div>
    );
};

export default EventEditPage;