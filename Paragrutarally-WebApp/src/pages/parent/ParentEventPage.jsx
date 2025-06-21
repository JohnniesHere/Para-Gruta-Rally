// src/pages/parent/ParentEventPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import ParentEventModal from '../../components/modals/ParentEventModal'; // Import the modal
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    IconRefresh as RefreshCw,
    IconFilter as Filter,
    IconSearch as Search,
    IconEye as Eye,
    IconX as X,
    IconCalendarEvent as Calendar,
    IconEraser as Eraser,
    IconFile as FileSpreadsheet,
    IconClock as Clock,
    IconCheck as Check,
    IconTrophy as Trophy,
    IconMapPin as MapPin,
    IconPhoto as Photo,
    IconUsers as Users
} from '@tabler/icons-react';
import './ParentEventPage.css';

const ParentEventPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t, isRTL } = useLanguage();
    const { permissions, userRole } = usePermissions();

    // State for handling events and pagination
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination settings
    const eventsPerPage = 6;

    // Fetch events from Firestore
    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const eventsQuery = query(
                collection(db, 'events'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(eventsQuery);
            const eventsData = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                eventsData.push({
                    id: doc.id,
                    name: data.name || t('parentEvents.unnamedEvent', 'Unnamed Event'),
                    description: data.description || t('parentEvents.noDescription', 'No description available'),
                    location: data.location || t('parentEvents.locationTBD', 'Location TBD'),
                    address: data.address || '',
                    date: data.date || t('parentEvents.dateTBD', 'Date TBD'),
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
                    image: data.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
                });
            });

            setEvents(eventsData);
            setFilteredEvents(eventsData);
            console.log('Fetched events for parent view:', eventsData);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError(t('parentEvents.fetchError', 'Failed to load events. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    // Load events on component mount
    useEffect(() => {
        fetchEvents();
    }, [t]);

    // Get unique locations from events for the filter dropdown
    const getUniqueLocations = () => {
        const locations = events
            .map(event => event.location)
            .filter(location => location && location !== t('parentEvents.locationTBD', 'Location TBD'))
            .filter((location, index, array) => array.indexOf(location) === index) // Remove duplicates
            .sort(); // Sort alphabetically

        return locations;
    };

    const uniqueLocations = getUniqueLocations();

    // Filter events based on search term and filters
    useEffect(() => {
        const results = events.filter(event => {
            const matchesSearch =
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.organizer.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'upcoming' && event.status === 'upcoming') ||
                (statusFilter === 'completed' && event.status === 'completed') ||
                (statusFilter === 'ongoing' && event.status === 'ongoing');

            const matchesLocation =
                locationFilter === 'all' ||
                event.location.toLowerCase() === locationFilter.toLowerCase();

            return matchesSearch && matchesStatus && matchesLocation;
        });

        setFilteredEvents(results);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, locationFilter, events]);

    // Get current events for the current page
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    // Calculate total pages
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    // Change page
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setLocationFilter('all');
    };

    // Handle view event - open modal instead of navigating
    const handleViewEvent = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    // Handle view gallery
    const handleViewGallery = (event) => {
        if (event.hasGalleryFolder) {
            navigate(`/gallery/${event.id}`);
        } else {
            alert(t('parentEvents.noGalleryFolder', 'This event does not have a gallery folder.'));
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchEvents();
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString || dateString === t('parentEvents.dateTBD', 'Date TBD')) return dateString;

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
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
                return t('parentEvents.typeRace', 'Race');
            case 'newcomers':
                return t('parentEvents.typeNewcomers', 'Newcomers');
            case 'social':
                return t('parentEvents.typeSocial', 'Social');
            default:
                return type;
        }
    };

    // Generate page numbers
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    // Calculate stats
    const stats = {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        completedEvents: events.filter(e => e.status === 'completed').length
    };

    // Handle stat card clicks to filter events
    const handleStatCardClick = (filterType) => {
        switch (filterType) {
            case 'total':
                setStatusFilter('all');
                break;
            case 'upcoming':
                setStatusFilter('upcoming');
                break;
            case 'completed':
                setStatusFilter('completed');
                break;
            default:
                break;
        }
        // Clear other filters when clicking stat cards
        setSearchTerm('');
        setLocationFilter('all');
    };

    if (error) {
        return (
            <Dashboard userRole={userRole}>
                <div className={`parent-event-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button onClick={handleRefresh} className="btn-primary">
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
            <div className={`parent-event-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                <h1>
                    <Calendar size={32} className="page-title-icon" />
                    {t('parentEvents.title', 'Events')}
                </h1>

                <div className="parent-event-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        <div className="header-info">
                            <h2>{t('parentEvents.viewEvents', 'View Upcoming and Past Events')}</h2>
                            <p className="header-subtitle">
                                {t('parentEvents.subtitle', 'Stay updated with all racing events and activities')}
                            </p>
                        </div>

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={handleRefresh}>
                                <RefreshCw className="btn-icon" size={18} />
                                {t('common.refresh', 'Refresh')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div
                            className={`stat-card total ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('total')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Calendar className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('parentEvents.totalEvents', 'Total Events')}</h3>
                                <div className="stat-value">{stats.totalEvents}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card upcoming ${statusFilter === 'upcoming' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('upcoming')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Trophy className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('parentEvents.upcomingEvents', 'Upcoming Events')}</h3>
                                <div className="stat-value">{stats.upcomingEvents}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card completed ${statusFilter === 'completed' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('completed')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Check className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('parentEvents.completedEvents', 'Completed Events')}</h3>
                                <div className="stat-value">{stats.completedEvents}</div>
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
                                    placeholder={t('parentEvents.searchPlaceholder', 'Search by event name, location, or organizer...')}
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
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
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">🌈 {t('parentEvents.allEvents', 'All Events')}</option>
                                <option value="upcoming">🏁 {t('parentEvents.upcoming', 'Upcoming')}</option>
                                <option value="completed">✅ {t('parentEvents.completed', 'Completed')}</option>
                                <option value="ongoing">🔄 {t('parentEvents.ongoing', 'Ongoing')}</option>
                            </select>
                        </div>

                        <div className="filter-container">
                            <select
                                className="filter-select"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="all">📍 {t('parentEvents.allLocations', 'All Locations')}</option>
                                {uniqueLocations.map((location, index) => (
                                    <option key={index} value={location.toLowerCase()}>
                                        📍 {location}
                                    </option>
                                ))}
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
                        {t('parentEvents.showing', 'Showing')} {filteredEvents.length} {t('common.of', 'of')} {events.length} {t('parentEvents.eventsLowercase', 'events')}
                        {statusFilter !== 'all' && <span className="filter-applied"> • {t('parentEvents.status', 'Status')}: {statusFilter}</span>}
                        {locationFilter !== 'all' && <span className="filter-applied"> • {t('parentEvents.location', 'Location')}: {locationFilter}</span>}
                        {searchTerm && <span className="search-applied"> • {t('parentEvents.searchLabel', 'Search')}: "{searchTerm}"</span>}
                    </div>

                    {/* Events Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Calendar size={16} style={{ marginRight: '8px' }} />{t('parentEvents.eventInfo', 'Event Info')}</th>
                                <th>📅 {t('parentEvents.dateTime', 'Date & Time')}</th>
                                <th><MapPin size={16} style={{ marginRight: '8px' }} />{t('parentEvents.location', 'Location')}</th>
                                <th>👤 {t('parentEvents.organizer', 'Organizer')}</th>
                                <th>📊 {t('parentEvents.status', 'Status')}</th>
                                <th>⚡ {t('parentEvents.actions', 'Actions')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="loading-cell">
                                        <div className="loading-content">
                                            <Clock className="loading-spinner" size={30} />
                                            {t('parentEvents.loading', 'Loading events...')}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <Calendar className="empty-icon" size={60} />
                                            <h3>{t('parentEvents.noEvents', 'No events found')}</h3>
                                            <p>
                                                {events.length === 0
                                                    ? t('parentEvents.noEventsAvailable', 'No events are currently available.')
                                                    : t('common.adjustFilters', 'Try adjusting your search or filters')
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentEvents.map(event => (
                                    <tr key={event.id}>
                                        <td>
                                            <div className="event-info">
                                                <img src={event.image} alt={event.name} className="event-image" />
                                                <div className="event-details">
                                                    <div className="event-name">
                                                        {event.name}
                                                        {event.hasGalleryFolder && (
                                                            <Photo size={14} className="gallery-indicator" title={t('parentEvents.hasGallery', 'Has Gallery')} />
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
                                        <td>{event.organizer}</td>
                                        <td>
                                            <span className={`status-badge status-${event.status}`}>
                                                {event.status === 'upcoming' && <Trophy size={14} style={{ marginRight: '4px' }} />}
                                                {event.status === 'completed' && <Check size={14} style={{ marginRight: '4px' }} />}
                                                {event.status === 'ongoing' && <Clock size={14} style={{ marginRight: '4px' }} />}
                                                {event.status === 'upcoming' && t('parentEvents.upcoming', 'Upcoming')}
                                                {event.status === 'completed' && t('parentEvents.completed', 'Completed')}
                                                {event.status === 'ongoing' && t('parentEvents.ongoing', 'Ongoing')}
                                                {event.status === 'cancelled' && t('parentEvents.cancelled', 'Cancelled')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewEvent(event)}
                                                    title={t('parentEvents.viewDetails', 'View Details')}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {event.hasGalleryFolder && (
                                                    <button
                                                        className="btn-action gallery"
                                                        onClick={() => handleViewGallery(event)}
                                                        title={t('parentEvents.viewGallery', 'View Gallery')}
                                                    >
                                                        <Photo size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-button"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                &laquo; {t('parentEvents.previous', 'Previous')}
                            </button>

                            <div className="pagination-numbers">
                                {pageNumbers.map(number => (
                                    <button
                                        key={number}
                                        className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                                        onClick={() => goToPage(number)}
                                    >
                                        {number}
                                    </button>
                                ))}
                            </div>

                            <button
                                className="pagination-button"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                {t('parentEvents.next', 'Next')} &raquo;
                            </button>
                        </div>
                    )}
                </div>

                {/* Event Details Modal */}
                <ParentEventModal
                    event={selectedEvent}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            </div>
        </Dashboard>
    );
};

export default ParentEventPage;