// src/pages/admin/CreateEventPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
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
    IconX as X
} from '@tabler/icons-react';
import './CreateEventPage.css';

const CreateEventPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
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
        requirements: ''
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const eventTypes = [
        {
            id: 'race',
            name: 'Race Event',
            description: 'Competitive racing event with winners',
            icon: '🏁🏎️'
        },
        {
            id: 'newcomers',
            name: 'New Families Event',
            description: 'Welcome new families with a fun racing day',
            icon: '👨‍👩‍👧‍👦'
        }
    ];

    // Check permissions on load
    useEffect(() => {
        if (!loading && permissions && !permissions.canCreate) {
            navigate('/admin/events');
        }
    }, [permissions, navigate, loading]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            let imageUrl = null;

            // Upload image to Firebase Storage if one was selected
            if (formData.image) {
                try {
                    // Create a unique filename
                    const timestamp = Date.now();
                    const fileName = `events/${timestamp}_${formData.image.name}`;
                    const storageRef = ref(storage, fileName);

                    // Upload the file
                    console.log('Uploading image...');
                    const snapshot = await uploadBytes(storageRef, formData.image);

                    // Get the download URL
                    imageUrl = await getDownloadURL(snapshot.ref);
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (imageError) {
                    console.error('Error uploading image:', imageError);
                    alert('Warning: Failed to upload image, but event will be created without it.');
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
                participatingTeams: [], // Empty array for team references
                image: imageUrl, // Add the uploaded image URL
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add document to Firestore
            const docRef = await addDoc(collection(db, 'events'), eventDoc);

            console.log('Event created with ID:', docRef.id);
            alert('Event created successfully!');

            // Navigate back to events list
            navigate('/admin/events');
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Error creating event: ' + error.message);
        } finally {
            setIsSubmitting(false);
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

                    {/* Validation Errors - REMOVED */}

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
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default CreateEventPage;