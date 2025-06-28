// src/pages/instructor/InstructorFormsPage.jsx - Instructor Forms Interface
import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import EventRegistrationModal from '../../components/modals/EventRegistrationModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    getUserFormAssignments,
    getFormSubmissions,
    getFormsForRole
} from '../../services/formService';
import './InstructorFormsPage.css';
import {
    IconForms as FileText,
    IconClock as Clock,
    IconCheck as Check,
    IconX as X,
    IconAlertTriangle as AlertTriangle,
    IconEye as Eye,
    IconPlus as Plus,
    IconCalendar as Calendar,
    IconUsers as Users,
    IconShirt as Shirt,
    IconHeart as Heart,
    IconFileText as FileIcon,
    IconExternalLink as ExternalLink,
    IconChalkboard as ChalkboardTeacher
} from '@tabler/icons-react';

const InstructorFormsPage = () => {
    const { appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { userData, user } = usePermissions();

    // State management
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [availableForms, setAvailableForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEventData, setSelectedEventData] = useState(null);
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
            const [assignmentsData, submissionsData, availableFormsData] = await Promise.all([
                getUserFormAssignments(user.uid),
                getFormSubmissions(null, { submitterId: user.uid }),
                getFormsForRole('instructor')
            ]);

            setAssignments(assignmentsData);
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

    // Handle create new event form
    const handleCreateEventForm = () => {
        // Sample event data for instructor registration
        const sampleEventData = {
            id: 'demo_instructor_event_' + Date.now(),
            title: 'Instructor Training Event',
            dayAndDate: 'Sunday, July 23rd, 2025',
            hours: '8:00 AM - 6:00 PM',
            location: 'Jerusalem Racing Academy',
            googleMapsLink: 'https://maps.google.com/?q=Jerusalem+Racing+Academy',
            wazeLink: 'https://waze.com/to/Jerusalem+Racing+Academy',
            notes: 'Mandatory training session for all racing instructors. Please bring your certification documents.',
            paymentLink: null, // Instructors typically don't pay
            closingNotes: 'Lunch will be provided. Looking forward to an excellent training session!',
            contactInfo: [
                'Training coordinator: training@racingclub.com',
                'Admin contact: +972-50-987-6543'
            ]
        };

        setSelectedEventData(sampleEventData);
        setShowEventModal(true);
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
                    {/* Quick Actions */}
                    <div className="quick-actions-section">
                        <div className="section-header">
                            <h3>{t('forms.quickActions', 'Quick Actions')}</h3>
                        </div>
                        <div className="quick-actions-grid">
                            <button
                                className="quick-action-card instructor-card"
                                onClick={handleCreateEventForm}
                            >
                                <Plus size={24} />
                                <span className="action-title">
                                    {t('forms.newInstructorRegistration', 'New Training Registration')}
                                </span>
                                <span className="action-desc">
                                    {t('forms.newInstructorDesc', 'Register for training events and workshops')}
                                </span>
                            </button>
                        </div>
                    </div>

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
                                <p>{t('forms.noInstructorSubmissionsDesc', 'You haven\'t registered for any training events yet. Start by registering for an upcoming training!')}</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateEventForm}
                                >
                                    <Plus size={16} />
                                    {t('forms.registerForTraining', 'Register for Training')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Available Forms */}
                    {availableForms.length > 0 && (
                        <div className="forms-section">
                            <div className="section-header">
                                <h3>
                                    <Calendar size={20} />
                                    {t('forms.availableForms', 'Available Training Events')}
                                </h3>
                            </div>

                            <div className="available-forms-grid">
                                {availableForms.map(form => {
                                    const hasSubmitted = hasSubmittedForm(form.id);
                                    const userSubmission = getUserSubmission(form.id);

                                    return (
                                        <div key={form.id} className="available-form-card instructor-form">
                                            <div className="card-header">
                                                <h4>{form.title}</h4>
                                                {hasSubmitted && (
                                                    <span className="submitted-badge">
                                                        <Check size={12} />
                                                        {t('forms.submitted', 'Submitted')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="card-body">
                                                <p>{form.description}</p>
                                                {form.createdAt && (
                                                    <div className="form-meta">
                                                        <span className="meta-label">{t('forms.created', 'Created')}:</span>
                                                        <span className="meta-value">
                                                            {form.createdAt.toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="card-footer">
                                                {hasSubmitted ? (
                                                    <button
                                                        className="btn-action view"
                                                        onClick={() => handleViewSubmission(userSubmission)}
                                                    >
                                                        <Eye size={16} />
                                                        {t('forms.viewSubmission', 'View Submission')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-action register instructor-register"
                                                        onClick={() => {
                                                            setSelectedEventData(form);
                                                            setShowEventModal(true);
                                                        }}
                                                    >
                                                        <Plus size={16} />
                                                        {t('forms.register', 'Register')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Event Registration Modal */}
                    <EventRegistrationModal
                        isOpen={showEventModal}
                        onClose={() => {
                            setShowEventModal(false);
                            setSelectedEventData(null);
                        }}
                        eventData={selectedEventData}
                        onSubmit={(submissionData) => {
                            loadFormsData(); // Reload data after submission
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
                                                    {viewSubmission.extraAttendees.map((attendee, index) => (
                                                        <div key={index} className="extra-attendee-item">
                                                            {attendee}
                                                        </div>
                                                    ))}
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