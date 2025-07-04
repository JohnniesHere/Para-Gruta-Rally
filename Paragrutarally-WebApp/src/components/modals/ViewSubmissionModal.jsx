// src/components/modals/ViewSubmissionModal.jsx - Fixed with kidService
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getKidById } from '../../services/kidService';
import {
    IconX as X,
    IconUser as User,
    IconUsers as Users,
    IconShirt as Shirt,
    IconFileText as FileText,
    IconCalendar as Calendar,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconExternalLink as ExternalLink,
    IconEye as Eye
} from '@tabler/icons-react';
import './FormSubmissionModal.css'; // Reuse the same styles

const ViewSubmissionModal = ({
                                 isOpen,
                                 submission,
                                 form,
                                 onClose,
                                 userKids = []
                             }) => {
    const { t } = useLanguage();
    const [kidNames, setKidNames] = useState({});
    const [loadingKids, setLoadingKids] = useState(false);

    // Load kid names when modal opens or submission changes
    useEffect(() => {
        if (isOpen && submission?.kidIds?.length > 0) {
            loadKidNames();
        }
    }, [isOpen, submission]);

    const loadKidNames = async () => {
        if (!submission?.kidIds?.length) return;

        setLoadingKids(true);
        const names = {};

        try {
            // Load each kid's data from the database
            for (const kidId of submission.kidIds) {
                try {
                    // Clean the kidId first
                    const cleanKidId = typeof kidId === 'string' ? kidId.replace(/[^\w-]/g, '') : kidId;

                    const kidData = await getKidById(cleanKidId);
                    // Use the proper schema to get the full name
                    names[kidId] = kidData.personalInfo?.firstName ||
                        kidData.firstName ||
                        `Kid ${cleanKidId.slice(-4)}`;
                } catch (error) {
                    console.warn(`Failed to load kid ${kidId}:`, error);
                    // Clean the kidId for fallback display
                    const cleanKidId = typeof kidId === 'string' ? kidId.replace(/[^\w-]/g, '') : kidId;
                    names[kidId] = `Kid ${cleanKidId.slice(-4)}`;
                }
            }
        } catch (error) {
            console.error('Error loading kid names:', error);
        } finally {
            setKidNames(names);
            setLoadingKids(false);
        }
    };

    if (!isOpen || !submission) {
        return null;
    }

    // Get status info
    const getStatusInfo = (status) => {
        const statusMap = {
            'attending': {
                label: t('forms.status.attending', 'Attending'),
                color: '#10B981',
                icon: Check
            },
            'not attending': {
                label: t('forms.status.notAttending', 'Not Attending'),
                color: '#EF4444',
                icon: X
            },
            'needs to decide': {
                label: t('forms.status.needsToDecide', 'Needs to Decide'),
                color: '#F59E0B',
                icon: AlertTriangle
            }
        };

        return statusMap[status] || statusMap['needs to decide'];
    };

    // Get kid name by ID - now uses the loaded names
    const getKidNameById = (kidId) => {
        return kidNames[kidId] || t('forms.loading.kid', 'Loading...');
    };

    // Format date display
    const formatEventDate = () => {
        if (form?.eventDetails?.dayAndDate) {
            return form.eventDetails.dayAndDate;
        }

        if (form?.eventDetails?.eventDate) {
            const date = new Date(form.eventDetails.eventDate);
            return date.toLocaleDateString();
        }

        return '';
    };

    const statusInfo = getStatusInfo(submission.confirmationStatus);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="form-submission-modal-overlay">
            <div className="form-submission-modal-content">
                <div className="form-submission-modal-header">
                    <h3>
                        <Eye size={24} />
                        {t('forms.modal.viewSubmission', 'View Submission')}
                        {form && ` - ${form.title}`}
                    </h3>
                    <button className="form-submission-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="form-submission-modal-body">
                    {/* Submission Status */}
                    <div className="form-section">
                        <h4>
                            <StatusIcon size={18} />
                            {t('forms.sections.submissionStatus', 'Submission Status')}
                        </h4>

                        <div className="status-display">
                            <div className="status-badge-large" style={{
                                borderColor: statusInfo.color,
                                color: statusInfo.color,
                                backgroundColor: `${statusInfo.color}15`
                            }}>
                                <StatusIcon size={24} />
                                <span>{statusInfo.label}</span>
                            </div>
                        </div>

                        <div className="submission-meta">
                            <div className="meta-item">
                                <label>{t('forms.labels.submittedAt', 'Submitted At')}</label>
                                <span>
                                    {submission.submittedAt?.toLocaleDateString()} {submission.submittedAt?.toLocaleTimeString()}
                                </span>
                            </div>
                            {submission.updatedAt && submission.updatedAt !== submission.submittedAt && (
                                <div className="meta-item">
                                    <label>{t('forms.labels.lastUpdated', 'Last Updated')}</label>
                                    <span>
                                        {submission.updatedAt?.toLocaleDateString()} {submission.updatedAt?.toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Information (if form is provided) */}
                    {form && (
                        <div className="form-section">
                            <h4>
                                <Calendar size={18} />
                                {t('forms.sections.eventDetails', 'Event Details')}
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
                        </div>
                    )}

                    {/* Attendance Details - Only if attending */}
                    {submission.confirmationStatus === 'attending' && (
                        <>
                            {/* Attendee Count */}
                            <div className="form-section">
                                <h4>
                                    <Users size={18} />
                                    {t('forms.sections.attendeeInformation', 'Attendee Information')}
                                </h4>

                                <div className="attendee-summary">
                                    <div className="summary-item-large">
                                        <label>{t('forms.labels.totalAttendees', 'Total Attendees')}</label>
                                        <span className="count-display">{submission.attendeesCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Kids */}
                            {submission.kidIds && submission.kidIds.length > 0 && (
                                <div className="form-section">
                                    <h4>
                                        <Users size={18} />
                                        {t('forms.sections.selectedKids', 'Selected Kids')}
                                    </h4>

                                    <div className="kids-display">
                                        {submission.kidIds.map((kidId, index) => (
                                            <div key={kidId} className="kid-display-item">
                                                <Users size={16} />
                                                <span>
                                                    {loadingKids ? (
                                                        t('forms.loading.kid', 'Loading...')
                                                    ) : (
                                                        getKidNameById(kidId)
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extra Attendees */}
                            {submission.extraAttendees && submission.extraAttendees.length > 0 && (
                                <div className="form-section">
                                    <h4>
                                        <Users size={18} />
                                        {t('forms.sections.extraAttendees', 'Additional Attendees')}
                                    </h4>

                                    <div className="extra-attendees-display">
                                        {submission.extraAttendees.map((attendee, index) => {
                                            const [firstName, lastName, phone] = attendee.split('|');
                                            return (
                                                <div key={index} className="extra-attendee-display">
                                                    <div className="attendee-name">
                                                        <User size={16} />
                                                        <span>{firstName} {lastName}</span>
                                                    </div>
                                                    {phone && (
                                                        <div className="attendee-phone">
                                                            <span>{phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Shirt Information */}
                            {((submission.shirts && submission.shirts.length > 0) ||
                                (submission.extraShirts && submission.extraShirts.length > 0)) && (
                                <div className="form-section">
                                    <h4>
                                        <Shirt size={18} />
                                        {t('forms.sections.shirtInformation', 'Shirt Information')}
                                    </h4>

                                    <div className="shirts-display">
                                        {submission.shirts && submission.shirts.length > 0 && (
                                            <div className="shirts-group-display">
                                                <h5>{t('forms.labels.requiredShirts', 'Required Shirts')}</h5>
                                                <div className="shirts-list">
                                                    {submission.shirts.map((shirt, index) => (
                                                        <span key={index} className="shirt-size-display required">
                                                            {shirt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {submission.extraShirts && submission.extraShirts.length > 0 && (
                                            <div className="shirts-group-display">
                                                <h5>{t('forms.labels.extraShirts', 'Extra Shirts')}</h5>
                                                <div className="shirts-list">
                                                    {submission.extraShirts.map((shirt, index) => (
                                                        <span key={index} className="shirt-size-display extra">
                                                            {shirt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Motto (if instructor) */}
                            {submission.motoForLife && (
                                <div className="form-section">
                                    <h4>
                                        <FileText size={18} />
                                        {t('forms.sections.motoForLife', 'Motto for Life')}
                                    </h4>

                                    <div className="motto-display">
                                        <p>"{submission.motoForLife}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Declaration File */}
                            {submission.declarationUploaded && (
                                <div className="form-section">
                                    <h4>
                                        <FileText size={18} />
                                        {t('forms.sections.signedDeclaration', 'Signed Declaration')}
                                    </h4>

                                    <div className="declaration-display">
                                        <a
                                            href={submission.declarationUploaded}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="declaration-link"
                                        >
                                            <FileText size={16} />
                                            {t('forms.actions.viewDeclaration', 'View Declaration File')}
                                            <ExternalLink size={12} />
                                        </a>
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
                    >
                        {t('common.close', 'Close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewSubmissionModal;