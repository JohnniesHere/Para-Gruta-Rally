// src/pages/admin/EventManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { usePermissions } from '../../hooks/usePermissions';
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

    // Mock data - in a real app, this would come from an API
    useEffect(() => {
        // Simulate API call with setTimeout
        setTimeout(() => {
            const mockEvents = [
                {
                    id: 1,
                    name: 'Summer Race 2025',
                    date: 'May 20, 2025',
                    location: 'Jerusalem City Park',
                    participants: 32,
                    status: 'upcoming',
                    description: 'Annual summer racing event in the beautiful Jerusalem City Park.',
                    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
                },
                {
                    id: 2,
                    name: 'Beach Racing Day',
                    date: 'June 15, 2025',
                    location: 'Tel Aviv Beach',
                    participants: 28,
                    status: 'upcoming',
                    description: 'Exciting beach racing event with ocean views.',
                    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
                },
                {
                    id: 3,
                    name: 'Spring Race 2025',
                    date: 'April 10, 2025',
                    location: 'Haifa Park',
                    participants: 45,
                    status: 'completed',
                    description: 'Spring racing event in the scenic Haifa Park.',
                    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'
                },
                {
                    id: 4,
                    name: 'Winter Challenge',
                    date: 'January 25, 2025',
                    location: 'Eilat Beachfront',
                    participants: 36,
                    status: 'completed',
                    description: 'Winter challenge race at the beautiful Eilat beachfront.',
                    image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400'
                },
                {
                    id: 5,
                    name: 'Mountain Trail Run',
                    date: 'July 8, 2025',
                    location: 'Golan Heights',
                    participants: 52,
                    status: 'upcoming',
                    description: 'Challenging mountain trail run in the Golan Heights.',
                    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
                },
                {
                    id: 6,
                    name: 'Desert Marathon',
                    date: 'September 15, 2025',
                    location: 'Negev Desert',
                    participants: 67,
                    status: 'upcoming',
                    description: 'Epic desert marathon through the Negev Desert.',
                    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400'
                },
                {
                    id: 7,
                    name: 'Urban Race Challenge',
                    date: 'March 3, 2025',
                    location: 'Tel Aviv Downtown',
                    participants: 89,
                    status: 'completed',
                    description: 'Urban racing challenge through Tel Aviv downtown.',
                    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'
                }
            ];

            setEvents(mockEvents);
            setFilteredEvents(mockEvents);
            setIsLoading(false);
        }, 800);
    }, []);

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
                event.location.toLowerCase().includes(locationFilter.toLowerCase());

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
    const handleDeleteEvent = (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            setEvents(events.filter(event => event.id !== eventId));
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
        completedEvents: events.filter(e => e.status === 'completed').length,
        totalParticipants: events.reduce((sum, e) => sum + e.participants, 0)
    };

    if (error) {
        return (
            <Dashboard requiredRole="admin">
                <div className={`event-management-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()} className="btn-primary">
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
                            <button className="btn-secondary" onClick={() => window.location.reload()}>
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
                        <div className="stat-card total">
                            <Calendar className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Events</h3>
                                <div className="stat-value">{stats.totalEvents}</div>
                            </div>
                        </div>

                        <div className="stat-card upcoming">
                            <Trophy className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Upcoming Events</h3>
                                <div className="stat-value">{stats.upcomingEvents}</div>
                                <div className="stat-subtitle">Ready to race</div>
                            </div>
                        </div>

                        <div className="stat-card completed">
                            <Check className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Completed Events</h3>
                                <div className="stat-value">{stats.completedEvents}</div>
                            </div>
                        </div>

                        <div className="stat-card participants">
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Participants</h3>
                                <div className="stat-value">{stats.totalParticipants}</div>
                                <div className="stat-subtitle">Growing fast</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="search-filter-section">
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
                            <label className="filter-label">
                                <Filter className="filter-icon" size={16} />
                                Status
                            </label>
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
                            <label className="filter-label">
                                <MapPin className="filter-icon" size={16} />
                                Location
                            </label>
                            <select
                                className="filter-select"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="all">📍 All Locations</option>
                                <option value="jerusalem">🏛️ Jerusalem</option>
                                <option value="tel-aviv">🏖️ Tel Aviv</option>
                                <option value="haifa">⛰️ Haifa</option>
                                <option value="eilat">🌊 Eilat</option>
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
                                            <p>Try adjusting your search or filters</p>
                                            <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleCreateEvent}>
                                                <Plus className="btn-icon" size={18} />
                                                Create First Event
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
                                                    <div className="event-description">{event.description.substring(0, 50)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{event.date}</td>
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
                                        <p>{selectedEvent.date}</p>
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