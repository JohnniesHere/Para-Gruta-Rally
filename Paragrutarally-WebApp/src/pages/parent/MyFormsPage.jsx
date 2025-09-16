import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import FormSubmissionModal from '../../components/modals/FormSubmissionModal';
import FormViewModal from '../../components/modals/FormViewModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import ViewSubmissionModal from '../../components/modals/ViewSubmissionModal';
import EditSubmissionModal from '../../components/modals/EditSubmissionModal';
import { getUserFormSubmission } from '@/services/formService.js';

import {
    getFormSubmissions,
    getActiveForms,
    incrementFormViewCount
} from '@/services/formService.js';
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
    IconTarget as Target,
    IconEdit as Edit
} from '@tabler/icons-react';

const MyFormsPage = () => {
    const getErrorMessage = (error, t) => {
        if (typeof error === 'string') {
            if (error.includes('Missing or insufficient permissions') || error.includes('permission-denied')) {
                return t('errors.insufficientPermissions', 'אין הרשאות מספיקות לצפייה בתוכן זה');
            }
            if (error.includes('network-request-failed')) {
                return t('errors.networkError', 'שגיאת רשת - בדוק את החיבור לאינטרנט');
            }
        }
        return error || t('errors.unknownError', 'שגיאה לא ידועה');
    };
    const { appliedTheme } = useTheme();
    const { t, currentLanguage } = useLanguage();
    const { userData, user } = usePermissions();

    // Determine if RTL based on language
    const isRTL = currentLanguage === 'he' || currentLanguage === 'ar';

    // State management
    const [submissions, setSubmissions] = useState([]);
    const [availableForms, setAvailableForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [viewSubmission, setViewSubmission] = useState(null);
    const [showViewSubmissionModal, setShowViewSubmissionModal] = useState(false);
    const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // Load data
    useEffect(() => {
        if (user?.uid) {
            loadFormsData();
        }
    }, [user]);

    const loadFormsData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Loading forms for parent user:', user?.uid);

            // Try to load active forms - this should work with updated rules
            let availableFormsData = [];
            try {
                availableFormsData = await getActiveForms('parent');
                console.log('✅ Loaded', availableFormsData.length, 'forms');
            } catch (formsError) {
                console.error('❌ Error loading forms:', formsError);
                throw new Error('Failed to load available forms');
            }

            setAvailableForms(availableFormsData);

            // Try to load user submissions - but don't fail if it doesn't work
            let userSubmissions = [];
            try {
                // Use the individual form checking approach for better compatibility
                for (const form of availableFormsData) {
                    try {
                        const userSubmission = await getUserFormSubmission(user.uid, form.id);
                        if (userSubmission) {
                            userSubmission.formTitle = form.title;
                            userSubmissions.push(userSubmission);
                        }
                    } catch (submissionError) {
                        // It's OK if no submission exists
                        console.log(`No submission found for form ${form.id}`);
                    }
                }
                console.log('✅ Loaded', userSubmissions.length, 'user submissions');
            } catch (submissionsError) {
                console.warn('⚠️ Could not load submissions:', submissionsError);
                // Don't fail - just show empty submissions
            }

            setSubmissions(userSubmissions);

        } catch (error) {
            console.error('❌ Critical error loading forms data:', error);
            setError(error.message || 'Failed to load forms data');
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
            },
            'submitted': {
                label: t('forms.status.submitted', 'Submitted'),
                color: '#10B981',
                icon: Check
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

    // For viewing submissions
    const handleViewSubmission = (submission) => {
        setSelectedSubmission(submission);
        setShowViewSubmissionModal(true);
    };

    // For editing submissions
    const handleEditSubmission = (submission) => {
        setSelectedSubmission(submission);
        setShowEditSubmissionModal(true);
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

    // State for kid names - similar to ViewSubmissionModal
    const [kidNames, setKidNames] = useState({});
    const [loadingKids, setLoadingKids] = useState(false);

    // Load kid names when submissions change
    useEffect(() => {
        if (submissions.length > 0) {
            loadAllKidNames();
        }
    }, [submissions]);

    const loadAllKidNames = async () => {
        const allKidIds = new Set();

        // Collect all unique kid IDs from all submissions
        submissions.forEach(submission => {
            if (submission.kidIds && Array.isArray(submission.kidIds)) {
                submission.kidIds.forEach(kidId => {
                    const cleanKidId = typeof kidId === 'string' ? kidId.replace(/[^\w-]/g, '') : kidId;
                    if (cleanKidId) allKidIds.add(kidId); // Store original for mapping, but clean for lookup
                });
            }
        });

        if (allKidIds.size === 0) return;

        setLoadingKids(true);
        const names = {};

        try {
            // Import kidService
            const { getKidById } = await import('../../services/kidService');

            // Load each kid's data from the database
            for (const kidId of allKidIds) {
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

    // Helper function to get kid display name using loaded names
    const getKidDisplayName = (kidIds = []) => {
        if (!Array.isArray(kidIds) || kidIds.length === 0) {
            return '';
        }

        if (loadingKids) {
            return t('forms.loading.kid', 'Loading...');
        }

        if (kidIds.length === 1) {
            const kidName = kidNames[kidIds[0]];
            return kidName || t('forms.kidDisplay', 'Kid {{id}}', {
                id: (typeof kidIds[0] === 'string' ? kidIds[0].replace(/[^\w-]/g, '') : kidIds[0]).slice(-4)
            });
        }

        return t('forms.kidsCount', '{{count}} kids', { count: kidIds.length });
    };

    // Error boundary component
    const ErrorDisplay = ({ error, onRetry }) => (
        <div className="error-state">
            <div className="error-icon">
                <AlertTriangle size={60} />
            </div>
            <h3>{t('forms.error.title', 'Unable to Load Forms')}</h3>
            <p>{getErrorMessage(error,t)}</p>
            <button className="btn btn-primary" onClick={onRetry}>
                <Refresh size={16} />
                {t('forms.actions.retry', 'Try Again')}
            </button>
        </div>
    );

    return (
        <Dashboard requiredRole="parent">
            <div className={`parent-forms-page ${appliedTheme}-mode ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Page Title - Matching Admin Style */}
                <h1 className="page-title">
                    <FileText size={32} className="page-title-icon" />
                    {t('forms.pageTitle', 'My Forms')}
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                <div className="page-container">
                    {/* Quick Actions - Matching Admin Style */}
                    <div className="quick-actions">
                        <div className="quick-actions-title">
                            <Target size={20} className="section-icon" />
                            {t('forms.quickActions.title', 'Quick Actions')}
                        </div>
                        <div className="quick-actions-grid">
                            <button
                                className="quick-action-btn"
                                onClick={loadFormsData}
                                disabled={isLoading}
                            >
                                <Refresh size={16} />
                                {t('forms.actions.refreshData', 'Refresh Data')}
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && !isLoading && (
                        <ErrorDisplay error={error} onRetry={loadFormsData} />
                    )}

                    {/* Main Content - Only show if no error */}
                    {!error && (
                        <>
                            {/* My Submissions */}
                            <div className="forms-section">
                                <div className="section-header">
                                    <h3>
                                        <FileText size={20} className="section-icon" />
                                        {t('forms.sections.mySubmissions', 'My Submissions')}
                                    </h3>
                                </div>

                                {isLoading ? (
                                    <div className="loading-state">
                                        <Clock className="loading-spinner" size={30} />
                                        <p>{t('forms.loading.forms', 'Loading forms...')}</p>
                                    </div>
                                ) : submissions.length > 0 ? (
                                    <div className="submissions-grid">
                                        {submissions.map(submission => {
                                            const statusInfo = getStatusInfo(submission.confirmationStatus);
                                            const StatusIcon = statusInfo.icon;

                                            return (
                                                <div key={submission.id} className="submission-card">
                                                    <div className="card-header">
                                                        {/* Conditional rendering based on RTL */}
                                                        {isRTL ? (
                                                            <>
                                                                {/* RTL: Status badge first, then form info */}
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
                                                                <div className="form-info" style={{ textAlign: 'right', direction: 'rtl' }}>
                                                                    <h4 style={{ flexDirection: 'row-reverse', textAlign: 'right' }}>
                                                                        {submission.formTitle || t('forms.defaultTitle', 'Event Registration')}
                                                                    </h4>
                                                                    <span className="submission-date" style={{ textAlign: 'right', direction: 'ltr' }}>
                                                                        {submission.submittedAt?.toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* LTR: Form info first, then status badge */}
                                                                <div className="form-info">
                                                                    <h4>{submission.formTitle || t('forms.defaultTitle', 'Event Registration')}</h4>
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
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="card-body">
                                                        <div className="submission-summary">
                                                            <div className="summary-item" style={isRTL ? {
                                                                flexDirection: 'row-reverse',
                                                                textAlign: 'right'
                                                            } : {}}>
                                                                <Users size={16} />
                                                                <span>{submission.attendeesCount || 0} {t('forms.labels.attendees', 'attendees')}</span>
                                                            </div>
                                                            {submission.kidIds && submission.kidIds.length > 0 && (
                                                                <div className="summary-item" style={isRTL ? {
                                                                    flexDirection: 'row-reverse',
                                                                    textAlign: 'right'
                                                                } : {}}>
                                                                    <Users size={16} />
                                                                    <span>{getKidDisplayName(submission.kidIds)}</span>
                                                                </div>
                                                            )}
                                                            {(submission.shirts?.length > 0 || submission.extraShirts?.length > 0) && (
                                                                <div className="summary-item" style={isRTL ? {
                                                                    flexDirection: 'row-reverse',
                                                                    textAlign: 'right'
                                                                } : {}}>
                                                                    <Shirt size={16} />
                                                                    <span>
                                                                        {(submission.shirts?.length || 0) + (submission.extraShirts?.length || 0)} {t('forms.labels.shirts', 'shirts')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {submission.declarationUploaded && (
                                                                <div className="summary-item" style={isRTL ? {
                                                                    flexDirection: 'row-reverse',
                                                                    textAlign: 'right'
                                                                } : {}}>
                                                                    <FileIcon size={16} />
                                                                    <span>{t('forms.labels.declarationUploaded', 'Declaration uploaded')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="card-footer">
                                                        <button
                                                            className="btn-action view"
                                                            onClick={() => handleViewSubmission(submission)}
                                                            title={t('forms.actions.viewDetails', 'View Details')}
                                                        >
                                                            <Eye size={16} />
                                                            {t('forms.actions.view', 'View')}
                                                        </button>

                                                        <button
                                                            className="btn-action edit"
                                                            onClick={() => handleEditSubmission(submission)}
                                                            title={t('forms.actions.editSubmission', 'Edit Submission')}
                                                        >
                                                            <Edit size={16} />
                                                            {t('forms.actions.edit', 'Edit')}
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
                                        <h3>{t('forms.empty.noSubmissions.title', 'No Submissions Yet')}</h3>
                                        <p>{t('forms.empty.noSubmissions.description', 'You haven\'t submitted any forms yet. Check the available forms below!')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Available Forms */}
                            <div className="forms-section">
                                <div className="section-header">
                                    <h3>
                                        <Calendar size={20} className="section-icon" />
                                        {t('forms.sections.availableForms', 'Available Forms')}
                                    </h3>
                                </div>

                                {isLoading ? (
                                    <div className="loading-state">
                                        <Clock className="loading-spinner" size={30} />
                                        <p>{t('forms.loading.forms', 'Loading forms...')}</p>
                                    </div>
                                ) : availableForms.length > 0 ? (
                                    <div className="available-forms-grid">
                                        {availableForms.map(form => {
                                            const hasSubmitted = hasSubmittedForm(form.id);
                                            const userSubmission = getUserSubmission(form.id);

                                            return (
                                                <div key={form.id} className="available-form-card">
                                                    <div className="card-header">
                                                        {/* Conditional rendering based on RTL */}
                                                        {isRTL ? (
                                                            <>
                                                                {/* RTL: Badge first, then title section */}
                                                                {hasSubmitted && (
                                                                    (() => {
                                                                        const submittedStatusInfo = getStatusInfo('submitted');
                                                                        const SubmittedIcon = submittedStatusInfo.icon;
                                                                        return (
                                                                            <span
                                                                                className="status-badge"
                                                                                style={{
                                                                                    borderColor: submittedStatusInfo.color,
                                                                                    color: submittedStatusInfo.color
                                                                                }}
                                                                            >
                                                                                <SubmittedIcon size={12} />
                                                                                {submittedStatusInfo.label}
                                                                            </span>
                                                                        );
                                                                    })()
                                                                )}
                                                                <div className="form-title-section" style={{ textAlign: 'right', direction: 'rtl' }}>
                                                                    <h4 style={{ flexDirection: 'row-reverse', textAlign: 'right' }}>
                                                                        {form.title}
                                                                    </h4>
                                                                    {formatEventDate(form.eventDetails) && (
                                                                        <div className="event-date" style={{ flexDirection: 'row-reverse', justifyContent: 'flex-end' }}>
                                                                            <span style={{ direction: 'ltr' }}>{formatEventDate(form.eventDetails)}</span>
                                                                            <Calendar size={14} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* LTR: Title section first, then badge */}
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
                                                                    (() => {
                                                                        const submittedStatusInfo = getStatusInfo('submitted');
                                                                        const SubmittedIcon = submittedStatusInfo.icon;
                                                                        return (
                                                                            <span
                                                                                className="status-badge"
                                                                                style={{
                                                                                    borderColor: submittedStatusInfo.color,
                                                                                    color: submittedStatusInfo.color
                                                                                }}
                                                                            >
                                                                                <SubmittedIcon size={12} />
                                                                                {submittedStatusInfo.label}
                                                                            </span>
                                                                        );
                                                                    })()
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="card-body">
                                                        <p style={isRTL ? {
                                                            textAlign: 'right',
                                                            direction: 'rtl'
                                                        } : {}}>{form.description}</p>

                                                        {/* Event details preview */}
                                                        {form.eventDetails && (
                                                            <div className="event-preview" style={isRTL ? {
                                                                borderLeft: 'none',
                                                                borderRight: '4px solid var(--racing-lilach)',
                                                                textAlign: 'right',
                                                                direction: 'rtl'
                                                            } : {}}>
                                                                {form.eventDetails.location && (
                                                                    <div className="event-detail" style={isRTL ? {
                                                                        flexDirection: 'row-reverse',
                                                                        textAlign: 'right',
                                                                        direction: 'rtl'
                                                                    } : {}}>
                                                                        <MapPin size={14} />
                                                                        <span>{form.eventDetails.location}</span>
                                                                    </div>
                                                                )}
                                                                {form.eventDetails.hours && (
                                                                    <div className="event-detail" style={isRTL ? {
                                                                        flexDirection: 'row-reverse',
                                                                        textAlign: 'right',
                                                                        direction: 'ltr' // Keep time LTR but align right
                                                                    } : {}}>
                                                                        <Clock size={14} />
                                                                        <span>{form.eventDetails.hours}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="form-meta" style={isRTL ? {
                                                            textAlign: 'right'
                                                        } : {}}>
                                                            <span className="meta-label" style={isRTL ? { textAlign: 'right' } : {}}>
                                                                {t('forms.labels.views', 'Views')}:
                                                            </span>
                                                            <span className="meta-value" style={isRTL ? { direction: 'ltr' } : {}}>
                                                                {form.viewCount || 0}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="card-footer">
                                                        {/* Conditional rendering for RTL button order */}
                                                        {isRTL ? (
                                                            <>
                                                                {/* RTL: Second button first, then view button */}
                                                                {hasSubmitted ? (
                                                                    <button
                                                                        className="btn-action edit"
                                                                        onClick={() => handleEditSubmission(userSubmission)}
                                                                        title={t('forms.actions.editSubmission', 'Edit Submission')}
                                                                    >
                                                                        <Edit size={16} />
                                                                        {t('forms.actions.edit', 'Edit')}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn-action register"
                                                                        onClick={() => handleFormSubmission(form)}
                                                                        title={t('forms.actions.fillForm', 'Fill Form')}
                                                                    >
                                                                        <FileText size={16} />
                                                                        {t('forms.actions.fillForm', 'Fill Form')}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="btn-action view"
                                                                    onClick={() => handleViewForm(form)}
                                                                    title={t('forms.actions.viewForm', 'View Form')}
                                                                >
                                                                    <Eye size={16} />
                                                                    {t('forms.actions.view', 'View')}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* LTR: View button first, then action button */}
                                                                <button
                                                                    className="btn-action view"
                                                                    onClick={() => handleViewForm(form)}
                                                                    title={t('forms.actions.viewForm', 'View Form')}
                                                                >
                                                                    <Eye size={16} />
                                                                    {t('forms.actions.view', 'View')}
                                                                </button>
                                                                {hasSubmitted ? (
                                                                    <button
                                                                        className="btn-action edit"
                                                                        onClick={() => handleEditSubmission(userSubmission)}
                                                                        title={t('forms.actions.editSubmission', 'Edit Submission')}
                                                                    >
                                                                        <Edit size={16} />
                                                                        {t('forms.actions.edit', 'Edit')}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn-action register"
                                                                        onClick={() => handleFormSubmission(form)}
                                                                        title={t('forms.actions.fillForm', 'Fill Form')}
                                                                    >
                                                                        <FileText size={16} />
                                                                        {t('forms.actions.fillForm', 'Fill Form')}
                                                                    </button>
                                                                )}
                                                            </>
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
                                        <h3>{t('forms.empty.noForms.title', 'No Forms Available')}</h3>
                                        <p>{t('forms.empty.noForms.description', 'There are no active forms available at the moment.')}</p>
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

                    {/* View Submission Modal - REMOVED EDIT BUTTON */}
                    <ViewSubmissionModal
                        isOpen={showViewSubmissionModal}
                        submission={selectedSubmission}
                        form={availableForms.find(f => f.id === selectedSubmission?.formId)}
                        onClose={() => {
                            setShowViewSubmissionModal(false);
                            setSelectedSubmission(null);
                        }}
                        userKids={submissions.kidIds}
                    />

                    {/* Edit Submission Modal */}
                    <EditSubmissionModal
                        isOpen={showEditSubmissionModal}
                        submission={selectedSubmission}
                        form={availableForms.find(f => f.id === selectedSubmission?.formId)}
                        onClose={() => {
                            setShowEditSubmissionModal(false);
                            setSelectedSubmission(null);
                        }}
                        onSubmit={(updatedSubmission) => {
                            // Refresh the forms data to show updated submission
                            loadFormsData();
                            setShowEditSubmissionModal(false);
                            setSelectedSubmission(null);
                        }}
                        userType="parent"
                    />

                    {/* Submission Details Modal */}
                    {viewSubmission && (
                        <div className="modal-overlay">
                            <div className="modal-content submission-details-modal">
                                <div className="modal-header">
                                    <h3>{t('forms.modal.submissionDetails', 'Submission Details')}</h3>
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
                                            <h4>{t('forms.sections.basicInformation', 'Basic Information')}</h4>
                                            <div className="details-grid">
                                                <div className="detail-item">
                                                    <label>{t('forms.labels.submittedAt', 'Submitted At')}</label>
                                                    <span>
                                                        {viewSubmission.submittedAt?.toLocaleDateString()} {viewSubmission.submittedAt?.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>{t('forms.labels.confirmationStatus', 'Status')}</label>
                                                    <span className="status-value">
                                                        {getStatusInfo(viewSubmission.confirmationStatus).label}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>{t('forms.labels.totalAttendees', 'Total Attendees')}</label>
                                                    <span>{viewSubmission.attendeesCount || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Kids Info */}
                                        {viewSubmission.kidIds && viewSubmission.kidIds.length > 0 && (
                                            <div className="details-section">
                                                <h4>{t('forms.sections.selectedKids', 'Selected Kids')}</h4>
                                                <div className="kids-list">
                                                    {viewSubmission.kidIds.map((kidId, index) => (
                                                        <div key={kidId} className="kid-item">
                                                            <span className="kid-info">
                                                                {getKidDisplayName([kidId])}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Extra Attendees */}
                                        {viewSubmission.extraAttendees && viewSubmission.extraAttendees.length > 0 && (
                                            <div className="details-section">
                                                <h4>{t('forms.sections.extraAttendees', 'Extra Attendees')}</h4>
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
                                                    {t('forms.sections.shirtInformation', 'Shirt Information')}
                                                </h4>
                                                <div className="shirts-details">
                                                    {viewSubmission.shirts?.length > 0 && (
                                                        <div className="shirts-group">
                                                            <label>{t('forms.labels.requiredShirts', 'Required Shirts')}</label>
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
                                                            <label>{t('forms.labels.extraShirts', 'Extra Shirts')}</label>
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
                                                    {t('forms.sections.signedDeclaration', 'Signed Declaration')}
                                                </h4>
                                                <div className="declaration-file">
                                                    <a
                                                        href={viewSubmission.declarationUploaded}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="file-link"
                                                    >
                                                        <FileIcon size={16} />
                                                        {t('forms.actions.viewDeclaration', 'View Declaration File')}
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