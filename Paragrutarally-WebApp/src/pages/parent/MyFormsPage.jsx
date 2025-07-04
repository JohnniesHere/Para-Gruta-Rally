// src/pages/parent/MyFormsPage.jsx - Updated Parent Forms Interface
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
    IconMapPin as MapPin
} from '@tabler/icons-react';

const MyFormsPage = () => {
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
        console.log('🔍 DEBUG: Starting to load forms data...');
        console.log('🔍 DEBUG: Current user:', user);

        try {
            console.log('🔍 DEBUG: Calling getFormSubmissions...');
            const submissionsData = await getFormSubmissions({ submitterId: user.uid });
            console.log('🔍 DEBUG: Submissions loaded:', submissionsData);
            setSubmissions(submissionsData);

            console.log('🔍 DEBUG: About to call getActiveForms with "parent"...');

            // Let's try a more direct approach first
            try {
                const availableFormsData = await getActiveForms('parent');
                console.log('🔍 DEBUG: Forms query result:', availableFormsData);
                console.log('🔍 DEBUG: Number of forms found:', availableFormsData.length);

                // Log each form for detailed inspection
                availableFormsData.forEach((form, index) => {
                    console.log(`🔍 DEBUG: Form ${index + 1}:`, {
                        id: form.id,
                        title: form.title,
                        status: form.status,
                        targetUsers: form.targetUsers,
                        createdAt: form.createdAt,
                        eventDetails: form.eventDetails
                    });
                });

                setAvailableForms(availableFormsData);
            } catch (formsError) {
                console.error('❌ DEBUG: Error in getActiveForms:', formsError);
                console.error('❌ DEBUG: Detailed error:', {
                    message: formsError.message,
                    stack: formsError.stack
                });

                // Try to set empty array so page doesn't break
                setAvailableForms([]);
            }

        } catch (error) {
            console.error('❌ DEBUG: Error loading forms data:', error);
            console.error('❌ DEBUG: Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            // Set empty arrays so page doesn't break
            setSubmissions([]);
            setAvailableForms([]);
        } finally {
            setIsLoading(false);
            console.log('🔍 DEBUG: Loading completed');
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
                icon: X
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

    return (
        <Dashboard requiredRole="parent">
            <div className={`parent-forms-page ${appliedTheme}-mode`}>
                {/* Page Header */}
                <div className="page-header">
                    <h1>
                        <FileText size={32} className="page-title-icon" />
                        {t('forms.myForms', 'My Forms')}
                    </h1>
                    <p className="page-subtitle">
                        {t('forms.parentFormsDesc', 'Manage your event registrations and form submissions')}
                    </p>
                </div>

                <div className="page-container">
                    {/* Debug Information - Remove this in production */}
                    {process.env.NODE_ENV === 'development' && (
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
                            <p><strong>Available Forms Count:</strong> {availableForms.length}</p>
                            <p><strong>Submissions Count:</strong> {submissions.length}</p>
                            <details>
                                <summary>Raw Forms Data</summary>
                                <pre style={{ background: '#fff', padding: '8px', overflow: 'auto' }}>
                                    {JSON.stringify(availableForms, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
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
                                <Calendar size={20} />
                                {t('forms.availableForms', 'Available Forms')}
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