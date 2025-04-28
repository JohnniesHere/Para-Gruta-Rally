import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalChildren: 0,
        totalEvents: 0,
        totalVehicles: 0,
        upcomingEvents: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch users count
                const usersRef = collection(db, 'users');
                const usersSnap = await getDocs(usersRef);
                const totalUsers = usersSnap.size;

                // Fetch children count
                const childrenRef = collection(db, 'children');
                const childrenSnap = await getDocs(childrenRef);
                const totalChildren = childrenSnap.size;

                // Fetch vehicles count
                const vehiclesRef = collection(db, 'vehicles');
                const vehiclesSnap = await getDocs(vehiclesRef);
                const totalVehicles = vehiclesSnap.size;

                // Fetch events and upcoming events
                const eventsRef = collection(db, 'events');
                const eventsSnap = await getDocs(eventsRef);
                const totalEvents = eventsSnap.size;

                const today = new Date();
                const upcomingEventsQuery = query(
                    eventsRef,
                    where('date', '>=', today.toISOString()),
                    orderBy('date'),
                    limit(5)
                );
                const upcomingEventsSnap = await getDocs(upcomingEventsQuery);
                const upcomingEvents = upcomingEventsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setStats({
                    totalUsers,
                    totalChildren,
                    totalEvents,
                    totalVehicles,
                    upcomingEvents
                });
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentUser]);

    if (loading) return <div>Loading dashboard data...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                    <a href="/admin/users" className="stat-link">Manage Users</a>
                </div>

                <div className="stat-card">
                    <div className="stat-value">{stats.totalChildren}</div>
                    <div className="stat-label">Children Registered</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value">{stats.totalEvents}</div>
                    <div className="stat-label">Total Events</div>
                    <a href="/admin/events" className="stat-link">Manage Events</a>
                </div>

                <div className="stat-card">
                    <div className="stat-value">{stats.totalVehicles}</div>
                    <div className="stat-label">Total Vehicles</div>
                    <a href="/admin/vehicles" className="stat-link">Manage Vehicles</a>
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Upcoming Events</h2>
                {stats.upcomingEvents.length === 0 ? (
                    <p>No upcoming events scheduled.</p>
                ) : (
                    <div className="upcoming-events-table">
                        <table>
                            <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Participants</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {stats.upcomingEvents.map(event => (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{new Date(event.date).toLocaleDateString()}</td>
                                    <td>{event.location}</td>
                                    <td>
                                        {event.participants ? event.participants.length : 0} / {event.maxParticipants}
                                    </td>
                                    <td>
                                        <a href={`/admin/events/${event.id}`} className="button small">View</a>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <a href="/admin/events/new" className="button">Create New Event</a>
                    <a href="/admin/vehicles/new" className="button">Add New Vehicle</a>
                    <a href="/admin/instructors/new" className="button">Add New Instructor</a>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
