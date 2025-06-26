// src/pages/admin/EditEventPage.jsx - Event editing with team assignment and translation
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import TeamAssignmentModal from '../../components/modals/TeamAssignmentModal';
import { getAllTeams } from '../../services/teamService';
import {
    IconCalendarEvent as Calendar,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconUsers as Users,
    IconPhoto as Upload,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconTarget as Target,
    IconFlag as Flag,
    IconArrowLeft as ArrowLeft,
    IconDeviceFloppy as Save,
    IconEye as Eye,
    IconMinus as Minus,
    IconPlus as Plus,
    IconX as X,
    IconFolder as Folder,
    IconUserPlus as UserPlus,
    IconTrash as Trash, IconArrowRight as ArrowRight
} from '@tabler/icons-react';
import './CreateEventPage.css'; // Reuse create event styles

const EditEventPage = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t, isRTL, isHebrew } = useLanguage();
    const { permissions, userRole, userData, user, loading } = usePermissions();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'race',
        date: '',
        time: '',
        location: '',
        address: '',
        organizer: '',
        requirements: '',
        participatingTeams: []
    });

    const [originalImageUrl, setOriginalImageUrl] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [newImageFile, setNewImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Team assignment modal state
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamsData, setTeamsData] = useState({});
    const [loadingTeams, setLoadingTeams] = useState(false);

    const eventTypes = [
        {
            id: 'race',
            name: t('events.racingEvent', 'Racing Event'),
            description: t('events.racingEventDescription', 'Competitive racing event with winners'),
            icon: '🏁🏎️'
        },
        {
            id: 'newcomers',
            name: t('events.newFamiliesEvent', 'New Families Event'),
            description: t('events.newFamiliesEventDescription', 'Welcome new families with a fun racing day'),
            icon: '👨‍👩‍👧‍👦'
        },
        {
            id: 'social',
            name: t('events.socialEvent', 'Social Event'),
            description: t('events.socialEventDescription', 'Community gathering and activities'),
            icon: '🎉🎊'
        }
    ];

    // Check permissions on load
    useEffect(() => {
        if (!loading && permissions && !permissions.canEdit) {
            navigate('/admin/events');
        }
    }, [permissions, navigate, loading]);

    // Load event data
    useEffect(() => {
        if (eventId) {
            loadEventData();
        }
    }, [eventId]);

    // Load teams data for participating teams display
    useEffect(() => {
        if (formData.participatingTeams.length > 0) {
            loadTeamsData();
        }
    }, [formData.participatingTeams]);

    const loadEventData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const eventDoc = await getDoc(doc(db, 'events', eventId));

            if (eventDoc.exists()) {
                const eventData = eventDoc.data();

                setFormData({
                    name: eventData.name || '',
                    description: eventData.description || '',
                    type: eventData.type || 'race',
                    date: eventData.date || '',
                    time: eventData.time || '',
                    location: eventData.location || '',
                    address: eventData.address || '',
                    organizer: eventData.organizer || '',
                    requirements: eventData.notes || '',
                    participatingTeams: eventData.participatingTeams || []
                });

                if (eventData.image && !eventData.image.includes('unsplash.com')) {
                    setOriginalImageUrl(eventData.image);
                    setImagePreview(eventData.image);
                }
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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: false
            }));
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setNewImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setNewImageFile(null);
        setImagePreview(originalImageUrl);
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) errors.name = true;
        if (!formData.description.trim()) errors.description = true;
        if (!formData.date) errors.date = true;
        if (!formData.time) errors.time = true;
        if (!formData.location.trim()) errors.location = true;
        if (!formData.address.trim()) errors.address = true;
        if (!formData.organizer.trim()) errors.organizer = true;

        // Check if date is in the future (only for upcoming events)
        const eventDateTime = new Date(`${formData.date}T${formData.time}`);
        if (formData.date && formData.time && eventDateTime <= new Date()) {
            errors.dateTime = true;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAssignTeams = (selectedTeamIds) => {
        setFormData(prev => ({
            ...prev,
            participatingTeams: [...prev.participatingTeams, ...selectedTeamIds]
        }));
        setShowTeamModal(false);
    };

    const handleRemoveTeam = (teamIdToRemove) => {
        setFormData(prev => ({
            ...prev,
            participatingTeams: prev.participatingTeams.filter(id => id !== teamIdToRemove)
        }));
    };

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

                console.log('Deleting old image from storage:', decodedPath);
                const imageRef = ref(storage, decodedPath);
                await deleteObject(imageRef);
                console.log('Old image deleted successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting old image:', error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        let newImageUrl = originalImageUrl;

        try {
            // Handle image upload/replacement
            if (newImageFile) {
                try {
                    setIsUploadingImage(true);

                    // Delete old image if it exists and is not default
                    if (originalImageUrl && !originalImageUrl.includes('unsplash.com')) {
                        await deleteEventImage(originalImageUrl);
                    }

                    // Upload new image
                    const timestamp = Date.now();
                    const fileName = `events/${timestamp}_${newImageFile.name}`;
                    const storageRef = ref(storage, fileName);

                    console.log('Uploading new image...');
                    const snapshot = await uploadBytes(storageRef, newImageFile);
                    newImageUrl = await getDownloadURL(snapshot.ref);
                    console.log('New image uploaded successfully:', newImageUrl);
                } catch (imageError) {
                    console.error('Error uploading new image:', imageError);
                    alert(t('events.imageUploadWarning', 'Warning: Failed to upload new image, but event will be updated with other changes.'));
                    newImageUrl = originalImageUrl; // Keep original image
                } finally {
                    setIsUploadingImage(false);
                }
            }

            // Update event document
            const eventDoc = {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                address: formData.address,
                date: formData.date,
                time: formData.time,
                organizer: formData.organizer,
                notes: formData.requirements || t('events.additionalNotesDefault', 'Additional notes about the event'),
                participatingTeams: formData.participatingTeams,
                image: newImageUrl,
                updatedAt: serverTimestamp()
            };

            await updateDoc(doc(db, 'events', eventId), eventDoc);
            console.log('Event updated successfully');

            alert(t('events.updateSuccess', 'Event updated successfully!'));
            navigate(`/admin/events/view/${eventId}`);
        } catch (error) {
            console.error('Error updating event:', error);
            alert(t('events.updateError', 'Error updating event: {error}', { error: error.message }));
        } finally {
            setIsSubmitting(false);
            setIsUploadingImage(false);
        }
    };

    // Show loading if permissions not loaded yet
    if (!permissions || isLoading) {
        return (
            <Dashboard>
                <div className="create-event-page" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="loading-container">
                        <div className="loading-content">
                            <Clock className="loading-spinner" size={40} />
                            <p>{t('events.loadingEventData', 'Loading event data...')}</p>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard>
                <div className="create-event-page" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button
                            onClick={() => navigate('/admin/events')}
                            className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                            {isHebrew ? (
                                <>
                                    {t('events.backToEvents', 'Back to Events')}
                                    <ArrowRight className="btn-icon" size={20}/>
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="btn-icon" size={20}/>
                                    {t('events.backToEvents', 'Back to Events')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className={`create-event-page admin-page ${appliedTheme}-mode`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <button
                    onClick={() => navigate('/admin/events')}
                    className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                    {isHebrew ? (
                        <>
                            {t('events.backToEvents', 'Back to Events')}
                            <ArrowRight className="btn-icon" size={20}/>
                        </>
                    ) : (
                        <>
                            <ArrowLeft className="btn-icon" size={20}/>
                            {t('events.backToEvents', 'Back to Events')}
                        </>
                    )}
                </button>
                <div className="page-header">
                    <div className="title-section">
                        <h1 className="page-title">
                            <Trophy size={32} className="page-title-icon"/>
                            {t('events.editRacingEvent', 'Edit Racing Event')}
                        </h1>
                    </div>
                </div>

                <div className="admin-container create-event-container">
                    <form onSubmit={handleSubmit} className="create-event-form">
                        {/* Event Basic Information */}
                        <div className="form-section event-basic-section">
                            <div className="section-header">
                                <Trophy className="section-icon" size={24} />
                                <h3>📋 {t('events.basicInformation', 'Basic Information')}</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.eventName', 'Event Name')} *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                                    placeholder={t('events.eventNamePlaceholder', 'e.g., Summer Racing Championship 2025')}
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                                {fieldErrors.name && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.eventType', 'Event Type')} *</label>
                                <div className="event-types">
                                    {eventTypes.map(type => (
                                        <div
                                            key={type.id}
                                            className={`event-type-card ${formData.type === type.id ? 'selected' : ''}`}
                                            onClick={() => handleInputChange('type', type.id)}
                                        >
                                            <span className="event-type-icon">{type.icon}</span>
                                            <div className="event-type-name">{type.name}</div>
                                            <div className="event-type-description">{type.description}</div>
                                            {formData.type === type.id && (
                                                <Check className="selected-indicator" size={20} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.description', 'Description')} *</label>
                                <textarea
                                    className={`form-textarea ${fieldErrors.description ? 'error' : ''}`}
                                    rows="4"
                                    placeholder={t('events.descriptionPlaceholder', 'Describe your racing event in detail...')}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />
                                {fieldErrors.description && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.organizer', 'Organizer')} *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.organizer ? 'error' : ''}`}
                                    placeholder={t('events.organizerPlaceholder', 'Event organizer name')}
                                    value={formData.organizer}
                                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                                />
                                {fieldErrors.organizer && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="form-section event-datetime-section">
                            <div className="section-header">
                                <Calendar className="section-icon calendar-icon" size={24} />
                                <h3>📅 {t('events.dateAndTime', 'Date & Time')}</h3>
                            </div>

                            <div className="datetime-group">
                                <div className="form-group">
                                    <label className="form-label">{t('events.eventDate', 'Event Date')} *</label>
                                    <input
                                        type="date"
                                        className={`date-input ${fieldErrors.date ? 'error' : ''}`}
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    {fieldErrors.date && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('events.eventTime', 'Event Time')} *</label>
                                    <input
                                        type="time"
                                        className={`time-input ${fieldErrors.time ? 'error' : ''}`}
                                        value={formData.time}
                                        onChange={(e) => handleInputChange('time', e.target.value)}
                                    />
                                    {fieldErrors.time && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                                </div>
                            </div>
                            {fieldErrors.dateTime && <div className="field-error">{t('events.futureDateTime', '*Event date and time must be in the future')}</div>}
                        </div>

                        {/* Location */}
                        <div className="form-section event-location-section">
                            <div className="section-header">
                                <MapPin className="section-icon" size={24} />
                                <h3>📍 {t('events.locationDetails', 'Location Details')}</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.locationName', 'Location Name')} *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.location ? 'error' : ''}`}
                                    placeholder={t('events.locationPlaceholder', 'e.g., Jerusalem Racing Park')}
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                                {fieldErrors.location && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.fullAddress', 'Full Address')} *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.address ? 'error' : ''}`}
                                    placeholder={t('events.addressPlaceholder', 'Complete address of the event')}
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                                {fieldErrors.address && <div className="field-error">{t('events.requiredField', '*Required field')}</div>}
                            </div>
                        </div>

                        {/* Teams Section */}
                        <div className="form-section event-teams-section">
                            <div className="section-header">
                                <Users className="section-icon" size={24} />
                                <h3>🏁 {t('events.participatingTeams', 'Participating Teams')}</h3>
                            </div>

                            <div className="teams-management">
                                <div className="teams-header">
                                    <div className="teams-count">
                                        {t('events.teamsAssigned', '{count} team{plural} assigned', {
                                            count: formData.participatingTeams.length,
                                            plural: formData.participatingTeams.length !== 1 ? 's' : ''
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowTeamModal(true)}
                                        className="btn-add-teams"
                                    >
                                        <UserPlus size={16} />
                                        {t('events.addTeams', 'Add Teams')}
                                    </button>
                                </div>

                                {formData.participatingTeams.length > 0 ? (
                                    <div className="assigned-teams">
                                        {formData.participatingTeams.map(teamId => (
                                            <div key={teamId} className="assigned-team-item">
                                                <div className="team-info">
                                                    <Users size={16} className="team-icon" />
                                                    <span className="team-name">
                                                        {loadingTeams ? t('general.loading', 'Loading...') : (teamsData[teamId]?.name || t('events.unknownTeam', 'Unknown Team'))}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTeam(teamId)}
                                                    className="btn-remove-team"
                                                    title={t('events.removeTeam', 'Remove team')}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-teams-assigned">
                                        <Users size={24} className="no-teams-icon" />
                                        <p>{t('events.noTeamsAssigned', 'No teams assigned to this event yet.')}</p>
                                        <p className="no-teams-hint">{t('events.addTeamsHint', 'Click "Add Teams" to assign teams to participate.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gallery & Media Section */}
                        <div className="form-section event-gallery-section">
                            <div className="section-header">
                                <Upload className="section-icon" size={24} />
                                <h3>📷 {t('events.eventImage', 'Event Image')}</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.eventImageOptional', 'Event Image (Optional)')}</label>
                                <div className="image-upload-area" onClick={() => document.getElementById('image-upload').click()}>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    {!imagePreview ? (
                                        <>
                                            <Upload className="upload-icon" size={48} />
                                            <div className="upload-text">{t('events.clickToUpload', 'Click to upload event image')}</div>
                                            <div className="upload-hint">{t('events.imageRecommendation', 'Recommended: 1200x600px, JPG or PNG')}</div>
                                        </>
                                    ) : (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" className="preview-image" />
                                            <div className="image-actions">
                                                {newImageFile && (
                                                    <button
                                                        type="button"
                                                        className="remove-image"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveImage();
                                                        }}
                                                    >
                                                        {t('events.cancelNewImage', 'Cancel New Image')}
                                                    </button>
                                                )}
                                                <div className="upload-text">{t('events.clickToChange', 'Click to change image')}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="form-section event-details-section">
                            <div className="section-header">
                                <Target className="section-icon" size={24} />
                                <h3>📝 {t('events.additionalDetails', 'Additional Details')}</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('events.notesOptional', 'Notes (Optional)')}</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder={t('events.notesPlaceholder', 'Additional notes about the event...')}
                                    value={formData.requirements}
                                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => navigate(`/admin/events/view/${eventId}`)}
                                disabled={isSubmitting}
                            >
                                {t('general.cancel', 'Cancel')}
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting || isUploadingImage}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Clock className="loading-spinner" size={16} />
                                        {isUploadingImage ? t('events.uploadingImage', 'Uploading Image...') : t('events.updatingEvent', 'Updating Event...')}
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {t('events.updateEvent', 'Update Event')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Team Assignment Modal */}
                <TeamAssignmentModal
                    isOpen={showTeamModal}
                    onClose={() => setShowTeamModal(false)}
                    onAssignTeams={handleAssignTeams}
                    currentTeamIds={formData.participatingTeams}
                    eventName={formData.name}
                />
            </div>
        </Dashboard>
    );
};

export default EditEventPage;