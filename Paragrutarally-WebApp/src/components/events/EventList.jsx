import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsRef = collection(db, 'events');
                const q = query(eventsRef, orderBy('date', 'asc'));
                const querySnapshot = await getDocs(q);

                const eventsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Format date from Firestore timestamp
                    date: doc.data().date
                }));

                setEvents(eventsList);
            } catch (err) {
                setError('Failed to fetch events');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) return <div>Loading events...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="event-list">
            <h2>Upcoming Events</h2>
            {events.length === 0 ? (
                <p>No events scheduled</p>
            ) : (
                <div className="events-grid">
                    {events.map(event => (
                        <div key={event.id} className="event-card">
                            <h3>{event.name}</h3>
                            <p><strong>Date:</strong> {event.date}</p>
                            <p><strong>Location:</strong> {event.location}</p>
                            <p>{event.description}</p>
                            <div className="event-footer">
                                <span>Participants: {event.participants?.length || 0}/{event.maxParticipants}</span>
                                <a href={`/events/${event.id}`}>View Details</a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventList;