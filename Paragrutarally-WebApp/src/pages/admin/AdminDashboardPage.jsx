// src/pages/admin/AdminDashboardPage.jsx - Updated for Global Theme System
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { getDashboardData, formatTimeAgo, formatEventDate } from '../../services/dashboardService';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconUsers as Users,
    IconCalendarEvent as Calendar,
    IconUserCircle as Kids,
    IconUsersGroup as Teams
} from '@tabler/icons-react';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const {t, isRTL } = useLanguage();
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalUsers: 0,
            totalKids: 0,
            activeTeams: 0,
            upcomingEventsCount: 0
        },
        upcomingEvents: [],
        recentActivities: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Navigation handlers for stat cards
    const handleNavigateToUsers = () => {
        navigate('/admin/users');
    };

    const handleNavigateToEvents = () => {
        navigate('/admin/events');
    };

    const handleNavigateToKids = () => {
        navigate('/admin/kids');
    };

    const handleNavigateToTeams = () => {
        navigate('/admin/teams');
    };

    // Load dashboard data on component mount
    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getDashboardData();
                setDashboardData(data);
            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    // Refresh data every 5 minutes
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getDashboardData();
                setDashboardData(data);
            } catch (err) {
                console.error('Error refreshing dashboard data:', err);
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <Dashboard requiredRole="admin">
                <div className={`admin-page admin-dashboard ${appliedTheme}-mode`}>
                    <h1>
                        <Teams size={32} className="page-title-icon" />
                        Admin Dashboard
                    </h1>
                    <div className="admin-container">
                        <div className="error-container">
                            <h3>Oops! Something went wrong</h3>
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole="admin">
            <div className={`admin-page admin-dashboard ${appliedTheme}-mode`}>
                {/* Page Title - Outside container */}
                <h1>
                    <Teams size={32} className="page-title-icon" />
                    Admin Dashboard
                </h1>

                {/* Main Container */}
                <div className="admin-container">
                    {/* Stats Grid */}
                    <div className="stats-grid dashboard-stats">
                        <div
                            className={`stat-card total clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToUsers}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToUsers()}
                        >
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Users</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.totalUsers
                                    )}
                                </div>
                                <div className="stat-subtitle">System Users</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card admins clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToEvents}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToEvents()}
                        >
                            <Calendar className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Upcoming Events</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.upcomingEventsCount
                                    )}
                                </div>
                                <div className="stat-subtitle">Scheduled</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card kids clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToKids}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToKids()}
                        >
                            <Kids className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Kids</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.totalKids
                                    )}
                                </div>
                                <div className="stat-subtitle">Registered</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card teams clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToTeams}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToTeams()}
                        >
                            <Teams className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Active Teams</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.activeTeams
                                    )}
                                </div>
                                <div className="stat-subtitle">Racing Ready</div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Sections */}
                    <div className="dashboard-sections">
                        <div className="recent-activities">
                            <h2>Recent Activities</h2>
                            <div className="activity-list">
                                {isLoading ? (
                                    // Loading skeleton for activities
                                    [...Array(3)].map((_, index) => (
                                        <div key={index} className="activity-item loading">
                                            <div className="activity-time loading-skeleton">Loading...</div>
                                            <div className="activity-description loading-skeleton">
                                                Loading activity...
                                            </div>
                                        </div>
                                    ))
                                ) : dashboardData.recentActivities.length > 0 ? (
                                    dashboardData.recentActivities.map((activity, index) => (
                                        <div key={index} className="activity-item">
                                            <div className="activity-time">
                                                {formatTimeAgo(activity.timestamp)}
                                            </div>
                                            <div className="activity-description">
                                                <span className="activity-icon">{activity.icon}</span>
                                                <span dangerouslySetInnerHTML={{ __html: activity.description }} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <p>No recent activities found.</p>
                                        <small>Activities will appear here as users interact with the system.</small>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="upcoming-events">
                            <h2>Upcoming Events</h2>
                            <div className="events-list">
                                {isLoading ? (
                                    // Loading skeleton for events
                                    [...Array(3)].map((_, index) => (
                                        <div key={index} className="event-item loading">
                                            <div className="event-date loading-skeleton">Loading...</div>
                                            <div className="event-name loading-skeleton">Loading event...</div>
                                            <div className="event-location loading-skeleton">Loading location...</div>
                                        </div>
                                    ))
                                ) : dashboardData.upcomingEvents.length > 0 ? (
                                    dashboardData.upcomingEvents.slice(0, 5).map((event) => (
                                        <div key={event.id} className="event-item">
                                            <div className="event-date">
                                                {formatEventDate(event.date)}
                                            </div>
                                            <div className="event-name">
                                                {event.name}
                                            </div>
                                            <div className="event-location">
                                                {event.location}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <p>No upcoming events scheduled.</p>
                                        <small>Create your first event to get started!</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Refresh indicator */}
                    <div className="refresh-info">
                        <small>Dashboard updates automatically every 5 minutes</small>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default AdminDashboardPage;