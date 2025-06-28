// src/pages/admin/AdminDashboardPage.jsx - Enhanced with Translation Support
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVehicleStats } from '../../services/vehicleService';
import {
    IconUsers as Users,
    IconCalendarEvent as Calendar,
    IconUserCircle as Kids,
    IconUsersGroup as Teams,
    IconCar
} from '@tabler/icons-react';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t, isRTL } = useLanguage();
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalUsers: 0,
            totalKids: 0,
            activeTeams: 0,
            upcomingEventsCount: 0,
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

    const handleNavigateToVehicles = () => {
        navigate('/admin/vehicles');
    };

    // Format time ago utility
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return t('general.loading', 'Loading...');

        const now = new Date();
        const eventTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInMilliseconds = now - eventTime;
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return t('dashboard.justNow', 'Just now');
        if (diffInMinutes < 60) {
            return t('dashboard.minutesAgo', '{count} minute{plural} ago', {
                count: diffInMinutes,
                plural: diffInMinutes > 1 ? 's' : ''
            });
        }
        if (diffInHours < 24) {
            return t('dashboard.hoursAgo', '{count} hour{plural} ago', {
                count: diffInHours,
                plural: diffInHours > 1 ? 's' : ''
            });
        }
        return t('dashboard.daysAgo', '{count} day{plural} ago', {
            count: diffInDays,
            plural: diffInDays > 1 ? 's' : ''
        });
    };

    // Format event date utility
    const formatEventDate = (dateString) => {
        if (!dateString || dateString === 'Date TBD') return t('events.dateTBD', 'Date TBD');

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
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
                    totalVehicles: 0,
                    activeVehicles: 0,
                    vehiclesInUse: 0,
                    availableVehicles: 0
                },
                upcomingEvents: [],
                recentActivities: []
            };

            // Array to collect all recent activities
            const allActivities = [];

            // Fetch events
            const eventsQuery = query(
                collection(db, 'events'),
                orderBy('createdAt', 'desc')
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            const allEvents = [];

            eventsSnapshot.forEach((doc) => {
                const eventData = doc.data();
                const event = {
                    id: doc.id,
                    name: eventData.name || t('events.unnamedEvent', 'Unnamed Event'),
                    description: eventData.description || t('events.noDescription', 'No description available'),
                    location: eventData.location || t('events.locationTBD', 'Location TBD'),
                    date: eventData.date || t('events.dateTBD', 'Date TBD'),
                    participants: eventData.attendees || 0,
                    status: eventData.status || 'upcoming',
                    createdAt: eventData.createdAt,
                    updatedAt: eventData.updatedAt
                };
                allEvents.push(event);

                // Add event creation activity
                if (eventData.createdAt) {
                    allActivities.push({
                        timestamp: eventData.createdAt,
                        icon: '📅',
                        description: t('dashboard.event', 'Event') + ` <strong>${event.name}</strong> ` + t('dashboard.wasCreated', 'was created') + '.',
                        type: 'event_created'
                    });
                }

                // Add event update activity if it was updated recently
                if (eventData.updatedAt && eventData.updatedAt !== eventData.createdAt) {
                    allActivities.push({
                        timestamp: eventData.updatedAt,
                        icon: '📝',
                        description: t('dashboard.event', 'Event') + ` <strong>${event.name}</strong> ` + t('dashboard.wasUpdated', 'was updated') + '.',
                        type: 'event_updated'
                    });
                }
            });

            // Filter upcoming events
            const now = new Date();
            const upcomingEvents = allEvents.filter(event => {
                if (event.status === 'upcoming' && event.date !== t('events.dateTBD', 'Date TBD')) {
                    const eventDate = new Date(event.date);
                    return eventDate >= now;
                }
                return event.status === 'upcoming';
            });

            data.stats.upcomingEventsCount = upcomingEvents.length;
            data.upcomingEvents = upcomingEvents.slice(0, 5);

            // Fetch users with recent activity tracking
            try {
                const usersQuery = query(
                    collection(db, 'users'),
                    orderBy('createdAt', 'desc')
                );
                const usersSnapshot = await getDocs(usersQuery);
                data.stats.totalUsers = usersSnapshot.size;

                // Add user activities
                usersSnapshot.forEach((doc) => {
                    const userData = doc.data();

                    // User creation activity
                    if (userData.createdAt) {
                        allActivities.push({
                            timestamp: userData.createdAt,
                            icon: '👤',
                            description: t('dashboard.newUser', 'New user') + ` <strong>${userData.displayName || userData.email || 'Unknown'}</strong> ` + t('dashboard.wasAdded', 'was added') + '.',
                            type: 'user_created'
                        });
                    }

                    // User update activity
                    if (userData.updatedAt && userData.updatedAt !== userData.createdAt) {
                        allActivities.push({
                            timestamp: userData.updatedAt,
                            icon: '👤',
                            description: t('dashboard.user', 'User') + ` <strong>${userData.displayName || userData.email || 'Unknown'}</strong> ` + t('dashboard.wasUpdated', 'was updated') + '.',
                            type: 'user_updated'
                        });
                    }
                });
            } catch (userError) {
                console.warn('Could not fetch users:', userError);
                data.stats.totalUsers = 5;
            }

            // Fetch kids with recent activity tracking
            try {
                const kidsQuery = query(
                    collection(db, 'kids'),
                    orderBy('createdAt', 'desc')
                );
                const kidsSnapshot = await getDocs(kidsQuery);
                data.stats.totalKids = kidsSnapshot.size;

                // Add kid activities
                kidsSnapshot.forEach((doc) => {
                    const kidData = doc.data();

                    // Kid creation activity
                    if (kidData.createdAt) {
                        allActivities.push({
                            timestamp: kidData.createdAt,
                            icon: '👶',
                            description: t('dashboard.newKid', 'New kid') + ` <strong>${kidData.personalInfo.firstName || 'Unknown'} ${kidData.personalInfo.lastName || ''}</strong> ` + t('dashboard.wasAdded', 'was added') + '.',
                            type: 'kid_created'
                        });
                    }

                    // Kid update activity
                    if (kidData.updatedAt && kidData.updatedAt !== kidData.createdAt) {
                        allActivities.push({
                            timestamp: kidData.updatedAt,
                            icon: '👶',
                            description: t('dashboard.kid', 'Kid') + ` <strong>${kidData.personalInfo.firstName || 'Unknown'} ${kidData.personalInfo.lastName || ''}</strong> ` + t('dashboard.wasUpdated', 'was updated') + '.',
                            type: 'kid_updated'
                        });
                    }
                });
            } catch (kidError) {
                console.warn('Could not fetch kids:', kidError);
                data.stats.totalKids = 1;
            }

            // Fetch teams with recent activity tracking
            try {
                const teamsQuery = query(
                    collection(db, 'teams'),
                    orderBy('createdAt', 'desc')
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                data.stats.activeTeams = teamsSnapshot.size;

                // Add team activities
                teamsSnapshot.forEach((doc) => {
                    const teamData = doc.data();

                    // Team creation activity
                    if (teamData.createdAt) {
                        allActivities.push({
                            timestamp: teamData.createdAt,
                            icon: '👥',
                            description: t('dashboard.teamCreated', 'Team <strong>{teamName}</strong> was created.', {
                                teamName: teamData.name || 'Unknown Team'
                            }),
                            type: 'team_created'
                        });
                    }

                    // Team update activity
                    if (teamData.updatedAt && teamData.updatedAt !== teamData.createdAt) {
                        allActivities.push({
                            timestamp: teamData.updatedAt,
                            icon: '👥',
                            description: t('dashboard.team', 'Team') + ` <strong>${teamData.name || 'Unknown Team'}</strong> ` + t('dashboard.wasUpdated', 'was updated') + '.',
                            type: 'team_updated'
                        });
                    }
                });
            } catch (teamError) {
                console.warn('Could not fetch teams:', teamError);
                data.stats.activeTeams = 2;
            }

            // Fetch vehicles with recent activity tracking
            try {
                const vehiclesQuery = query(
                    collection(db, 'vehicles'),
                    orderBy('createdAt', 'desc')
                );
                const vehiclesSnapshot = await getDocs(vehiclesQuery);

                // Get vehicle stats
                const vehicleStats = await getVehicleStats();

                data.stats.totalVehicles = vehicleStats.total;
                data.stats.activeVehicles = vehicleStats.active;
                data.stats.vehiclesInUse = vehicleStats.inUse;
                data.stats.availableVehicles = vehicleStats.available;

                // Add vehicle activities
                vehiclesSnapshot.forEach((doc) => {
                    const vehicleData = doc.data();

                    // Vehicle creation activity
                    if (vehicleData.createdAt) {
                        allActivities.push({
                            timestamp: vehicleData.createdAt,
                            icon: '🏎️',
                            description: t('dashboard.newVehicle', 'New vehicle') + ` <strong>${vehicleData.name || vehicleData.model || 'Unknown Vehicle'}</strong> ` + t('dashboard.wasAdded', 'was added') + '.',
                            type: 'vehicle_created'
                        });
                    }

                    // Vehicle update activity
                    if (vehicleData.updatedAt && vehicleData.updatedAt !== vehicleData.createdAt) {
                        allActivities.push({
                            timestamp: vehicleData.updatedAt,
                            icon: '🏎️',
                            description: t('dashboard.vehicle', 'Vehicle') + ` <strong>${vehicleData.name || vehicleData.model || 'Unknown Vehicle'}</strong> ` + t('dashboard.wasUpdated', 'was updated') + '.',
                            type: 'vehicle_updated'
                        });
                    }

                    // Vehicle status change activities
                    if (vehicleData.statusChangedAt) {
                        const statusIcon = vehicleData.status === 'active' ? '✅' : vehicleData.status === 'maintenance' ? '🔧' : '❌';
                        allActivities.push({
                            timestamp: vehicleData.statusChangedAt,
                            icon: statusIcon,
                            description: t('dashboard.vehicle', 'Vehicle') + ` <strong>${vehicleData.name || vehicleData.model || 'Unknown Vehicle'}</strong> ` +
                                t('dashboard.statusChanged', 'status changed to') + ` <strong>${vehicleData.status}</strong>.`,
                            type: 'vehicle_status_changed'
                        });
                    }
                });
            } catch (vehicleError) {
                console.warn('Could not fetch vehicles:', vehicleError);
                data.stats.totalVehicles = 0;
                data.stats.activeVehicles = 0;
                data.stats.vehiclesInUse = 0;
                data.stats.availableVehicles = 0;
            }

            // Sort all activities by timestamp (most recent first)
            allActivities.sort((a, b) => {
                const timeA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const timeB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return timeB - timeA;
            });

            // Filter activities from the last 30 days and take top 10
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentActivities = allActivities.filter(activity => {
                const activityTime = activity.timestamp.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp);
                return activityTime >= thirtyDaysAgo;
            }).slice(0, 10);

            data.recentActivities = recentActivities;

            // If no recent activities, add some helpful mock data
            if (data.recentActivities.length === 0) {
                data.recentActivities = [
                    {
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        icon: '🏁',
                        description: t('dashboard.welcomeMessage', 'Welcome to your racing dashboard! Activities will appear here as you use the system.'),
                        type: 'system_message'
                    }
                ];
            }

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
                setError(t('dashboard.fetchError', 'Failed to load dashboard data. Please try again.'));
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [t]);

    // Refresh data every 5 minutes
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getDashboardData();
                setDashboardData(data);
            } catch (err) {
                console.error('Error refreshing dashboard data:', err);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <Dashboard requiredRole="admin">
                <div className={`admin-page admin-dashboard ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <h1>
                        <Teams size={32} className="page-title-icon" />
                        {t('dashboard.title', 'Admin Dashboard')}
                    </h1>
                    <div className="admin-container">
                        <div className="error-container">
                            <h3>{t('common.error', 'Oops! Something went wrong')}</h3>
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                            >
                                {t('teams.tryAgain', 'Retry')}
                            </button>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole="admin">
            <div className={`admin-page admin-dashboard ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Page Title */}
                <h1>
                    <Teams size={32} className="page-title-icon" />
                    {t('dashboard.title', 'Admin Dashboard')}
                </h1>

                {/* Main Container */}
                <div className="admin-container">
                    {/* Stats Grid - Enhanced with 5 cards */}
                    <div className="stats-grid dashboard-stats">
                        <div
                            className={`stat-card total clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToUsers}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToUsers()}
                        >
                            <Users className="stat-icon" size={40}/>
                            <div className="stat-content">
                                <h3>{t('dashboard.totalUsers', 'Total Users')}</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.totalUsers
                                    )}
                                </div>
                                <div className="stat-subtitle">{t('dashboard.systemUsers', 'System Users')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card admins clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToEvents}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToEvents()}
                        >
                            <Calendar className="stat-icon" size={40}/>
                            <div className="stat-content">
                                <h3>{t('dashboard.upcomingEvents', 'Upcoming Events')}</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.upcomingEventsCount
                                    )}
                                </div>
                                <div className="stat-subtitle">{t('dashboard.scheduled', 'Scheduled')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card kids clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToKids}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToKids()}
                        >
                            <Kids className="stat-icon" size={40}/>
                            <div className="stat-content">
                                <h3>{t('dashboard.totalKids', 'Total Kids')}</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.totalKids
                                    )}
                                </div>
                                <div className="stat-subtitle">{t('dashboard.registered', 'Registered')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card teams clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToTeams}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToTeams()}
                        >
                            <Teams className="stat-icon" size={40}/>
                            <div className="stat-content">
                                <h3>{t('dashboard.activeTeams', 'Active Teams')}</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.activeTeams
                                    )}
                                </div>
                                <div className="stat-subtitle">{t('dashboard.racingReady', 'Racing Ready')}</div>
                            </div>
                        </div>

                        {/* Racing Vehicles Card */}
                        <div
                            className={`stat-card vehicles clickable ${isLoading ? 'loading' : ''}`}
                            onClick={handleNavigateToVehicles}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToVehicles()}
                        >
                            <IconCar className="stat-icon" size={40}/>
                            <div className="stat-content">
                                <h3>{t('dashboard.racingVehicles', 'Racing Vehicles')}</h3>
                                <div className="stat-value">
                                    {isLoading ? (
                                        <div className="loading-skeleton">--</div>
                                    ) : (
                                        dashboardData.stats.totalVehicles
                                    )}
                                </div>
                                <div className="stat-subtitle">
                                    {dashboardData.stats.availableVehicles} {t('dashboard.available', 'Available')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Sections */}
                    <div className="dashboard-sections">
                        <div className="recent-activities">
                            <h2>{t('dashboard.recentActivities', 'Recent Activities')}</h2>
                            <div className="activity-list">
                                {isLoading ? (
                                    [...Array(3)].map((_, index) => (
                                        <div key={index} className="activity-item loading">
                                            <div className="activity-time loading-skeleton">{t('general.loading', 'Loading...')}</div>
                                            <div className="activity-description loading-skeleton">
                                                {t('general.loading', 'Loading...')}...
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
                                                <span dangerouslySetInnerHTML={{__html: activity.description}}/>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <p>{t('dashboard.noRecentActivities', 'No recent activities found.')}</p>
                                        <small>{t('dashboard.activitiesWillAppear', 'Activities will appear here as users interact with the system.')}</small>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="upcoming-events">
                            <h2>{t('dashboard.upcomingEvents', 'Upcoming Events')}</h2>
                            <div className="events-list">
                                {isLoading ? (
                                    <>
                                        <div className="event-headers">
                                            <div className="event-header-date">📅 {t('events.date', 'Date')}</div>
                                            <div className="event-header-name">🎯 {t('events.eventName', 'Event Name')}</div>
                                            <div className="event-header-location">📍 {t('events.location', 'Location')}</div>
                                        </div>
                                        {[...Array(3)].map((_, index) => (
                                            <div key={index} className="event-item loading">
                                                <div className="event-date loading-skeleton">{t('general.loading', 'Loading...')}</div>
                                                <div className="event-name loading-skeleton">{t('general.loading', 'Loading...')}...
                                                </div>
                                                <div className="event-location loading-skeleton">{t('general.loading', 'Loading...')}...
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : dashboardData.upcomingEvents.length > 0 ? (
                                    <>
                                        <div className="event-headers">
                                            <div className="event-header-date">📅 {t('events.date', 'Date')}</div>
                                            <div className="event-header-name">🎯 {t('events.eventName', 'Event Name')}</div>
                                            <div className="event-header-location">📍 {t('events.location', 'Location')}</div>
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
                                        <p>{t('dashboard.noUpcomingEvents', 'No upcoming events scheduled.')}</p>
                                        <small>{t('dashboard.createFirstEvent', 'Create your first event to get started!')}</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Refresh indicator */}
                    <div className="refresh-info">
                        <small>{t('dashboard.autoRefresh', 'Dashboard updates automatically every 5 minutes')}</small>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default AdminDashboardPage;