// src/pages/admin/ViewEventsPage.jsx - Updated with Fixed Styling and Teams Section
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getAllTeams } from '../../services/teamService';
import {
    IconCalendarEvent as Calendar,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconPlus as Plus,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconUsers as Users,
    IconSearch as Search,
    IconFilter as Filter,
    IconGrid3x3 as Grid,
    IconList as List,
    IconChevronLeft as ChevronLeft,
    IconChevronRight as ChevronRight,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconTarget as Target,
    IconRefresh as RefreshCw,
    IconDownload as Download,
    IconPhoto as Photo,
    IconFolder as Folder,
    IconArrowLeft as ArrowLeft,
    IconCheck as Check,
    IconFlag as Flag
} from '@tabler/icons-react';
import './ViewEventsPage.css';

const ViewEventsPage = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [teamsData, setTeamsData] = useState({});
    const [loadingTeams, setLoadingTeams] = useState(false);

    // Load event data on mount
    useEffect(() => {
        if (eventId) {
            loadEventData();
        }
    }, [eventId]);

    // Load teams data when event has participating teams
    useEffect(() => {
        if (event && event.participatingTeams && event.participatingTeams.length > 0) {
            loadTeamsData();
        }
    }, [event]);

    const loadEventData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const eventDoc = await getDoc(doc(db, 'events', eventId));

            if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                setEvent({
                    id: eventDoc.id,
                    name: eventData.name || 'Unnamed Event',
                    description: eventData.description || 'No description available',
                    location: eventData.location || 'Location TBD',
                    date: eventData.date || 'Date TBD',
                    time: eventData.time || 'Time TBD',
                    address: eventData.address || 'Address TBD',
                    organizer: eventData.organizer || 'TBD',
                    participants: eventData.attendees || 0,
                    status: eventData.status || 'upcoming',
                    notes: eventData.notes || '',
                    participatingTeams: eventData.participatingTeams || [],
                    hasGalleryFolder: eventData.hasGalleryFolder || false,
                    galleryFolderPath: eventData.galleryFolderPath || null,
                    createdAt: eventData.createdAt,
                    updatedAt: eventData.updatedAt,
                    image: eventData.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
                });
            } else {
                setError('Event not found');
            }
        } catch (err) {
            console.error('Error loading event:', err);
            setError('Failed to load event. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTeamsData = async () => {
        setLoadingTeams(true);
        try {
            const teams = await getAllTeams();
            const teamsMap = {};
            teams.forEach(team => {
                teamsMap[team.id] = team;
            });
            setTeamsData(teamsMap);
        } catch (error) {
            console.error('Error loading teams data:', error);
        } finally {
            setLoadingTeams(false);
        }
    };

    const handleEditEvent = () => {
        navigate(`/admin/events/edit/${eventId}`);
    };

    const handleViewGallery = () => {
        if (event.hasGalleryFolder) {
            navigate(`/gallery/${eventId}`);
        } else {
            alert('This event does not have a gallery folder.');
        }
    };

    const handleBackToEvents = () => {
        navigate('/admin/events');
    };

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

    const formatTime = (time) => {
        if (!time || time === 'Time TBD') return 'Time TBD';
        try {
            return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return time;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'upcoming':
                return 'status-upcoming';
            case 'completed':
                return 'status-completed';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'status-upcoming';
        }
    };

    if (isLoading) {
        return (
            <Dashboard>
                <div className={`view-events-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-content">
                            <Clock className="loading-spinner" size={40} />
                            <p>Loading event...</p>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error || !event) {
        return (
            <Dashboard>
                <div className={`view-events-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>Error</h3>
                        <p>{error || 'Event not found'}</p>
                        <button onClick={handleBackToEvents} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            Back to Events
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className={`view-events-page ${appliedTheme}-mode`}>
                {/* Header */}
                <button
                    onClick={handleBackToEvents}
                    className={`back-button ${appliedTheme}-back-button`}
                >
                    <ArrowLeft size={20} />
                    Back to Events
                </button>

                {/* Racing Header */}
                <div className="racing-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1>
                                <Trophy size={32} className="page-title-icon" />
                                Racing Event Details!
                                <Flag size={24} className="trophy-icon" />
                            </h1>
                            <p className="subtitle">Event information and details 🏁</p>
                        </div>
                        <div className="header-actions">
                            {permissions?.canEdit && (
                                <button
                                    onClick={handleEditEvent}
                                    className="edit-button"
                                >
                                    <Edit className="btn-icon" size={18} />
                                    Edit Event
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="view-event-container">
                    {/* Hero Section */}
                    <div className="hero-section">
                        <div className="hero-content">
                            <div className="event-avatar">
                                <div className="event-photo-container">
                                    <img
                                        src={event.image}
                                        alt={event.name}
                                        className="event-photo"
                                    />
                                    <div className="event-type-badge">🏁</div>
                                </div>
                            </div>

                            <div className="hero-info">
                                <h2 className="event-title">{event.name}</h2>
                                <p className="event-description">{event.description}</p>

                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <Calendar className="stat-icon" size={16} />
                                        <span>{formatDate(event.date)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Clock className="stat-icon" size={16} />
                                        <span>{formatTime(event.time)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <MapPin className="stat-icon" size={16} />
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Users className="stat-icon" size={16} />
                                        <span>{event.participants} participants</span>
                                    </div>
                                    <div className="stat-item">
                                        <Flag className="stat-icon" size={16} />
                                        <span className={`status-badge ${getStatusBadge(event.status)}`}>
                                            {event.status === 'upcoming' && <Trophy size={14} />}
                                            {event.status === 'completed' && <Check size={14} />}
                                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="content-grid">
                        {/* Event Details Section */}
                        <div className="info-section">
                            <div className="section-header">
                                <h2>
                                    <Trophy size={24} className="section-icon" />
                                    🏎️ Event Details
                                </h2>
                            </div>

                            <div className="info-grid">
                                <div className="info-item">
                                    <label>📊 Status</label>
                                    <div className="info-value">
                                        <span className={`status-badge ${getStatusBadge(event.status)}`}>
                                            {event.status === 'upcoming' && <Trophy size={14} style={{ marginRight: '4px' }} />}
                                            {event.status === 'completed' && <Check size={14} style={{ marginRight: '4px' }} />}
                                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <label>📅 Date</label>
                                    <div className="info-value">{formatDate(event.date)}</div>
                                </div>

                                <div className="info-item">
                                    <label>🕐 Time</label>
                                    <div className="info-value">{formatTime(event.time)}</div>
                                </div>

                                <div className="info-item">
                                    <label>📍 Location</label>
                                    <div className="info-value">{event.location}</div>
                                </div>

                                <div className="info-item">
                                    <label>👥 Participants</label>
                                    <div className="info-value">{event.participants}</div>
                                </div>

                                <div className="info-item">
                                    <label>👨‍💼 Organizer</label>
                                    <div className="info-value">{event.organizer}</div>
                                </div>

                                <div className="info-item full-width">
                                    <label>🏠 Full Address</label>
                                    <div className="info-value">{event.address}</div>
                                </div>

                                {event.notes && (
                                    <div className="info-item full-width">
                                        <label>📝 Additional Notes</label>
                                        <div className="info-value">{event.notes}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Participating Teams Section */}
                        {event.participatingTeams && event.participatingTeams.length > 0 && (
                            <div className="info-section teams-section">
                                <div className="section-header">
                                    <h2>
                                        <Users size={24} className="section-icon" />
                                        🏁 Participating Teams
                                    </h2>
                                </div>

                                <div className="teams-content">
                                    {loadingTeams ? (
                                        <div className="teams-loading">
                                            <Clock className="loading-spinner" size={20} />
                                            <span>Loading team data...</span>
                                        </div>
                                    ) : (
                                        <div className="teams-list-view">
                                            {event.participatingTeams.map((teamId) => (
                                                <div
                                                    key={teamId}
                                                    className="team-card-view"
                                                    onClick={() => navigate(`/admin/teams/view/${teamId}`)}
                                                >
                                                    <div className="team-card-header">
                                                        <Users size={20} className="team-icon" />
                                                        <h3 className="team-name">
                                                            {teamsData[teamId]?.name || 'Unknown Team'}
                                                        </h3>
                                                    </div>

                                                    {teamsData[teamId] && (
                                                        <div className="team-details">
                                                            {teamsData[teamId].teamLeader && (
                                                                <div className="team-leader">
                                                                    <Users size={14} />
                                                                    <span>Leader: {teamsData[teamId].teamLeader.firstName} {teamsData[teamId].teamLeader.lastName}</span>
                                                                </div>
                                                            )}
                                                            <div className="team-member-count">
                                                                <Users size={14} />
                                                                <span>Kids in team: {teamsData[teamId].kidIds?.length || 0}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Gallery Section */}
                        {event.hasGalleryFolder && (
                            <div className="info-section gallery-section">
                                <div className="section-header">
                                    <h2>
                                        <Photo size={24} className="section-icon" />
                                        📷 Event Gallery
                                    </h2>
                                </div>

                                <div className="gallery-preview">
                                    <div className="gallery-info">
                                        <Folder className="gallery-folder-icon" size={48} />
                                        <div className="gallery-details">
                                            <h3>{event.name} Album</h3>
                                            <p>View and manage photos from this event</p>
                                        </div>
                                    </div>

                                    <div className="gallery-actions">
                                        <button
                                            onClick={handleViewGallery}
                                            className="btn-primary gallery-button"
                                        >
                                            <Photo size={16} />
                                            View Gallery
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ViewEventsPage;