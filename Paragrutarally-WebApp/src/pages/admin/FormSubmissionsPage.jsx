// src/pages/admin/FormSubmissionsPage.jsx - Form Submissions Management
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    getFormById,
    getFormSubmissions,
    getFormsAnalytics
} from '../../services/formService';
import { getUserData } from '../../services/userService';
import { getKidsByParent } from '../../services/kidService';
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
    IconExternalLink as ExternalLink
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
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [submissionDetails, setSubmissionDetails] = useState({});

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
                    getFormSubmissions(formId)
                ]);
                setForm(formData);
                setSubmissions(submissionsData);
            } else {
                // Load all submissions
                const submissionsData = await getFormSubmissions();
                setSubmissions(submissionsData);
            }

            console.log('✅ Data loaded successfully');
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

            // Load submitter user data
            if (submission.submitterId) {
                details.submitterData = await getUserData(submission.submitterId);
            }

            // Load kids data if available
            if (submission.kidIds && submission.kidIds.length > 0) {
                details.kidsData = await Promise.all(
                    submission.kidIds.map(async (kidId) => {
                        try {
                            const { getKidById } = await import('../../services/kidService');
                            return await getKidById(kidId);
                        } catch (error) {
                            console.warn(`Failed to load kid ${kidId}:`, error);
                            return null;
                        }
                    })
                );
                details.kidsData = details.kidsData.filter(kid => kid !== null);
            }

            setSubmissionDetails(prev => ({
                ...prev,
                [submission.id]: details
            }));

            return details;
        } catch (error) {
            console.error('Error loading submission details:', error);
            return submission;
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

    // Handle view submission details
    const handleViewSubmission = async (submission) => {
        setSelectedSubmission(submission);
        await loadSubmissionDetails(submission);
    };

    // Export submissions to CSV
    const handleExportSubmissions = () => {
        const csvData = filteredSubmissions.map(submission => ({
            'Submission Date': submission.submittedAt?.toLocaleDateString(),
            'Status': submission.confirmationStatus,
            'Type': submission.formType,
            'Submitter': submission.submitterData?.name || 'Unknown',
            'Email': submission.submitterData?.email || '',
            'Phone': submission.submitterData?.phone || '',
            'Attendees Count': submission.attendeesCount || 0,
            'Kids Count': submission.kidIds?.length || 0,
            'Shirts Count': submission.shirts?.length || 0,
            'Extra Shirts Count': submission.extraShirts?.length || 0,
            'Declaration Uploaded': submission.declarationUploaded ? 'Yes' : 'No'
        }));

        // Convert to CSV and download
        const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `form_submissions_${formId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
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
                                disabled={filteredSubmissions.length === 0}
                            >
                                <Download size={16} />
                                {t('forms.exportSubmissions', 'Export CSV')}
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
                                        <tr key={submission.id}>
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
                                                    onClick={() => handleViewSubmission(submission)}
                                                    title={t('forms.viewDetails', 'View Details')}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
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

                    {/* Submission Details Modal */}
                    {selectedSubmission && (
                        <div className="modal-overlay">
                            <div className="modal-content submission-details-modal">
                                <div className="modal-header">
                                    <h3>{t('forms.submissionDetails', 'Submission Details')}</h3>
                                    <button
                                        className="modal-close"
                                        onClick={() => setSelectedSubmission(null)}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="modal-body">
                                    {submissionDetails[selectedSubmission.id] ? (
                                        <div className="submission-details">
                                            {/* Basic Info */}
                                            <div className="details-section">
                                                <h4>{t('forms.basicInformation', 'Basic Information')}</h4>
                                                <div className="details-grid">
                                                    <div className="detail-item">
                                                        <label>{t('forms.submittedAt', 'Submitted At')}</label>
                                                        <span>
                                                            {selectedSubmission.submittedAt?.toLocaleDateString()} {selectedSubmission.submittedAt?.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <label>{t('forms.confirmationStatus', 'Status')}</label>
                                                        <span className="status-value">
                                                            {getStatusInfo(selectedSubmission.confirmationStatus).label}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <label>{t('forms.formType', 'Form Type')}</label>
                                                        <span>
                                                            {selectedSubmission.formType === 'parent'
                                                                ? t('forms.parentForm', 'Parent Form')
                                                                : t('forms.instructorForm', 'Instructor Form')
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Submitter Info */}
                                            <div className="details-section">
                                                <h4>{t('forms.submitterInformation', 'Submitter Information')}</h4>
                                                <div className="submitter-details">
                                                    <div className="detail-item">
                                                        <label>{t('forms.name', 'Name')}</label>
                                                        <span>{submissionDetails[selectedSubmission.id].submitterData?.name}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <label>{t('forms.email', 'Email')}</label>
                                                        <span className="contact-info">
                                                            <Mail size={16} />
                                                            {submissionDetails[selectedSubmission.id].submitterData?.email}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <label>{t('forms.phone', 'Phone')}</label>
                                                        <span className="contact-info">
                                                            <Phone size={16} />
                                                            {submissionDetails[selectedSubmission.id].submitterData?.phone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Attendance Info */}
                                            <div className="details-section">
                                                <h4>{t('forms.attendanceInformation', 'Attendance Information')}</h4>
                                                <div className="attendance-details">
                                                    <div className="detail-item">
                                                        <label>{t('forms.totalAttendees', 'Total Attendees')}</label>
                                                        <span className="attendee-count-large">
                                                            {selectedSubmission.attendeesCount || 0}
                                                        </span>
                                                    </div>

                                                    {/* Kids Info for Parent Forms */}
                                                    {selectedSubmission.formType === 'parent' && submissionDetails[selectedSubmission.id].kidsData && (
                                                        <div className="kids-info">
                                                            <label>{t('forms.selectedKids', 'Selected Kids')}</label>
                                                            <div className="kids-list">
                                                                {submissionDetails[selectedSubmission.id].kidsData.map(kid => (
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
                                                    {selectedSubmission.extraAttendees && selectedSubmission.extraAttendees.length > 0 && (
                                                        <div className="extra-attendees">
                                                            <label>{t('forms.extraAttendees', 'Extra Attendees')}</label>
                                                            <div className="extra-attendees-list">
                                                                {selectedSubmission.extraAttendees.map((attendee, index) => (
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
                                            {(selectedSubmission.shirts?.length > 0 || selectedSubmission.extraShirts?.length > 0) && (
                                                <div className="details-section">
                                                    <h4>
                                                        <Shirt size={20} />
                                                        {t('forms.shirtInformation', 'Shirt Information')}
                                                    </h4>
                                                    <div className="shirts-details">
                                                        {selectedSubmission.shirts?.length > 0 && (
                                                            <div className="shirts-group">
                                                                <label>{t('forms.requiredShirts', 'Required Shirts')}</label>
                                                                <div className="shirts-list">
                                                                    {selectedSubmission.shirts.map((shirt, index) => (
                                                                        <span key={index} className="shirt-size">
                                                                            {shirt}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedSubmission.extraShirts?.length > 0 && (
                                                            <div className="shirts-group">
                                                                <label>{t('forms.extraShirts', 'Extra Shirts')}</label>
                                                                <div className="shirts-list">
                                                                    {selectedSubmission.extraShirts.map((shirt, index) => (
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
                                            {selectedSubmission.formType === 'instructor' && selectedSubmission.motoForLife && (
                                                <div className="details-section">
                                                    <h4>{t('forms.motoForLife', 'Motto for Life')}</h4>
                                                    <div className="motto-text">
                                                        {selectedSubmission.motoForLife}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Declaration File */}
                                            {selectedSubmission.declarationUploaded && (
                                                <div className="details-section">
                                                    <h4>
                                                        <FileIcon size={20} />
                                                        {t('forms.signedDeclaration', 'Signed Declaration')}
                                                    </h4>
                                                    <div className="declaration-file">
                                                        <a
                                                            href={selectedSubmission.declarationUploaded}
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
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setSelectedSubmission(null)}
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

export default FormSubmissionsPage;