// src/pages/parent/MyFormsPage.jsx - Updated with Better Error Handling
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
import './MyFormsPage.css';
import {
    IconForms as FileText,
    IconClock as Clock,
    IconCheck as Check,
    IconX as X,
    IconEye as Eye,
    IconCalendar as Calendar,
    IconUsers as Users,
    IconShirt as Shirt,
    IconFileText as FileIcon,
    IconExternalLink as ExternalLink,
    IconMapPin as MapPin,
    IconAlertTriangle as AlertTriangle,
    IconRefresh as Refresh,
    IconSparkles as Sparkles,
    IconTarget as Target
} from '@tabler/icons-react';

const MyFormsPage = () => {
    const { appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { userData, user } = usePermissions();

    // State management
    const [submissions, setSubmissions] = useState([]);
    const [availableForms, setAvailableForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
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
        setError(null);
        console.log('🔍 Starting to load forms data...');

        try {
            // Load submissions first (less likely to fail)
            console.log('🔍 Loading form submissions...');
            const submissionsData = await getFormSubmissions({ submitterId: user.uid });
            console.log('✅ Submissions loaded:', submissionsData.length);
            setSubmissions(submissionsData);

            // Load available forms
            console.log('🔍 Loading available forms...');
            const availableFormsData = await getActiveForms('parent');
            console.log('✅ Forms loaded:', availableFormsData.length);
            setAvailableForms(availableFormsData);

        } catch (error) {
            console.error('❌ Error loading forms data:', error);
            setError(error.message || 'Failed to load forms data');
            // Set empty arrays so page doesn't break
            setSubmissions([]);
            setAvailableForms([]);
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
            // Try to increment view count, but don't fail if it doesn't work
            await incrementFormViewCount(form.id);

            // Update local state only if increment was successful
            setAvailableForms(prevForms =>
                prevForms.map(f =>
                    f.id === form.id
                        ? { ...f, viewCount: (f.viewCount || 0) + 1 }
                        : f
                )
            );
        } catch (error) {
            console.log('ℹ️ View count not updated, but continuing with form submission');
        }

        // Always open the form regardless of view count update
        setSelectedForm(form);
        setShowSubmissionModal(true);
    };

    // Handle view form details
    const handleViewForm = async (form) => {
        try {
            // Try to increment view count, but don't fail if it doesn't work
            await incrementFormViewCount(form.id);

            // Update local state only if increment was successful
            setAvailableForms(prevForms =>
                prevForms.map(f =>
                    f.id === form.id
                        ? { ...f, viewCount: (f.viewCount || 0) + 1 }
                        : f
                )
            );
        } catch (error) {
            console.log('ℹ️ View count not updated, but continuing with form view');
        }

        // Always open the form regardless of view count update
        setSelectedForm(form);
        setShowViewModal(true);
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
            // If it's already a string, return it
            if (typeof eventDetails.eventDate === 'string') {
                return eventDetails.eventDate;
            }
            // If it's a Date object, format it
            if (eventDetails.eventDate instanceof Date) {
                return eventDetails.eventDate.toLocaleDateString();
            }
            // If it has a toDate method (Firestore Timestamp), use it
            if (eventDetails.eventDate.toDate) {
                return eventDetails.eventDate.toDate().toLocaleDateString();
            }
        }

        return '';
    };

    // Error boundary component
    const ErrorDisplay = ({ error, onRetry }) => (
        <div className="error-state">
            <div className="error-icon">
                <AlertTriangle size={60} />
            </div>
            <h3>{t('forms.errorTitle', 'Unable to Load Forms')}</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={onRetry}>
                <Refresh size={16} />
                {t('forms.retry', 'Try Again')}
            </button>
        </div>
    );

    return (
        <Dashboard requiredRole="parent">
            <div className={`parent-forms-page ${appliedTheme}-mode`}>
                {/* Page Title - Matching Admin Style */}
                <h1 className="page-title">
                    <FileText size={32} className="page-title-icon" />
                    {t('forms.myForms', 'My Forms')}
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                <div className="page-container">
                    {/* Quick Actions - Matching Admin Style */}
                    <div className="quick-actions">
                        <div className="quick-actions-title">
                            <Target size={20} className="section-icon" />
                            {t('forms.quickActions', 'Quick Actions')}
                        </div>
                        <div className="quick-actions-grid">
                            <button
                                className="quick-action-btn"
                                onClick={loadFormsData}
                                disabled={isLoading}
                            >
                                <Refresh size={16} />
                                {t('forms.refreshData', 'Refresh Data')}
                            </button>
                        </div>
                    </div>
                    {/* Error Display */}
                    {error && !isLoading && (
                        <ErrorDisplay error={error} onRetry={loadFormsData} />
                    )}

                    {/* Debug Information - Only in development */}
                    {process.env.NODE_ENV === 'development' && !error && (
                        <div style={{
                            background: '#f0f0f0',
                            padding: '16px',
                            margin: '16px 0',
                            borderRadius: '8px',
                            border: '2px solid #ccc'
                        }}>
                            <h4>🔍 DEBUG INFO</h4>
                            <p><strong>User ID:</strong> {user?.uid || 'No user'}</p>
                            <p><strong>User Role:</strong> {userData?.role || 'No role'}</p>
                            <p><strong>Is Loading:</strong> {isLoading.toString()}</p>
                            <p><strong>Error:</strong> {error || 'None'}</p>
                            <p><strong>Available Forms Count:</strong> {availableForms.length}</p>
                            <p><strong>Submissions Count:</strong> {submissions.length}</p>
                            <details>
                                <summary>Raw Forms Data</summary>
                                <pre style={{ background: '#fff', padding: '8px', overflow: 'auto', maxHeight: '200px' }}>
                                    {JSON.stringify(availableForms, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}

                    {/* Main Content - Only show if no error */}
                    {!error && (
                        <>
                            {/* My Submissions */}
                            <div className="forms-section">
                                <div className="section-header">
                                    <h3>
                                        <FileText size={20} className="section-icon" />
                                        {t('forms.mySubmissions', '📝 My Submissions')}
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
                                                <div key={submission.id} className="submission-card">
                                                    <div className="card-header">
                                                        <div className="form-info">
                                                            <h4>{submission.formTitle || t('forms.eventRegistration', 'Event Registration')}</h4>
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
                                                                <span>{submission.attendeesCount || 0} {t('forms.attendees', 'attendees')}</span>
                                                            </div>
                                                            {submission.kidIds && submission.kidIds.length > 0 && (
                                                                <div className="summary-item">
                                                                    <Users size={16} />
                                                                    <span>{submission.kidIds.length} {t('forms.kids', 'kids')}</span>
                                                                </div>
                                                            )}
                                                            {(submission.shirts?.length > 0 || submission.extraShirts?.length > 0) && (
                                                                <div className="summary-item">
                                                                    <Shirt size={16} />
                                                                    <span>
                                                                        {(submission.shirts?.length || 0) + (submission.extraShirts?.length || 0)} {t('forms.shirts', 'shirts')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {submission.declarationUploaded && (
                                                                <div className="summary-item">
                                                                    <FileIcon size={16} />
                                                                    <span>{t('forms.declarationUploaded', 'Declaration uploaded')}</span>
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
                                            <FileText size={60} />
                                        </div>
                                        <h3>{t('forms.noSubmissions', 'No Submissions Yet')}</h3>
                                        <p>{t('forms.noSubmissionsDesc', 'You haven\'t submitted any forms yet. Check the available forms below!')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Available Forms */}
                            <div className="forms-section">
                                <div className="section-header">
                                    <h3>
                                        <Calendar size={20} className="section-icon" />
                                        {t('forms.availableForms', '📋 Available Forms')}
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
                                                <div key={form.id} className="available-form-card">
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
                                                                <FileIcon size={16} />
                                                                {t('forms.viewSubmission', 'View Submission')}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-action register"
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
                                        <h3>{t('forms.noFormsAvailable', 'No Forms Available')}</h3>
                                        <p>{t('forms.noFormsDesc', 'There are no active forms available at the moment.')}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Form Submission Modal */}
                    <FormSubmissionModal
                        isOpen={showSubmissionModal}
                        onClose={() => {
                            setShowSubmissionModal(false);
                            setSelectedForm(null);
                        }}
                        form={selectedForm}
                        userType="parent"
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
                                                    <span>{viewSubmission.attendeesCount || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Kids Info */}
                                        {viewSubmission.kidIds && viewSubmission.kidIds.length > 0 && (
                                            <div className="details-section">
                                                <h4>{t('forms.selectedKids', 'Selected Kids')}</h4>
                                                <div className="kids-list">
                                                    {viewSubmission.kidIds.map((kidId, index) => (
                                                        <div key={kidId} className="kid-item">
                                                            <span className="kid-info">
                                                                {t('forms.kid', 'Kid')} #{index + 1} (ID: {kidId})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Extra Attendees */}
                                        {viewSubmission.extraAttendees && viewSubmission.extraAttendees.length > 0 && (
                                            <div className="details-section">
                                                <h4>{t('forms.extraAttendees', 'Extra Attendees')}</h4>
                                                <div className="extra-attendees-list">
                                                    {viewSubmission.extraAttendees.map((attendee, index) => (
                                                        <div key={index} className="extra-attendee-item">
                                                            {attendee}
                                                        </div>
                                                    ))}
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

export default MyFormsPage;