// src/pages/instructor/InstructorEventsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import {
    IconCalendar as Calendar,
    IconEye as Eye,
    IconSearch as Search,
    IconFilter as Filter,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconUsers as Users,
    IconUsersGroup as Team,
    IconActivity as Activity
} from '@tabler/icons-react';

const InstructorEventsPage = () => {
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();

    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Load instructor's events and teams
    useEffect(() => {
        const loadInstructorEvents = async () => {
            if (!userData?.instructorId || userRole !== 'instructor') {
                setError('Access denied: Instructor credentials required');
                setLoading(false);
                return;
            }

            try {
                setError('');

                // Load instructor's teams first
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorId', '==', userData.instructorId),
                    orderBy('name', 'asc')
                );
                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Load all events and filter for those involving instructor's teams
                const eventsQuery = query(
                    collection(db, 'events'),
                    orderBy('eventDate', 'desc')
                );
                const eventsSnapshot = await getDocs(eventsQuery);
                const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter events that include instructor's teams
                const instructorEvents = allEvents.filter(event =>
                    teamsData.some(team => event.participatingTeams?.includes(team.id))
                );

                setEvents(instructorEvents);
                setTeams(teamsData);
            } catch (err) {
                console.error('Error loading instructor events:', err);
                setError('Failed to load events. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadInstructorEvents();
    }, [userData, userRole]);

    // Filter events based on search and filters
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch = searchTerm === '' ||
                event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === '' || event.status === statusFilter;

            const now = new Date();
            const eventDate = new Date(event.eventDate);
            let matchesDate = true;

            if (dateFilter === 'upcoming') {
                matchesDate = eventDate > now;
            } else if (dateFilter === 'past') {
                matchesDate = eventDate < now;
            } else if (dateFilter === 'today') {
                const today = new Date();
                matchesDate = eventDate.toDateString() === today.toDateString();
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [events, searchTerm, statusFilter, dateFilter]);

    // Get team names for an event
    const getEventTeamNames = (event) => {
        if (!event.participatingTeams) return [];
        return event.participatingTeams
            .map(teamId => teams.find(t => t.id === teamId)?.name)
            .filter(Boolean);
    };

    // Get instructor's teams in this event
    const getMyTeamsInEvent = (event) => {
        if (!event.participatingTeams) return [];
        return teams.filter(team => event.participatingTeams.includes(team.id));
    };

    // Get event status
    const getEventStatus = (event) => {
        const now = new Date();
        const eventDate = new Date(event.eventDate);

        if (eventDate < now) return 'past';
        if (eventDate.toDateString() === now.toDateString()) return 'today';
        return 'upcoming';
    };

    // Get unique statuses for filter
    const eventStatuses = [...new Set(events.map(e => e.status).filter(Boolean))];

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

    // Count events by status
    const upcomingEvents = events.filter(e => getEventStatus(e) === 'upcoming').length;
    const pastEvents = events.filter(e => getEventStatus(e) === 'past').length;
    const todayEvents = events.filter(e => getEventStatus(e) === 'today').length;

    return (
        <Dashboard userRole={userRole}>
            <div className="admin-page">
                <h1>
                    <Calendar className="page-title-icon" size={48} />
                    {t('instructor.events', 'My Events')}
                </h1>

                <div className="admin-container">
                    {/* Racing Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <Calendar size={40} />
                                    {t('instructor.eventsManagement', 'Events Management')}
                                </h1>
                                <p className="subtitle">
                                    {t('instructor.manageTeamEvents', 'View and track events involving your teams')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <Calendar size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.totalEvents', 'Total Events')}</h3>
                                <div className="stat-value">{events.length}</div>
                                <div className="stat-subtitle">{t('stats.involvingYourTeams', 'Involving Your Teams')}</div>
                            </div>
                        </div>

                        <div className="stat-card instructors">
                            <div className="stat-icon">
                                <Activity size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.upcoming', 'Upcoming')}</h3>
                                <div className="stat-value">{upcomingEvents}</div>
                                <div className="stat-subtitle">{t('stats.futureEvents', 'Future Events')}</div>
                            </div>
                        </div>

                        <div className="stat-card parents">
                            <div className="stat-icon">
                                <Clock size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.today', 'Today')}</h3>
                                <div className="stat-value">{todayEvents}</div>
                                <div className="stat-subtitle">{t('stats.todaysEvents', 'Today\'s Events')}</div>
                            </div>
                        </div>

                        <div className="stat-card teams">
                            <div className="stat-icon">
                                <Team size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.myTeams', 'My Teams')}</h3>
                                <div className="stat-value">{teams.length}</div>
                                <div className="stat-subtitle">{t('stats.participating', 'Participating')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="search-filter-section">
                        <div className="search-container">
                            <label className="search-label">
                                <Search size={16} />
                                {t('common.search', 'Search')}
                            </label>
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder={t('events.searchPlaceholder', 'Search by name, location, or description...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        className="clear-search"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Filter size={16} />
                                {t('common.status', 'Status')}
                            </label>
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">{t('common.allStatuses', 'All Statuses')}</option>
                                {eventStatuses.map(status => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Calendar size={16} />
                                {t('common.timeframe', 'Timeframe')}
                            </label>
                            <select
                                className="filter-select"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="">{t('common.allDates', 'All Dates')}</option>
                                <option value="upcoming">{t('events.upcoming', 'Upcoming')}</option>
                                <option value="today">{t('events.today', 'Today')}</option>
                                <option value="past">{t('events.past', 'Past')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Summary */}
                    {(searchTerm || statusFilter || dateFilter) && (
                        <div className="results-summary">
                            <span>{t('common.showing', 'Showing')} {filteredEvents.length} {t('common.results', 'results')}</span>
                            {searchTerm && <span className="search-applied">for "{searchTerm}"</span>}
                            {statusFilter && <span className="filter-applied">status: {statusFilter}</span>}
                            {dateFilter && <span className="filter-applied">timeframe: {dateFilter}</span>}
                        </div>
                    )}

                    {/* Events Display */}
                    {filteredEvents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Calendar size={80} />
                            </div>
                            <h3>{t('instructor.noEventsFound', 'No Events Found')}</h3>
                            <p>
                                {searchTerm || statusFilter || dateFilter
                                    ? t('instructor.noEventsMatchFilter', 'No events match your current filter')
                                    : t('instructor.noEventsForTeams', 'Your teams are not participating in any events yet')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                            {filteredEvents.map(event => {
                                const eventStatus = getEventStatus(event);
                                const myTeams = getMyTeamsInEvent(event);
                                const eventDate = new Date(event.eventDate);

                                return (
                                    <div key={event.id} className="card event-card" style={{ padding: '25px' }}>
                                        <div className="card-header">
                                            <Calendar className="card-icon" size={24} />
                                            <h3 className="card-title">{event.name}</h3>
                                            <span className={`status-badge ${
                                                eventStatus === 'upcoming' ? 'pending' :
                                                    eventStatus === 'today' ? 'ready' : 'inactive'
                                            }`}>
                                                {eventStatus}
                                            </span>
                                        </div>

                                        <div className="card-body">
                                            <div style={{ marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <Clock size={16} style={{ color: 'var(--info-color)' }} />
                                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>

                                                {event.location && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <MapPin size={16} style={{ color: 'var(--success-color)' }} />
                                                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                            {event.location}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {event.description && (
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: '15px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {event.description.length > 100
                                                        ? `${event.description.substring(0, 100)}...`
                                                        : event.description
                                                    }
                                                </p>
                                            )}

                                            <div className="my-teams-section" style={{ marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <Team size={16} style={{ color: 'var(--racing-purple)' }} />
                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                        {t('instructor.yourTeamsInEvent', 'Your Teams in This Event')}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {myTeams.length > 0 ? (
                                                        myTeams.map(team => (
                                                            <span key={team.id} className="badge success" style={{ fontSize: '11px' }}>
                                                                {team.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                            {t('instructor.noTeamsInEvent', 'None of your teams')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {event.participatingTeams && event.participatingTeams.length > myTeams.length && (
                                                <div className="other-teams-section" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        <Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                        {event.participatingTeams.length - myTeams.length} other team(s) participating
                                                    </div>
                                                </div>
                                            )}

                                            {event.maxParticipants && (
                                                <div className="capacity-info" style={{ marginBottom: '15px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                            {t('events.capacity', 'Capacity')}
                                                        </span>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            {event.currentParticipants || 0}/{event.maxParticipants}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '6px',
                                                        backgroundColor: 'var(--border-color)',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${Math.min(((event.currentParticipants || 0) / event.maxParticipants) * 100, 100)}%`,
                                                            height: '100%',
                                                            backgroundColor: (event.currentParticipants || 0) >= event.maxParticipants ? 'var(--error-color)' : 'var(--success-color)',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-footer">
                                            <Link
                                                to={`/admin/events/view/${event.id}`}
                                                className="btn btn-info btn-sm"
                                            >
                                                <Eye size={14} />
                                                {t('common.viewDetails', 'View Details')}
                                            </Link>

                                            {eventStatus === 'upcoming' && myTeams.length > 0 && (
                                                <span className="badge info" style={{ fontSize: '11px', marginLeft: 'auto' }}>
                                                    {t('instructor.readyToParticipate', 'Ready to Participate')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="racing-actions" style={{ marginTop: '30px' }}>
                        <Link to="/instructor/teams" className="btn btn-primary">
                            <Team size={18} />
                            {t('instructor.manageTeams', 'Manage Teams')}
                        </Link>
                        <Link to="/instructor/kids" className="btn btn-primary">
                            <Users size={18} />
                            {t('instructor.manageKids', 'Manage Kids')}
                        </Link>
                        <Link to="/instructor/dashboard" className="btn btn-secondary">
                            <Activity size={18} />
                            {t('instructor.backToDashboard', 'Back to Dashboard')}
                        </Link>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorEventsPage;