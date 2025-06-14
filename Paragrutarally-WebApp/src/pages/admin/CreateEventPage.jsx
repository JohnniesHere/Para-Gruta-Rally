// src/pages/admin/CreateEventPage.jsx - Racing Theme Event Creation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    IconPlus as Plus
} from '@tabler/icons-react';
import './CreateEventPage.css';

const CreateEventPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

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
        prizes: '',
        entryFee: ''
    });

    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Mock participants data
    const [availableParticipants] = useState([
        { id: '1', name: 'John Doe', email: 'john@example.com', team: 'Speed Demons' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', team: 'Racing Eagles' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', team: 'Thunder Bolts' },
        { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', team: 'Lightning Fast' },
        { id: '5', name: 'Tom Brown', email: 'tom@example.com', team: 'Speed Demons' }
    ]);

    const eventTypes = [
        {
            id: 'race',
            name: 'Racing Competition',
            description: 'Competitive racing event with winners',
            icon: '🏁'
        },
        {
            id: 'practice',
            name: 'Practice Session',
            description: 'Training and skill development',
            icon: '🎯'
        },
        {
            id: 'workshop',
            name: 'Educational Workshop',
            description: 'Learning and safety training',
            icon: '🎓'
        },
        {
            id: 'social',
            name: 'Social Event',
            description: 'Team building and community',
            icon: '🎉'
        }
    ];

    // Check permissions on load
    useEffect(() => {
        if (permissions && !permissions.canCreate) {
            navigate('/admin/events');
        }
    }, [permissions, navigate]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear validation errors when user starts typing
        if (validationErrors.length > 0) {
            setValidationErrors([]);
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

    const handleParticipantToggle = (participant) => {
        setSelectedParticipants(prev => {
            const isSelected = prev.find(p => p.id === participant.id);
            if (isSelected) {
                return prev.filter(p => p.id !== participant.id);
            } else {
                return [...prev, participant];
            }
        });
    };

    const adjustCapacity = (increment) => {
        const newValue = formData.maxParticipants + increment;
        if (newValue >= 1 && newValue <= 500) {
            handleInputChange('maxParticipants', newValue);
        }
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.name.trim()) errors.push('Event name is required');
        if (!formData.description.trim()) errors.push('Event description is required');
        if (!formData.date) errors.push('Event date is required');
        if (!formData.time) errors.push('Event time is required');
        if (!formData.location.trim()) errors.push('Location is required');
        if (!formData.address.trim()) errors.push('Address is required');
        if (!formData.organizer.trim()) errors.push('Organizer name is required');
        if (formData.maxParticipants < 1) errors.push('Maximum participants must be at least 1');

        // Check if date is in the future
        const eventDateTime = new Date(`${formData.date}T${formData.time}`);
        if (eventDateTime <= new Date()) {
            errors.push('Event date and time must be in the future');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('Event created:', {
                ...formData,
                participants: selectedParticipants
            });

            // Navigate back to events list
            navigate('/admin/events');
        } catch (error) {
            console.error('Error creating event:', error);
            setValidationErrors(['Failed to create event. Please try again.']);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = () => {
        if (validateForm()) {
            console.log('Preview event:', formData);
            // In a real app, this might open a preview modal
        }
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

    return (
        <Dashboard>
            <div className={`create-event-page admin-page ${appliedTheme}-mode`}>
                {/* Header */}
                <div className="page-header">
                    <button
                        onClick={() => navigate('/admin/events')}
                        className="back-button"
                    >
                        <ArrowLeft size={20} />
                        Back to Events
                    </button>

                    <h1 className="page-title">
                        <Trophy size={32} className="page-title-icon" />
                        Create Racing Event
                        <Sparkles size={24} className="sparkle-icon" />
                    </h1>
                </div>

                <div className="admin-container create-event-container">
                    {/* Racing Theme Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h2>
                                    <Flag size={28} className="page-title-icon" />
                                    Racing Event Control Center
                                </h2>
                                <p className="subtitle">Create an amazing racing experience! 🏁</p>
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="validation-summary">
                            <div className="validation-title">
                                <AlertTriangle size={20} />
                                Please fix the following issues:
                            </div>
                            <ul className="validation-list">
                                {validationErrors.map((error, index) => (
                                    <li key={index} className="validation-item">
                                        <span>•</span> {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

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
                                    className="form-input"
                                    placeholder="e.g., Summer Racing Championship 2025"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
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
                                    className="form-textarea"
                                    rows="4"
                                    placeholder="Describe your racing event in detail..."
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Organizer *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Event organizer name"
                                    value={formData.organizer}
                                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                                />
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
                                        className="date-input"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Event Time *</label>
                                    <input
                                        type="time"
                                        className="time-input"
                                        value={formData.time}
                                        onChange={(e) => handleInputChange('time', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="form-section event-location-section">
                            <div className="section-header">
                                <MapPin className="section-icon" size={24} />
                                <h3>📍 Location Details</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Venue Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Jerusalem Racing Park"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Address *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Complete address with city and postal code"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Participants */}
                        <div className="form-section event-participants-section">
                            <div className="section-header">
                                <Users className="section-icon" size={24} />
                                <h3>👥 Participants</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Maximum Participants</label>
                                <div className="capacity-controls">
                                    <button
                                        type="button"
                                        className="capacity-button"
                                        onClick={() => adjustCapacity(-5)}
                                        disabled={formData.maxParticipants <= 5}
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="capacity-display">{formData.maxParticipants}</span>
                                    <button
                                        type="button"
                                        className="capacity-button"
                                        onClick={() => adjustCapacity(5)}
                                        disabled={formData.maxParticipants >= 500}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Pre-select Participants (Optional)
                                    <span className="selected-count">
                                        {selectedParticipants.length} selected
                                    </span>
                                </label>
                                <div className="participants-grid">
                                    {availableParticipants.map(participant => (
                                        <div
                                            key={participant.id}
                                            className={`participant-card ${
                                                selectedParticipants.find(p => p.id === participant.id) ? 'selected' : ''
                                            }`}
                                            onClick={() => handleParticipantToggle(participant)}
                                        >
                                            <div className="participant-name">{participant.name}</div>
                                            <div className="participant-details">
                                                {participant.email} • {participant.team}
                                            </div>
                                            {selectedParticipants.find(p => p.id === participant.id) && (
                                                <Check className="selected-indicator" size={16} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="form-section event-details-section">
                            <div className="section-header">
                                <Target className="section-icon" size={24} />
                                <h3>📝 Additional Details</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Entry Fee (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., $50 or Free"
                                    value={formData.entryFee}
                                    onChange={(e) => handleInputChange('entryFee', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Requirements (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Special requirements, equipment needed, etc."
                                    value={formData.requirements}
                                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Prizes & Rewards (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Describe prizes, trophies, or recognition..."
                                    value={formData.prizes}
                                    onChange={(e) => handleInputChange('prizes', e.target.value)}
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
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Clock className="loading-spinner" size={16} />
                                        Creating Event...
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
            </div>
        </Dashboard>
    );
};

export default CreateEventPage;