// src/components/modals/ParentEventModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconX as X,
    IconCalendar as Calendar,
    IconMapPin as MapPin,
    IconUser as User,
    IconUsers as Users,
    IconPhone as Phone,
    IconMail as Mail,
    IconFileText as FileText,
    IconClock as Clock,
    IconTrophy as Trophy,
    IconCheck as Check,
    IconPhoto as Photo,
    IconExternalLink as ExternalLink
} from '@tabler/icons-react';
import { getTeamById } from '../../services/teamService';
import './ParentEventModal.css';

const ParentEventModal = ({ event, isOpen, onClose }) => {
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();
    const [teamNames, setTeamNames] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(false);

    // Fetch team names when modal opens
    useEffect(() => {
        const fetchTeamNames = async () => {
            if (!event?.participatingTeams || event.participatingTeams.length === 0) {
                setTeamNames([]);
                return;
            }

            setLoadingTeams(true);
            try {
                const teamPromises = event.participatingTeams.map(async (teamId) => {
                    try {
                        const team = await getTeamById(teamId);
                        return team ? team.name : teamId; // Fallback to ID if team not found
                    } catch (error) {
                        console.warn(`Failed to fetch team ${teamId}:`, error);
                        return teamId; // Fallback to ID if fetch fails
                    }
                });

                const names = await Promise.all(teamPromises);
                setTeamNames(names);
            } catch (error) {
                console.error('Error fetching team names:', error);
                setTeamNames(event.participatingTeams); // Fallback to IDs
            } finally {
                setLoadingTeams(false);
            }
        };

        if (isOpen && event) {
            fetchTeamNames();
        }
    }, [isOpen, event]);

    if (!isOpen || !event) return null;

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString || dateString === t('parentEvents.dateTBD', 'Date TBD')) return dateString;

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                weekday: 'long',
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
        try {
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date.toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: !isRTL
            });
        } catch (error) {
            return timeString;
        }
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

    // Get status display
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'upcoming':
                return t('parentEvents.upcoming', 'Upcoming');
            case 'completed':
                return t('parentEvents.completed', 'Completed');
            case 'ongoing':
                return t('parentEvents.ongoing', 'Ongoing');
            case 'cancelled':
                return t('parentEvents.cancelled', 'Cancelled');
            default:
                return status;
        }
    };

    const handleViewGallery = () => {
        if (event.hasGalleryFolder) {
            navigate(`/gallery/${event.id}`);
            onClose();
        } else {
            alert(t('parentEvents.noGalleryFolder', 'This event does not have a gallery folder.'));
        }
    };

    return (
        <div className="parent-event-modal-overlay" onClick={onClose}>
            <div className="parent-event-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header Section */}
                <header className="event-modal-header">
                    <div className="event-header-content">
                        <div className="event-image-section">
                            <img src={event.image} alt={event.name} className="event-main-image" />
                        </div>
                        <div className="event-title-section">
                            <div className="event-type-badge">
                                {getEventTypeDisplay(event.type)}
                            </div>
                            <h1 className="event-title">{event.name}</h1>
                            <div className="event-status-display">
                                <span className={`status-indicator status-${event.status}`}>
                                    {event.status === 'upcoming' && <Trophy size={16} />}
                                    {event.status === 'completed' && <Check size={16} />}
                                    {event.status === 'ongoing' && <Clock size={16} />}
                                    {getStatusDisplay(event.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </header>

                {/* Main Content Area */}
                <main className="event-modal-body">

                    {/* Description Section */}
                    {event.description && (
                        <section className="event-description-section">
                            <div className="section-header">
                                <FileText size={20} />
                                <h2>{t('parentEvents.description', 'Description')}</h2>
                            </div>
                            <div className="description-content">
                                {event.description}
                            </div>
                        </section>
                    )}

                    {/* Details Grid */}
                    <div className="event-details-grid">

                        {/* Date & Time Card */}
                        <div className="detail-card">
                            <div className="card-header">
                                <Calendar size={20} />
                                <h3>{t('parentEvents.dateTime', 'Date & Time')}</h3>
                            </div>
                            <div className="card-content">
                                <div className="info-row">
                                    <span className="label">{t('parentEvents.date', 'Date')}:</span>
                                    <span className="value">{formatDate(event.date)}</span>
                                </div>
                                {event.time && (
                                    <div className="info-row">
                                        <span className="label">{t('parentEvents.time', 'Time')}:</span>
                                        <span className="value time-value">{formatTime(event.time)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="detail-card">
                            <div className="card-header">
                                <MapPin size={20} />
                                <h3>{t('common.location', 'Location')}</h3>
                            </div>
                            <div className="card-content">
                                <div className="info-row">
                                    <span className="label">{t('parentEvents.venue', 'Venue')}:</span>
                                    <span className="value">{event.location}</span>
                                </div>
                                {event.address && (
                                    <div className="info-row">
                                        <span className="label">{t('parentEvents.address', 'Address')}:</span>
                                        <span className="value">{event.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Organizer Card */}
                        <div className="detail-card">
                            <div className="card-header">
                                <User size={20} />
                                <h3>{t('parentEvents.organizer', 'Organizer')}</h3>
                            </div>
                            <div className="card-content">
                                <div className="info-row">
                                    <span className="label">{t('parentEvents.organizedBy', 'Organized by')}:</span>
                                    <span className="value">{event.organizer}</span>
                                </div>
                                {event.contactEmail && (
                                    <div className="info-row contact-row">
                                        <Mail size={16} />
                                        <a href={`mailto:${event.contactEmail}`} className="contact-link">
                                            {event.contactEmail}
                                        </a>
                                    </div>
                                )}
                                {event.contactPhone && (
                                    <div className="info-row contact-row">
                                        <Phone size={16} />
                                        <a href={`tel:${event.contactPhone}`} className="contact-link">
                                            {event.contactPhone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Teams Card */}
                        {event.participatingTeams && event.participatingTeams.length > 0 && (
                            <div className="detail-card">
                                <div className="card-header">
                                    <Users size={20} />
                                    <h3>{t('parentEvents.participatingTeams', 'Participating Teams')}</h3>
                                </div>
                                <div className="card-content">
                                    <div className="info-row">
                                        <span className="label">{t('parentEvents.teamsCount', 'Teams')}:</span>
                                        <span className="value">{t('parentEventModal.teamsRegistered', '{count} teams registered', { count: event.participatingTeams.length })}</span>
                                    </div>
                                    <div className="teams-list">
                                        {loadingTeams ? (
                                            <span className="loading-text">{t('parentEventModal.loadingTeams', 'Loading team names...')}</span>
                                        ) : (
                                            teamNames.map((teamName, index) => (
                                                <span key={index} className="team-tag">{teamName}</span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Info Card */}
                        {(event.requirements || event.notes || event.backupPlan) && (
                            <div className="detail-card full-width">
                                <div className="card-header">
                                    <FileText size={20} />
                                    <h3>{t('parentEvents.additionalInfo', 'Additional Information')}</h3>
                                </div>
                                <div className="card-content">
                                    {event.requirements && (
                                        <div className="info-row">
                                            <span className="label">{t('parentEvents.requirements', 'Requirements')}:</span>
                                            <span className="value">{event.requirements}</span>
                                        </div>
                                    )}
                                    {event.notes && (
                                        <div className="info-row">
                                            <span className="label">{t('parentEvents.notes', 'Notes')}:</span>
                                            <span className="value">{event.notes}</span>
                                        </div>
                                    )}
                                    {event.weatherDependent && event.backupPlan && (
                                        <div className="info-row">
                                            <span className="label">{t('parentEvents.backupPlan', 'Backup Plan')}:</span>
                                            <span className="value">{event.backupPlan}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </main>

                {/* Footer Actions */}
                <footer className="event-modal-footer">
                    {event.hasGalleryFolder && (
                        <button className="action-btn primary-btn" onClick={handleViewGallery}>
                            <Photo size={18} />
                            {t('parentEvents.viewGallery', 'View Gallery')}
                            <ExternalLink size={14} />
                        </button>
                    )}
                    <button className="action-btn secondary-btn" onClick={onClose}>
                        {t('general.close', 'Close')}
                    </button>
                </footer>

            </div>
        </div>
    );
};

export default ParentEventModal;