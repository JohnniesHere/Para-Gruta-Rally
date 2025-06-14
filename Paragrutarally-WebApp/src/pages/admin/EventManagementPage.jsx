// src/pages/admin/EventManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    IconPlus as Plus,
    IconRefresh as RefreshCw,
    IconDownload as Download,
    IconFilter as Filter,
    IconSearch as Search,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconCalendarEvent as Calendar,
    IconEraser as Eraser,
    IconFile as FileSpreadsheet,
    IconX as X,
    IconClock as Clock,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconTrophy as Trophy,
    IconMapPin as MapPin,
    IconUsers as Users
} from '@tabler/icons-react';
import './EventManagementPage.css';

const EventManagementPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions } = usePermissions();

    // State for handling events and pagination
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [error, setError] = useState(null);

    // Pagination settings
    const eventsPerPage = 4;

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
                    name: data.name || 'Unnamed Event',
                    description: data.description || 'No description available',
                    location: data.location || 'Location TBD',
                    date: data.date || 'Date TBD',
                    participants: data.attendees || 0,
                    status: data.status || 'upcoming',
                    notes: data.notes || '',
                    participatingTeams: data.participatingTeams || [],
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    // Use uploaded image or default image
                    image: data.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
                });
            });

            setEvents(eventsData);
            setFilteredEvents(eventsData);
            console.log('Fetched events:', eventsData);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to load events. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load events on component mount
    useEffect(() => {
        fetchEvents();
    }, []);

    // Get unique locations from events for the filter dropdown
    const getUniqueLocations = () => {
        const locations = events
            .map(event => event.location)
            .filter(location => location && location !== 'Location TBD')
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
                event.location.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'upcoming' && event.status === 'upcoming') ||
                (statusFilter === 'completed' && event.status === 'completed');

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

    // Handle view event
    const handleViewEvent = (event) => {
        setSelectedEvent(event);
    };

    // Handle close event details
    const handleCloseEventDetails = () => {
        setSelectedEvent(null);
    };

    // Handle create event
    const handleCreateEvent = () => {
        navigate('/admin/events/create');
    };

    // Handle edit event
    const handleEditEvent = (eventId) => {
        navigate(`/admin/events/edit/${eventId}`);
    };

    // Handle delete event
    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                // Remove from local state
                setEvents(events.filter(event => event.id !== eventId));
                console.log('Event deleted successfully');
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Failed to delete event. Please try again.');
            }
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchEvents();
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString || dateString === 'Date TBD') return dateString;

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
            <Dashboard requiredRole="admin">
                <div className={`event-management-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={handleRefresh} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            Try Again
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole="admin">
            <div className={`event-management-page ${appliedTheme}-mode`}>
                <h1><Calendar size={32} className="page-title-icon" /> Event Management</h1>

                <div className="event-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        <button className="btn-primary" onClick={handleCreateEvent}>
                            <Plus className="btn-icon" size={18} />
                            Add New Event
                        </button>

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={handleRefresh}>
                                <RefreshCw className="btn-icon" size={18} />
                                Refresh
                            </button>
                            <button className="btn-export">
                                <Download className="btn-icon" size={18} />
                                Export Events
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
                                <h3>Total Events</h3>
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
                                <h3>Upcoming Events</h3>
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
                                <h3>Completed Events</h3>
                                <div className="stat-value">{stats.completedEvents}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters - All in one row */}
                    <div className="search-filter-section-row">
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by event name or location..."
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
                                <option value="all">🌈 All Events</option>
                                <option value="upcoming">🏁 Upcoming</option>
                                <option value="completed">✅ Completed</option>
                            </select>
                        </div>

                        <div className="filter-container">
                            <select
                                className="filter-select"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="all">📍 All Locations</option>
                                {uniqueLocations.map((location, index) => (
                                    <option key={index} value={location.toLowerCase()}>
                                        📍 {location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            Clear All
                        </button>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        <FileSpreadsheet className="results-icon" size={18} />
                        Showing {filteredEvents.length} of {events.length} events
                        {statusFilter !== 'all' && <span className="filter-applied"> • Status: {statusFilter}</span>}
                        {locationFilter !== 'all' && <span className="filter-applied"> • Location: {locationFilter}</span>}
                        {searchTerm && <span className="search-applied"> • Search: "{searchTerm}"</span>}
                    </div>

                    {/* Events Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Calendar size={16} style={{ marginRight: '8px' }} />Event Info</th>
                                <th>📅 Date</th>
                                <th><MapPin size={16} style={{ marginRight: '8px' }} />Location</th>
                                <th>👥 Participants</th>
                                <th>📊 Status</th>
                                <th>⚡ Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="loading-cell">
                                        <div className="loading-content">
                                            <Clock className="loading-spinner" size={30} />
                                            Loading events...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <Calendar className="empty-icon" size={60} />
                                            <h3>No events found</h3>
                                            <p>
                                                {events.length === 0
                                                    ? 'No events have been created yet. Start by creating your first event!'
                                                    : 'Try adjusting your search or filters'
                                                }
                                            </p>
                                            <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleCreateEvent}>
                                                <Plus className="btn-icon" size={18} />
                                                {events.length === 0 ? 'Create First Event' : 'Create New Event'}
                                            </button>
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
                                                    <div className="event-name">{event.name}</div>
                                                    <div className="event-description">
                                                        {event.description.length > 50
                                                            ? `${event.description.substring(0, 50)}...`
                                                            : event.description
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{formatDate(event.date)}</td>
                                        <td>{event.location}</td>
                                        <td>{event.participants}</td>
                                        <td>
                                            <span className={`status-badge status-${event.status}`}>
                                                {event.status === 'upcoming' && <Trophy size={14} style={{ marginRight: '4px' }} />}
                                                {event.status === 'completed' && <Check size={14} style={{ marginRight: '4px' }} />}
                                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewEvent(event)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditEvent(event.id)}
                                                    title="Edit Event"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    title="Delete Event"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
                                &laquo; Previous
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
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </div>

                {/* Event Details Modal */}
                {selectedEvent && (
                    <div className="modal-overlay" onClick={handleCloseEventDetails}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedEvent.name}</h2>
                                <button
                                    className="modal-close"
                                    onClick={handleCloseEventDetails}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <img
                                    src={selectedEvent.image}
                                    alt={selectedEvent.name}
                                    className="event-modal-image"
                                />
                                <div className="event-modal-details">
                                    <div className="event-detail-item">
                                        <strong>Date:</strong>
                                        <p>{formatDate(selectedEvent.date)}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Location:</strong>
                                        <p>{selectedEvent.location}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Participants:</strong>
                                        <p>{selectedEvent.participants}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Status:</strong>
                                        <span className={`status-badge status-${selectedEvent.status}`}>
                                            {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Description:</strong>
                                        <p>{selectedEvent.description}</p>
                                    </div>
                                    {selectedEvent.notes && (
                                        <div className="event-detail-item">
                                            <strong>Notes:</strong>
                                            <p>{selectedEvent.notes}</p>
                                        </div>
                                    )}
                                    {selectedEvent.participatingTeams && selectedEvent.participatingTeams.length > 0 && (
                                        <div className="event-detail-item">
                                            <strong>Participating Teams:</strong>
                                            <p>{selectedEvent.participatingTeams.length} teams registered</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default EventManagementPage;