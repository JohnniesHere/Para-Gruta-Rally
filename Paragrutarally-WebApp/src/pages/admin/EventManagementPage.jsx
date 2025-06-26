// src/pages/admin/EventManagementPage.jsx - Updated with Export Modal Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import DeleteEventModal from '../../components/modals/DeleteEventModal';
import ExportEventsModal from '../../components/modals/ExportEventsModal'; // Import the Export Modal
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
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
    IconUsers as Users,
    IconPhoto as Photo,
    IconFolder as Folder
} from '@tabler/icons-react';
import './EventManagementPage.css';

const EventManagementPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t, isRTL } = useLanguage();
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

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [deleteGalleryToo, setDeleteGalleryToo] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Export modal state - ADDED THIS
    const [exportModalOpen, setExportModalOpen] = useState(false);

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
                    name: data.name || t('events.unnamedEvent', 'Unnamed Event'),
                    description: data.description || t('events.noDescription', 'No description available'),
                    location: data.location || t('events.locationTBD', 'Location TBD'),
                    date: data.date || t('events.dateTBD', 'Date TBD'),
                    participants: data.attendees || 0,
                    status: data.status || t('events.upcoming','upcoming'),
                    notes: data.notes || '',
                    participatingTeams: data.participatingTeams || [],
                    hasGalleryFolder: data.hasGalleryFolder || false,
                    galleryFolderPath: data.galleryFolderPath || null,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    image: data.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
                });
            });

            setEvents(eventsData);
            setFilteredEvents(eventsData);
            console.log('Fetched events:', eventsData);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError(t('events.fetchError', 'Failed to load events. Please try again.'));
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
            .filter(location => location && location !== t('events.locationTBD', 'Location TBD'))
            .filter((location, index, array) => array.indexOf(location) === index)
            .sort();

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
                (statusFilter === 'upcoming' && event.status === t('events.upcoming', 'upcoming')) ||
                (statusFilter === 'completed' && event.status === t('events.completed', 'completed'));

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

    // Handle view event - navigate to view page
    const handleViewEvent = (event) => {
        navigate(`/admin/events/view/${event.id}`);
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

    // Handle view gallery
    const handleViewGallery = (event) => {
        if (event.hasGalleryFolder) {
            navigate(`/gallery/${event.id}`);
        } else {
            alert(t('events.noGalleryFolder', 'This event does not have a gallery folder.'));
        }
    };

    // ADDED THIS - Handle export events
    const handleExportEvents = () => {
        setExportModalOpen(true);
    };

    // ADDED THIS - Handle close export modal
    const handleCloseExportModal = () => {
        setExportModalOpen(false);
    };

    /**
     * Delete event image from Firebase Storage
     */
    const deleteEventImage = async (imageUrl) => {
        try {
            if (!imageUrl || imageUrl.includes('unsplash.com')) {
                return true;
            }

            const url = new URL(imageUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)$/);

            if (pathMatch) {
                const encodedPath = pathMatch[1];
                const decodedPath = decodeURIComponent(encodedPath);

                console.log('Deleting event image from storage:', decodedPath);
                const imageRef = ref(storage, decodedPath);
                await deleteObject(imageRef);
                console.log('Event image deleted successfully from storage');
                return true;
            } else {
                console.warn('Could not extract storage path from URL:', imageUrl);
                return false;
            }
        } catch (error) {
            console.error('Error deleting event image from storage:', error);
            return false;
        }
    };

    /**
     * Delete gallery folder and all its contents
     */
    const deleteGalleryFolder = async (eventName, galleryFolderPath = null) => {
        try {
            const folderPath = galleryFolderPath || `gallery/events/${eventName}`;
            console.log('Deleting gallery folder:', folderPath);

            const folderRef = ref(storage, folderPath);
            const result = await listAll(folderRef);

            if (result.items.length === 0) {
                console.log('Gallery folder is empty or does not exist');
                return true;
            }

            const deletePromises = result.items.map(itemRef => {
                console.log('Deleting file:', itemRef.fullPath);
                return deleteObject(itemRef);
            });

            await Promise.all(deletePromises);

            console.log(`Gallery folder deleted successfully. Removed ${result.items.length} files.`);
            return true;
        } catch (error) {
            console.error(`Error deleting gallery folder for ${eventName}:`, error);
            return false;
        }
    };

    // Handle delete event - show modal
    const handleDeleteEvent = (event) => {
        setEventToDelete(event);
        setDeleteGalleryToo(false);
        setDeleteModalOpen(true);
    };

    /**
     * Complete event deletion with proper cleanup
     */
    const deleteEventWithCleanup = async (eventData, eventId, includeGallery = false) => {
        try {
            console.log('Starting event deletion with cleanup for:', eventData.name);
            const cleanupResults = {
                eventImage: false,
                gallery: false,
                firestoreDoc: false
            };

            // Delete the event image if it exists and is not a default image
            if (eventData.image && !eventData.image.includes('unsplash.com')) {
                console.log('Deleting event image...');
                cleanupResults.eventImage = await deleteEventImage(eventData.image);
                if (!cleanupResults.eventImage) {
                    console.warn('Failed to delete event image, but continuing with event deletion');
                }
            } else {
                cleanupResults.eventImage = true;
            }

            // Delete the gallery folder if requested and it exists
            if (includeGallery && (eventData.hasGalleryFolder || eventData.galleryFolderPath)) {
                console.log('Deleting gallery folder...');
                cleanupResults.gallery = await deleteGalleryFolder(
                    eventData.name,
                    eventData.galleryFolderPath
                );
                if (!cleanupResults.gallery) {
                    console.warn('Failed to delete gallery folder, but continuing with event deletion');
                }
            } else {
                cleanupResults.gallery = true;
            }

            // Delete the event document from Firestore
            console.log('Deleting event document from Firestore...');
            await deleteDoc(doc(db, 'events', eventId));
            cleanupResults.firestoreDoc = true;

            console.log('Event deletion completed successfully', cleanupResults);

            let message = t('events.deleteSuccess', 'Event "{eventName}" deleted successfully', { eventName: eventData.name });
            if (includeGallery && eventData.hasGalleryFolder) {
                message += ` (${t('events.includingGallery', 'including gallery photos')})`;
            }

            return {
                success: true,
                message: message,
                cleanupResults: cleanupResults
            };

        } catch (error) {
            console.error('Error during event deletion:', error);
            return {
                success: false,
                message: t('events.deleteFailed', 'Failed to delete event: {error}', { error: error.message }),
                cleanupResults: null
            };
        }
    };

    // Confirm delete event
    const confirmDeleteEvent = async () => {
        if (!eventToDelete) return;

        setIsDeleting(true);

        try {
            const result = await deleteEventWithCleanup(
                eventToDelete,
                eventToDelete.id,
                deleteGalleryToo
            );

            if (result.success) {
                setEvents(events.filter(event => event.id !== eventToDelete.id));
                console.log('Event deleted successfully');
                alert(result.message);
            } else {
                alert(result.message);
            }

        } catch (error) {
            console.error('Error deleting event:', error);
            alert(t('events.deleteError', 'Failed to delete event. Please try again.'));
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setEventToDelete(null);
            setDeleteGalleryToo(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setEventToDelete(null);
        setDeleteGalleryToo(false);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchEvents();
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString || dateString === t('events.dateTBD', 'Date TBD')) return dateString;

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
        setSearchTerm('');
        setLocationFilter('all');
    };

    // Helper function to get translated status label
    const getTranslatedStatusLabel = (status) => {
        switch (status) {
            case 'upcoming':
                return t('events.upcoming', 'Upcoming Events');
            case 'completed':
                return t('events.completed', 'Completed Events');
            case 'all':
                return t('events.allEvents', 'All Events');
            default:
                return status;
        }
    };

    if (error) {
        return (
            <Dashboard requiredRole="admin">
                <div className={`event-management-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button onClick={handleRefresh} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            {t('teams.tryAgain', 'Try Again')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole="admin">
            <div className={`event-management-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                <h1><Calendar size={32} className="page-title-icon" /> {t('events.title', 'Event Management')}</h1>

                <div className="event-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        <button className="btn-primary" onClick={handleCreateEvent}>
                            <Plus className="btn-icon" size={18} />
                            {t('events.addNewEvent', 'Add New Event')}
                        </button>

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={handleRefresh}>
                                <RefreshCw className="btn-icon" size={18} />
                                {t('teams.refresh', 'Refresh')}
                            </button>
                            {/* UPDATED THIS BUTTON - Added onClick handler */}
                            <button className="btn-export" onClick={handleExportEvents}>
                                <Download className="btn-icon" size={18} />
                                {t('events.exportEvents', 'Export Events')}
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
                                <h3>{t('events.totalEvents', 'Total Events')}</h3>
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
                                <h3>{t('events.upcomingEvents', 'Upcoming Events')}</h3>
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
                                <h3>{t('events.completedEvents', 'Completed Events')}</h3>
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
                                    placeholder={t('events.searchPlaceholder', 'Search by event name or location...')}
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
                                <option value="all">🌈 {t('events.allEvents', 'All Events')}</option>
                                <option value="upcoming">🏁 {t('events.upcoming', 'Upcoming')}</option>
                                <option value="completed">✅ {t('events.completed', 'Completed')}</option>
                            </select>
                        </div>

                        <div className="filter-container">
                            <select
                                className="filter-select"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option value="all">📍 {t('events.allLocations', 'All Locations')}</option>
                                {uniqueLocations.map((location, index) => (
                                    <option key={index} value={location.toLowerCase()}>
                                        📍 {location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            {t('teams.clearAll', 'Clear All')}
                        </button>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        <FileSpreadsheet className="results-icon" size={18} />
                        {t('events.showing', 'Showing')} {filteredEvents.length} {t('teams.of', 'of')} {events.length} {t('events.eventsLowercase', 'events')}
                        {statusFilter !== 'all' && (
                            <span className="filter-applied"> • {t('events.status', 'Status')}: {getTranslatedStatusLabel(statusFilter)}</span>
                        )}
                        {locationFilter !== 'all' && (
                            <span className="filter-applied"> • {t('events.location', 'Location')}: {locationFilter}</span>
                        )}
                        {searchTerm && (
                            <span className="search-applied"> • {t('events.searchLabel', 'Search')}: "{searchTerm}"</span>
                        )}
                    </div>

                    {/* Events Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Calendar size={16} style={{ marginRight: '8px' }} />{t('events.eventInfo', 'Event Info')}</th>
                                <th>📅 {t('events.date', 'Date')}</th>
                                <th><MapPin size={16} style={{ marginRight: '8px' }} />{t('events.location', 'Location')}</th>
                                <th>👥 {t('events.participants', 'Participants')}</th>
                                <th>📊 {t('events.status', 'Status')}</th>
                                <th>⚡ {t('events.actions', 'Actions')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="loading-cell">
                                        <div className="loading-content">
                                            <Clock className="loading-spinner" size={30} />
                                            {t('events.loading', 'Loading events...')}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <Calendar className="empty-icon" size={60} />
                                            <h3>{t('events.noEvents', 'No events found')}</h3>
                                            <p>
                                                {events.length === 0
                                                    ? t('events.noEventsCreated', 'No events have been created yet. Start by creating your first event!')
                                                    : t('teams.adjustFilters', 'Try adjusting your search or filters')
                                                }
                                            </p>
                                            <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleCreateEvent}>
                                                <Plus className="btn-icon" size={18} />
                                                {events.length === 0 ? t('events.createFirstEvent', 'Create First Event') : t('events.createNewEvent', 'Create New Event')}
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
                                                    <div className="event-name">
                                                        {event.name}
                                                        {event.hasGalleryFolder && (
                                                            <Photo size={14} className="gallery-indicator" title={t('events.hasGallery', 'Has Gallery')} />
                                                        )}
                                                    </div>
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
                                                {event.status === 'upcoming' ? t('events.upcoming', 'Upcoming') : t('events.completed', 'Completed')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewEvent(event)}
                                                    title={t('events.viewDetails', 'View Details')}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditEvent(event.id)}
                                                    title={t('events.editEvent', 'Edit Event')}
                                                >
                                                    <Edit size={16} />
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
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteEvent(event)}
                                                    title={t('events.deleteEvent', 'Delete Event')}
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
                                &laquo; {t('events.previous', 'Previous')}
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
                                {t('events.next', 'Next')} &raquo;
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
                                        <strong>{t('events.status', 'Status')}:</strong>
                                        <span className={`status-badge status-${selectedEvent.status}`}>
                                            {selectedEvent.status === 'upcoming' ? t('events.upcoming', 'Upcoming') : t('events.completed', 'Completed')}
                                        </span>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>{t('events.description', 'Description')}:</strong>
                                        <p>{selectedEvent.description}</p>
                                    </div>
                                    {selectedEvent.notes && (
                                        <div className="event-detail-item">
                                            <strong>{t('events.notes', 'Notes')}:</strong>
                                            <p>{selectedEvent.notes}</p>
                                        </div>
                                    )}
                                    {selectedEvent.participatingTeams && selectedEvent.participatingTeams.length > 0 && (
                                        <div className="event-detail-item">
                                            <strong>{t('events.participatingTeams', 'Participating Teams')}:</strong>
                                            <p>{t('events.teamsRegistered', '{count} teams registered', { count: selectedEvent.participatingTeams.length })}</p>
                                        </div>
                                    )}
                                    {selectedEvent.hasGalleryFolder && (
                                        <div className="event-detail-item">
                                            <strong>{t('events.gallery', 'Gallery')}:</strong>
                                            <div className="gallery-actions">
                                                <button
                                                    className="btn-action gallery"
                                                    onClick={() => handleViewGallery(selectedEvent)}
                                                >
                                                    <Photo size={16} />
                                                    {t('events.viewGallery', 'View Gallery')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Event Modal Component */}
                <DeleteEventModal
                    isOpen={deleteModalOpen}
                    eventToDelete={eventToDelete}
                    deleteGalleryToo={deleteGalleryToo}
                    setDeleteGalleryToo={setDeleteGalleryToo}
                    isDeleting={isDeleting}
                    onConfirm={confirmDeleteEvent}
                    onCancel={cancelDelete}
                />

                {/* Export Events Modal Component */}
                <ExportEventsModal
                    isOpen={exportModalOpen}
                    onClose={handleCloseExportModal}
                />
            </div>
        </Dashboard>
    );
};

export default EventManagementPage;