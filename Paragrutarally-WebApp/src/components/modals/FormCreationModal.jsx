// src/components/modals/FormCreationModal.jsx - Updated with Event Selection
import React, { useState, useEffect } from 'react';
import { createForm } from '@/services/formService.js';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    IconX as X,
    IconCheck as Check,
    IconPlus as Plus,
    IconTrash as Trash2,
    IconCalendar as Calendar,
    IconMapPin as MapPin,
    IconUsers as Users,
    IconFileText as FileText,
    IconClock as Clock,
    IconDeviceFloppy as Save,
    IconRefresh as Refresh
} from '@tabler/icons-react';
import './FormCreationModal.css';

const FormCreationModal = ({
                               isOpen,
                               templateType = null,
                               onClose,
                               onSuccess
                           }) => {
    const { t, isRTL } = useLanguage();
    const { user } = usePermissions();

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'event_registration', // Fixed to event registration
        status: 'draft',
        targetUsers: ['parent'],

        // Event details - Updated with separate date and time fields
        eventDate: '',
        startTime: '',
        endTime: '',
        location: '',
        googleMapsLink: '',
        wazeLink: '',
        notes: '',
        paymentLink: '',
        closingNotes: '',
        contactInfo: ['']
    });

    // Load events when modal opens
    useEffect(() => {
        if (isOpen) {
            loadEvents();
            
            // Set targetUsers based on templateType
            if (templateType === 'instructor') {
                setFormData(prev => ({
                    ...prev,
                    targetUsers: ['instructor']
                }));
            } else if (templateType === 'parent') {
                setFormData(prev => ({
                    ...prev,
                    targetUsers: ['parent']
                }));
            }
        }
    }, [isOpen, templateType]);

    // Load events from database
    const loadEvents = async () => {
        try {
            setLoadingEvents(true);

            // Import events service
            const { getAllEvents } = await import('../../services/eventService'); // Adjust path as needed
            const eventsData = await getAllEvents();

            // Filter for upcoming events only
            const upcomingEvents = eventsData.filter(event => event.status === 'upcoming');
            setEvents(upcomingEvents);

        } catch (error) {
            console.error('Error loading events:', error);
            // If events service doesn't exist, we'll handle it gracefully
            setEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    };

    // Handle event selection
    const handleEventSelection = (eventId) => {
        setSelectedEventId(eventId);

        if (!eventId) {
            // Clear event-related fields if no event selected
            setFormData(prev => ({
                ...prev,
                eventDate: '',
                startTime: '',
                endTime: '',
                location: ''
            }));
            return;
        }

        // Find selected event and populate fields
        const selectedEvent = events.find(event => event.id === eventId);
        if (selectedEvent) {
            // Parse the date from the event
            let eventDate = '';
            if (selectedEvent.date && selectedEvent.date !== 'Date TBD') {
                try {
                    const date = new Date(selectedEvent.date);
                    if (!isNaN(date.getTime())) {
                        eventDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                    }
                } catch (error) {
                    console.warn('Could not parse event date:', selectedEvent.date);
                }
            }

            setFormData(prev => ({
                ...prev,
                title: `${t('forms.registrationFor', 'Registration for')} ${selectedEvent.name}`,
                eventDate: eventDate,
                startTime: '', // Events don't seem to have separate start/end times
                endTime: '',
                location: selectedEvent.location || '',
                notes: selectedEvent.description || selectedEvent.notes || ''
            }));
        }
    };

    // Handle form data change
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle target users change
    const handleTargetUsersChange = (userType) => {
        setFormData(prev => ({
            ...prev,
            targetUsers: prev.targetUsers.includes(userType)
                ? prev.targetUsers.filter(u => u !== userType)
                : [...prev.targetUsers, userType]
        }));
    };

    // Handle contact info changes
    const updateContactInfo = (index, value) => {
        setFormData(prev => ({
            ...prev,
            contactInfo: prev.contactInfo.map((contact, i) =>
                i === index ? value : contact
            )
        }));
    };

    const addContactInfo = () => {
        setFormData(prev => ({
            ...prev,
            contactInfo: [...prev.contactInfo, '']
        }));
    };

    const removeContactInfo = (index) => {
        if (formData.contactInfo.length > 1) {
            setFormData(prev => ({
                ...prev,
                contactInfo: prev.contactInfo.filter((_, i) => i !== index)
            }));
        }
    };

    // Format date and time for submission
    const formatDateTime = () => {
        if (!formData.eventDate) return '';

        const date = new Date(formData.eventDate);
        const dayName = date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'long' });
        const dateStr = date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let timeStr = '';
        if (formData.startTime) {
            timeStr = formData.startTime;
            if (formData.endTime) {
                timeStr += ` - ${formData.endTime}`;
            }
        }

        return `${dayName}, ${dateStr}${timeStr ? ` (${timeStr})` : ''}`;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            alert(t('forms.titleRequired', 'Form title is required'));
            return;
        }

        setIsSubmitting(true);
        try {
            // Clean up contact info
            const cleanContactInfo = formData.contactInfo.filter(contact => contact.trim());

            // Prepare form data
            const formToCreate = {
                title: formData.title,
                description: formData.description,
                type: 'event_registration', // Fixed type
                status: formData.status,
                targetUsers: formData.targetUsers,

                // Event details for registration forms
                eventDetails: {
                    selectedEventId: selectedEventId || null, // Store reference to source event
                    dayAndDate: formatDateTime(),
                    eventDate: formData.eventDate,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    location: formData.location,
                    googleMapsLink: formData.googleMapsLink,
                    wazeLink: formData.wazeLink,
                    notes: formData.notes,
                    paymentLink: formData.paymentLink,
                    closingNotes: formData.closingNotes,
                    contactInfo: cleanContactInfo
                }
            };

            // Create the form
            const formId = await createForm(formToCreate, user.uid);

            if (onSuccess) {
                onSuccess(formId);
            }

            alert(t('forms.formCreatedSuccess', 'Form created successfully!'));
            onClose();
        } catch (error) {
            console.error('Error creating form:', error);
            alert(t('forms.formCreateError', 'Error creating form. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form when modal closes
    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            type: 'event_registration',
            status: 'draft',
            targetUsers: ['parent'],
            eventDate: '',
            startTime: '',
            endTime: '',
            location: '',
            googleMapsLink: '',
            wazeLink: '',
            notes: '',
            paymentLink: '',
            closingNotes: '',
            contactInfo: ['']
        });
        setSelectedEventId('');
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="form-creation-modal-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-creation-modal-content">
                <div className="form-creation-modal-header">
                    <h3>
                        <FileText size={24} />
                        {t('forms.createEventRegistration', 'Create Event Registration Form')}
                    </h3>
                    <button className="form-creation-modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="form-creation-modal-body">
                    {/* Basic Form Information */}
                    <div className="form-section">
                        <h4>
                            <FileText size={18} />
                            {t('forms.basicInformation', 'Basic Information')}
                        </h4>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('forms.formTitle', 'Form Title')} *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder={t('forms.titlePlaceholder', 'Enter form title...')}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('forms.status', 'Status')}</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="draft">{t('forms.status.draft', 'Draft')}</option>
                                    <option value="active">{t('forms.status.active', 'Active')}</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>{t('forms.description', 'Description')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder={t('forms.descriptionPlaceholder', 'Describe what this form is for...')}
                                    className="form-textarea"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Target Users */}
                    <div className="form-section">
                        <h4>
                            <Users size={18} />
                            {t('forms.targetUsers', 'Target Users')}
                        </h4>

                        <div className="target-users-grid">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.targetUsers.includes('parent')}
                                    onChange={() => handleTargetUsersChange('parent')}
                                />
                                {t('forms.parents', 'Parents')}
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.targetUsers.includes('instructor')}
                                    onChange={() => handleTargetUsersChange('instructor')}
                                />
                                {t('forms.instructors', 'Instructors')}
                            </label>
                        </div>
                    </div>

                    {/* Event Selection & Details */}
                    <div className="form-section">
                        <h4>
                            <Calendar size={18} />
                            {t('forms.eventDetails', 'Event Details')}
                        </h4>

                        {/* Event Selection */}
                        <div className="form-group full-width">
                            <label>
                                {t('forms.selectEvent', 'Select Existing Event')}
                                <button
                                    type="button"
                                    onClick={loadEvents}
                                    className="refresh-events-btn"
                                    disabled={loadingEvents}
                                    title={t('forms.refreshEvents', 'Refresh Events')}
                                >
                                    <Refresh size={14} className={loadingEvents ? 'spinning' : ''} />
                                </button>
                            </label>
                            <select
                                value={selectedEventId}
                                onChange={(e) => handleEventSelection(e.target.value)}
                                className="form-select"
                                disabled={loadingEvents}
                            >
                                <option value="">
                                    {loadingEvents
                                        ? t('forms.loadingEvents', 'Loading events...')
                                        : t('forms.selectEventOption', 'Select an event or enter manually')
                                    }
                                </option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>
                                        🏁 {event.name} {event.date && event.date !== 'Date TBD' ? `(${event.date})` : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedEventId && (
                                <div className="selected-event-info">
                                    <small>
                                        {t('forms.eventSelected', 'Event selected - form fields have been auto-filled')}
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('forms.eventDate', 'Event Date')}</label>
                                <input
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('forms.startTime', 'Start Time')}</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('forms.endTime', 'End Time')}</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>{t('forms.location', 'Location')}</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder={t('forms.eventLocation', 'Enter event location...')}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('forms.googleMapsLink', 'Google Maps Link')}</label>
                                <input
                                    type="url"
                                    value={formData.googleMapsLink}
                                    onChange={(e) => handleInputChange('googleMapsLink', e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('forms.wazeLink', 'Waze Link')}</label>
                                <input
                                    type="url"
                                    value={formData.wazeLink}
                                    onChange={(e) => handleInputChange('wazeLink', e.target.value)}
                                    placeholder="https://waze.com/..."
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>{t('forms.paymentLink', 'Payment Link (Optional)')}</label>
                                <input
                                    type="url"
                                    value={formData.paymentLink}
                                    onChange={(e) => handleInputChange('paymentLink', e.target.value)}
                                    placeholder="https://bit.ly/payment-link"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Date/Time Preview */}
                        {formData.eventDate && (
                            <div className="datetime-preview">
                                <label>{t('forms.eventDateTime', 'Event Date & Time Preview')}:</label>
                                <div className="preview-text">
                                    {formatDateTime()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="form-section">
                        <h4>{t('forms.additionalInformation', 'Additional Information')}</h4>

                        <div className="form-group">
                            <label>{t('forms.notes', 'Event Notes')}</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder={t('forms.notesPlaceholder', 'Additional information about the event...')}
                                className="form-textarea"
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('forms.closingNotes', 'Closing Notes')}</label>
                            <textarea
                                value={formData.closingNotes}
                                onChange={(e) => handleInputChange('closingNotes', e.target.value)}
                                placeholder={t('forms.closingNotesPlaceholder', 'Closing message for the form...')}
                                className="form-textarea"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="form-section">
                        <h4>
                            {t('forms.contactInformation', 'Contact Information')}
                        </h4>

                        <div className="contact-info-section">
                            {formData.contactInfo.map((contact, index) => (
                                <div key={index} className="contact-item">
                                    <input
                                        type="text"
                                        value={contact}
                                        onChange={(e) => updateContactInfo(index, e.target.value)}
                                        placeholder={t('forms.contactPlaceholder', 'Enter contact information...')}
                                        className="form-input"
                                    />
                                    {formData.contactInfo.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeContactInfo(index)}
                                            className="remove-contact-btn"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addContactInfo}
                                className="add-contact-btn"
                            >
                                <Plus size={16} />
                                {t('forms.addContact', 'Add Contact Info')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-creation-modal-footer">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-secondary"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.title.trim()}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? (
                            <>
                                <Clock className="loading-spinner" size={16} />
                                {t('forms.creating', 'Creating...')}
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {t('forms.createForm', 'Create Form')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormCreationModal;