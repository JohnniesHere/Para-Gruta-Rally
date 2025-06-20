// src/pages/admin/FormsManagementPage.jsx - Full Translation Support
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    IconNotes as FileText,
    IconPlus as Plus,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconDownload as Download,
    IconUpload as Upload,
    IconCheck as Check,
    IconClock as Clock,
    IconAlertTriangle as AlertTriangle,
    IconUsers as Users,
    IconChartBar  as BarChart3,
    IconTarget as Target,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconRefresh as RefreshCw,
    IconSearch as Search,
    IconFilter as Filter,
    IconCopy as Copy,
    IconSettings as Settings
} from '@tabler/icons-react';
import './FormsManagementPage.css';

const FormsManagementPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { permissions, userRole } = usePermissions();

    const [forms, setForms] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [analytics, setAnalytics] = useState({
        totalForms: 0,
        totalSubmissions: 0,
        pendingReviews: 0,
        completionRate: 0
    });

    // Mock data - in a real app, this would come from your API
    useEffect(() => {
        loadFormsData();
    }, []);

    const loadFormsData = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockForms = [
                {
                    id: '1',
                    name: 'Racing Registration Form',
                    description: 'Complete registration form for racing events',
                    status: 'active',
                    submissions: 45,
                    lastModified: '2025-06-10',
                    createdBy: 'Admin'
                },
                {
                    id: '2',
                    name: 'Safety Declaration',
                    description: 'Safety agreement and liability waiver',
                    status: 'active',
                    submissions: 38,
                    lastModified: '2025-06-08',
                    createdBy: 'Admin'
                },
                {
                    id: '3',
                    name: 'Team Formation Request',
                    description: 'Form for requesting new team creation',
                    status: 'draft',
                    submissions: 0,
                    lastModified: '2025-06-12',
                    createdBy: 'Admin'
                }
            ];

            // Mock templates with translated names and descriptions
            const mockTemplates = [
                {
                    id: 't1',
                    name: t('formsManagement.eventRegistration', 'Event Registration'),
                    description: t('formsManagement.eventRegistrationDesc', 'Standard event registration template'),
                    icon: '📋',
                    category: t('formsManagement.registration', 'Registration')
                },
                {
                    id: 't2',
                    name: t('formsManagement.contactInformation', 'Contact Information'),
                    description: t('formsManagement.contactInformationDesc', 'Basic contact details form'),
                    icon: '📞',
                    category: t('formsManagement.contact', 'Contact')
                },
                {
                    id: 't3',
                    name: t('formsManagement.feedbackSurvey', 'Feedback Survey'),
                    description: t('formsManagement.feedbackSurveyDesc', 'Post-event feedback collection'),
                    icon: '⭐',
                    category: t('formsManagement.feedback', 'Feedback')
                },
                {
                    id: 't4',
                    name: t('formsManagement.medicalInformation', 'Medical Information'),
                    description: t('formsManagement.medicalInformationDesc', 'Health and medical details form'),
                    icon: '🏥',
                    category: t('formsManagement.medical', 'Medical')
                }
            ];

            const mockSubmissions = [
                {
                    id: 's1',
                    formName: 'Racing Registration Form',
                    submittedBy: 'John Doe',
                    submittedAt: '2025-06-14 10:30',
                    status: 'pending'
                },
                {
                    id: 's2',
                    formName: 'Safety Declaration',
                    submittedBy: 'Jane Smith',
                    submittedAt: '2025-06-14 09:15',
                    status: 'completed'
                },
                {
                    id: 's3',
                    formName: 'Racing Registration Form',
                    submittedBy: 'Mike Johnson',
                    submittedAt: '2025-06-13 16:45',
                    status: 'review'
                }
            ];

            setForms(mockForms);
            setTemplates(mockTemplates);
            setSubmissions(mockSubmissions);
            setAnalytics({
                totalForms: mockForms.length,
                totalSubmissions: mockSubmissions.length,
                pendingReviews: mockSubmissions.filter(s => s.status === 'pending').length,
                completionRate: 78
            });
        } catch (error) {
            console.error('Error loading forms data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateForm = () => {
        // In a real app, this would navigate to form builder
        console.log('Creating new form...');
    };

    const handleEditForm = (formId) => {
        // In a real app, this would navigate to form editor
        console.log('Editing form:', formId);
    };

    const handleViewSubmissions = (formId) => {
        // In a real app, this would show submissions for the form
        console.log('Viewing submissions for form:', formId);
    };

    const handleDeleteForm = (formId) => {
        if (window.confirm(t('formsManagement.deleteConfirm', 'Are you sure you want to delete this form?'))) {
            setForms(forms.filter(form => form.id !== formId));
        }
    };

    const handleUseTemplate = (templateId) => {
        // In a real app, this would create a new form from template
        console.log('Using template:', templateId);
    };

    const handleViewSubmission = (submissionId) => {
        // In a real app, this would show submission details
        console.log('Viewing submission:', submissionId);
    };

    // Get translated status label
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return t('formsManagement.active', 'Active');
            case 'draft':
                return t('formsManagement.draft', 'Draft');
            case 'archived':
                return t('formsManagement.archived', 'Archived');
            case 'pending':
                return t('formsManagement.pending', 'Pending');
            case 'completed':
                return t('formsManagement.completed', 'Completed');
            case 'review':
                return t('formsManagement.review', 'Review');
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const filteredForms = forms.filter(form => {
        const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!permissions) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`forms-management-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('formsManagement.loadingPermissions', 'Loading permissions...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`forms-management-page ${appliedTheme}-mode`}>
                {/* Page Title - Outside container - TRANSLATED */}
                <h1>
                    <FileText size={32} className="page-title-icon" />
                    {t('formsManagement.title', 'Forms Management')}
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                {/* Main Container */}
                <div className="admin-container forms-management-container">
                    {/* Racing Theme Header - TRANSLATED */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h2>
                                    <Trophy size={28} className="page-title-icon" />
                                    {t('formsManagement.racingFormsControlCenter', 'Racing Forms Control Center')}
                                </h2>
                                <p className="subtitle">{t('formsManagement.subtitle', 'Manage registration forms, collect data, and track submissions! 🏁')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - TRANSLATED */}
                    <div className="quick-actions">
                        <div className="quick-actions-title">
                            <Target className="section-icon" size={20} />
                            {t('formsManagement.quickActions', 'Quick Actions')}
                        </div>
                        <div className="quick-actions-grid">
                            <button className="quick-action-btn" onClick={handleCreateForm}>
                                <Plus size={16} />
                                {t('formsManagement.createNewForm', 'Create New Form')}
                            </button>
                            <button className="quick-action-btn" onClick={loadFormsData}>
                                <RefreshCw size={16} />
                                {t('formsManagement.refreshData', 'Refresh Data')}
                            </button>
                            <button className="quick-action-btn">
                                <Download size={16} />
                                {t('formsManagement.exportSubmissions', 'Export Submissions')}
                            </button>
                            <button className="quick-action-btn">
                                <Settings size={16} />
                                {t('formsManagement.formSettings', 'Form Settings')}
                            </button>
                        </div>
                    </div>

                    {/* Analytics Cards - TRANSLATED */}
                    <div className="analytics-grid">
                        <div className="analytics-card">
                            <FileText className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.totalForms}</div>
                            <div className="analytics-label">{t('formsManagement.totalForms', 'Total Forms')}</div>
                        </div>

                        <div className="analytics-card">
                            <Users className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.totalSubmissions}</div>
                            <div className="analytics-label">{t('formsManagement.submissions', 'Submissions')}</div>
                            <div className="analytics-trend trend-up">
                                <span>↗</span> {t('formsManagement.thisWeek', '+12% this week')}
                            </div>
                        </div>

                        <div className="analytics-card">
                            <Clock className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.pendingReviews}</div>
                            <div className="analytics-label">{t('formsManagement.pendingReviews', 'Pending Reviews')}</div>
                        </div>

                        <div className="analytics-card">
                            <BarChart3 className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.completionRate}%</div>
                            <div className="analytics-label">{t('formsManagement.completionRate', 'Completion Rate')}</div>
                            <div className="analytics-trend trend-up">
                                <span>↗</span> {t('formsManagement.improvement', '+5% improvement')}
                            </div>
                        </div>
                    </div>

                    {/* Forms Overview - TRANSLATED */}
                    <div className="form-section forms-overview-section">
                        <div className="section-header">
                            <FileText className="section-icon form-icon" size={24} />
                            <h3>{t('formsManagement.activeForms', '📋 Active Forms')}</h3>
                        </div>

                        {/* Search and Filters - TRANSLATED */}
                        <div className="search-filter-section">
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <Search className="search-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder={t('formsManagement.searchForms', 'Search forms...')}
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="filter-container">
                                <label className="filter-label">
                                    <Filter className="filter-icon" size={16} />
                                    {t('formsManagement.status', 'Status')}
                                </label>
                                <select
                                    className="filter-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">{t('formsManagement.allForms', 'All Forms')}</option>
                                    <option value="active">{t('formsManagement.active', 'Active')}</option>
                                    <option value="draft">{t('formsManagement.draft', 'Draft')}</option>
                                    <option value="archived">{t('formsManagement.archived', 'Archived')}</option>
                                </select>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">
                                <div className="loading-content">
                                    <Clock className="loading-spinner" size={30} />
                                    <p>{t('formsManagement.loadingForms', 'Loading forms...')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="forms-grid">
                                {filteredForms.map(form => (
                                    <div key={form.id} className="form-card">
                                        <div className="form-card-header">
                                            <FileText className="form-card-icon" size={20} />
                                            <h4 className="form-card-title">{form.name}</h4>
                                        </div>
                                        <div className="form-card-body">
                                            {form.description}
                                        </div>
                                        <div className="form-card-stats">
                                            <div className="form-stat">
                                                <div className="form-stat-number">{form.submissions}</div>
                                                <div className="form-stat-label">{t('formsManagement.submissions', 'Submissions')}</div>
                                            </div>
                                            <div className="form-stat">
                                                <div className="form-stat-number">
                                                    <span className={`status-badge ${form.status}`}>
                                                        {getStatusLabel(form.status)}
                                                    </span>
                                                </div>
                                                <div className="form-stat-label">{t('formsManagement.status', 'Status')}</div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <button
                                                className="btn-action view"
                                                onClick={() => handleViewSubmissions(form.id)}
                                                title={t('formsManagement.viewSubmissions', 'View Submissions')}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="btn-action edit"
                                                onClick={() => handleEditForm(form.id)}
                                                title={t('formsManagement.editForm', 'Edit Form')}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-action delete"
                                                onClick={() => handleDeleteForm(form.id)}
                                                title={t('formsManagement.deleteForm', 'Delete Form')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Templates - TRANSLATED */}
                    <div className="form-section form-templates-section">
                        <div className="section-header">
                            <Copy className="section-icon" size={24} />
                            <h3>{t('formsManagement.formTemplates', '📚 Form Templates')}</h3>
                        </div>
                        <div className="template-gallery">
                            {templates.map(template => (
                                <div key={template.id} className="template-card">
                                    <div className="template-preview">
                                        <span className="template-preview-icon">{template.icon}</span>
                                    </div>
                                    <div className="template-name">{template.name}</div>
                                    <div className="template-description">{template.description}</div>
                                    <button
                                        className="use-template-btn"
                                        onClick={() => handleUseTemplate(template.id)}
                                    >
                                        <Plus size={14} />
                                        {t('formsManagement.useTemplate', 'Use Template')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Submissions - TRANSLATED */}
                    <div className="form-section form-submissions-section">
                        <div className="section-header">
                            <Users className="section-icon" size={24} />
                            <h3>{t('formsManagement.recentSubmissions', '📨 Recent Submissions')}</h3>
                        </div>
                        <div className="submissions-table-container">
                            <table className="submissions-table">
                                <thead>
                                <tr>
                                    <th>{t('formsManagement.formName', 'Form Name')}</th>
                                    <th>{t('formsManagement.submittedBy', 'Submitted By')}</th>
                                    <th>{t('formsManagement.dateTime', 'Date & Time')}</th>
                                    <th>{t('formsManagement.status', 'Status')}</th>
                                    <th>{t('formsManagement.actions', 'Actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {submissions.map(submission => (
                                    <tr key={submission.id}>
                                        <td>{submission.formName}</td>
                                        <td>{submission.submittedBy}</td>
                                        <td>{submission.submittedAt}</td>
                                        <td>
                                                <span className={`submission-status ${submission.status}`}>
                                                    {submission.status === 'pending' && <Clock size={12} />}
                                                    {submission.status === 'completed' && <Check size={12} />}
                                                    {submission.status === 'review' && <AlertTriangle size={12} />}
                                                    {getStatusLabel(submission.status)}
                                                </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewSubmission(submission.id)}
                                                    title={t('formsManagement.viewSubmission', 'View Submission')}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    className="btn-action download"
                                                    title={t('formsManagement.download', 'Download')}
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default FormsManagementPage;