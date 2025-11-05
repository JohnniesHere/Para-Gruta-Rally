// src/pages/admin/FormSubmissionsPage.jsx - Form Submissions Management
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    getFormById,
    getFormSubmissionsWithUserDetails, getAllSubmissionsWithDetails,
    getFormsAnalytics
} from '@/services/formService.js';
import { getUserData } from '@/services/userService.js';
import { getKidsByParent } from '@/services/kidService.js';
import { exportSubmissionsToCSV } from "@/utils/formatUtils.js";
import {
    IconNotes as FileText,
    IconEye as Eye,
    IconDownload as Download,
    IconFilter as Filter,
    IconSearch as Search,
    IconUsers as Users,
    IconClock as Clock,
    IconCheck as Check,
    IconX as X,
    IconAlertTriangle as AlertTriangle,
    IconChevronLeft as ChevronLeft,
    IconMail as Mail,
    IconPhone as Phone,
    IconShirt as Shirt,
    IconFileText as FileIcon,
    IconExternalLink as ExternalLink,
    IconChevronDown as ChevronDown,
    IconChevronUp as ChevronUp
} from '@tabler/icons-react';

const FormSubmissionsPage = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const { appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { permissions, userRole } = usePermissions();

    // State management
    const [form, setForm] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [formTypeFilter, setFormTypeFilter] = useState('all');
    const [expandedSubmissions, setExpandedSubmissions] = useState(new Set());
    const [submissionDetails, setSubmissionDetails] = useState({});
    const [isExporting, setIsExporting] = useState(false);

    // Load data
    useEffect(() => {
        loadData();
    }, [formId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (formId) {
                // Load specific form and its submissions
                const [formData, submissionsData] = await Promise.all([
                    getFormById(formId),
                    getFormSubmissionsWithUserDetails(formId)
                ]);
                setForm(formData);
                setSubmissions(submissionsData);
            } else {
                // Load all submissions
                const submissionsData = await getAllSubmissionsWithDetails();
                setSubmissions(submissionsData);
            }

        } catch (error) {
            console.error('❌ Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load submission details (user data, kids data)
    const loadSubmissionDetails = async (submission) => {
        if (submissionDetails[submission.id]) {
            return submissionDetails[submission.id];
        }

        try {
            const details = { ...submission };

            // Load submitter user data with error handling
            if (submission.submitterId) {
                try {
                    details.submitterData = await getUserData(submission.submitterId);
                } catch (error) {
                    console.warn('Could not load user data for:', submission.submitterId, error);
                    // Try to use data from the submission object itself as fallback
                    details.submitterData = {
                        name: submission.submitterName || submission.submitterData?.name || 'Unknown User',
                        email: submission.submitterEmail || submission.submitterData?.email || '',
                        phone: submission.submitterPhone || submission.submitterData?.phone || ''
                    };
                }
            } else if (submission.submitterData) {
                // If no submitterId but submitterData exists in submission
                details.submitterData = submission.submitterData;
            } else {
                // Last resort fallback
                details.submitterData = {
                    name: submission.submitterName || 'Unknown User',
                    email: submission.submitterEmail || '',
                    phone: submission.submitterPhone || ''
                };
            }

            // Load kids data if available - with better error handling
            if (submission.kidIds && submission.kidIds.length > 0) {
                details.kidsData = [];

                for (const kidId of submission.kidIds) {
                    try {
                        const { getKidById } = await import('../../services/kidService');
                        const kidData = await getKidById(kidId);

                        if (kidData) {
                            details.kidsData.push(kidData);
                        } else {
                            // Kid not found, add placeholder
                            console.warn(`Kid ${kidId} not found, using placeholder`);
                            details.kidsData.push({
                                id: kidId,
                                personalInfo: {
                                    firstName: 'Unknown',
                                    lastName: 'Kid',
                                    participantNumber: kidId
                                }
                            });
                        }
                    } catch (error) {
                        console.warn(`Could not load kid ${kidId}:`, error.message);

                        // Add placeholder data instead of failing completely
                        details.kidsData.push({
                            id: kidId,
                            personalInfo: {
                                firstName: 'Missing',
                                lastName: 'Kid Data',
                                participantNumber: kidId
                            },
                            error: true
                        });
                    }
                }
            }

            // Store the loaded details
            setSubmissionDetails(prev => ({
                ...prev,
                [submission.id]: details
            }));

            return details;
        } catch (error) {
            console.error('Error loading submission details:', error);

            // Return submission with basic data even if details loading fails
            const fallbackDetails = {
                ...submission,
                submitterData: {
                    name: submission.submitterName || submission.submitterData?.name || 'Unknown User',
                    email: submission.submitterEmail || submission.submitterData?.email || '',
                    phone: submission.submitterPhone || submission.submitterData?.phone || ''
                },
                kidsData: submission.kidIds ? submission.kidIds.map(kidId => ({
                    id: kidId,
                    personalInfo: {
                        firstName: 'Unknown',
                        lastName: 'Kid',
                        participantNumber: kidId
                    }
                })) : []
            };

            setSubmissionDetails(prev => ({
                ...prev,
                [submission.id]: fallbackDetails
            }));

            return fallbackDetails;
        }
    };

    // Toggle submission expansion - THIS WAS MISSING!
    const toggleSubmissionExpansion = async (submission) => {
        const newExpanded = new Set(expandedSubmissions);

        if (newExpanded.has(submission.id)) {
            // Collapse
            newExpanded.delete(submission.id);
        } else {
            // Expand and load details if not already loaded
            newExpanded.add(submission.id);
            if (!submissionDetails[submission.id]) {
                const details = await loadSubmissionDetails(submission);
                setSubmissionDetails(prev => ({
                    ...prev,
                    [submission.id]: details
                }));
            }
        }

        setExpandedSubmissions(newExpanded);
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

    // Filter submissions
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(submission => {
            const matchesSearch = searchTerm === '' ||
                submission.submitterData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                submission.submitterData?.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || submission.confirmationStatus === statusFilter;
            const matchesType = formTypeFilter === 'all' || submission.formType === formTypeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [submissions, searchTerm, statusFilter, formTypeFilter]);

    // Export submissions to CSV
    const handleExportSubmissions = async () => {
        if (filteredSubmissions.length === 0) {
            alert(t('forms.noSubmissionsToExport', 'No submissions available to export'));
            return;
        }

        setIsExporting(true);
        try {
            const filename = formId ? `form_${formId}_submissions` : 'all_submissions';
            const success = exportSubmissionsToCSV(filteredSubmissions, filename);
            if (!success) {
                alert(t('forms.exportError', 'Export failed. Please try again.'));
            }
        } catch (error) {
            console.error('Export error:', error);
            alert(t('forms.exportError', 'Export failed. Please try again.'));
        } finally {
            setIsExporting(false);
        }
    };

    if (!permissions) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading', 'Loading...')}</p>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page ${appliedTheme}-mode`}>
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <button
                            className="back-button"
                            onClick={() => navigate('/admin/forms')}
                        >
                            <ChevronLeft size={20} />
                            {t('common.back', 'Back')}
                        </button>
                        <h1>
                            <FileText size={32} className="page-title-icon" />
                            {form
                                ? t('forms.submissionsForForm', 'Submissions for {title}', { title: form.title })
                                : t('forms.allSubmissions', 'All Form Submissions')
                            }
                        </h1>
                    </div>
                </div>

                <div className="admin-container">
                    {/* Controls */}
                    <div className="controls-section">
                        <div className="search-filter-section">
                            {/* Search */}
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <Search className="search-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder={t('forms.searchSubmissions', 'Search submissions...')}
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="filters-container">
                                <div className="filter-container">
                                    <label className="filter-label">
                                        <Filter className="filter-icon" size={16} />
                                        {t('forms.status', 'Status')}
                                    </label>
                                    <select
                                        className="filter-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">{t('forms.allStatuses', 'All Statuses')}</option>
                                        <option value="attending">{t('forms.attending', 'Attending')}</option>
                                        <option value="not attending">{t('forms.notAttending', 'Not Attending')}</option>
                                        <option value="needs to decide">{t('forms.needsToDecide', 'Needs to Decide')}</option>
                                    </select>
                                </div>

                                <div className="filter-container">
                                    <label className="filter-label">
                                        {t('forms.formType', 'Form Type')}
                                    </label>
                                    <select
                                        className="filter-select"
                                        value={formTypeFilter}
                                        onChange={(e) => setFormTypeFilter(e.target.value)}
                                    >
                                        <option value="all">{t('forms.allTypes', 'All Types')}</option>
                                        <option value="parent">{t('forms.parentForm', 'Parent Form')}</option>
                                        <option value="instructor">{t('forms.instructorForm', 'Instructor Form')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button
                                className="btn btn-secondary"
                                onClick={handleExportSubmissions}
                                disabled={isExporting || filteredSubmissions.length === 0}
                            >
                                <Download size={16} />
                                {isExporting ?
                                    t('forms.exporting', 'Exporting...') :
                                    t('forms.exportSubmissions', 'Export CSV')
                                }
                            </button>
                        </div>
                    </div>

                    {/* Submissions List */}
                    {isLoading ? (
                        <div className="loading-state">
                            <Clock className="loading-spinner" size={30} />
                            <p>{t('forms.loadingSubmissions', 'Loading submissions...')}</p>
                        </div>
                    ) : filteredSubmissions.length > 0 ? (
                        <div className="submissions-table-container">
                            <table className="submissions-table">
                                <thead>
                                <tr>
                                    <th>{t('forms.submittedAt', 'Submitted')}</th>
                                    <th>{t('forms.submitter', 'Submitter')}</th>
                                    <th>{t('forms.status', 'Status')}</th>
                                    <th>{t('forms.type', 'Type')}</th>
                                    <th>{t('forms.attendees', 'Attendees')}</th>
                                    <th>{t('forms.actions', 'Actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredSubmissions.map(submission => {
                                    const statusInfo = getStatusInfo(submission.confirmationStatus);
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <React.Fragment key={submission.id}>
                                            <tr>
                                                <td>
                                                    {submission.submittedAt?.toLocaleDateString()} {submission.submittedAt?.toLocaleTimeString()}
                                                </td>
                                                <td>
                                                    <div className="submitter-info">
                                                        <div className="submitter-name">
                                                            {submission.submitterData?.name || t('common.unknown', 'Unknown')}
                                                        </div>
                                                        <div className="submitter-email">
                                                            {submission.submitterData?.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="submission-status"
                                                        style={{ borderColor: statusInfo.color }}
                                                    >
                                                        <StatusIcon size={12} style={{ color: statusInfo.color }} />
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="form-type-badge">
                                                        {submission.formType === 'parent'
                                                            ? t('forms.parent', 'Parent')
                                                            : t('forms.instructor', 'Instructor')
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="attendees-summary">
                                                        <span className="attendee-count">
                                                            {submission.attendeesCount || 0}
                                                        </span>
                                                        {submission.kidIds && submission.kidIds.length > 0 && (
                                                            <span className="kids-count">
                                                                ({submission.kidIds.length} {t('forms.kids', 'kids')})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-action view"
                                                        onClick={() => toggleSubmissionExpansion(submission)}
                                                        title={expandedSubmissions.has(submission.id) ? t('forms.hideDetails', 'Hide Details') : t('forms.viewDetails', 'View Details')}
                                                    >
                                                        {expandedSubmissions.has(submission.id) ? (
                                                            <ChevronUp size={16} />
                                                        ) : (
                                                            <ChevronDown size={16} />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedSubmissions.has(submission.id) && (
                                                <tr className="expanded-row submission-expanded-row">
                                                    <td colSpan="6">
                                                        {submissionDetails[submission.id] ? (
                                                            <div className="submission-details-expanded">
                                                                {/* Contact Information */}
                                                                <div className="details-section">
                                                                    <h4>{t('forms.contactInformation', 'Contact Information')}</h4>
                                                                    <div className="details-grid">
                                                                        {submissionDetails[submission.id].submitterData && (
                                                                            <>
                                                                                <div className="detail-item" style={{marginBottom: "16px"}}>
                                                                                    <label style={{display: "block", fontWeight: 600, marginBottom: "8px"}}>{t('forms.fullName', 'Full Name')}</label>
                                                                                    <span>{submissionDetails[submission.id].submitterData.name || t('common.unknown', 'Unknown')}</span>
                                                                                </div>
                                                                                <div className="detail-item" style={{marginBottom: "16px"}}>
                                                                                    <label style={{display: "block", fontWeight: 600, marginBottom: "8px"}}><Mail size={14} /> {t('forms.email', 'Email')}</label>
                                                                                    <span>{submissionDetails[submission.id].submitterData.email}</span>
                                                                                </div>
                                                                                <div className="detail-item" style={{marginBottom: "16px"}}>
                                                                                    <label style={{display: "block", fontWeight: 600, marginBottom: "8px"}}><Phone size={14} /> {t('forms.phone', 'Phone')}</label>
                                                                                    <span>{submissionDetails[submission.id].submitterData.phone || t('common.notProvided', 'Not provided')}</span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Attendance Information */}
                                                                <div className="details-section">
                                                                    <h4>{t('forms.attendanceInformation', 'Attendance Information')}</h4>
                                                                    <div className="attendance-details">
                                                                        <div className="detail-item">
                                                                            <label>{t('forms.totalAttendees', 'Total Attendees')}</label>
                                                                            <span className="attendee-count-large">
                                                                                {submission.attendeesCount || 0}
                                                                            </span>
                                                                        </div>

                                                                        {/* Kids Info for Parent Forms */}
                                                                        {submission.formType === 'parent' && submissionDetails[submission.id].kidsData && (
                                                                            <div className="kids-info">
                                                                                <label>{t('forms.selectedKids', 'Selected Kids')}</label>
                                                                                <div className="kids-list">
                                                                                    {submissionDetails[submission.id].kidsData.map(kid => (
                                                                                        <div key={kid.id} className="kid-item">
                                                                                            <span className="kid-name">
                                                                                                {kid.personalInfo?.firstName} {kid.personalInfo?.lastName}
                                                                                            </span>
                                                                                            <span className="kid-number">
                                                                                                #{kid.participantNumber}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Extra Attendees */}
                                                                        {submission.extraAttendees && submission.extraAttendees.length > 0 && (
                                                                            <div className="extra-attendees">
                                                                                <label>{t('forms.extraAttendees', 'Extra Attendees')}</label>
                                                                                <div className="extra-attendees-list">
                                                                                    {submission.extraAttendees.map((attendee, index) => (
                                                                                        <div key={index} className="extra-attendee-item">
                                                                                            {attendee}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Shirts Info */}
                                                                {(submission.shirts?.length > 0 || submission.extraShirts?.length > 0) && (
                                                                    <div className="details-section">
                                                                        <h4>
                                                                            <Shirt size={20} />
                                                                            {t('forms.shirtInformation', 'Shirt Information')}
                                                                        </h4>
                                                                        <div className="shirts-details">
                                                                            {submission.shirts?.length > 0 && (
                                                                                <div className="shirts-group">
                                                                                    <label>{t('forms.requiredShirts', 'Required Shirts')}</label>
                                                                                    <div className="shirts-list">
                                                                                        {submission.shirts.map((shirt, index) => (
                                                                                            <span key={index} className="shirt-size">
                                                                                                {shirt}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {submission.extraShirts?.length > 0 && (
                                                                                <div className="shirts-group">
                                                                                    <label>{t('forms.extraShirts', 'Extra Shirts')}</label>
                                                                                    <div className="shirts-list">
                                                                                        {submission.extraShirts.map((shirt, index) => (
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

                                                                {/* Instructor Specific */}
                                                                {submission.formType === 'instructor' && submission.motoForLife && (
                                                                    <div className="details-section">
                                                                        <h4>{t('forms.motoForLife', 'Motto for Life')}</h4>
                                                                        <div className="motto-text">
                                                                            {submission.motoForLife}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Declaration File */}
                                                                {submission.declarationUploaded && (
                                                                    <div className="details-section">
                                                                        <h4>
                                                                            <FileIcon size={20} />
                                                                            {t('forms.signedDeclaration', 'Signed Declaration')}
                                                                        </h4>
                                                                        <div className="declaration-file">
                                                                            <a
                                                                                href={submission.declarationUploaded}
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
                                                        ) : (
                                                            <div className="loading-details">
                                                                <Clock className="loading-spinner" size={24} />
                                                                <p>{t('forms.loadingDetails', 'Loading details...')}</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <FileText size={80} />
                            </div>
                            <h3>{t('forms.noSubmissions', 'No Submissions Found')}</h3>
                            <p>
                                {searchTerm || statusFilter !== 'all' || formTypeFilter !== 'all'
                                    ? t('forms.noSubmissionsMatchFilter', 'No submissions match your search criteria')
                                    : t('forms.noSubmissionsYet', 'No submissions have been received yet')
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default FormSubmissionsPage;