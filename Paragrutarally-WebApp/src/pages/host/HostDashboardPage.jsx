// src/pages/host/HostDashboardPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import './HostDashboardPage.css';

const HostDashboardPage = () => {
    const { isDarkMode } = useTheme();

    return (
        <Dashboard requiredRole="host">
            <div className={`host-dashboard ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1>Host Dashboard</h1>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <h3>Events Hosted</h3>
                        <div className="stat-value">12</div>
                    </div>

                    <div className="stat-card">
                        <h3>Total Attendees</h3>
                        <div className="stat-value">286</div>
                    </div>

                    <div className="stat-card">
                        <h3>Upcoming Events</h3>
                        <div className="stat-value">4</div>
                    </div>

                    <div className="stat-card">
                        <h3>Venues Managed</h3>
                        <div className="stat-value">6</div>
                    </div>
                </div>

                <div className="dashboard-sections">
                    <div className="event-management">
                        <h2>Event Management</h2>
                        <div className="events-list">
                            <div className="event-item">
                                <div className="event-info">
                                    <div className="event-name">Spring Racing Festival</div>
                                    <div className="event-date">May 28, 2025</div>
                                    <div className="event-location">Yarkon Park, Tel Aviv</div>
                                </div>
                                <div className="event-actions">
                                    <span className="event-status active">Active</span>
                                    <button className="btn-small">Manage</button>
                                </div>
                            </div>

                            <div className="event-item">
                                <div className="event-info">
                                    <div className="event-name">Charity Fun Run</div>
                                    <div className="event-date">June 5, 2025</div>
                                    <div className="event-location">Independence Park, Jerusalem</div>
                                </div>
                                <div className="event-actions">
                                    <span className="event-status planning">Planning</span>
                                    <button className="btn-small">Manage</button>
                                </div>
                            </div>

                            <div className="event-item">
                                <div className="event-info">
                                    <div className="event-name">Beach Marathon</div>
                                    <div className="event-date">June 12, 2025</div>
                                    <div className="event-location">Gordon Beach, Tel Aviv</div>
                                </div>
                                <div className="event-actions">
                                    <span className="event-status upcoming">Upcoming</span>
                                    <button className="btn-small">Manage</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="venue-status">
                        <h2>Venue Status</h2>
                        <div className="venue-list">
                            <div className="venue-item">
                                <div className="venue-name">Yarkon Park - Main Field</div>
                                <div className="venue-status available">Available</div>
                                <div className="venue-capacity">Capacity: 200 people</div>
                            </div>

                            <div className="venue-item">
                                <div className="venue-name">Independence Park - Track</div>
                                <div className="venue-status occupied">In Use</div>
                                <div className="venue-capacity">Capacity: 150 people</div>
                            </div>

                            <div className="venue-item">
                                <div className="venue-name">Gordon Beach - North Section</div>
                                <div className="venue-status maintenance">Maintenance</div>
                                <div className="venue-capacity">Capacity: 300 people</div>
                            </div>

                            <div className="venue-item">
                                <div className="venue-name">Haifa Sports Center</div>
                                <div className="venue-status available">Available</div>
                                <div className="venue-capacity">Capacity: 500 people</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-sections">
                    <div className="recent-bookings">
                        <h2>Recent Bookings</h2>
                        <div className="booking-list">
                            <div className="booking-item">
                                <div className="booking-time">Today, 2:30 PM</div>
                                <div className="booking-description">
                                    New booking for <strong>Community Race Day</strong> at Yarkon Park
                                </div>
                            </div>
                            <div className="booking-item">
                                <div className="booking-time">Yesterday, 4:15 PM</div>
                                <div className="booking-description">
                                    Venue confirmation for <strong>Youth Athletics</strong> event
                                </div>
                            </div>
                            <div className="booking-item">
                                <div className="booking-time">2 days ago</div>
                                <div className="booking-description">
                                    Equipment request updated for <strong>Beach Marathon</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="host-tools">
                        <h2>Host Tools</h2>
                        <div className="tool-buttons">
                            <button className="tool-btn">
                                <span className="tool-icon">📅</span>
                                <span className="tool-text">Schedule Event</span>
                            </button>
                            <button className="tool-btn">
                                <span className="tool-icon">🏟️</span>
                                <span className="tool-text">Manage Venues</span>
                            </button>
                            <button className="tool-btn">
                                <span className="tool-icon">📊</span>
                                <span className="tool-text">View Reports</span>
                            </button>
                            <button className="tool-btn">
                                <span className="tool-icon">⚙️</span>
                                <span className="tool-text">Event Settings</span>
                            </button>
                            <button className="tool-btn">
                                <span className="tool-icon">📧</span>
                                <span className="tool-text">Send Notifications</span>
                            </button>
                            <button className="tool-btn">
                                <span className="tool-icon">📋</span>
                                <span className="tool-text">Participant List</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default HostDashboardPage;