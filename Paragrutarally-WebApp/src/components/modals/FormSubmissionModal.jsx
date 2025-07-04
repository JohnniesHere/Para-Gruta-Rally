// src/components/modals/FormSubmissionModal.jsx - Unified Form Submission Modal
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    createFormSubmission,
    uploadDeclarationFile
} from '../../services/formService';
import { getUserKids } from '../../services/userService';
import {
    IconX as X,
    IconUser as User,
    IconUsers as Users,
    IconShirt as Shirt,
    IconHeart as Heart,
    IconUpload as Upload,
    IconAlertTriangle as AlertTriangle,
    IconFileText as FileText,
    IconPhone as Phone,
    IconCalendar as Calendar,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconCheck as Check
} from '@tabler/icons-react';
import './FormSubmissionModal.css';

const FormSubmissionModal = ({
                                 isOpen,
                                 onClose,
                                 form,
                                 userType = 'parent', // 'parent' or 'instructor'
                                 onSubmit
                             }) => {
    const { t } = useLanguage();
    const { userData, user } = usePermissions();

    // Form state
    const [formData, setFormData] = useState({
        confirmationStatus: 'needs to decide',
        attendeesCount: 1,
        kidIds: [],
        extraAttendees: [],
        shirts: ['', '', '', '', ''],
        extraShirts: ['', '', '', '', ''],
        declarationFile: null,
        motoForLife: ''
    });

    const [userKids, setUserKids] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [kidsWithoutDeclaration, setKidsWithoutDeclaration] = useState([]);
    const [showDeclarationWarning, setShowDeclarationWarning] = useState(false);

    // Shirt size options
    const shirtSizes = ['2', '4', '6', '8', '10', '12', '14', '16', '18', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

    // Load user's kids if parent
    useEffect(() => {
        if (isOpen && userType === 'parent' && user?.uid) {
            loadUserKids();
        }
    }, [isOpen, userType, user]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                confirmationStatus: 'needs to decide',
                attendeesCount: 1,
                kidIds: [],
                extraAttendees: [],
                shirts: ['', '', '', '', ''],
                extraShirts: ['', '', '', '', ''],
                declarationFile: null,
                motoForLife: ''
            });
        }
    }, [isOpen]);

    // Check for declaration requirements when kids are selected
    useEffect(() => {
        checkDeclarationRequirements();
    }, [formData.kidIds, userKids]);

    const loadUserKids = async () => {
        try {
            const kids = await getUserKids(user.uid);
            setUserKids(kids || []);
        } catch (error) {
            console.error('❌ Error loading user kids:', error);
            setUserKids([]);
        }
    };

    const checkDeclarationRequirements = () => {
        if (userType !== 'parent' || !userKids.length) {
            setKidsWithoutDeclaration([]);
            setShowDeclarationWarning(false);
            return;
        }

        const selectedKids = userKids.filter(kid => formData.kidIds.includes(kid.id));
        const kidsNeedingDeclaration = selectedKids.filter(kid => !kid.signedDeclaration);

        setKidsWithoutDeclaration(kidsNeedingDeclaration);
        setShowDeclarationWarning(kidsNeedingDeclaration.length > 0);
    };

    // Update extra attendees array based on count
    useEffect(() => {
        const baseCount = 1 + formData.kidIds.length; // User + selected kids
        const extraCount = Math.max(0, formData.attendeesCount - baseCount);

        setFormData(prev => ({
            ...prev,
            extraAttendees: Array(extraCount).fill('').map((_, index) =>
                prev.extraAttendees[index] || ''
            )
        }));
    }, [formData.attendeesCount, formData.kidIds]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleKidSelection = (kidId, selected) => {
        setFormData(prev => ({
            ...prev,
            kidIds: selected
                ? [...prev.kidIds, kidId]
                : prev.kidIds.filter(id => id !== kidId)
        }));
    };

    const handleExtraAttendeeChange = (index, value) => {
        setFormData(prev => ({
            ...prev,
            extraAttendees: prev.extraAttendees.map((attendee, i) =>
                i === index ? value : attendee
            )
        }));
    };

    const handleShirtChange = (index, value, isExtra = false) => {
        const field = isExtra ? 'extraShirts' : 'shirts';
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((shirt, i) =>
                i === index ? value : shirt
            )
        }));
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                declarationFile: file
            }));
        }
    };

    const validateForm = () => {
        if (formData.confirmationStatus === 'attending') {
            if (formData.attendeesCount < 1) {
                alert(t('forms.validation.attendeesRequired', 'Please specify number of attendees'));
                return false;
            }

            if (showDeclarationWarning && !formData.declarationFile) {
                alert(t('forms.validation.declarationRequired', 'Please upload the parent declaration'));
                return false;
            }

            // Validate extra attendees
            const requiredExtraAttendees = Math.max(0, formData.attendeesCount - 1 - formData.kidIds.length);
            for (let i = 0; i < requiredExtraAttendees; i++) {
                if (!formData.extraAttendees[i] || formData.extraAttendees[i].trim() === '') {
                    alert(t('forms.validation.extraAttendeesRequired', 'Please fill in all extra attendee details'));
                    return false;
                }
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            let declarationUrl = null;

            // Upload declaration file if provided
            if (formData.declarationFile) {
                declarationUrl = await uploadDeclarationFile(
                    formData.declarationFile,
                    user.uid,
                    form.id
                );
            }

            // Prepare submission data
            const submissionData = {
                formId: form.id,
                confirmationStatus: formData.confirmationStatus,
                submittedAt: new Date(),
                submitterId: user.uid,
                updatedAt: new Date(),
                attendeesCount: formData.attendeesCount,
                formType: userType,
                // Optional fields based on form data
                ...(formData.kidIds.length > 0 && { kidIds: formData.kidIds }),
                ...(formData.extraAttendees.some(a => a.trim()) && {
                    extraAttendees: formData.extraAttendees.filter(a => a.trim())
                }),
                ...(formData.shirts.some(s => s) && {
                    shirts: formData.shirts.filter(s => s)
                }),
                ...(formData.extraShirts.some(s => s) && {
                    extraShirts: formData.extraShirts.filter(s => s)
                }),
                ...(declarationUrl && { declarationUploaded: declarationUrl }),
                ...(formData.motoForLife.trim() && { motoForLife: formData.motoForLife.trim() })
            };

            // Submit to database
            await createFormSubmission(submissionData);

            // Call success callback
            onSubmit(submissionData);

            // Close modal
            onClose();

        } catch (error) {
            console.error('❌ Error submitting form:', error);
            alert(t('forms.error.submissionFailed', 'Failed to submit form. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !form) {
        return null;
    }

    const formatEventDate = () => {
        if (form.eventDetails?.dayAndDate) {
            return form.eventDetails.dayAndDate;
        }

        if (form.eventDetails?.eventDate) {
            const date = new Date(form.eventDetails.eventDate);
            return date.toLocaleDateString();
        }

        return '';
    };

    return (
        <div className="form-submission-modal-overlay">
            <div className="form-submission-modal-content">
                <div className="form-submission-modal-header">
                    <h3>
                        <FileText size={24} />
                        {form.title}
                    </h3>
                    <button className="form-submission-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="form-submission-modal-body">
                    {/* Event Information */}
                    <div className="form-section">
                        <h4>
                            <Calendar size={18} />
                            {t('forms.eventInformation', 'Event Information')}
                        </h4>

                        <div className="event-info-display">
                            {formatEventDate() && (
                                <div className="event-info-item">
                                    <Calendar size={16} />
                                    <span>{formatEventDate()}</span>
                                </div>
                            )}

                            {form.eventDetails?.hours && (
                                <div className="event-info-item">
                                    <Clock size={16} />
                                    <span>{form.eventDetails.hours}</span>
                                </div>
                            )}

                            {form.eventDetails?.location && (
                                <div className="event-info-item">
                                    <MapPin size={16} />
                                    <span>{form.eventDetails.location}</span>
                                </div>
                            )}
                        </div>

                        {form.eventDetails?.notes && (
                            <div className="event-notes">
                                <p>{form.eventDetails.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Attendance Confirmation */}
                    <div className="form-section">
                        <h4>
                            <Check size={18} />
                            {t('forms.attendanceConfirmation', 'Attendance Confirmation')}
                        </h4>

                        <div className="attendance-options">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="attendance"
                                    value="attending"
                                    checked={formData.confirmationStatus === 'attending'}
                                    onChange={(e) => handleInputChange('confirmationStatus', e.target.value)}
                                />
                                <span className="radio-label attending">
                                    <Check size={16} />
                                    {t('forms.attending', 'Attending')}
                                </span>
                            </label>

                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="attendance"
                                    value="not attending"
                                    checked={formData.confirmationStatus === 'not attending'}
                                    onChange={(e) => handleInputChange('confirmationStatus', e.target.value)}
                                />
                                <span className="radio-label not-attending">
                                    <X size={16} />
                                    {t('forms.notAttending', 'Not Attending')}
                                </span>
                            </label>

                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="attendance"
                                    value="needs to decide"
                                    checked={formData.confirmationStatus === 'needs to decide'}
                                    onChange={(e) => handleInputChange('confirmationStatus', e.target.value)}
                                />
                                <span className="radio-label needs-decision">
                                    <AlertTriangle size={16} />
                                    {t('forms.needsToDecide', 'Needs to Decide')}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Attendee Details - Only if attending */}
                    {formData.confirmationStatus === 'attending' && (
                        <>
                            {/* User Information */}
                            <div className="form-section">
                                <h4>
                                    <User size={18} />
                                    {userType === 'parent'
                                        ? t('forms.parentInformation', 'Parent Information')
                                        : t('forms.instructorInformation', 'Instructor Information')
                                    }
                                </h4>

                                <div className="user-info-display">
                                    <div className="info-item">
                                        <label>{t('forms.name', 'Name')}</label>
                                        <span>{userData?.displayName || userData?.firstName + ' ' + userData?.lastName || 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>{t('forms.phoneNumber', 'Phone Number')}</label>
                                        <span>{userData?.phoneNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Kids Selection - Only for parents */}
                            {userType === 'parent' && userKids.length > 0 && (
                                <div className="form-section">
                                    <h4>
                                        <Users size={18} />
                                        {t('forms.selectKids', 'Select Kids to Attend')}
                                    </h4>

                                    <div className="kids-selection">
                                        {userKids.map(kid => (
                                            <label key={kid.id} className="checkbox-option">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.kidIds.includes(kid.id)}
                                                    onChange={(e) => handleKidSelection(kid.id, e.target.checked)}
                                                />
                                                <span className="checkbox-label">
                                                    {kid.firstName} {kid.lastName}
                                                    {!kid.signedDeclaration && (
                                                        <AlertTriangle size={14} className="warning-icon" />
                                                    )}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attendee Count */}
                            <div className="form-section">
                                <h4>
                                    <Users size={18} />
                                    {t('forms.attendeeCount', 'Total Attendee Count')}
                                </h4>

                                <div className="attendee-count-input">
                                    <label>{t('forms.totalPeopleAttending', 'Total people attending (including yourself)')}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.attendeesCount}
                                        onChange={(e) => handleInputChange('attendeesCount', parseInt(e.target.value) || 1)}
                                        className="number-input"
                                    />
                                </div>
                            </div>

                            {/* Extra Attendees */}
                            {formData.extraAttendees.length > 0 && (
                                <div className="form-section">
                                    <h4>
                                        <Users size={18} />
                                        {t('forms.extraAttendees', 'Additional Attendee Details')}
                                    </h4>

                                    <div className="extra-attendees-table">
                                        <div className="table-header">
                                            <span>{t('forms.firstName', 'First Name')}</span>
                                            <span>{t('forms.lastName', 'Last Name')}</span>
                                            <span>{t('forms.phoneNumber', 'Phone Number')}</span>
                                        </div>

                                        {formData.extraAttendees.map((attendee, index) => {
                                            const [firstName, lastName, phone] = (attendee || '').split('|');
                                            return (
                                                <div key={index} className="table-row">
                                                    <input
                                                        type="text"
                                                        placeholder={t('forms.firstName', 'First Name')}
                                                        value={firstName || ''}
                                                        onChange={(e) => {
                                                            const newValue = `${e.target.value}|${lastName || ''}|${phone || ''}`;
                                                            handleExtraAttendeeChange(index, newValue);
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder={t('forms.lastName', 'Last Name')}
                                                        value={lastName || ''}
                                                        onChange={(e) => {
                                                            const newValue = `${firstName || ''}|${e.target.value}|${phone || ''}`;
                                                            handleExtraAttendeeChange(index, newValue);
                                                        }}
                                                    />
                                                    <input
                                                        type="tel"
                                                        placeholder={t('forms.phoneNumber', 'Phone Number')}
                                                        value={phone || ''}
                                                        onChange={(e) => {
                                                            const newValue = `${firstName || ''}|${lastName || ''}|${e.target.value}`;
                                                            handleExtraAttendeeChange(index, newValue);
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Shirt Sizes */}
                            <div className="form-section">
                                <h4>
                                    <Shirt size={18} />
                                    {t('forms.shirtSizes', 'Shirt Sizes')}
                                </h4>

                                <div className="shirts-selection">
                                    <div className="shirts-group">
                                        <h5>{t('forms.requiredShirts', 'Required Shirts')}</h5>
                                        <div className="shirts-grid">
                                            {formData.shirts.map((shirt, index) => (
                                                <div key={index} className="shirt-input">
                                                    <label>{t('forms.shirt', 'Shirt')} #{index + 1}</label>
                                                    <select
                                                        value={shirt}
                                                        onChange={(e) => handleShirtChange(index, e.target.value)}
                                                    >
                                                        <option value="">{t('forms.selectSize', 'Select Size')}</option>
                                                        {shirtSizes.map(size => (
                                                            <option key={size} value={size}>{size}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="shirts-group">
                                        <h5>{t('forms.extraShirts', 'Extra Shirts (Optional)')}</h5>
                                        <div className="shirts-grid">
                                            {formData.extraShirts.map((shirt, index) => (
                                                <div key={index} className="shirt-input">
                                                    <label>{t('forms.extraShirt', 'Extra Shirt')} #{index + 1}</label>
                                                    <select
                                                        value={shirt}
                                                        onChange={(e) => handleShirtChange(index, e.target.value, true)}
                                                    >
                                                        <option value="">{t('forms.selectSize', 'Select Size')}</option>
                                                        {shirtSizes.map(size => (
                                                            <option key={size} value={size}>{size}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instructor Motto */}
                            {userType === 'instructor' && (
                                <div className="form-section">
                                    <h4>
                                        <Heart size={18} />
                                        {t('forms.motoForLife', 'My Motto for Life')}
                                    </h4>

                                    <textarea
                                        value={formData.motoForLife}
                                        onChange={(e) => handleInputChange('motoForLife', e.target.value)}
                                        placeholder={t('forms.motoPlaceholder', 'Share your life motto...')}
                                        className="motto-textarea"
                                        rows="3"
                                    />
                                </div>
                            )}

                            {/* Declaration Upload */}
                            {showDeclarationWarning && (
                                <div className="form-section declaration-section">
                                    <h4>
                                        <AlertTriangle size={18} />
                                        {t('forms.parentDeclaration', 'Parent Declaration Required')}
                                    </h4>

                                    <div className="declaration-warning">
                                        <div className="warning-content">
                                            <AlertTriangle size={24} className="warning-icon" />
                                            <div>
                                                <p>{t('forms.declarationWarning', 'Please attach parent declaration')}</p>
                                                <p className="warning-details">
                                                    {t('forms.declarationDetails', 'The following kids need a signed declaration:')}
                                                </p>
                                                <ul>
                                                    {kidsWithoutDeclaration.map(kid => (
                                                        <li key={kid.id}>{kid.firstName} {kid.lastName}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="file-upload">
                                            <input
                                                type="file"
                                                id="declaration-file"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                onChange={handleFileUpload}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="declaration-file" className="upload-button">
                                                <Upload size={16} />
                                                {formData.declarationFile
                                                    ? formData.declarationFile.name
                                                    : t('forms.uploadDeclaration', 'Upload Declaration')
                                                }
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="form-submission-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={isSubmitting}
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Clock size={16} className="spinning" />
                                {t('forms.submitting', 'Submitting...')}
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                {t('forms.submitForm', 'Submit Form')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormSubmissionModal;