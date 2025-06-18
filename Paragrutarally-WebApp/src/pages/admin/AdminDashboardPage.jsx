// src/pages/admin/AdminDashboardPage.jsx - Enhanced with Vehicle Statistics
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVehicleStats } from '../../services/vehicleService'; // ADDED: Vehicle service
import {
    IconUsers as Users,
    IconCalendarEvent as Calendar,
    IconUserCircle as Kids,
    IconUsersGroup as Teams,
    IconCar // ADDED: Vehicle icon
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
            upcomingEventsCount: 0,
            // ADDED: Vehicle statistics
            totalVehicles: 0,
            activeVehicles: 0,
            vehiclesInUse: 0,
            availableVehicles: 0
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

    // ADDED: Navigation handler for vehicles
    const handleNavigateToVehicles = () => {
        navigate('/admin/vehicles');
    };

    // Format time ago utility
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Unknown time';

        const now = new Date();
        const eventTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInMilliseconds = now - eventTime;
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    // Format event date utility
    const formatEventDate = (dateString) => {
        if (!dateString || dateString === 'Date TBD') return dateString;

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Fetch dashboard data from Firestore
    const getDashboardData = async () => {
        try {
            const data = {
                stats: {
                    totalUsers: 0,
                    totalKids: 0,
                    activeTeams: 0,
                    upcomingEventsCount: 0,
                    // ADDED: Vehicle statistics
                    totalVehicles: 0,
                    activeVehicles: 0,
                    vehiclesInUse: 0,
                    availableVehicles: 0
                },
                upcomingEvents: [],
                recentActivities: []
            };

            // Fetch events
            const eventsQuery = query(
                collection(db, 'events'),
                orderBy('createdAt', 'desc')
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            const allEvents = [];

            eventsSnapshot.forEach((doc) => {
                const eventData = doc.data();
                allEvents.push({
                    id: doc.id,
                    name: eventData.name || 'Unnamed Event',
                    description: eventData.description || 'No description available',
                    location: eventData.location || 'Location TBD',
                    date: eventData.date || 'Date TBD',
                    participants: eventData.attendees || 0,
                    status: eventData.status || 'upcoming',
                    createdAt: eventData.createdAt,
                    updatedAt: eventData.updatedAt
                });
            });

            // Filter upcoming events
            const now = new Date();
            const upcomingEvents = allEvents.filter(event => {
                if (event.status === 'upcoming' && event.date !== 'Date TBD') {
                    const eventDate = new Date(event.date);
                    return eventDate >= now;
                }
                return event.status === 'upcoming';
            });

            data.stats.upcomingEventsCount = upcomingEvents.length;
            data.upcomingEvents = upcomingEvents.slice(0, 5); // Show only first 5

            // Fetch users
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                data.stats.totalUsers = usersSnapshot.size;
            } catch (userError) {
                console.warn('Could not fetch users:', userError);
                // Use mock data if users collection doesn't exist
                data.stats.totalUsers = 5;
            }

            // Fetch kids
            try {
                const kidsSnapshot = await getDocs(collection(db, 'kids'));
                data.stats.totalKids = kidsSnapshot.size;
            } catch (kidError) {
                console.warn('Could not fetch kids:', kidError);
                // Use mock data if kids collection doesn't exist
                data.stats.totalKids = 1;
            }

            // Fetch teams
            try {
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                data.stats.activeTeams = teamsSnapshot.size;
            } catch (teamError) {
                console.warn('Could not fetch teams:', teamError);
                // Use mock data if teams collection doesn't exist
                data.stats.activeTeams = 2;
            }

            // ADDED: Fetch vehicles
            try {
                const vehicleStats = await getVehicleStats();
                console.log('✅ Vehicle stats loaded:', vehicleStats);
                data.stats.totalVehicles = vehicleStats.total;
                data.stats.activeVehicles = vehicleStats.active;
                data.stats.vehiclesInUse = vehicleStats.inUse;
                data.stats.availableVehicles = vehicleStats.available;
            } catch (vehicleError) {
                console.warn('Could not fetch vehicles:', vehicleError);
                // Use mock data if vehicles collection doesn't exist or fails
                data.stats.totalVehicles = 0;
                data.stats.activeVehicles = 0;
                data.stats.vehiclesInUse = 0;
                data.stats.availableVehicles = 0;
            }

            // Generate recent activities based on actual data
            data.recentActivities = [];

            // Add event creation activities
            allEvents.slice(0, 3).forEach(event => {
                if (event.createdAt) {
                    data.recentActivities.push({
                        timestamp: event.createdAt,
                        icon: '📅',
                        description: `Event <strong>${event.name}</strong> was created.`
                    });
                }
            });

            // Add some mock activities if we don't have enough real ones
            if (data.recentActivities.length < 3) {
                const mockActivities = [
                    {
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                        icon: '👤',
                        description: 'User <strong>instructorTest</strong> was updated.'
                    },
                    {
                        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
                        icon: '👥',
                        description: 'Team <strong>testName</strong> was created.'
                    },
                    {
                        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                        icon: '👤',
                        description: 'New user <strong>parentTest</strong> was added.'
                    }
                ];

                // Fill with mock activities up to 5 total
                data.recentActivities = [...data.recentActivities, ...mockActivities].slice(0, 5);
            }

            // Sort activities by timestamp
            data.recentActivities.sort((a, b) => {
                const timeA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const timeB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return timeB - timeA;
            });

            return data;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
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
                    {/* Stats Grid - ENHANCED with 5 cards */}
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

                        {/* ADDED: Racing Vehicles Card */}
                        <div
                            className={`stat-card vehicles clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToVehicles}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToVehicles()}
                        >
                            <IconCar className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Racing Vehicles</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.totalVehicles
                                    )}
                                </div>
                                <div className="stat-subtitle">
                                    {dashboardData.stats.availableVehicles} Available
                                </div>
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
                                    <>
                                        <div className="event-headers">
                                            <div className="event-header-date">📅 Date</div>
                                            <div className="event-header-name">🎯 Event Name</div>
                                            <div className="event-header-location">📍 Location</div>
                                        </div>
                                        {[...Array(3)].map((_, index) => (
                                            <div key={index} className="event-item loading">
                                                <div className="event-date loading-skeleton">Loading...</div>
                                                <div className="event-name loading-skeleton">Loading event...</div>
                                                <div className="event-location loading-skeleton">Loading location...</div>
                                            </div>
                                        ))}
                                    </>
                                ) : dashboardData.upcomingEvents.length > 0 ? (
                                    <>
                                        <div className="event-headers">
                                            <div className="event-header-date">📅 Date</div>
                                            <div className="event-header-name">🎯 Event Name</div>
                                            <div className="event-header-location">📍 Location</div>
                                        </div>
                                        {dashboardData.upcomingEvents.slice(0, 5).map((event) => (
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
                                        ))}
                                    </>
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