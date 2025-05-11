// src/pages/admin/AdminDashboardPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    return (
        <Dashboard requiredRole="admin">
            <div className="admin-dashboard">
                <h1>Admin Dashboard</h1>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <div className="stat-value">45</div>
                    </div>

                    <div className="stat-card">
                        <h3>Upcoming Events</h3>
                        <div className="stat-value">3</div>
                    </div>

                    <div className="stat-card">
                        <h3>Total Kids</h3>
                        <div className="stat-value">78</div>
                    </div>

                    <div className="stat-card">
                        <h3>Active Teams</h3>
                        <div className="stat-value">12</div>
                    </div>
                </div>

                <div className="dashboard-sections">
                    <div className="recent-activities">
                        <h2>Recent Activities</h2>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-time">2 hours ago</div>
                                <div className="activity-description">
                                    New user <strong>John Doe</strong> was added.
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-time">Yesterday</div>
                                <div className="activity-description">
                                    Event <strong>Summer Race 2025</strong> was created.
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-time">2 days ago</div>
                                <div className="activity-description">
                                    <strong>5 new photos</strong> were added to the gallery.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="upcoming-events">
                        <h2>Upcoming Events</h2>
                        <div className="events-list">
                            <div className="event-item">
                                <div className="event-date">May 20, 2025</div>
                                <div className="event-name">Summer Race 2025</div>
                                <div className="event-location">Jerusalem City Park</div>
                            </div>
                            <div className="event-item">
                                <div className="event-date">June 15, 2025</div>
                                <div className="event-name">Beach Racing Day</div>
                                <div className="event-location">Tel Aviv Beach</div>
                            </div>
                            <div className="event-item">
                                <div className="event-date">July 10, 2025</div>
                                <div className="event-name">Mountain Challenge</div>
                                <div className="event-location">Haifa Mountains</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default AdminDashboardPage;