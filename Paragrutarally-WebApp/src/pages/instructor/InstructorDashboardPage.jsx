// src/pages/instructor/InstructorDashboardPage.jsx - With Debug, Better Error Handling, and Full Translation Support
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
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import InstructorCommentModal from '../../components/modals/InstructorCommentModal';
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
    IconDatabase as Database,
    IconChevronDown as ChevronDown,
    IconChevronUp as ChevronUp,
    IconMessageCircle as MessageCircle,
    IconFileText as FileText,
    IconMapPin as MapPin,
    IconSchool as School,
    IconPhone as Phone,
    IconUser as User,
    IconTrash as Trash
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
    const [expandedKid, setExpandedKid] = useState(null);
    const [commentModalKid, setCommentModalKid] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentUser || !isInstructor) {
                setError(t('instructor.accessDenied', 'Access denied: Instructor credentials required'));
                setLoading(false);
                return;
            }

            try {
                setError('');
                const instructorId = currentUser.uid;
                console.log('Loading data for instructor:', instructorId);

                // Load teams for this instructor - FIXED: Use instructorIds array
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorIds', 'array-contains', instructorId)
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('Found teams:', teams);

                // Load kids for this instructor - FIXED: Use instructorId
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
                setError(t('instructor.failedToLoad', 'Failed to load dashboard data: {error}', { error: err.message }));
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [currentUser, isInstructor, t]);

    // Helper functions
    const getFieldValue = (kid, fieldPath, defaultValue = '-') => {
        const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], kid);
        return value || defaultValue;
    };

    const getTeamName = (teamId) => {
        const team = dashboardData.teams.find(t => t.id === teamId);
        return team ? team.name : t('common.unknownTeam', 'Unknown Team');
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

    const toggleKidExpansion = (kidId) => {
        setExpandedKid(expandedKid === kidId ? null : kidId);
    };

    const handleAddComment = (kid) => {
        setCommentModalKid(kid);
        setShowCommentModal(true);
    };

    const handleCommentSuccess = async (message) => {
        alert(message);
        // Refresh dashboard data to show new comment
        try {
            const instructorId = currentUser.uid;
            const kidsQuery = query(
                collection(db, 'kids'),
                where('instructorId', '==', instructorId)
            );
            const kidsSnapshot = await getDocs(kidsQuery);
            const updatedKids = kidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setDashboardData(prev => ({
                ...prev,
                kids: updatedKids
            }));
        } catch (error) {
            console.error('Error refreshing kids data:', error);
        }
    };

    const handleCommentModalClose = () => {
        setShowCommentModal(false);
        setCommentModalKid(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const handleDeleteComment = async (kidId, commentToDelete) => {
        // Only allow deletion of own comments - FIXED: use currentUser instead of user
        if (commentToDelete.instructorId !== currentUser?.uid) {
            alert(t('instructor.canOnlyDeleteOwnComments', 'You can only delete your own comments'));
            return;
        }

        if (!window.confirm(t('instructor.confirmDeleteComment', 'Are you sure you want to delete this comment?'))) {
            return;
        }

        try {
            // Remove comment from the instructorsComments array
            await updateDoc(doc(db, 'kids', kidId), {
                instructorsComments: arrayRemove(commentToDelete)
            });

            // Refresh kids data to show updated comments
            const instructorId = currentUser.uid;
            const kidsQuery = query(
                collection(db, 'kids'),
                where('instructorId', '==', instructorId)
            );
            const kidsSnapshot = await getDocs(kidsQuery);
            const updatedKids = kidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setDashboardData(prev => ({
                ...prev,
                kids: updatedKids
            }));

            alert(t('instructor.commentDeleted', 'Comment deleted successfully!'));

        } catch (error) {
            console.error('Error deleting comment:', error);
            alert(t('instructor.deleteCommentError', 'Failed to delete comment. Please try again.'));
        }
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
                        {/* Welcome Header - TRANSLATED */}
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

                        {/* No Data Message - TRANSLATED */}
                        <div className="card" style={{ textAlign: 'center', padding: '40px', marginTop: '30px' }}>
                            <Database size={64} style={{ color: '#6c757d', marginBottom: '20px' }} />
                            <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>
                                {t('instructor.noDataFound', 'No Data Found')}
                            </h3>
                            <p style={{ color: '#6c757d', marginBottom: '20px', lineHeight: '1.6' }}>
                                {t('instructor.noDataMessage', 'It looks like you don\'t have any teams or kids assigned yet.')}<br />
                                {t('instructor.couldMean', 'This could mean:')}
                            </p>
                            <ul style={{
                                color: '#6c757d',
                                textAlign: 'left',
                                display: 'inline-block',
                                marginBottom: '30px'
                            }}>
                                <li>{t('instructor.newInstructor', 'You\'re a new instructor and haven\'t been assigned teams yet')}</li>
                                <li>{t('instructor.differentFormat', 'The data in Firestore uses a different instructor ID format')}</li>
                                <li>{t('instructor.collectionsNotExist', 'The collections (teams, kids) don\'t exist in your Firestore database')}</li>
                            </ul>
                            <div>
                                <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                                    <strong>{t('instructor.nextSteps', 'Next Steps:')}</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn btn-primary"
                                    >
                                        {t('instructor.refreshPage', 'Refresh Page')}
                                    </button>
                                    <Link to="/my-account" className="btn btn-secondary">
                                        {t('instructor.viewMyAccount', 'View My Account')}
                                    </Link>
                                    <Link to="/gallery" className="btn btn-secondary">
                                        {t('instructor.viewGallery', 'View Gallery')}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Development Tools - TRANSLATED */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="alert" style={{
                                marginTop: '30px',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '8px',
                                padding: '15px'
                            }}>
                                <h4 style={{ color: '#856404', marginBottom: '10px' }}>
                                    {t('instructor.developmentMode', 'Development Mode')}
                                </h4>
                                <p style={{ color: '#856404', marginBottom: '10px' }}>
                                    {t('instructor.debugHelp', 'The debug component (red box) can help you create sample data for testing.')}
                                </p>
                                <p style={{ color: '#856404', fontSize: '14px' }}>
                                    {t('instructor.instructorId', 'Your instructor ID:')} <code>{currentUser?.uid}</code>
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
                    {/* Welcome Header - TRANSLATED */}
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

                    {/* Main Stats - TRANSLATED */}
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

                    {/* My Kids Section */}
                    {dashboardData.kids.length > 0 && (
                        <div className="dashboard-section" style={{ marginTop: '30px' }}>
                            <div className="section-header" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '20px',
                                paddingBottom: '10px',
                                borderBottom: '2px solid var(--racing-purple)'
                            }}>
                                <Users size={24} style={{ color: 'var(--racing-purple)' }} />
                                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                    {t('instructor.myKids', 'My Kids')} ({dashboardData.kids.length})
                                </h2>
                            </div>

                            <div className="kids-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {dashboardData.kids.map(kid => {
                                    const isExpanded = expandedKid === kid.id;
                                    const kidName = `${getFieldValue(kid, 'personalInfo.firstName')} ${getFieldValue(kid, 'personalInfo.lastName')}`.trim();

                                    return (
                                        <div key={kid.id} className="card kid-card" style={{ padding: '20px' }}>
                                            {/* Kid Header */}
                                            <div
                                                className="kid-header"
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    marginBottom: isExpanded ? '20px' : '0'
                                                }}
                                                onClick={() => toggleKidExpansion(kid.id)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <User size={24} style={{ color: 'var(--racing-purple)' }} />
                                                    <div>
                                                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                                            {kidName || 'Unknown Kid'}
                                                        </h3>
                                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                                                            {t('kids.participantNumber', 'Participant #')}: {getFieldValue(kid, 'participantNumber')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {/* Add Comment Button */}
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddComment(kid);
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <MessageCircle size={14} />
                                                        {t('instructor.addComment', 'Add Comment')}
                                                    </button>

                                                    {/* Status Badge */}
                                                    <span className={`status-badge ${
                                                        getFieldValue(kid, 'signedFormStatus') === 'completed' && getFieldValue(kid, 'signedDeclaration')
                                                            ? 'ready' : 'pending'
                                                    }`}>
                                    {getFieldValue(kid, 'signedFormStatus') === 'completed' && getFieldValue(kid, 'signedDeclaration')
                                        ? t('status.complete', 'Complete')
                                        : t('status.pending', 'Pending')
                                    }
                                </span>

                                                    {/* Expand/Collapse Icon */}
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {/* Expanded Kid Details */}
                                            {isExpanded && (
                                                <div className="kid-details" style={{
                                                    paddingTop: '20px',
                                                    borderTop: '1px solid var(--border-color)'
                                                }}>
                                                    {/* Personal Information */}
                                                    <div className="detail-section" style={{ marginBottom: '25px' }}>
                                                        <h4 style={{
                                                            margin: '0 0 15px 0',
                                                            color: 'var(--text-primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <User size={18} />
                                                            {t('instructor.personalInfo', 'Personal Information')}
                                                        </h4>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                                            gap: '15px'
                                                        }}>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('common.dateOfBirth', 'Date of Birth')}
                                                                </label>
                                                                <div style={{ color: 'var(--text-primary)' }}>
                                                                    {formatDate(getFieldValue(kid, 'personalInfo.dateOfBirth'))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('common.address', 'Address')}
                                                                </label>
                                                                <div style={{ color: 'var(--text-primary)' }}>
                                                                    {getFieldValue(kid, 'personalInfo.address')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('common.capabilities', 'Capabilities')}
                                                                </label>
                                                                <div style={{ color: 'var(--text-primary)' }}>
                                                                    {getFieldValue(kid, 'personalInfo.capabilities') || t('common.none', 'None')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Parent Information */}
                                                    <div className="detail-section" style={{ marginBottom: '25px' }}>
                                                        <h4 style={{
                                                            margin: '0 0 15px 0',
                                                            color: 'var(--text-primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <Phone size={18} />
                                                            {t('instructor.parentInfo', 'Parent Information')}
                                                        </h4>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                                            gap: '15px'
                                                        }}>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('common.parentName', 'Parent Name')}
                                                                </label>
                                                                <div style={{ color: 'var(--text-primary)' }}>
                                                                    {getFieldValue(kid, 'parentInfo.name')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('users.email', 'Email')}
                                                                </label>
                                                                <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                                                    {getFieldValue(kid, 'parentInfo.email')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('users.phone', 'Phone')}
                                                                </label>
                                                                <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                                                    {getFieldValue(kid, 'parentInfo.phone')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Forms Status */}
                                                    <div className="detail-section" style={{ marginBottom: '25px' }}>
                                                        <h4 style={{
                                                            margin: '0 0 15px 0',
                                                            color: 'var(--text-primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <FileText size={18} />
                                                            {t('instructor.formsStatus', 'Forms & Status')}
                                                        </h4>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                            gap: '15px'
                                                        }}>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('common.signedFormStatus', 'Form Status')}
                                                                </label>
                                                                <div>
                                                <span className={`status-badge ${
                                                    getFieldValue(kid, 'signedFormStatus') === 'completed' ? 'ready' : 'pending'
                                                }`}>
                                                    {t(`common.${getFieldValue(kid, 'signedFormStatus', 'pending')}`,
                                                        getFieldValue(kid, 'signedFormStatus', 'pending'))}
                                                </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('common.declaration', 'Declaration')}
                                                                </label>
                                                                <div>
                                                <span className={`status-badge ${
                                                    getFieldValue(kid, 'signedDeclaration') ? 'ready' : 'pending'
                                                }`}>
                                                    {getFieldValue(kid, 'signedDeclaration')
                                                        ? t('viewKid.signed', 'Signed')
                                                        : t('viewKid.pending', 'Pending')
                                                    }
                                                </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Comments & Additional Info */}
                                                    <div className="detail-section">
                                                        <h4 style={{
                                                            margin: '0 0 15px 0',
                                                            color: 'var(--text-primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <MessageCircle size={18} />
                                                            {t('instructor.commentsAndNotes', 'Comments & Notes')}
                                                        </h4>

                                                        {/* Additional Comments */}
                                                        {getFieldValue(kid, 'additionalComments') && (
                                                            <div style={{ marginBottom: '15px' }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('instructor.additionalComments', 'Additional Comments')}
                                                                </label>
                                                                <div style={{
                                                                    color: 'var(--text-primary)',
                                                                    background: 'var(--bg-tertiary)',
                                                                    padding: '10px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid var(--border-color)'
                                                                }}>
                                                                    {getFieldValue(kid, 'additionalComments')}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Instructor Comments */}
                                                        {kid.instructorsComments && kid.instructorsComments.length > 0 && (
                                                            <div>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                                    {t('instructor.instructorComments', 'Instructor Comments')} ({kid.instructorsComments.length})
                                                                </label>
                                                                <div style={{ marginTop: '8px' }}>
                                                                    {/* Sort comments by timestamp (most recent first) */}
                                                                    {[...(kid.instructorsComments || [])].sort((a, b) => {
                                                                        const timeA = a.timestamp?.seconds || 0;
                                                                        const timeB = b.timestamp?.seconds || 0;
                                                                        return timeB - timeA; // Descending order (newest first)
                                                                    }).map((comment, index) => {
                                                                        const isOwnComment = comment.instructorId === currentUser?.uid; // FIXED: use currentUser

                                                                        return (
                                                                            <div key={comment.id || index} style={{
                                                                                background: isOwnComment ? 'rgba(139, 69, 255, 0.05)' : 'var(--bg-tertiary)',
                                                                                padding: '12px',
                                                                                borderRadius: '6px',
                                                                                border: isOwnComment ? '1px solid var(--racing-purple)' : '1px solid var(--border-color)',
                                                                                borderLeft: isOwnComment ? '4px solid var(--racing-purple)' : '1px solid var(--border-color)',
                                                                                marginBottom: '8px'
                                                                            }}>
                                                                                <div style={{
                                                                                    fontSize: '13px',
                                                                                    color: 'var(--text-secondary)',
                                                                                    marginBottom: '6px',
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center'
                                                                                }}>
                            <span>
                                {comment.instructorName || 'Instructor'}
                                {isOwnComment && (
                                    <span style={{ color: 'var(--racing-purple)', fontWeight: '500', marginLeft: '4px' }}>
                                        ({t('instructor.you', 'You')})
                                    </span>
                                )}
                            </span>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>
                                    {comment.timestamp?.toDate ?
                                        comment.timestamp.toDate().toLocaleDateString() :
                                        'Unknown date'
                                    }
                                </span>
                                                                                        {isOwnComment && (
                                                                                            <button
                                                                                                style={{
                                                                                                    background: 'none',
                                                                                                    border: 'none',
                                                                                                    color: 'var(--error-color)',
                                                                                                    cursor: 'pointer',
                                                                                                    padding: '4px',
                                                                                                    borderRadius: '3px',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    transition: 'background-color 0.2s ease'
                                                                                                }}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleDeleteComment(kid.id, comment);
                                                                                                }}
                                                                                                onMouseEnter={(e) => {
                                                                                                    e.target.style.backgroundColor = 'var(--error-light)';
                                                                                                }}
                                                                                                onMouseLeave={(e) => {
                                                                                                    e.target.style.backgroundColor = 'transparent';
                                                                                                }}
                                                                                                title={t('instructor.deleteComment', 'Delete Comment')}
                                                                                            >
                                                                                                <Trash size={12} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ color: 'var(--text-primary)' }}>
                                                                                    {comment.comment}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Comment Modal */}
                    <InstructorCommentModal
                        kid={commentModalKid}
                        isOpen={showCommentModal}
                        onClose={handleCommentModalClose}
                        onSuccess={handleCommentSuccess}
                    />
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorDashboardPage;