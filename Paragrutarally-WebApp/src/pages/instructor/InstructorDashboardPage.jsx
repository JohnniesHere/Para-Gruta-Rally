// src/pages/instructor/InstructorDashboardPage.jsx - With Debug and Better Error Handling
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
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import FirestoreInstructorDebug from '../../components/debug/FirestoreInstructionDebug'; // Add this
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
    IconAlertTriangle as Alert,
    IconDatabase as Database
} from '@tabler/icons-react';

const InstructorDashboardPage = () => {
    const { currentUser, userRole, userData, isInstructor } = useAuth();
    const { permissions } = usePermissions();
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
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentUser || !isInstructor) {
                setError('Access denied: Instructor credentials required');
                setLoading(false);
                return;
            }

            try {
                setError('');
                const instructorId = currentUser.uid;
                console.log('Loading data for instructor:', instructorId);

                // Load teams for this instructor
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorId', '==', instructorId)
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('Found teams:', teams);

                // Load kids for this instructor
                const kidsQuery = query(
                    collection(db, 'kids'),
                    where('instructorId', '==', instructorId)
                );
                const kidsSnapshot = await getDocs(kidsQuery);
                const kids = kidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('Found kids:', kids);

                // Load all vehicles to filter by team assignments
                let vehicles = [];
                try {
                    const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
                    const allVehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    vehicles = allVehicles.filter(vehicle =>
                        teams.some(team => vehicle.assignedTeams?.includes(team.id))
                    );
                    console.log('Found vehicles:', vehicles);
                } catch (vehicleError) {
                    console.warn('Error loading vehicles:', vehicleError);
                    // Continue without vehicles
                }

                // Load events involving instructor's teams
                let events = [];
                try {
                    const eventsSnapshot = await getDocs(collection(db, 'events'));
                    const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    events = allEvents.filter(event =>
                        teams.some(team => event.participatingTeams?.includes(team.id))
                    ).slice(0, 5);
                    console.log('Found events:', events);
                } catch (eventError) {
                    console.warn('Error loading events:', eventError);
                    // Continue without events
                }

                setDashboardData({
                    teams,
                    kids,
                    vehicles,
                    events,
                    recentActivity: kids.slice(0, 5)
                });

                setDataLoaded(true);

            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError(`Failed to load dashboard data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [currentUser, isInstructor]);

    // Helper functions
    const getFieldValue = (item, fieldPath, defaultValue = '-') => {
        const context = { kidData: item, userData, user: currentUser };

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
                    <FirestoreInstructorDebug />
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h4>Debug Information:</h4>
                            <p><strong>User ID:</strong> {currentUser?.uid}</p>
                            <p><strong>Email:</strong> {currentUser?.email}</p>
                            <p><strong>Is Instructor:</strong> {isInstructor ? 'Yes' : 'No'}</p>
                            <p><strong>User Role:</strong> {userRole}</p>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    // Check if we have no data at all
    const hasNoData = dataLoaded &&
        dashboardData.teams.length === 0 &&
        dashboardData.kids.length === 0;

    if (hasNoData) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <FirestoreInstructorDebug />

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
                                        {t('common.welcome', 'Welcome')}, {userData?.displayName || currentUser?.displayName || 'Instructor'}!
                                    </h1>
                                    <p className="subtitle">
                                        {t('instructor.dashboardSubtitle', 'Manage your teams, kids, and vehicles')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* No Data Message */}
                        <div className="card" style={{ textAlign: 'center', padding: '40px', marginTop: '30px' }}>
                            <Database size={64} style={{ color: '#6c757d', marginBottom: '20px' }} />
                            <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>
                                No Data Found
                            </h3>
                            <p style={{ color: '#6c757d', marginBottom: '20px', lineHeight: '1.6' }}>
                                It looks like you don't have any teams or kids assigned yet.<br />
                                This could mean:
                            </p>
                            <ul style={{
                                color: '#6c757d',
                                textAlign: 'left',
                                display: 'inline-block',
                                marginBottom: '30px'
                            }}>
                                <li>You're a new instructor and haven't been assigned teams yet</li>
                                <li>The data in Firestore uses a different instructor ID format</li>
                                <li>The collections (teams, kids) don't exist in your Firestore database</li>
                            </ul>
                            <div>
                                <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                                    <strong>Next Steps:</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn btn-primary"
                                    >
                                        Refresh Page
                                    </button>
                                    <Link to="/my-account" className="btn btn-secondary">
                                        View My Account
                                    </Link>
                                    <Link to="/gallery" className="btn btn-secondary">
                                        View Gallery
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Development Tools */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="alert" style={{
                                marginTop: '30px',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '8px',
                                padding: '15px'
                            }}>
                                <h4 style={{ color: '#856404', marginBottom: '10px' }}>
                                    Development Mode
                                </h4>
                                <p style={{ color: '#856404', marginBottom: '10px' }}>
                                    The debug component (red box) can help you create sample data for testing.
                                </p>
                                <p style={{ color: '#856404', fontSize: '14px' }}>
                                    Your instructor ID: <code>{currentUser?.uid}</code>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Dashboard>
        );
    }

    // Normal dashboard with data
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
                                    {t('common.welcome', 'Welcome')}, {userData?.displayName || currentUser?.displayName || 'Instructor'}!
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

                        <Link to="/instructor/vehicles" className="stat-card instructors clickable">
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

                    {/* Rest of your dashboard content... */}
                    {/* (The rest remains the same as your original component) */}
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorDashboardPage;