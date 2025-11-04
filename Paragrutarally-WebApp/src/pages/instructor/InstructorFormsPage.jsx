// src/pages/instructor/InstructorFormsPage.jsx - Updated Instructor Forms Interface
import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import FormSubmissionModal from '../../components/modals/FormSubmissionModal';
import FormViewModal from '../../components/modals/FormViewModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    getFormSubmissions,
    getActiveForms,
    incrementFormViewCount
} from '../../services/formService';
import './InstructorFormsPage.css';
import {
    IconForms as FileText,
    IconClock as Clock,
    IconCheck as Check,
    IconX as X,
    IconAlertTriangle as AlertTriangle,
    IconEye as Eye,
    IconCalendar as Calendar,
    IconUsers as Users,
    IconShirt as Shirt,
    IconHeart as Heart,
    IconExternalLink as ExternalLink,
    IconChalkboard as ChalkboardTeacher,
    IconMapPin as MapPin,
    IconFileText as FileIcon
} from '@tabler/icons-react';

const InstructorFormsPage = () => {
    const { appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { userData, user } = usePermissions();

    // State management
    const [submissions, setSubmissions] = useState([]);
    const [availableForms, setAvailableForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [viewSubmission, setViewSubmission] = useState(null);

    // Load data
    useEffect(() => {
        if (user?.uid) {
            loadFormsData();
        }
    }, [user]);

    const loadFormsData = async () => {
        setIsLoading(true);
        try {
            const [submissionsData, availableFormsData] = await Promise.all([
                getFormSubmissions({ submitterId: user.uid }),
                getActiveForms('instructor') // Get active forms for instructors
            ]);

            setSubmissions(submissionsData);
            setAvailableForms(availableFormsData);

        } catch (error) {
            console.error('❌ Error loading forms data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get status info
    const getStatusInfo = (status) => {
        const statusMap = {
            'attending': {
                label: t('forms.attending', 'Attending'),
                color: '#10B981',
                icon: Check
            },
            'not attending': {
                label: t('forms.notAttending', 'Not Attending'),
                color: '#EF4444',
                icon: X
            },
            'needs to decide': {
                label: t('forms.needsToDecide', 'Needs to Decide'),
                color: '#F59E0B',
                icon: AlertTriangle
            }
        };

        return statusMap[status] || statusMap['needs to decide'];
    };

    // Handle form submission click
    const handleFormSubmission = async (form) => {
        try {
            // Increment view count
            await incrementFormViewCount(form.id);

            // Update local state
            setAvailableForms(prevForms =>
                prevForms.map(f =>
                    f.id === form.id
                        ? { ...f, viewCount: (f.viewCount || 0) + 1 }
                        : f
                )
            );

            setSelectedForm(form);
            setShowSubmissionModal(true);
        } catch (error) {
            console.error('❌ Error opening form:', error);
        }
    };

    // Handle view form details
    const handleViewForm = async (form) => {
        try {
            // Increment view count
            await incrementFormViewCount(form.id);

            // Update local state
            setAvailableForms(prevForms =>
                prevForms.map(f =>
                    f.id === form.id
                        ? { ...f, viewCount: (f.viewCount || 0) + 1 }
                        : f
                )
            );

            setSelectedForm(form);
            setShowViewModal(true);
        } catch (error) {
            console.error('❌ Error viewing form:', error);
        }
    };

    // Handle view submission details
    const handleViewSubmission = (submission) => {
        setViewSubmission(submission);
    };

    // Check if user has submitted a form
    const hasSubmittedForm = (formId) => {
        return submissions.some(submission => submission.formId === formId);
    };

    // Get user's submission for a form
    const getUserSubmission = (formId) => {
        return submissions.find(submission => submission.formId === formId);
    };

    // Format date display
    const formatEventDate = (eventDetails) => {
        if (eventDetails?.dayAndDate) {
            return eventDetails.dayAndDate;
        }

        if (eventDetails?.eventDate) {
            const date = new Date(eventDetails.eventDate);
            return date.toLocaleDateString();
        }

        return '';
    };

    return (
        <Dashboard requiredRole="instructor">
            <div className={`instructor-forms-page ${appliedTheme}-mode`}>
                {/* Page Header */}
                <div className="page-header">
                    <h1>
                        <ChalkboardTeacher size={32} className="page-title-icon" />
                        {t('forms.instructorForms', 'Instructor Forms')}
                    </h1>
                    <p className="page-subtitle">
                        {t('forms.instructorFormsDesc', 'Manage your training registrations and form submissions')}
                    </p>
                </div>

                <div className="page-container">
                    {/* My Submissions */}
                    <div className="forms-section">
                        <div className="section-header">
                            <h3>
                                <FileText size={20} />
                                {t('forms.mySubmissions', 'My Submissions')}
                            </h3>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">
                                <Clock className="loading-spinner" size={30} />
                                <p>{t('forms.loadingForms', 'Loading forms...')}</p>
                            </div>
                        ) : submissions.length > 0 ? (
                            <div className="submissions-grid">
                                {submissions.map(submission => {
                                    const statusInfo = getStatusInfo(submission.confirmationStatus);
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <div key={submission.id} className="submission-card instructor-submission">
                                            <div className="card-header">
                                                <div className="form-info">
                                                    <h4>{submission.formTitle || t('forms.instructorTraining', 'Instructor Training')}</h4>
                                                    <span className="submission-date">
                                                        {submission.submittedAt?.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        borderColor: statusInfo.color,
                                                        color: statusInfo.color
                                                    }}
                                                >
                                                    <StatusIcon size={12} />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            <div className="card-body">
                                                <div className="submission-summary">
                                                    <div className="summary-item">
                                                        <Users size={16} />
                                                        <span>{submission.attendeesCount || 1} {t('forms.attendees', 'attendees')}</span>
                                                    </div>
                                                    {(submission.shirts?.length > 0 || submission.extraShirts?.length > 0) && (
                                                        <div className="summary-item">
                                                            <Shirt size={16} />
                                                            <span>
                                                                {(submission.shirts?.length || 0) + (submission.extraShirts?.length || 0)} {t('forms.shirts', 'shirts')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {submission.motoForLife && (
                                                        <div className="summary-item">
                                                            <Heart size={16} />
                                                            <span>{t('forms.mottoShared', 'Motto shared')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewSubmission(submission)}
                                                    title={t('forms.viewDetails', 'View Details')}
                                                >
                                                    <Eye size={16} />
                                                    {t('forms.viewDetails', 'View Details')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <ChalkboardTeacher size={60} />
                                </div>
                                <h3>{t('forms.noSubmissions', 'No Submissions Yet')}</h3>
                                <p>{t('forms.noInstructorSubmissionsDesc', 'You haven\'t registered for any training events yet. Check the available forms below!')}</p>
                            </div>
                        )}
                    </div>

                    {/* Available Forms */}
                    <div className="forms-section">
                        <div className="section-header">
                            <h3>
                                <Calendar size={20} />
                                {t('forms.availableForms', 'Available Training Events')}
                            </h3>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">
                                <Clock className="loading-spinner" size={30} />
                                <p>{t('forms.loadingForms', 'Loading forms...')}</p>
                            </div>
                        ) : availableForms.length > 0 ? (
                            <div className="available-forms-grid">
                                {availableForms.map(form => {
                                    const hasSubmitted = hasSubmittedForm(form.id);
                                    const userSubmission = getUserSubmission(form.id);

                                    return (
                                        <div key={form.id} className="available-form-card instructor-form">
                                            <div className="card-header">
                                                <div className="form-title-section">
                                                    <h4>{form.title}</h4>
                                                    {formatEventDate(form.eventDetails) && (
                                                        <div className="event-date">
                                                            <Calendar size={14} />
                                                            {formatEventDate(form.eventDetails)}
                                                        </div>
                                                    )}
                                                </div>
                                                {hasSubmitted && (
                                                    <span className="submitted-badge">
                                                        <Check size={12} />
                                                        {t('forms.submitted', 'Submitted')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="card-body">
                                                <p>{form.description}</p>

                                                {/* Event details preview */}
                                                {form.eventDetails && (
                                                    <div className="event-preview">
                                                        {form.eventDetails.location && (
                                                            <div className="event-detail">
                                                                <MapPin size={14} />
                                                                <span>{form.eventDetails.location}</span>
                                                            </div>
                                                        )}
                                                        {form.eventDetails.hours && (
                                                            <div className="event-detail">
                                                                <Clock size={14} />
                                                                <span>{form.eventDetails.hours}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="form-meta">
                                                    <span className="meta-label">{t('forms.views', 'Views')}:</span>
                                                    <span className="meta-value">{form.viewCount || 0}</span>
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewForm(form)}
                                                    title={t('forms.viewForm', 'View Form')}
                                                >
                                                    <Eye size={16} />
                                                    {t('forms.viewForm', 'View')}
                                                </button>

                                                {hasSubmitted ? (
                                                    <button
                                                        className="btn-action view"
                                                        onClick={() => handleViewSubmission(userSubmission)}
                                                    >
                                                        <FileText size={16} />
                                                        {t('forms.viewSubmission', 'View Submission')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-action register instructor-register"
                                                        onClick={() => handleFormSubmission(form)}
                                                    >
                                                        <FileText size={16} />
                                                        {t('forms.fillForm', 'Fill Form')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Calendar size={60} />
                                </div>
                                <h3>{t('forms.noFormsAvailable', 'No Training Events Available')}</h3>
                                <p>{t('forms.noInstructorFormsDesc', 'There are no active training events available at the moment.')}</p>
                            </div>
                        )}
                    </div>

                    {/* Form Submission Modal */}
                    <FormSubmissionModal
                        isOpen={showSubmissionModal}
                        onClose={() => {
                            setShowSubmissionModal(false);
                            setSelectedForm(null);
                        }}
                        form={selectedForm}
                        userType="instructor"
                        onSubmit={(submissionData) => {
                            loadFormsData(); // Reload data after submission
                        }}
                    />

                    {/* Form View Modal */}
                    <FormViewModal
                        isOpen={showViewModal}
                        form={selectedForm}
                        onClose={() => {
                            setShowViewModal(false);
                            setSelectedForm(null);
                        }}
                    />

                    {/* Submission Details Modal */}
                    {viewSubmission && (
                        <div className="modal-overlay">
                            <div className="modal-content submission-details-modal">
                                <div className="modal-header">
                                    <h3>{t('forms.submissionDetails', 'Submission Details')}</h3>
                                    <button
                                        className="modal-close"
                                        onClick={() => setViewSubmission(null)}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="submission-details">
                                        {/* Basic Info */}
                                        <div className="details-section">
                                            <h4>{t('forms.basicInformation', 'Basic Information')}</h4>
                                            <div className="details-grid">
                                                <div className="detail-item">
                                                    <label>{t('forms.submittedAt', 'Submitted At')}</label>
                                                    <span>
                                                        {viewSubmission.submittedAt?.toLocaleDateString()} {viewSubmission.submittedAt?.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>{t('forms.confirmationStatus', 'Status')}</label>
                                                    <span className="status-value">
                                                        {getStatusInfo(viewSubmission.confirmationStatus).label}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>{t('forms.totalAttendees', 'Total Attendees')}</label>
                                                    <span>{viewSubmission.attendeesCount || 1}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Extra Attendees */}
                                        {viewSubmission.extraAttendees && viewSubmission.extraAttendees.length > 0 && (
                                            <div className="details-section">
                                                <h4>{t('forms.extraAttendees', 'Additional Attendees')}</h4>
                                                <div className="extra-attendees-list">
                                                    {viewSubmission.extraAttendees.map((attendeeString, index) => {
                                                        const [firstName, lastName, phone] = attendeeString.split('|');
                                                        return (
                                                            <div key={index} className="extra-attendee-item">
                                                                <strong>{firstName} {lastName}</strong>
                                                                {phone && <span> - {phone}</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Motto for Life */}
                                        {viewSubmission.motoForLife && (
                                            <div className="details-section">
                                                <h4>
                                                    <Heart size={20} />
                                                    {t('forms.motoForLife', 'My Motto for Life')}
                                                </h4>
                                                <div className="motto-display">
                                                    "{viewSubmission.motoForLife}"
                                                </div>
                                            </div>
                                        )}

                                        {/* Shirts Info */}
                                        {(viewSubmission.shirts?.length > 0 || viewSubmission.extraShirts?.length > 0) && (
                                            <div className="details-section">
                                                <h4>
                                                    <Shirt size={20} />
                                                    {t('forms.shirtInformation', 'Shirt Information')}
                                                </h4>
                                                <div className="shirts-details">
                                                    {viewSubmission.shirts?.length > 0 && (
                                                        <div className="shirts-group">
                                                            <label>{t('forms.requiredShirts', 'Required Shirts')}</label>
                                                            <div className="shirts-list">
                                                                {viewSubmission.shirts.map((shirt, index) => (
                                                                    <span key={index} className="shirt-size">
                                                                        {shirt}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {viewSubmission.extraShirts?.length > 0 && (
                                                        <div className="shirts-group">
                                                            <label>{t('forms.extraShirts', 'Extra Shirts')}</label>
                                                            <div className="shirts-list">
                                                                {viewSubmission.extraShirts.map((shirt, index) => (
                                                                    <span key={index} className="shirt-size extra">
                                                                        {shirt}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Declaration File */}
                                        {viewSubmission.declarationUploaded && (
                                            <div className="details-section">
                                                <h4>
                                                    <FileIcon size={20} />
                                                    {t('forms.signedDeclaration', 'Signed Declaration')}
                                                </h4>
                                                <div className="declaration-file">
                                                    <a
                                                        href={viewSubmission.declarationUploaded}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="file-link"
                                                    >
                                                        <FileIcon size={16} />
                                                        {t('forms.viewDeclaration', 'View Declaration File')}
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setViewSubmission(null)}
                                    >
                                        {t('common.close', 'Close')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorFormsPage;