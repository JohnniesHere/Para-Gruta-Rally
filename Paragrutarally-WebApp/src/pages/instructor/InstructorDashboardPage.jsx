// src/pages/instructor/InstructorEventsPage.jsx - COMPLETE TRANSLATION SUPPORT
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useTheme } from '../../contexts/ThemeContext';
import Dashboard from '../../components/layout/Dashboard';
import ParentEventModal from '../../components/modals/ParentEventModal';
import {
    IconCalendar as Calendar,
    IconEye as Eye,
    IconSearch as Search,
    IconFilter as Filter,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconUsers as Users,
    IconUsersGroup as Team,
    IconActivity as Activity,
    IconRefresh as RefreshCw,
    IconEraser as Eraser,
    IconFile as FileSpreadsheet,
    IconX as X,
    IconPhoto as Photo
} from '@tabler/icons-react';

const InstructorEventsPage = () => {
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();
    const { isDarkMode, appliedTheme } = useTheme();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [myTeamFilter, setMyTeamFilter] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load instructor's events and teams
    const fetchEvents = async () => {
        const instructorId = user?.uid || userData?.id;

        if (!instructorId || userRole !== 'instructor') {
            setError(t('instructor.accessDenied', 'Access denied: Instructor credentials required'));
            setLoading(false);
            return;
        }

        try {
            setError('');
            setLoading(true);

            // Load instructor's teams using the correct field name
            const teamsQuery = query(
                collection(db, 'teams'),
                where('instructorIds', 'array-contains', instructorId)
            );

            const teamsSnapshot = await getDocs(teamsQuery);
            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));


            // Load all events (using same structure as ParentEventPage)
            const eventsQuery = query(
                collection(db, 'events')
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            const allEvents = [];

            eventsSnapshot.forEach((doc) => {
                const data = doc.data();
                allEvents.push({
                    id: doc.id,
                    name: data.name || t('events.unnamedEvent', 'Unnamed Event'),
                    description: data.description || t('events.noDescription', 'No description available'),
                    location: data.location || t('events.locationTBD', 'Location TBD'),
                    address: data.address || '',
                    date: data.date || data.eventDate || t('events.dateTBD', 'Date TBD'), // Support both field names
                    time: data.time || '',
                    status: data.status || 'upcoming',
                    notes: data.notes || '',
                    organizer: data.organizer || '',
                    type: data.type || 'race',
                    participatingTeams: data.participatingTeams || [],
                    hasGalleryFolder: data.hasGalleryFolder || false,
                    galleryFolderPath: data.galleryFolderPath || null,
                    price: data.price || null,
                    currency: data.currency || null,
                    registrationOpen: data.registrationOpen || false,
                    registrationDeadline: data.registrationDeadline || null,
                    contactEmail: data.contactEmail || '',
                    contactPhone: data.contactPhone || '',
                    requirements: data.requirements || '',
                    weatherDependent: data.weatherDependent || false,
                    backupPlan: data.backupPlan || '',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    image: data.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
                    // Additional fields for compatibility
                    eventDate: data.eventDate || data.date,
                    maxParticipants: data.maxParticipants,
                    currentParticipants: data.currentParticipants
                });
            });

            // Sort events by date in memory
            allEvents.sort((a, b) => {
                const dateA = new Date(a.eventDate || a.date || a.createdAt || 0);
                const dateB = new Date(b.eventDate || b.date || b.createdAt || 0);
                return dateB - dateA; // Newest first
            });



            setEvents(allEvents);
            setFilteredEvents(allEvents);
            setTeams(teamsData);
        } catch (err) {
            console.error('Error loading instructor events:', err);
            setError(t('instructor.failedToLoad', 'Failed to load events. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [userData, userRole, user]);

    // Filter events based on search and filters (same as ParentEventPage)
    useEffect(() => {
        const results = events.filter(event => {
            const matchesSearch =
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.organizer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'upcoming' && event.status === 'upcoming') ||
                (statusFilter === 'completed' && event.status === 'completed') ||
                (statusFilter === 'ongoing' && event.status === 'ongoing');

            const now = new Date();
            const eventDate = new Date(event.date || event.eventDate);
            let matchesDate = true;

            if (dateFilter === 'upcoming') {
                matchesDate = eventDate > now;
            } else if (dateFilter === 'past') {
                matchesDate = eventDate < now;
            }

            // New: Filter by my team participation
            const matchesMyTeam = myTeamFilter === 'all' ||
                (myTeamFilter === 'myteams' && hasMyTeamsInEvent(event)) ||
                (myTeamFilter === 'other' && !hasMyTeamsInEvent(event));

            return matchesSearch && matchesStatus && matchesDate && matchesMyTeam;
        });

        setFilteredEvents(results);
    }, [searchTerm, statusFilter, dateFilter, myTeamFilter, events, teams]);

    // Get instructor's teams in this event
    const getMyTeamsInEvent = (event) => {
        if (!event.participatingTeams) return [];
        return teams.filter(team => event.participatingTeams.includes(team.id));
    };

    // Handle viewing gallery for an event
    const handleViewGallery = (event) => {
        if (event.hasGalleryFolder) {
            navigate(`/gallery/${event.id}`);
        } else {
            alert(t('events.noGalleryFolder', 'This event does not have a gallery folder.'));
        }
    };

    // Check if instructor has teams in this event
    const hasMyTeamsInEvent = (event) => {
        if (!event.participatingTeams || teams.length === 0) return false;
        return teams.some(team => event.participatingTeams.includes(team.id));
    };

    // Get event status based on date
    const getEventStatus = (event) => {
        const now = new Date();
        const eventDate = new Date(event.date || event.eventDate);

        if (eventDate < now) return 'past';
        if (eventDate.toDateString() === now.toDateString()) return 'today';
        return 'upcoming';
    };

    // Format date for display (same as ParentEventPage)
    const formatDate = (dateString) => {
        if (!dateString || dateString === t('events.dateTBD', 'Date TBD')) return dateString;

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Format time for display
    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString;
    };

    // Get event type display name
    const getEventTypeDisplay = (type) => {
        switch (type) {
            case 'race':
                return t('events.typeRace', 'Race');
            case 'newcomers':
                return t('events.typeNewcomers', 'Newcomers');
            case 'social':
                return t('events.typeSocial', 'Social');
            default:
                return type;
        }
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter('all');
        setMyTeamFilter('all');
    };

    // Calculate stats
    const stats = {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => getEventStatus(e) === 'upcoming').length,
        pastEvents: events.filter(e => getEventStatus(e) === 'past').length,
        myTeams: teams.length,
        myTeamEvents: events.filter(e => hasMyTeamsInEvent(e)).length
    };

    // Handle stat card clicks to filter events
    const handleStatCardClick = (filterType) => {
        switch (filterType) {
            case 'total':
                setStatusFilter('all');
                setDateFilter('all');
                setMyTeamFilter('all');
                break;
            case 'upcoming':
                setDateFilter('upcoming');
                setStatusFilter('all');
                setMyTeamFilter('all');
                break;
            case 'past':
                setDateFilter('past');
                setStatusFilter('all');
                setMyTeamFilter('all');
                break;
            case 'myteams':
                setMyTeamFilter('myteams');
                setStatusFilter('all');
                setDateFilter('all');
                break;
            default:
                break;
        }
        setSearchTerm('');
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
                        <button onClick={fetchEvents} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            {t('common.tryAgain', 'Try Again')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard userRole={userRole}>
            <div className={`parent-event-page ${appliedTheme}-mode`}>
                <h1>
                    <Calendar className="page-title-icon" size={48} />
                    {t('nav.events', 'My Events')}
                </h1>

                <div className="parent-event-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        <div className="header-info">
                            <h2>{t('instructor.eventsManagement', 'Events Management')}</h2>
                            <p className="header-subtitle">
                                {t('instructor.manageTeamEvents', 'View and track events involving your teams')}
                            </p>
                        </div>

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={fetchEvents}>
                                <RefreshCw className="btn-icon" size={18} />
                                {t('common.refresh', 'Refresh')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div
                            className={`stat-card total clickable ${statusFilter === 'all' && dateFilter === 'all' && myTeamFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('total')}
                        >
                            <Calendar className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('stats.totalEvents', 'TOTAL EVENTS')}</h3>
                                <div className="stat-value">{stats.totalEvents}</div>
                                <div className="stat-subtitle">{t('instructor.allAvailableEvents', 'All Available Events')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card upcoming clickable ${dateFilter === 'upcoming' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('upcoming')}
                        >
                            <Activity className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('events.upcoming', 'UPCOMING')}</h3>
                                <div className="stat-value">{stats.upcomingEvents}</div>
                                <div className="stat-subtitle">{t('instructor.futureEvents', 'Future Events')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card teams clickable ${myTeamFilter === 'myteams' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('myteams')}
                        >
                            <Team className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('instructor.myTeamEvents', 'MY TEAMS')}</h3>
                                <div className="stat-value">{stats.myTeamEvents}</div>
                                <div className="stat-subtitle">{t('instructor.eventsWithMyTeams', 'Events with My Teams')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="search-filter-section-row">
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder={t('events.searchEvents', 'Search events...')}
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-container">
                            <select
                                className="filter-select"
                                value={myTeamFilter}
                                onChange={(e) => setMyTeamFilter(e.target.value)}
                            >
                                <option value="all">{t('instructor.allEvents', 'All Events')}</option>
                                <option value="myteams">{t('instructor.eventsWithMyTeams', 'Events with My Teams')}</option>
                                <option value="other">{t('instructor.otherEvents', 'Other Events')}</option>
                            </select>
                        </div>

                        <div className="filter-container">
                            <select
                                className="filter-select"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="all">{t('events.allDates', 'All Dates')}</option>
                                <option value="upcoming">{t('events.upcoming', 'Upcoming')}</option>
                                <option value="past">{t('events.past', 'Past')}</option>
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            {t('common.clearAll', 'Clear All')}
                        </button>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        <FileSpreadsheet className="results-icon" size={18} />
                        {t('events.showing', 'Showing')} {filteredEvents.length} {t('events.of', 'of')} {events.length} {t('events.events', 'events')}
                        {statusFilter !== 'all' && <span className="filter-applied"> • {t('events.status', 'Status')}: {statusFilter}</span>}
                        {dateFilter !== 'all' && <span className="filter-applied"> • {t('common.timeframe', 'Timeframe')}: {dateFilter}</span>}
                        {myTeamFilter !== 'all' && <span className="filter-applied"> • {t('instructor.teamFilter', 'Team Filter')}: {myTeamFilter === 'myteams' ? t('instructor.myTeams', 'My Teams') : t('instructor.otherEvents', 'Other Events')}</span>}
                        {searchTerm && <span className="search-applied"> • {t('common.search', 'Search')}: "{searchTerm}"</span>}
                    </div>

                    {/* Events Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Calendar className="table-header-icon" size={16} />{t('events.eventInfo', 'Event Info')}</th>
                                <th className="date-time-header">📅 {t('events.dateTime', 'DATE & TIME')}</th>
                                <th><MapPin className="table-header-icon" size={16} />{t('events.location', 'Location')}</th>
                                <th><Team className="table-header-icon" size={16} />{t('instructor.myTeams', 'MY TEAMS')}</th>
                                <th className="status-header">📊 {t('events.status', 'Status')}</th>
                                <th className="actions-header">⚡ {t('common.actions', 'Actions')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <Calendar className="empty-icon" size={60} />
                                            <h3>{t('events.noEventsFound', 'No Events Found')}</h3>
                                            <p>
                                                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || myTeamFilter !== 'all'
                                                    ? t('events.noEventsMatchFilter', 'No events match your current filter')
                                                    : t('events.noEventsAvailable', 'No events are currently available')
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map(event => {
                                    const myTeams = getMyTeamsInEvent(event);
                                    const eventStatus = getEventStatus(event);
                                    const hasMyTeams = hasMyTeamsInEvent(event);

                                    return (
                                        <tr key={event.id} className={hasMyTeams ? 'has-my-teams' : ''}>
                                            <td>
                                                <div className="event-info">
                                                    <img src={event.image} alt={event.name} className="event-image" />
                                                    <div className="event-details">
                                                        <div className="event-name">
                                                            {hasMyTeams && (
                                                                <span className="my-team-indicator" title={t('instructor.myTeamsParticipating', 'My teams are participating')}>
                                                                    🏁
                                                                </span>
                                                            )}
                                                            {event.name}
                                                            {event.hasGalleryFolder && (
                                                                <Photo size={14} className="gallery-indicator" title={t('events.hasGallery', 'Has Gallery')} />
                                                            )}
                                                        </div>
                                                        <div className="event-type">
                                                            {getEventTypeDisplay(event.type)}
                                                        </div>
                                                        <div className="event-description">
                                                            {event.description.length > 40
                                                                ? `${event.description.substring(0, 40)}...`
                                                                : event.description
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-time-info">
                                                    <div className="event-date">{formatDate(event.date)}</div>
                                                    {event.time && (
                                                        <div className="event-time">{formatTime(event.time)}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="location-info">
                                                    <div className="location-name">{event.location}</div>
                                                    {event.address && (
                                                        <div className="location-address">{event.address}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="teams-info">
                                                    {myTeams.length > 0 ? (
                                                        myTeams.map(team => (
                                                            <span key={team.id} className="badge success team-badge">
                                                                {team.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="no-teams-text">
                                                            {t('instructor.noTeamsInEvent', 'None')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${event.status || eventStatus}`}>
                                                    {(event.status || eventStatus) === 'upcoming' && t('events.upcoming', 'Upcoming')}
                                                    {(event.status || eventStatus) === 'completed' && t('events.completed', 'Completed')}
                                                    {(event.status || eventStatus) === 'ongoing' && t('events.ongoing', 'Ongoing')}
                                                    {(event.status || eventStatus) === 'past' && t('events.past', 'Past')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons-enhanced">
                                                    <button
                                                        className="btn-action view"
                                                        onClick={() => {
                                                            setSelectedEvent(event);
                                                            setIsModalOpen(true);
                                                        }}
                                                        title={t('events.viewDetails', 'View Details')}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {event.hasGalleryFolder && (
                                                        <button
                                                            className="btn-action gallery"
                                                            onClick={() => handleViewGallery(event)}
                                                            title={t('events.viewGallery', 'View Gallery')}
                                                        >
                                                            <Photo size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Event Details Modal */}
                <ParentEventModal
                    event={selectedEvent}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedEvent(null);
                    }}
                />
            </div>
        </Dashboard>
    );
};

export default InstructorEventsPage;