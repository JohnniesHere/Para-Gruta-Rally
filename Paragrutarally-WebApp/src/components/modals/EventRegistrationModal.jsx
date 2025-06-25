// src/components/modals/EventRegistrationModal.jsx - Event Registration Forms
import React, { useState, useEffect } from 'react';
import {
    submitFormResponse,
    uploadSignedDeclaration
} from '../../services/formService';
import { getKidsByParent } from '../../services/kidService';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    IconX as X,
    IconCheck as Check,
    IconClock as Clock,
    IconAlertTriangle as AlertTriangle,
    IconPlus as Plus,
    IconUpload as Upload,
    IconUsers as Users,
    IconShirt as Shirt,
    IconFileText as FileText,
    IconMapPin as MapPin,
    IconExternalLink as ExternalLink
} from '@tabler/icons-react';
import './EventRegistrationModal.css';

const EventRegistrationModal = ({
                                    isOpen,
                                    onClose,
                                    eventData = {},
                                    onSubmit
                                }) => {
    const { t } = useLanguage();
    const { userData, user } = usePermissions();

    // Modal state
    const [formType, setFormType] = useState(null); // 'parent' or 'instructor'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        confirmationStatus: '',
        attendeesCount: 1,
        kidIds: [],
        extraAttendees: [],
        shirts: ['', '', '', '', ''],
        extraShirts: ['', '', '', '', ''],
        declarationFile: null,
        motoForLife: ''
    });

    // Parent specific state
    const [userKids, setUserKids] = useState([]);
    const [selectedKids, setSelectedKids] = useState([]);
    const [needsDeclaration, setNeedsDeclaration] = useState(false);

    // Shirt sizes options
    const shirtSizes = ['2', '4', '6', '8', '10', '12', '14', '16', '18', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

    // Load user's kids if parent
    useEffect(() => {
        if (formType === 'parent' && user?.uid) {
            loadUserKids();
        }
    }, [formType, user]);

    // Check if declaration is needed
    useEffect(() => {
        if (formType === 'parent' && selectedKids.length > 0) {
            const kidsNeedingDeclaration = selectedKids.some(kidId => {
                const kid = userKids.find(k => k.id === kidId);
                return !kid?.signedDeclaration;
            });
            setNeedsDeclaration(kidsNeedingDeclaration);
        }
    }, [selectedKids, userKids, formType]);

    const loadUserKids = async () => {
        try {
            const kids = await getKidsByParent(user.uid);
            setUserKids(kids);
        } catch (error) {
            console.error('Error loading user kids:', error);
        }
    };

    // Handle form type selection
    const handleFormTypeSelect = (type) => {
        setFormType(type);
        // Reset form data when changing type
        setFormData({
            confirmationStatus: '',
            attendeesCount: 1,
            kidIds: [],
            extraAttendees: [],
            shirts: ['', '', '', '', ''],
            extraShirts: ['', '', '', '', ''],
            declarationFile: null,
            motoForLife: ''
        });
        setSelectedKids([]);
    };

    // Handle confirmation status change
    const handleConfirmationChange = (status) => {
        setFormData(prev => ({
            ...prev,
            confirmationStatus: status
        }));
    };

    // Handle kid selection
    const handleKidSelection = (kidId, isSelected) => {
        let newSelectedKids;
        if (isSelected) {
            newSelectedKids = [...selectedKids, kidId];
        } else {
            newSelectedKids = selectedKids.filter(id => id !== kidId);
        }

        setSelectedKids(newSelectedKids);
        setFormData(prev => ({
            ...prev,
            kidIds: newSelectedKids
        }));

        // Update attendees count automatically
        const baseCount = 1; // The parent
        const kidsCount = newSelectedKids.length;
        setFormData(prev => ({
            ...prev,
            attendeesCount: Math.max(baseCount + kidsCount, prev.attendeesCount)
        }));
    };

    // Handle attendees count change
    const handleAttendeesCountChange = (count) => {
        const numCount = parseInt(count) || 1;
        setFormData(prev => ({
            ...prev,
            attendeesCount: numCount
        }));

        // Update extra attendees array if needed
        const baseCount = formType === 'parent' ? 1 + selectedKids.length : 1;
        const extraCount = Math.max(0, numCount - baseCount);

        setFormData(prev => ({
            ...prev,
            extraAttendees: Array.from({ length: extraCount }, (_, i) =>
                prev.extraAttendees[i] || ''
            )
        }));
    };

    // Handle extra attendee info
    const updateExtraAttendee = (index, field, value) => {
        setFormData(prev => {
            const newExtraAttendees = [...prev.extraAttendees];
            if (typeof newExtraAttendees[index] === 'string') {
                // Convert string to object
                newExtraAttendees[index] = {
                    firstName: '',
                    lastName: '',
                    phone: ''
                };
            }
            newExtraAttendees[index] = {
                ...newExtraAttendees[index],
                [field]: value
            };
            return {
                ...prev,
                extraAttendees: newExtraAttendees
            };
        });
    };

    // Handle shirt size selection
    const handleShirtChange = (index, size, isExtra = false) => {
        setFormData(prev => {
            const shirtArray = isExtra ? 'extraShirts' : 'shirts';
            const newShirts = [...prev[shirtArray]];
            newShirts[index] = size;
            return {
                ...prev,
                [shirtArray]: newShirts
            };
        });
    };

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                declarationFile: file
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!formData.confirmationStatus) {
            alert(t('forms.selectConfirmationStatus', 'Please select your confirmation status'));
            return;
        }

        if (needsDeclaration && !formData.declarationFile) {
            alert(t('forms.declarationRequired', 'Please upload the required parent declaration'));
            return;
        }

        setIsSubmitting(true);
        try {
            let declarationUrl = null;

            // Upload declaration file if provided
            if (formData.declarationFile) {
                declarationUrl = await uploadSignedDeclaration(formData.declarationFile, user.uid);
            }

            // Prepare submission data
            const submissionData = {
                formId: eventData.id,
                submitterId: user.uid,
                formType: formType,
                confirmationStatus: formData.confirmationStatus,
                attendeesCount: formData.attendeesCount,
                ...(formType === 'parent' && {
                    kidIds: formData.kidIds,
                }),
                extraAttendees: formData.extraAttendees.filter(attendee =>
                    attendee && (typeof attendee === 'string' ? attendee.trim() :
                        (attendee.firstName?.trim() || attendee.lastName?.trim()))
                ).map(attendee => {
                    if (typeof attendee === 'string') return attendee;
                    return `${attendee.firstName} ${attendee.lastName} (${attendee.phone})`.trim();
                }),
                shirts: formData.shirts.filter(size => size),
                extraShirts: formData.extraShirts.filter(size => size),
                ...(declarationUrl && { declarationUploaded: declarationUrl }),
                ...(formType === 'instructor' && formData.motoForLife && {
                    motoForLife: formData.motoForLife
                })
            };

            // Submit form
            await submitFormResponse(submissionData);

            if (onSubmit) {
                onSubmit(submissionData);
            }

            alert(t('forms.submissionSuccess', 'Form submitted successfully!'));
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(t('forms.submissionError', 'Error submitting form. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <div className="modal-overlay event-registration-overlay">
            <div className="modal-content event-registration-modal">
                <div className="modal-header">
                    <h3>
                        <Users size={24} />
                        {t('forms.eventRegistration', 'Event Registration')}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {!formType ? (
                        // Form Type Selection
                        <div className="form-type-selection">
                            <h4>{t('forms.selectFormType', 'Select Registration Type')}</h4>
                            <div className="form-type-options">
                                <button
                                    className="form-type-option"
                                    onClick={() => handleFormTypeSelect('parent')}
                                >
                                    <Users size={32} />
                                    <span className="option-title">
                                        {t('forms.parentRegistration', 'Parent Registration')}
                                    </span>
                                    <span className="option-description">
                                        {t('forms.parentRegistrationDesc', 'Register yourself and your kids for the event')}
                                    </span>
                                </button>

                                <button
                                    className="form-type-option"
                                    onClick={() => handleFormTypeSelect('instructor')}
                                >
                                    <FileText size={32} />
                                    <span className="option-title">
                                        {t('forms.instructorRegistration', 'Instructor Registration')}
                                    </span>
                                    <span className="option-description">
                                        {t('forms.instructorRegistrationDesc', 'Register as an instructor for the event')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Registration Form
                        <div className="registration-form">
                            {/* Event Details Section */}
                            <div className="form-section">
                                <h4>{t('forms.eventDetails', 'Event Details')}</h4>
                                <div className="event-details">
                                    <div className="detail-item">
                                        <label>{t('forms.dayAndDate', 'Day and Date')}</label>
                                        <span>{eventData.dayAndDate || t('forms.notSpecified', 'Not specified')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>{t('forms.hours', 'Hours')}</label>
                                        <span>{eventData.hours || t('forms.notSpecified', 'Not specified')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>{t('forms.location', 'Location')}</label>
                                        <span>{eventData.location || t('forms.notSpecified', 'Not specified')}</span>
                                    </div>
                                    {eventData.googleMapsLink && (
                                        <div className="detail-item">
                                            <a
                                                href={eventData.googleMapsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="map-link"
                                            >
                                                <MapPin size={16} />
                                                {t('forms.googleMaps', 'Google Maps')}
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                    {eventData.wazeLink && (
                                        <div className="detail-item">
                                            <a
                                                href={eventData.wazeLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="map-link"
                                            >
                                                <MapPin size={16} />
                                                {t('forms.waze', 'Waze')}
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                {eventData.notes && (
                                    <div className="event-notes">
                                        <label>{t('forms.notes', 'Notes')}</label>
                                        <div className="notes-content">
                                            {eventData.notes}
                                        </div>
                                    </div>
                                )}

                                {/* Payment Link */}
                                {eventData.paymentLink && (
                                    <div className="payment-section">
                                        <a
                                            href={eventData.paymentLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="payment-link"
                                        >
                                            {t('forms.bitPayment', 'Bit Payment')}
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                )}

                                {/* Closing Notes */}
                                {eventData.closingNotes && (
                                    <div className="closing-notes">
                                        <div className="notes-content">
                                            {eventData.closingNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Contact Info */}
                                {eventData.contactInfo && eventData.contactInfo.length > 0 && (
                                    <div className="contact-section">
                                        <label>{t('forms.contactUs', 'Contact Us')}</label>
                                        <div className="contact-info">
                                            {eventData.contactInfo.map((contact, index) => (
                                                <div key={index} className="contact-item">
                                                    {contact}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirmation Status */}
                            <div className="form-section">
                                <h4>{t('forms.confirmationStatus', 'Confirmation Status')} *</h4>
                                <div className="confirmation-options">
                                    <label className="confirmation-option">
                                        <input
                                            type="radio"
                                            name="confirmationStatus"
                                            value="attending"
                                            checked={formData.confirmationStatus === 'attending'}
                                            onChange={(e) => handleConfirmationChange(e.target.value)}
                                        />
                                        <span className="option-text attending">
                                            <Check size={16} />
                                            {t('forms.attending', 'Attending')}
                                        </span>
                                    </label>

                                    <label className="confirmation-option">
                                        <input
                                            type="radio"
                                            name="confirmationStatus"
                                            value="not attending"
                                            checked={formData.confirmationStatus === 'not attending'}
                                            onChange={(e) => handleConfirmationChange(e.target.value)}
                                        />
                                        <span className="option-text not-attending">
                                            <X size={16} />
                                            {t('forms.notAttending', 'Not Attending')}
                                        </span>
                                    </label>

                                    <label className="confirmation-option">
                                        <input
                                            type="radio"
                                            name="confirmationStatus"
                                            value="needs to decide"
                                            checked={formData.confirmationStatus === 'needs to decide'}
                                            onChange={(e) => handleConfirmationChange(e.target.value)}
                                        />
                                        <span className="option-text needs-decide">
                                            <Clock size={16} />
                                            {t('forms.needsToDecide', 'Need to Decide')}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Attendance Details - Only show if attending */}
                            {formData.confirmationStatus === 'attending' && (
                                <>
                                    {/* User Info */}
                                    <div className="form-section">
                                        <h4>
                                            {formType === 'parent'
                                                ? t('forms.parentInformation', 'Parent Information')
                                                : t('forms.instructorInformation', 'Instructor Information')
                                            }
                                        </h4>
                                        <div className="user-info">
                                            <div className="info-item">
                                                <label>{t('forms.name', 'Name')}</label>
                                                <span>{userData?.name || userData?.displayName}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('forms.phone', 'Phone')}</label>
                                                <span>{userData?.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kids Selection - Parent Only */}
                                    {formType === 'parent' && (
                                        <div className="form-section">
                                            <h4>{t('forms.selectKids', 'Select Kids to Attend')}</h4>
                                            {userKids.length > 0 ? (
                                                <div className="kids-selection">
                                                    {userKids.map(kid => (
                                                        <label key={kid.id} className="kid-option">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedKids.includes(kid.id)}
                                                                onChange={(e) => handleKidSelection(kid.id, e.target.checked)}
                                                            />
                                                            <span className="kid-info">
                                                                <span className="kid-name">
                                                                    {kid.personalInfo?.firstName} {kid.personalInfo?.lastName}
                                                                </span>
                                                                <span className="kid-number">#{kid.participantNumber}</span>
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-kids">
                                                    {t('forms.noKidsFound', 'No kids found in your account')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Attendees Count */}
                                    <div className="form-section">
                                        <h4>{t('forms.attendeesCount', 'Total Attendees Count')}</h4>
                                        <div className="attendees-count">
                                            <label>
                                                {t('forms.howManyPeople', 'How many people will be coming?')}
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.attendeesCount}
                                                onChange={(e) => handleAttendeesCountChange(e.target.value)}
                                                className="attendees-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Extra Attendees */}
                                    {formData.extraAttendees.length > 0 && (
                                        <div className="form-section">
                                            <h4>{t('forms.extraAttendees', 'Additional Attendees')}</h4>
                                            <div className="extra-attendees-table">
                                                <div className="table-header">
                                                    <span>{t('forms.firstName', 'First Name')}</span>
                                                    <span>{t('forms.lastName', 'Last Name')}</span>
                                                    <span>{t('forms.phone', 'Phone')}</span>
                                                </div>
                                                {formData.extraAttendees.map((_, index) => (
                                                    <div key={index} className="table-row">
                                                        <input
                                                            type="text"
                                                            placeholder={t('forms.firstName', 'First Name')}
                                                            value={formData.extraAttendees[index]?.firstName || ''}
                                                            onChange={(e) => updateExtraAttendee(index, 'firstName', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder={t('forms.lastName', 'Last Name')}
                                                            value={formData.extraAttendees[index]?.lastName || ''}
                                                            onChange={(e) => updateExtraAttendee(index, 'lastName', e.target.value)}
                                                        />
                                                        <input
                                                            type="tel"
                                                            placeholder={t('forms.phone', 'Phone')}
                                                            value={formData.extraAttendees[index]?.phone || ''}
                                                            onChange={(e) => updateExtraAttendee(index, 'phone', e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Shirts Section */}
                                    <div className="form-section">
                                        <h4>
                                            <Shirt size={20} />
                                            {t('forms.shirtSizes', 'Shirt Sizes')}
                                        </h4>

                                        {/* Required Shirts */}
                                        <div className="shirts-subsection">
                                            <label>{t('forms.requiredShirts', 'Required Shirts (up to 5)')}</label>
                                            <div className="shirts-grid">
                                                {formData.shirts.map((size, index) => (
                                                    <div key={index} className="shirt-selector">
                                                        <label>{t('forms.shirtNumber', 'Shirt #{number}', { number: index + 1 })}</label>
                                                        <select
                                                            value={size}
                                                            onChange={(e) => handleShirtChange(index, e.target.value)}
                                                        >
                                                            <option value="">{t('forms.selectSize', 'Select Size')}</option>
                                                            {shirtSizes.map(shirtSize => (
                                                                <option key={shirtSize} value={shirtSize}>
                                                                    {shirtSize}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Extra Shirts */}
                                        <div className="shirts-subsection">
                                            <label>{t('forms.extraShirts', 'Extra Shirts (optional, up to 5)')}</label>
                                            <div className="shirts-grid">
                                                {formData.extraShirts.map((size, index) => (
                                                    <div key={index} className="shirt-selector">
                                                        <label>{t('forms.extraShirtNumber', 'Extra #{number}', { number: index + 1 })}</label>
                                                        <select
                                                            value={size}
                                                            onChange={(e) => handleShirtChange(index, e.target.value, true)}
                                                        >
                                                            <option value="">{t('forms.selectSize', 'Select Size')}</option>
                                                            {shirtSizes.map(shirtSize => (
                                                                <option key={shirtSize} value={shirtSize}>
                                                                    {shirtSize}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instructor Motto */}
                                    {formType === 'instructor' && (
                                        <div className="form-section">
                                            <h4>{t('forms.motoForLife', 'My Motto for Life')}</h4>
                                            <textarea
                                                value={formData.motoForLife}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    motoForLife: e.target.value
                                                }))}
                                                placeholder={t('forms.motoPlaceholder', 'Share your motto for life...')}
                                                rows={3}
                                                className="motto-textarea"
                                            />
                                        </div>
                                    )}

                                    {/* Parent Declaration Upload */}
                                    {needsDeclaration && (
                                        <div className="form-section declaration-section">
                                            <h4 className="warning-header">
                                                <AlertTriangle size={20} />
                                                {t('forms.declarationRequired', 'Parent Declaration Required')}
                                            </h4>
                                            <div className="declaration-warning">
                                                <p>
                                                    {t('forms.declarationWarning', 'Some of your selected kids do not have a signed declaration on file. Please upload the required parent declaration.')}
                                                </p>
                                                <div className="file-upload">
                                                    <label className="file-upload-label">
                                                        <Upload size={16} />
                                                        {formData.declarationFile
                                                            ? formData.declarationFile.name
                                                            : t('forms.uploadDeclaration', 'Upload Declaration File')
                                                        }
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={handleFileUpload}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {!formType ? (
                        <button className="btn btn-secondary" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </button>
                    ) : (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setFormType(null)}
                            >
                                {t('common.back', 'Back')}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.confirmationStatus}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Clock className="loading-spinner" size={16} />
                                        {t('forms.submitting', 'Submitting...')}
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        {t('forms.submitRegistration', 'Submit Registration')}
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventRegistrationModal;