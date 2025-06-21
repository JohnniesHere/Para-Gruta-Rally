// src/pages/instructor/InstructorDashboardPage.jsx - Enhanced with Full Management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import {
    IconDashboard as DashboardIcon,
    IconUsers as Users,
    IconUsersGroup as Team,
    IconCar as Car,
    IconCalendar as Calendar,
    IconEye as Eye,
    IconEdit as Edit,
    IconPlus as Plus,
    IconActivity as Activity,
    IconClock as Clock,
    IconAlertTriangle as Alert
} from '@tabler/icons-react';

const InstructorDashboardPage = () => {
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();

    const [dashboardData, setDashboardData] = useState({
        teams: [],
        kids: [],
        vehicles: [],
        events: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!userData?.instructorId || userRole !== 'instructor') {
                setError('Access denied: Instructor credentials required');
                setLoading(false);
                return;
            }

            try {
                setError('');

                // Load teams for this instructor
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorId', '==', userData.instructorId),
                    orderBy('name', 'asc')
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Load kids for this instructor
                const kidsQuery = query(
                    collection(db, 'kids'),
                    where('instructorId', '==', userData.instructorId),
                    orderBy('createdAt', 'desc')
                );
                const kidsSnapshot = await getDocs(kidsQuery);
                const kids = kidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Load vehicles assigned to instructor's teams
                const vehiclesQuery = query(collection(db, 'vehicles'), orderBy('name', 'asc'));
                const vehiclesSnapshot = await getDocs(vehiclesQuery);
                const allVehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const vehicles = allVehicles.filter(vehicle =>
                    teams.some(team => vehicle.assignedTeams?.includes(team.id))
                );

                // Load recent events involving instructor's teams
                const eventsQuery = query(
                    collection(db, 'events'),
                    orderBy('eventDate', 'desc'),
                    limit(10)
                );
                const eventsSnapshot = await getDocs(eventsQuery);
                const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const events = allEvents.filter(event =>
                    teams.some(team => event.participatingTeams?.includes(team.id))
                );

                setDashboardData({
                    teams,
                    kids,
                    vehicles,
                    events: events.slice(0, 5), // Recent 5 events
                    recentActivity: kids.slice(0, 5) // Recent 5 kids
                });

            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [userData, userRole]);

    // Helper functions
    const getFieldValue = (item, fieldPath, defaultValue = '-') => {
        const context = { kidData: item, userData, user };

        if (!permissions.canViewField(fieldPath, context)) {
            return '***';
        }

        const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], item);
        return value || defaultValue;
    };

    const getTeamName = (teamId) => {
        const team = dashboardData.teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const getUpcomingEvents = () => {
        const now = new Date();
        return dashboardData.events.filter(event => new Date(event.eventDate) > now);
    };

    const getPendingKids = () => {
        return dashboardData.kids.filter(kid =>
            kid.signedFormStatus !== 'completed' || !kid.signedDeclaration
        );
    };

    if (loading) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading', 'Loading...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const upcomingEvents = getUpcomingEvents();
    const pendingKids = getPendingKids();

    return (
        <Dashboard userRole={userRole}>
            <div className="admin-page">
                <h1>
                    <DashboardIcon className="page-title-icon" size={48} />
                    {t('instructor.dashboard', 'Instructor Dashboard')}
                </h1>

                <div className="admin-container">
                    {/* Welcome Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <DashboardIcon size={40} />
                                    {t('common.welcome', 'Welcome')}, {userData?.displayName || user?.displayName || t('instructor.instructor', 'Instructor')}!
                                </h1>
                                <p className="subtitle">
                                    {t('instructor.dashboardSubtitle', 'Manage your teams, kids, and vehicles')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Stats */}
                    <div className="stats-grid">
                        <Link to="/instructor/teams" className="stat-card teams clickable">
                            <div className="stat-icon">
                                <Team size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.myTeams', 'My Teams')}</h3>
                                <div className="stat-value">{dashboardData.teams.length}</div>
                                <div className="stat-subtitle">{t('stats.managed', 'Managed')}</div>
                            </div>
                        </Link>

                        <Link to="/instructor/kids" className="stat-card kids clickable">
                            <div className="stat-icon">
                                <Users size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.myKids', 'My Kids')}</h3>
                                <div className="stat-value">{dashboardData.kids.length}</div>
                                <div className="stat-subtitle">{t('stats.totalMembers', 'Total Members')}</div>
                            </div>
                        </Link>

                        <Link to="/admin/vehicles" className="stat-card instructors clickable">
                            <div className="stat-icon">
                                <Car size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.myVehicles', 'My Vehicles')}</h3>
                                <div className="stat-value">{dashboardData.vehicles.length}</div>
                                <div className="stat-subtitle">{t('stats.assigned', 'Assigned')}</div>
                            </div>
                        </Link>

                        <div className="stat-card parents">
                            <div className="stat-icon">
                                <Calendar size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.upcomingEvents', 'Upcoming Events')}</h3>
                                <div className="stat-value">{upcomingEvents.length}</div>
                                <div className="stat-subtitle">{t('stats.involvingYourTeams', 'Involving Your Teams')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {pendingKids.length > 0 && (
                        <div className="alert warning-alert">
                            <Alert size={20} />
                            <span>
                                You have {pendingKids.length} kids with pending forms or missing declarations
                            </span>
                            <Link to="/instructor/kids" className="btn btn-warning btn-sm" style={{ marginLeft: 'auto' }}>
                                {t('common.review', 'Review')}
                            </Link>
                        </div>
                    )}

                    {/* Main Content Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }}>

                        {/* Recent Kids Activity */}
                        <div className="card">
                            <div className="card-header">
                                <Activity className="card-icon" size={24} />
                                <h3 className="card-title">{t('instructor.recentKids', 'Recent Kids')}</h3>
                                <Link to="/instructor/kids" className="btn btn-primary btn-sm">
                                    {t('common.viewAll', 'View All')}
                                </Link>
                            </div>
                            <div className="card-body">
                                {dashboardData.recentActivity.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                                        {t('instructor.noRecentKids', 'No recent kids activity')}
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {dashboardData.recentActivity.map(kid => (
                                            <div key={kid.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {getFieldValue(kid, 'personalInfo.firstName')} {getFieldValue(kid, 'personalInfo.lastName')}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {getTeamName(kid.teamId)} • #{getFieldValue(kid, 'participantNumber')}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span className={`status-badge ${kid.signedFormStatus === 'completed' ? 'ready' : 'pending'}`}>
                                                        {getFieldValue(kid, 'signedFormStatus', 'pending')}
                                                    </span>
                                                    <Link
                                                        to={`/instructor/kids/view/${kid.id}`}
                                                        className="btn-action view"
                                                        title={t('common.view', 'View')}
                                                    >
                                                        <Eye size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="card">
                            <div className="card-header">
                                <Calendar className="card-icon" size={24} />
                                <h3 className="card-title">{t('instructor.upcomingEvents', 'Upcoming Events')}</h3>
                            </div>
                            <div className="card-body">
                                {upcomingEvents.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                                        {t('instructor.noUpcomingEvents', 'No upcoming events')}
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {upcomingEvents.map(event => (
                                            <div key={event.id} style={{
                                                padding: '12px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>
                                                    {event.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                                    <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                    {new Date(event.eventDate).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    {event.location || 'Location TBD'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Teams Overview */}
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div className="card-header">
                            <Team className="card-icon" size={24} />
                            <h3 className="card-title">{t('instructor.myTeamsOverview', 'My Teams Overview')}</h3>
                            <Link to="/instructor/teams" className="btn btn-primary btn-sm">
                                {t('common.manageAll', 'Manage All')}
                            </Link>
                        </div>
                        <div className="card-body">
                            {dashboardData.teams.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                                    {t('instructor.noTeamsAssigned', 'No teams assigned yet')}
                                </p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                    {dashboardData.teams.map(team => {
                                        const teamKids = dashboardData.kids.filter(kid => kid.teamId === team.id);
                                        return (
                                            <div key={team.id} style={{
                                                padding: '15px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{team.name}</h4>
                                                    <span className={`status-badge ${team.status || 'active'}`}>
                                                        {team.status || 'active'}
                                                    </span>
                                                </div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        <Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                        {teamKids.length} members
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <Link
                                                        to={`/instructor/teams/view/${team.id}`}
                                                        className="btn btn-info btn-sm"
                                                        style={{ flex: 1, textAlign: 'center' }}
                                                    >
                                                        <Eye size={14} />
                                                        {t('common.view', 'View')}
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="racing-actions" style={{ marginTop: '30px' }}>
                        <Link to="/instructor/kids" className="btn btn-primary">
                            <Users size={18} />
                            {t('instructor.manageKids', 'Manage Kids')}
                        </Link>
                        <Link to="/instructor/teams" className="btn btn-primary">
                            <Team size={18} />
                            {t('instructor.manageTeams', 'Manage Teams')}
                        </Link>
                        <Link to="/admin/vehicles" className="btn btn-primary">
                            <Car size={18} />
                            {t('instructor.manageVehicles', 'Manage Vehicles')}
                        </Link>
                        <Link to="/gallery" className="btn btn-secondary">
                            <Calendar size={18} />
                            {t('instructor.viewGallery', 'View Gallery')}
                        </Link>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorDashboardPage;