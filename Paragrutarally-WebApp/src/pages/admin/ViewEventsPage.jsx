// src/pages/admin/ViewEventsPage.jsx - Updated with Complete Translation Support
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
    const { t, isRTL } = useLanguage();
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
                    name: eventData.name || t('events.unnamedEvent', 'Unnamed Event'),
                    description: eventData.description || t('events.noDescription', 'No description available'),
                    location: eventData.location || t('events.locationTBD', 'Location TBD'),
                    date: eventData.date || t('events.dateTBD', 'Date TBD'),
                    time: eventData.time || t('events.timeTBD', 'Time TBD'),
                    address: eventData.address || t('events.addressTBD', 'Address TBD'),
                    organizer: eventData.organizer || t('events.organizerTBD', 'TBD'),
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
                setError(t('events.eventNotFound', 'Event not found'));
            }
        } catch (err) {
            console.error('Error loading event:', err);
            setError(t('events.loadError', 'Failed to load event. Please try again.'));
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
            alert(t('events.noGalleryFolder', 'This event does not have a gallery folder.'));
        }
    };

    const handleBackToEvents = () => {
        navigate('/admin/events');
    };

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

    const formatTime = (time) => {
        if (!time || time === t('events.timeTBD', 'Time TBD')) return t('events.timeTBD', 'Time TBD');
        try {
            return new Date(`2000-01-01T${time}`).toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: !isRTL
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

    const getStatusText = (status) => {
        switch (status) {
            case 'upcoming':
                return t('events.upcoming', 'Upcoming');
            case 'completed':
                return t('events.completed', 'Completed');
            case 'cancelled':
                return t('events.cancelled', 'Cancelled');
            default:
                return t('events.upcoming', 'Upcoming');
        }
    };

    if (isLoading) {
        return (
            <Dashboard>
                <div className={`view-events-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="loading-container">
                        <div className="loading-content">
                            <Clock className="loading-spinner" size={40} />
                            <p>{t('events.loadingEvent', 'Loading event...')}</p>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error || !event) {
        return (
            <Dashboard>
                <div className={`view-events-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error || t('events.eventNotFound', 'Event not found')}</p>
                        <button onClick={handleBackToEvents} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            {t('events.backToEvents', 'Back to Events')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className={`view-events-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <button
                    onClick={handleBackToEvents}
                    className={`back-button ${appliedTheme}-back-button`}
                >
                    <ArrowLeft size={20} />
                    {t('events.backToEvents', 'Back to Events')}
                </button>

                {/* Racing Header */}
                <div className="racing-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1>
                                <Trophy size={32} className="page-title-icon" />
                                {t('events.racingEventDetails', 'Racing Event Details!')}
                                <Flag size={24} className="trophy-icon" />
                            </h1>
                            <p className="subtitle">{t('events.eventInformationSubtitle', 'Event information and details')} 🏁</p>
                        </div>
                        <div className="header-actions">
                            {permissions?.canEdit && (
                                <button
                                    onClick={handleEditEvent}
                                    className="edit-button"
                                >
                                    <Edit className="btn-icon" size={18} />
                                    {t('events.editEvent', 'Edit Event')}
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
                                        <span>{event.participants} {t('events.participants', 'participants')}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Flag className="stat-icon" size={16} />
                                        <span className={`status-badge ${getStatusBadge(event.status)}`}>
                                            {event.status === 'upcoming' && <Trophy size={14} />}
                                            {event.status === 'completed' && <Check size={14} />}
                                            {getStatusText(event.status)}
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
                                    🏎️ {t('events.eventDetails', 'Event Details')}
                                </h2>
                            </div>

                            <div className="info-grid">
                                <div className="info-item">
                                    <label>📊 {t('events.status', 'Status')}</label>
                                    <div className="info-value">
                                        <span className={`status-badge ${getStatusBadge(event.status)}`}>
                                            {event.status === 'upcoming' && <Trophy size={14} style={{ marginRight: '4px' }} />}
                                            {event.status === 'completed' && <Check size={14} style={{ marginRight: '4px' }} />}
                                            {getStatusText(event.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <label>📅 {t('events.date', 'Date')}</label>
                                    <div className="info-value">{formatDate(event.date)}</div>
                                </div>

                                <div className="info-item">
                                    <label>🕐 {t('events.time', 'Time')}</label>
                                    <div className="info-value">{formatTime(event.time)}</div>
                                </div>

                                <div className="info-item">
                                    <label>📍 {t('events.location', 'Location')}</label>
                                    <div className="info-value">{event.location}</div>
                                </div>

                                <div className="info-item">
                                    <label>👥 {t('events.participants', 'Participants')}</label>
                                    <div className="info-value">{event.participants}</div>
                                </div>

                                <div className="info-item">
                                    <label>👨‍💼 {t('events.organizer', 'Organizer')}</label>
                                    <div className="info-value">{event.organizer}</div>
                                </div>

                                <div className="info-item full-width">
                                    <label>🏠 {t('events.fullAddress', 'Full Address')}</label>
                                    <div className="info-value">{event.address}</div>
                                </div>

                                {event.notes && (
                                    <div className="info-item full-width">
                                        <label>📝 {t('events.additionalNotes', 'Additional Notes')}</label>
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
                                        🏁 {t('events.participatingTeams', 'Participating Teams')}
                                    </h2>
                                </div>

                                <div className="teams-content">
                                    {loadingTeams ? (
                                        <div className="teams-loading">
                                            <Clock className="loading-spinner" size={20} />
                                            <span>{t('events.loadingTeamData', 'Loading team data...')}</span>
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
                                                            {teamsData[teamId]?.name || t('events.unknownTeam', 'Unknown Team')}
                                                        </h3>
                                                    </div>

                                                    {teamsData[teamId] && (
                                                        <div className="team-details">
                                                            {teamsData[teamId].teamLeader && (
                                                                <div className="team-leader">
                                                                    <Users size={14} />
                                                                    <span>{t('events.leader', 'Leader')}: {teamsData[teamId].teamLeader.firstName} {teamsData[teamId].teamLeader.lastName}</span>
                                                                </div>
                                                            )}
                                                            <div className="team-member-count">
                                                                <Users size={14} />
                                                                <span>{t('events.kidsInTeam', 'Kids in team')}: {teamsData[teamId].kidIds?.length || 0}</span>
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
                                        📷 {t('events.eventGallery', 'Event Gallery')}
                                    </h2>
                                </div>

                                <div className="gallery-preview">
                                    <div className="gallery-info">
                                        <Folder className="gallery-folder-icon" size={48} />
                                        <div className="gallery-details">
                                            <h3>{t('events.eventAlbum', '{eventName} Album', { eventName: event.name })}</h3>
                                            <p>{t('events.viewManagePhotos', 'View and manage photos from this event')}</p>
                                        </div>
                                    </div>

                                    <div className="gallery-actions">
                                        <button
                                            onClick={handleViewGallery}
                                            className="btn-primary gallery-button"
                                        >
                                            <Photo size={16} />
                                            {t('events.viewGallery', 'View Gallery')}
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