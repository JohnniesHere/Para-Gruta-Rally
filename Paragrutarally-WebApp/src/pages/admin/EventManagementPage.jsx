// src/pages/admin/EventManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import './EventManagementPage.css';

const EventManagementPage = () => {
    const { isDarkMode } = useTheme(); // Fixed: was isDark, should be isDarkMode

    // State for handling events and pagination
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

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
            // Match search term
            const matchesSearch =
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase());

            // Match status filter
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'upcoming' && event.status === 'upcoming') ||
                (statusFilter === 'past' && event.status === 'completed');

            // Match location filter
            const matchesLocation =
                locationFilter === 'all' ||
                event.location.toLowerCase().includes(locationFilter.toLowerCase());

            return matchesSearch && matchesStatus && matchesLocation;
        });

        setFilteredEvents(results);
        // Reset to first page when filters change
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

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        // The search is already handled by the useEffect above
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle view event
    const handleViewEvent = (event) => {
        setSelectedEvent(event);
    };

    // Handle close event details
    const handleCloseEventDetails = () => {
        setSelectedEvent(null);
    };

    // Generate page numbers
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <Dashboard requiredRole="admin">
            <div className={`event-management ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                {/* FIXED: Title moved outside the container like UserManagement */}
                <h1>Event Management</h1>

                <div className="event-management-container">
                    <div className="page-header">
                        <Link to="/admin/events/create" className="create-button">
                            Create New Event
                        </Link>
                    </div>

                    <div className="event-actions">
                        <div className="event-search">
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="search-input"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            <button className="search-button" onClick={handleSearch}>Search</button>
                        </div>

                        <div className="event-filters">
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Events</option>
                                <option value="upcoming">Upcoming Events</option>
                                <option value="past">Past Events</option>
                            </select>

                            <select
                                className="filter-select"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="all">All Locations</option>
                                <option value="jerusalem">Jerusalem</option>
                                <option value="tel-aviv">Tel Aviv</option>
                                <option value="haifa">Haifa</option>
                                <option value="eilat">Eilat</option>
                            </select>
                        </div>
                    </div>

                    <div className="events-table-container">
                        <table className="events-table">
                            <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Participants</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" style={{ justifyContent: 'center' }}>Loading events...</td>
                                </tr>
                            ) : currentEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ justifyContent: 'center' }}>No events found</td>
                                </tr>
                            ) : (
                                currentEvents.map(event => (
                                    <tr key={event.id}>
                                        <td>
                                            <div
                                                className="event-name-hover"
                                                title={event.description}
                                            >
                                                {event.name}
                                                <div className="event-preview-card">
                                                    <img src={event.image} alt={event.name} />
                                                    <p>{event.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{event.date}</td>
                                        <td>{event.location}</td>
                                        <td>{event.participants}</td>
                                        <td>
                                            <span className={`status-badge ${event.status}`}>
                                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="action-buttons">
                                            <button className="edit-button">Edit</button>
                                            <button
                                                className="view-button"
                                                onClick={() => handleViewEvent(event)}
                                            >
                                                View
                                            </button>
                                            <button className="delete-button">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 0 && (
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
                    <div className="event-modal-overlay" onClick={handleCloseEventDetails}>
                        <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="event-modal-header">
                                <h2>{selectedEvent.name}</h2>
                                <button
                                    className="close-modal"
                                    onClick={handleCloseEventDetails}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="event-modal-content">
                                <img
                                    src={selectedEvent.image}
                                    alt={selectedEvent.name}
                                    className="event-modal-image"
                                />
                                <div className="event-modal-details">
                                    <div className="event-detail-item">
                                        <strong>Date:</strong> {selectedEvent.date}
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Location:</strong> {selectedEvent.location}
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Participants:</strong> {selectedEvent.participants}
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Status:</strong>
                                        <span className={`status-badge ${selectedEvent.status}`}>
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