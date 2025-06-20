// src/pages/admin/CreateEventPage.jsx - Updated with Gallery Integration and Image Cleanup
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import TeamAssignmentModal from '../../components/modals/TeamAssignmentModal';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
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
    IconTrash as Trash
} from '@tabler/icons-react';
import './CreateEventPage.css';

const CreateEventPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t, isRTL } = useLanguage();
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
        maxParticipants: 50,
        image: null,
        organizer: '',
        requirements: '',
        createGalleryFolder: true, // New option for gallery folder creation
        participatingTeams: [] // Add participating teams
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Team assignment modal state
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamsData, setTeamsData] = useState({});
    const [loadingTeams, setLoadingTeams] = useState(false);

    const eventTypes = [
        {
            id: 'race',
            name: 'Racing Event',
            description: 'Competitive racing event with winners',
            icon: '🏁🏎️'
        },
        {
            id: 'newcomers',
            name: 'New Families Event',
            description: 'Welcome new families with a fun racing day',
            icon: '👨‍👩‍👧‍👦'
        },
        {
            id: 'social',
            name: 'Social Event',
            description: 'Community gathering and activities',
            icon: '🎉🎊'
        }
    ];

    // Debug user claims on mount
    useEffect(() => {
        if (user && !loading) {
            debugUserClaims();
        }
    }, [user, loading]);

    // Check permissions on load
    useEffect(() => {
        if (!loading && permissions && !permissions.canCreate) {
            navigate('/admin/events');
        }
    }, [permissions, navigate, loading]);

    // Load teams data for participating teams display
    useEffect(() => {
        if (formData.participatingTeams.length > 0) {
            loadTeamsData();
        }
    }, [formData.participatingTeams]);

    // Debug function to check user permissions
    const debugUserClaims = async () => {
        try {
            if (user) {
                const idTokenResult = await user.getIdTokenResult();
                console.log('User ID Token Claims:', idTokenResult.claims);
                console.log('User Role from Claims:', idTokenResult.claims.role);
                console.log('User Data from Hook:', userData);
                console.log('User Role from Hook:', userRole);
            } else {
                console.log('No user logged in');
            }
        } catch (error) {
            console.error('Error getting user claims:', error);
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
            setFormData(prev => ({ ...prev, image: file }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
    };

    const adjustCapacity = (increment) => {
        const newValue = formData.maxParticipants + increment;
        if (newValue >= 1 && newValue <= 500) {
            handleInputChange('maxParticipants', newValue);
        }
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
        if (formData.maxParticipants < 1) errors.maxParticipants = true;

        // Check if date is in the future
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

    /**
     * Create gallery folder for the event by uploading a placeholder file
     * Uses only the event name (same format as when photos are uploaded)
     * @param {string} eventName - Name of the event to create folder for
     */
    const createEventGalleryFolder = async (eventName) => {
        try {
            // Debug logging
            console.log('createEventGalleryFolder called with:');
            console.log('- eventName:', eventName);

            // Validate inputs
            if (!eventName) {
                throw new Error(`Missing required parameter: eventName=${eventName}`);
            }

            // Use the event name directly as the folder path (same as photo upload logic)
            const folderPath = `gallery/events/${eventName}`;

            console.log('Creating folder at path:', folderPath);

            // Create a placeholder file to establish the folder structure
            const placeholderContent = JSON.stringify({
                eventName: eventName,
                createdAt: new Date().toISOString(),
                description: "This folder contains photos for the event: " + eventName,
                instructions: "Upload event photos to this folder. This placeholder file can be deleted once photos are uploaded.",
                folderType: "event_gallery"
            }, null, 2);

            // Convert the content to a blob
            const blob = new Blob([placeholderContent], { type: 'application/json' });

            // Create storage reference for the placeholder file
            const placeholderRef = ref(storage, `${folderPath}/.folder_info.json`);

            // Upload the placeholder file
            console.log(`Uploading placeholder file to: ${folderPath}/.folder_info.json`);
            const snapshot = await uploadBytes(placeholderRef, blob);
            console.log('Gallery folder created successfully with placeholder file');

            // Return the folder path for reference
            return {
                success: true,
                folderPath: folderPath,
                placeholderUrl: await getDownloadURL(snapshot.ref)
            };
        } catch (error) {
            console.error('Error creating gallery folder:', error);
            console.error('Error details:', {
                eventName,
                errorMessage: error.message,
                errorStack: error.stack
            });
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * Delete event image from Firebase Storage
     * @param {string} imageUrl - The full URL of the image to delete
     */
    const deleteEventImage = async (imageUrl) => {
        try {
            if (!imageUrl) return;

            // Extract the storage path from the URL
            // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
            const url = new URL(imageUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)$/);

            if (pathMatch) {
                const encodedPath = pathMatch[1];
                const decodedPath = decodeURIComponent(encodedPath);

                console.log('Deleting image from storage:', decodedPath);
                const imageRef = ref(storage, decodedPath);
                await deleteObject(imageRef);
                console.log('Image deleted successfully from storage');
                return true;
            } else {
                console.warn('Could not extract storage path from URL:', imageUrl);
                return false;
            }
        } catch (error) {
            console.error('Error deleting image from storage:', error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        let imageUrl = null;
        let uploadedImageRef = null;

        try {
            // Upload image to Firebase Storage if one was selected
            if (formData.image) {
                try {
                    setIsUploadingImage(true);
                    // Create a unique filename
                    const timestamp = Date.now();
                    const fileName = `events/${timestamp}_${formData.image.name}`;
                    const storageRef = ref(storage, fileName);
                    uploadedImageRef = storageRef;

                    // Upload the file
                    console.log('Uploading image...');
                    const snapshot = await uploadBytes(storageRef, formData.image);

                    // Get the download URL
                    imageUrl = await getDownloadURL(snapshot.ref);
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (imageError) {
                    console.error('Error uploading image:', imageError);
                    alert('Warning: Failed to upload image, but event will be created without it.');
                    uploadedImageRef = null;
                } finally {
                    setIsUploadingImage(false);
                }
            }

            // Create event document structure matching Firestore
            const eventDoc = {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                date: formData.date,
                notes: formData.requirements || "Additional notes about the event",
                status: "upcoming", // Default status for new events
                attendees: 0, // Start with 0 attendees
                participatingTeams: formData.participatingTeams, // Add participating teams
                image: imageUrl, // Add the uploaded image URL
                hasGalleryFolder: formData.createGalleryFolder, // Track if gallery folder was created
                galleryFolderPath: null, // Will be updated after folder creation
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add document to Firestore
            console.log('Creating event document...');
            const docRef = await addDoc(collection(db, 'events'), eventDoc);

            // Extract the document ID
            const eventId = docRef.id;
            console.log('Event created with document ID:', eventId);
            console.log('DocRef object:', docRef);

            // Ensure we have a valid document ID
            if (!eventId || eventId === undefined) {
                throw new Error('Failed to get event document ID from Firestore');
            }

            // Create gallery folder if requested
            let galleryResult = null;
            if (formData.createGalleryFolder) {
                console.log('Creating gallery folder for event:', formData.name);
                galleryResult = await createEventGalleryFolder(formData.name);

                if (galleryResult.success) {
                    console.log('Gallery folder created successfully at:', galleryResult.folderPath);

                    // Update the event document with the gallery folder path
                    try {
                        await updateDoc(docRef, {
                            galleryFolderPath: galleryResult.folderPath,
                            updatedAt: serverTimestamp()
                        });
                        console.log('Event document updated with gallery path');
                    } catch (updateError) {
                        console.error('Failed to update event document with gallery path:', updateError);
                    }

                    alert(`Event created successfully!\nGallery folder created at: ${galleryResult.folderPath}`);
                } else {
                    console.warn('Gallery folder creation failed:', galleryResult.error);
                    alert(`Event created successfully, but gallery folder creation failed: ${galleryResult.error}`);
                }
            } else {
                alert('Event created successfully!');
            }

            // Navigate back to events list
            navigate('/admin/events');
        } catch (error) {
            console.error('Error creating event:', error);

            // If event creation failed and we uploaded an image, clean it up
            if (uploadedImageRef && imageUrl) {
                console.log('Cleaning up uploaded image due to event creation failure...');
                try {
                    await deleteObject(uploadedImageRef);
                    console.log('Uploaded image cleaned up successfully');
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded image:', cleanupError);
                }
            }

            alert('Error creating event: ' + error.message);
        } finally {
            setIsSubmitting(false);
            setIsUploadingImage(false);
        }
    };

    const handlePreview = () => {
        if (validateForm()) {
            setShowPreview(true);
        }
    };

    const handleClosePreview = () => {
        setShowPreview(false);
    };

    // Show loading if permissions not loaded yet
    if (!permissions) {
        return (
            <Dashboard>
                <div className="create-event-page">
                    <div className="loading-container">
                        <div className="loading-content">
                            <Clock className="loading-spinner" size={40} />
                            <p>Loading permissions...</p>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    // Format date for display
    const formatEventDate = () => {
        if (!formData.date) return 'Not set';
        const date = new Date(formData.date);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dashboard>
            <div className={`create-event-page admin-page ${appliedTheme}-mode`}>
                {/* Header */}
                <button
                    onClick={() => navigate('/admin/events')}
                    className={`back-button ${appliedTheme}-back-button`}
                >
                    <ArrowLeft size={20} />
                    Back to Events
                </button>
                <div className="page-header">
                    <div className="title-section">
                        <h1 className="page-title">
                            <Trophy size={32} className="page-title-icon" />
                            Create Racing Event
                        </h1>
                    </div>
                </div>

                <div className="admin-container create-event-container">
                    {/* Racing Theme Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h2>
                                    <Flag size={28} className="page-title-icon" />
                                    Event Control Center
                                    <Flag size={28} className="page-title-icon" />
                                </h2>
                                <p className="subtitle">Choose one of the event types below 🏁</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="create-event-form">
                        {/* Event Basic Information */}
                        <div className="form-section event-basic-section">
                            <div className="section-header">
                                <Trophy className="section-icon" size={24} />
                                <h3>📋 Basic Information</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Name *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                                    placeholder="e.g., Summer Racing Championship 2025"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                                {fieldErrors.name && <div className="field-error">*Required field</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Type *</label>
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
                                <label className="form-label">Description *</label>
                                <textarea
                                    className={`form-textarea ${fieldErrors.description ? 'error' : ''}`}
                                    rows="4"
                                    placeholder="Describe your racing event in detail..."
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />
                                {fieldErrors.description && <div className="field-error">*Required field</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Organizer *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.organizer ? 'error' : ''}`}
                                    placeholder="Event organizer name"
                                    value={formData.organizer}
                                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                                />
                                {fieldErrors.organizer && <div className="field-error">*Required field</div>}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="form-section event-datetime-section">
                            <div className="section-header">
                                <Calendar className="section-icon calendar-icon" size={24} />
                                <h3>📅 Date & Time</h3>
                            </div>

                            <div className="datetime-group">
                                <div className="form-group">
                                    <label className="form-label">Event Date *</label>
                                    <input
                                        type="date"
                                        className={`date-input ${fieldErrors.date ? 'error' : ''}`}
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    {fieldErrors.date && <div className="field-error">*Required field</div>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Event Time *</label>
                                    <input
                                        type="time"
                                        className={`time-input ${fieldErrors.time ? 'error' : ''}`}
                                        value={formData.time}
                                        onChange={(e) => handleInputChange('time', e.target.value)}
                                    />
                                    {fieldErrors.time && <div className="field-error">*Required field</div>}
                                </div>
                            </div>
                            {fieldErrors.dateTime && <div className="field-error">*Event date and time must be in the future</div>}
                        </div>
                        {/* Location */}
                        <div className="form-section event-location-section">
                            <div className="section-header">
                                <MapPin className="section-icon" size={24} />
                                <h3>📍 Location Details</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Location Name *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.location ? 'error' : ''}`}
                                    placeholder="e.g., Jerusalem Racing Park"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                                {fieldErrors.location && <div className="field-error">*Required field</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Address *</label>
                                <input
                                    type="text"
                                    className={`form-input ${fieldErrors.address ? 'error' : ''}`}
                                    placeholder="Complete address of the event"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                                {fieldErrors.address && <div className="field-error">*Required field</div>}
                            </div>
                        </div>

                        {/* Teams Section */}
                        <div className="form-section event-teams-section">
                            <div className="section-header">
                                <Users className="section-icon" size={24} />
                                <h3>🏁 Participating Teams</h3>
                            </div>

                            <div className="teams-management">
                                <div className="teams-header">
                                    <div className="teams-count">
                                        {formData.participatingTeams.length} team{formData.participatingTeams.length !== 1 ? 's' : ''} assigned
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowTeamModal(true)}
                                        className="btn-add-teams"
                                    >
                                        <UserPlus size={16} />
                                        Add Teams
                                    </button>
                                </div>

                                {formData.participatingTeams.length > 0 ? (
                                    <div className="assigned-teams">
                                        {formData.participatingTeams.map(teamId => (
                                            <div key={teamId} className="assigned-team-item">
                                                <div className="team-info">
                                                    <Users size={16} className="team-icon" />
                                                    <span className="team-name">
                                                        {loadingTeams ? 'Loading...' : (teamsData[teamId]?.name || 'Unknown Team')}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTeam(teamId)}
                                                    className="btn-remove-team"
                                                    title="Remove team"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-teams-assigned">
                                        <Users size={24} className="no-teams-icon" />
                                        <p>No teams assigned to this event yet.</p>
                                        <p className="no-teams-hint">Click "Add Teams" to assign teams to participate.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gallery & Media Section */}
                        <div className="form-section event-gallery-section">
                            <div className="section-header">
                                <Upload className="section-icon" size={24} />
                                <h3>📷 Gallery & Media</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Image (Optional)</label>
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
                                            <div className="upload-text">Click to upload event image</div>
                                            <div className="upload-hint">Recommended: 1200x600px, JPG or PNG</div>
                                        </>
                                    ) : (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" className="preview-image" />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveImage();
                                                }}
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.createGalleryFolder}
                                            onChange={(e) => handleInputChange('createGalleryFolder', e.target.checked)}
                                            className="checkbox-input"
                                        />
                                        <span className="checkbox-custom"></span>
                                        <div className="checkbox-content">
                                            <div className="checkbox-title">
                                                <Folder size={16} />
                                                Create Gallery Folder
                                            </div>
                                            <div className="checkbox-description">
                                                Automatically create a dedicated photo gallery folder for this event.
                                                Participants and organizers can upload photos that will be organized under "{formData.name} Album".
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                {formData.createGalleryFolder && (
                                    <div className="gallery-info">
                                        <div className="info-box">
                                            <Folder className="info-icon" size={16} />
                                            <div className="info-content">
                                                <strong>Gallery Location:</strong> gallery/events/{formData.name || '[Event Name]'}
                                                <br />
                                                <strong>Album Name:</strong> {formData.name ? `${formData.name} Album` : '[Event Name] Album'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="form-section event-details-section">
                            <div className="section-header">
                                <Target className="section-icon" size={24} />
                                <h3>📝 Additional Details</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Additional notes about the event..."
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
                                onClick={() => navigate('/admin/events')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-outline"
                                onClick={handlePreview}
                                disabled={isSubmitting}
                            >
                                <Eye size={16} />
                                Preview
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting || isUploadingImage}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Clock className="loading-spinner" size={16} />
                                        {isUploadingImage ? 'Uploading Image...' : 'Creating Event...'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Create Event
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview Modal */}
                {showPreview && (
                    <div className="modal-overlay" onClick={handleClosePreview}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{formData.name || 'Event Preview'}</h2>
                                <button
                                    className="modal-close"
                                    onClick={handleClosePreview}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt={formData.name}
                                        className="event-modal-image"
                                    />
                                )}
                                {!imagePreview && (
                                    <img
                                        src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
                                        alt="Default event"
                                        className="event-modal-image"
                                        style={{ opacity: 0.6 }}
                                    />
                                )}
                                <div className="event-modal-details">
                                    <div className="event-detail-item">
                                        <strong>Date:</strong>
                                        <p>{formatEventDate()}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Location:</strong>
                                        <p>{formData.location || 'Not specified'}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Address:</strong>
                                        <p>{formData.address || 'Not specified'}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Organizer:</strong>
                                        <p>{formData.organizer || 'Not specified'}</p>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Status:</strong>
                                        <span className="status-badge status-upcoming">
                                            <Trophy size={14} style={{ marginRight: '4px' }} />
                                            Upcoming
                                        </span>
                                    </div>
                                    <div className="event-detail-item">
                                        <strong>Description:</strong>
                                        <p>{formData.description || 'No description provided'}</p>
                                    </div>
                                    {formData.requirements && (
                                        <div className="event-detail-item">
                                            <strong>Notes:</strong>
                                            <p>{formData.requirements}</p>
                                        </div>
                                    )}
                                    {formData.createGalleryFolder && (
                                        <div className="event-detail-item">
                                            <strong>Gallery:</strong>
                                            <p>
                                                <Folder size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                                                {formData.name ? `${formData.name} Album` : 'Event Album'} will be created
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

export default CreateEventPage;