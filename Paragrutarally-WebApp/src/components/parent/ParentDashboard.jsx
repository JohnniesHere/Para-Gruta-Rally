import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ParentDashboard = () => {
    const { currentUser } = useAuth();
    const [children, setChildren] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                // Fetch parent's children
                const childrenRef = collection(db, 'children');
                const childrenQuery = query(childrenRef, where('parentId', '==', currentUser.uid));
                const childrenSnapshot = await getDocs(childrenQuery);

                const childrenList = childrenSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setChildren(childrenList);

                // Get all child IDs
                const childIds = childrenList.map(child => child.id);

                // Fetch upcoming events
                const today = new Date();
                const eventsRef = collection(db, 'events');
                const upcomingQuery = query(
                    eventsRef,
                    where('date', '>=', today.toISOString()),
                    orderBy('date'),
                    limit(5)
                );

                const upcomingSnapshot = await getDocs(upcomingQuery);
                const upcomingList = upcomingSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setUpcomingEvents(upcomingList);

                // Find events where any of the children are registered
                const registeredList = upcomingList.filter(event =>
                    event.participants &&
                    event.participants.some(participant =>
                        childIds.includes(participant.childId)
                    )
                );

                setRegisteredEvents(registeredList);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="parent-dashboard">
            <h1>Welcome, {currentUser?.displayName || 'Parent'}</h1>
            {error && <div className="error-message">{error}</div>}

            <div className="dashboard-section">
                <h2>Your Children</h2>
                {children.length === 0 ? (
                    <div className="info-message">
                        <p>You haven't registered any children yet.</p>
                        <a href="/parent/register-child" className="button">Register a Child</a>
                    </div>
                ) : (
                    <div className="dashboard-children">
                        {children.map(child => (
                            <div key={child.id} className="dashboard-child-card">
                                <h3>{child.name}</h3>
                                <a href={`/parent/child/${child.id}`} className="button small">View Details</a>
                            </div>
                        ))}
                        <a href="/parent/children" className="button">Manage Children</a>
                    </div>
                )}
            </div>

            <div className="dashboard-section">
                <h2>Upcoming Events</h2>
                {upcomingEvents.length === 0 ? (
                    <p>No upcoming events at this moment.</p>
                ) : (
                    <div className="dashboard-events">
                        {upcomingEvents.map(event => {
                            const isRegistered = registeredEvents.some(e => e.id === event.id);

                            return (
                                <div key={event.id} className={`dashboard-event-card ${isRegistered ? 'registered' : ''}`}>
                                    <h3>{event.name}</h3>
                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                    <p><strong>Location:</strong> {event.location}</p>

                                    {isRegistered ? (
                                        <div className="registered-badge">Registered</div>
                                    ) : (
                                        <a href={`/parent/events/${event.id}`} className="button small">Register</a>
                                    )}
                                </div>
                            );
                        })}
                        <a href="/parent/events" className="button">View All Events</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;