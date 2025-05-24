// src/pages/instructor/InstructorDashboardPage.jsx
import React from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import './InstructorDashboardPage.css';

const InstructorDashboardPage = () => {
    const { isDarkMode } = useTheme();

    return (
        <Dashboard requiredRole="instructor">
            <div className={`instructor-dashboard ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1>Instructor Dashboard</h1>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <h3>My Events</h3>
                        <div className="stat-value">8</div>
                    </div>

                    <div className="stat-card">
                        <h3>Active Teams</h3>
                        <div className="stat-value">15</div>
                    </div>

                    <div className="stat-card">
                        <h3>Total Participants</h3>
                        <div className="stat-value">124</div>
                    </div>

                    <div className="stat-card">
                        <h3>Upcoming Events</h3>
                        <div className="stat-value">3</div>
                    </div>
                </div>

                <div className="dashboard-sections">
                    <div className="my-events">
                        <h2>My Events</h2>
                        <div className="events-list">
                            <div className="event-item">
                                <div className="event-date">May 25, 2025</div>
                                <div className="event-name">Youth Race Challenge</div>
                                <div className="event-location">Jerusalem Park</div>
                                <div className="event-status">Upcoming</div>
                            </div>
                            <div className="event-item">
                                <div className="event-date">June 2, 2025</div>
                                <div className="event-name">Team Building Race</div>
                                <div className="event-location">Tel Aviv Beach</div>
                                <div className="event-status">Planning</div>
                            </div>
                            <div className="event-item">
                                <div className="event-date">June 10, 2025</div>
                                <div className="event-name">Summer Championship</div>
                                <div className="event-location">Haifa Sports Center</div>
                                <div className="event-status">Upcoming</div>
                            </div>
                        </div>
                    </div>

                    <div className="team-activities">
                        <h2>Team Activities</h2>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-time">1 hour ago</div>
                                <div className="activity-description">
                                    Team <strong>Lightning Bolts</strong> completed training session.
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-time">3 hours ago</div>
                                <div className="activity-description">
                                    New participant <strong>Sarah Cohen</strong> joined Team Thunder.
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-time">Yesterday</div>
                                <div className="activity-description">
                                    Team <strong>Speed Demons</strong> achieved new record time.
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-time">2 days ago</div>
                                <div className="activity-description">
                                    Training schedule updated for <strong>3 teams</strong>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                        <button className="btn-primary">Create New Event</button>
                        <button className="btn-secondary">Manage Teams</button>
                        <button className="btn-secondary">View Reports</button>
                        <button className="btn-secondary">Update Schedule</button>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorDashboardPage;