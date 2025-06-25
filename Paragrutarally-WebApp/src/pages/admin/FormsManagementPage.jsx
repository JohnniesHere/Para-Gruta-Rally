// src/pages/admin/FormsManagementPage.jsx - Enhanced with Real Functionality
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/config.js';
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
    IconChartBar as BarChart3,
    IconTarget as Target,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconRefresh as RefreshCw,
    IconSearch as Search,
    IconFilter as Filter,
    IconCopy as Copy,
    IconSettings as Settings,
    IconSend as Send,
    IconX as X,
    IconDeviceFloppy as Save
} from '@tabler/icons-react';
import './FormsManagementPage.css';

const FormsManagementPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { permissions, userRole, userData, user } = usePermissions();

    // State management
    const [forms, setForms] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [editingForm, setEditingForm] = useState(null);
    const [showTargetUsers, setShowTargetUsers] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);

    // Form builder state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'event_registration',
        status: 'draft',
        isPublic: false,
        fields: [],
        targetUsers: []
    });

    // Target users state with "all users" logic
    const [targetUsers, setTargetUsers] = useState({
        parents: false,
        instructors: false,
        hosts: false,
        allUsers: false
    });

    // Analytics state
    const [analytics, setAnalytics] = useState({
        totalForms: 0,
        totalSubmissions: 0,
        pendingReviews: 0,
        completionRate: 0
    });

    // Available field types
    const fieldTypes = [
        { value: 'text', label: t('forms.fieldTypes.text', 'Text'), icon: '📝' },
        { value: 'textarea', label: t('forms.fieldTypes.textarea', 'Textarea'), icon: '📄' },
        { value: 'number', label: t('forms.fieldTypes.number', 'Number'), icon: '🔢' },
        { value: 'date', label: t('forms.fieldTypes.date', 'Date'), icon: '📅' },
        { value: 'select', label: t('forms.fieldTypes.select', 'Dropdown'), icon: '📋' },
        { value: 'checkbox', label: t('forms.fieldTypes.checkbox', 'Checkboxes'), icon: '☑️' },
        { value: 'radio', label: t('forms.fieldTypes.radio', 'Radio Buttons'), icon: '⚪' },
        { value: 'file', label: t('forms.fieldTypes.file', 'File Upload'), icon: '📎' }
    ];

    // Load forms data
    useEffect(() => {
        loadFormsData();
    }, []);

    const loadFormsData = async () => {
        setIsLoading(true);
        try {
            // Load forms
            const formsQuery = query(
                collection(db, 'forms'),
                orderBy('createdAt', 'desc')
            );
            const formsSnapshot = await getDocs(formsQuery);
            const formsData = formsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load submissions
            const submissionsQuery = query(
                collection(db, 'form_submissions'),
                orderBy('submittedAt', 'desc')
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissionsData = submissionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setForms(formsData);
            setSubmissions(submissionsData);

            // Calculate analytics
            const pendingSubmissions = submissionsData.filter(s => s.status === 'pending').length;
            setAnalytics({
                totalForms: formsData.length,
                totalSubmissions: submissionsData.length,
                pendingReviews: pendingSubmissions,
                completionRate: formsData.length > 0 ? Math.round((submissionsData.length / formsData.length) * 100) : 0
            });
        } catch (error) {
            console.error('Error loading forms data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle target users logic
    const handleTargetUserChange = (userType) => {
        if (userType === 'allUsers') {
            if (targetUsers.allUsers) {
                // Uncheck all
                setTargetUsers({
                    parents: false,
                    instructors: false,
                    hosts: false,
                    allUsers: false
                });
            } else {
                // Check all
                setTargetUsers({
                    parents: true,
                    instructors: true,
                    hosts: true,
                    allUsers: true
                });
            }
        } else {
            const newTargetUsers = {
                ...targetUsers,
                [userType]: !targetUsers[userType]
            };

            // Check if all individual boxes are checked
            const allIndividualChecked = newTargetUsers.parents &&
                newTargetUsers.instructors &&
                newTargetUsers.hosts;

            newTargetUsers.allUsers = allIndividualChecked;
            setTargetUsers(newTargetUsers);
        }
    };

    // Create new field
    const addField = (type) => {
        const newField = {
            id: `field_${Date.now()}`,
            type,
            label: '',
            placeholder: '',
            required: false,
            order: formData.fields.length,
            ...(type === 'select' || type === 'checkbox' || type === 'radio' ? { options: ['Option 1'] } : {})
        };

        setFormData(prev => ({
            ...prev,
            fields: [...prev.fields, newField]
        }));
    };

    // Update field
    const updateField = (fieldId, updates) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(field =>
                field.id === fieldId ? { ...field, ...updates } : field
            )
        }));
    };

    // Remove field
    const removeField = (fieldId) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.filter(field => field.id !== fieldId)
        }));
    };

    // Move field up/down
    const moveField = (fieldId, direction) => {
        const fieldIndex = formData.fields.findIndex(field => field.id === fieldId);
        if (fieldIndex === -1) return;

        const newIndex = direction === 'up' ? Math.max(0, fieldIndex - 1) : Math.min(formData.fields.length - 1, fieldIndex + 1);
        if (newIndex === fieldIndex) return;

        const newFields = [...formData.fields];
        const [movedField] = newFields.splice(fieldIndex, 1);
        newFields.splice(newIndex, 0, movedField);

        // Update field orders
        const fieldsWithOrder = newFields.map((field, index) => ({
            ...field,
            order: index
        }));

        setFormData(prev => ({
            ...prev,
            fields: fieldsWithOrder
        }));
    };

    // Add option to select/checkbox/radio field
    const addOption = (fieldId) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(field => {
                if (field.id === fieldId) {
                    return {
                        ...field,
                        options: [...field.options, `Option ${field.options.length + 1}`]
                    };
                }
                return field;
            })
        }));
    };

    // Update option
    const updateOption = (fieldId, optionIndex, newValue) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(field => {
                if (field.id === fieldId) {
                    const updatedOptions = [...field.options];
                    updatedOptions[optionIndex] = newValue;
                    return {
                        ...field,
                        options: updatedOptions
                    };
                }
                return field;
            })
        }));
    };

    // Remove option
    const removeOption = (fieldId, optionIndex) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(field => {
                if (field.id === fieldId && field.options.length > 1) {
                    const updatedOptions = [...field.options];
                    updatedOptions.splice(optionIndex, 1);
                    return {
                        ...field,
                        options: updatedOptions
                    };
                }
                return field;
            })
        }));
    };

    // Save form
    const handleSaveForm = async () => {
        try {
            // Prepare target users array
            const targetUsersArray = [];
            if (targetUsers.parents) targetUsersArray.push('parent');
            if (targetUsers.instructors) targetUsersArray.push('instructor');
            if (targetUsers.hosts) targetUsersArray.push('host');

            const formToSave = {
                ...formData,
                targetUsers: targetUsersArray,
                submissionCount: 0,
                viewCount: 0,
                ...(editingForm ? { updatedAt: serverTimestamp() } : {
                    createdBy: user?.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                })
            };

            if (editingForm) {
                await updateDoc(doc(db, 'forms', editingForm.id), formToSave);
            } else {
                await addDoc(collection(db, 'forms'), formToSave);
            }

            // Reset form
            setFormData({
                title: '',
                description: '',
                type: 'event_registration',
                status: 'draft',
                isPublic: false,
                fields: [],
                targetUsers: []
            });
            setTargetUsers({
                parents: false,
                instructors: false,
                hosts: false,
                allUsers: false
            });
            setShowFormBuilder(false);
            setEditingForm(null);

            // Reload data
            await loadFormsData();
        } catch (error) {
            console.error('Error saving form:', error);
        }
    };

    // Send form to users
    const handleSendForm = async (form) => {
        try {
            setIsLoading(true);

            // Get users based on target roles
            const usersQuery = query(collection(db, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            const allUsers = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter users by target roles
            const targetUsers = allUsers.filter(user =>
                form.targetUsers.includes(user.role)
            );

            // Create form assignments
            const batch = writeBatch(db);
            const assignmentsRef = collection(db, 'form_assignments');

            targetUsers.forEach(user => {
                const assignmentRef = doc(assignmentsRef);
                batch.set(assignmentRef, {
                    formId: form.id,
                    userId: user.id,
                    userRole: user.role,
                    status: 'pending',
                    assignedAt: serverTimestamp(),
                    notificationSent: false,
                    remindersSent: 0
                });
            });

            await batch.commit();

            alert(t('forms.formSentSuccess', 'Form sent to {count} users!', { count: targetUsers.length }));
        } catch (error) {
            console.error('Error sending form:', error);
            alert(t('forms.formSendError', 'Error sending form. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    // Edit form
    const handleEditForm = (form) => {
        setFormData(form);
        setEditingForm(form);

        // Set target users checkboxes
        const targetUsersState = {
            parents: form.targetUsers.includes('parent'),
            instructors: form.targetUsers.includes('instructor'),
            hosts: form.targetUsers.includes('host'),
            allUsers: false
        };
        targetUsersState.allUsers = targetUsersState.parents &&
            targetUsersState.instructors &&
            targetUsersState.hosts;
        setTargetUsers(targetUsersState);

        setShowFormBuilder(true);
    };

    // Delete form
    const handleDeleteForm = async (formId) => {
        if (window.confirm(t('forms.deleteConfirm', 'Are you sure you want to delete this form?'))) {
            try {
                await deleteDoc(doc(db, 'forms', formId));
                await loadFormsData();
            } catch (error) {
                console.error('Error deleting form:', error);
            }
        }
    };

    // Get status label
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return t('forms.status.active', 'Active');
            case 'draft':
                return t('forms.status.draft', 'Draft');
            case 'archived':
                return t('forms.status.archived', 'Archived');
            default:
                return status;
        }
    };

    // Filter forms
    const filteredForms = useMemo(() => {
        return forms.filter(form => {
            const matchesSearch = searchTerm === '' ||
                form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                form.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [forms, searchTerm, statusFilter]);

    if (!permissions) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`forms-management-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading', 'Loading...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`forms-management-page ${appliedTheme}-mode`}>
                {/* Page Title */}
                <h1>
                    <FileText size={32} className="page-title-icon" />
                    {t('forms.title', 'Forms Management')}
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                {/* Main Container */}
                <div className="admin-container forms-management-container">
                    {/* Racing Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h2>
                                    <Trophy size={28} className="page-title-icon" />
                                    {t('forms.racingFormsCenter', 'Racing Forms Control Center')}
                                </h2>
                                <p className="subtitle">
                                    {t('forms.subtitle', 'Create, manage and distribute forms to your racing community! 🏁')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <div className="quick-actions-title">
                            <Target className="section-icon" size={20} />
                            {t('forms.quickActions', 'Quick Actions')}
                        </div>
                        <div className="quick-actions-grid">
                            <button
                                className="quick-action-btn"
                                onClick={() => setShowFormBuilder(true)}
                            >
                                <Plus size={16} />
                                {t('forms.createNewForm', 'Create New Form')}
                            </button>
                            <button
                                className="quick-action-btn"
                                onClick={loadFormsData}
                                disabled={isLoading}
                            >
                                <RefreshCw size={16} />
                                {t('forms.refreshData', 'Refresh Data')}
                            </button>
                            <button className="quick-action-btn">
                                <Download size={16} />
                                {t('forms.exportSubmissions', 'Export Submissions')}
                            </button>
                            <button className="quick-action-btn">
                                <Settings size={16} />
                                {t('forms.formSettings', 'Form Settings')}
                            </button>
                        </div>
                    </div>

                    {/* Analytics Cards */}
                    <div className="analytics-grid">
                        <div className="analytics-card">
                            <FileText className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.totalForms}</div>
                            <div className="analytics-label">{t('forms.totalForms', 'Total Forms')}</div>
                        </div>

                        <div className="analytics-card">
                            <Users className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.totalSubmissions}</div>
                            <div className="analytics-label">{t('forms.submissions', 'Submissions')}</div>
                        </div>

                        <div className="analytics-card">
                            <Clock className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.pendingReviews}</div>
                            <div className="analytics-label">{t('forms.pendingReviews', 'Pending Reviews')}</div>
                        </div>

                        <div className="analytics-card">
                            <BarChart3 className="analytics-icon" size={30} />
                            <div className="analytics-number">{analytics.completionRate}%</div>
                            <div className="analytics-label">{t('forms.completionRate', 'Completion Rate')}</div>
                        </div>
                    </div>

                    {/* Form Builder Modal */}
                    {showFormBuilder && (
                        <div className="modal-overlay">
                            <div className="modal-content form-builder-modal">
                                <div className="modal-header">
                                    <h3>
                                        {editingForm ?
                                            t('forms.editForm', 'Edit Form') :
                                            t('forms.createNewForm', 'Create New Form')
                                        }
                                    </h3>
                                    <button
                                        className="modal-close"
                                        onClick={() => {
                                            setShowFormBuilder(false);
                                            setEditingForm(null);
                                            setFormData({
                                                title: '',
                                                description: '',
                                                type: 'event_registration',
                                                status: 'draft',
                                                isPublic: false,
                                                fields: [],
                                                targetUsers: []
                                            });
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="modal-body">
                                    {/* Basic Form Info */}
                                    <div className="form-section">
                                        <h4>{t('forms.basicInfo', 'Basic Information')}</h4>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>{t('forms.formTitle', 'Form Title')} *</label>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        title: e.target.value
                                                    }))}
                                                    placeholder={t('forms.titlePlaceholder', 'Enter form title...')}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('forms.formType', 'Form Type')}</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        type: e.target.value
                                                    }))}
                                                    className="form-select"
                                                >
                                                    <option value="event_registration">
                                                        {t('forms.types.eventRegistration', 'Event Registration')}
                                                    </option>
                                                    <option value="contact_info">
                                                        {t('forms.types.contactInfo', 'Contact Information')}
                                                    </option>
                                                    <option value="feedback">
                                                        {t('forms.types.feedback', 'Feedback')}
                                                    </option>
                                                    <option value="custom">
                                                        {t('forms.types.custom', 'Custom')}
                                                    </option>
                                                </select>
                                            </div>
                                            <div className="form-group full-width">
                                                <label>{t('forms.description', 'Description')}</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        description: e.target.value
                                                    }))}
                                                    placeholder={t('forms.descriptionPlaceholder', 'Describe what this form is for...')}
                                                    className="form-textarea"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('forms.status', 'Status')}</label>
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        status: e.target.value
                                                    }))}
                                                    className="form-select"
                                                >
                                                    <option value="draft">{t('forms.status.draft', 'Draft')}</option>
                                                    <option value="active">{t('forms.status.active', 'Active')}</option>
                                                    <option value="archived">{t('forms.status.archived', 'Archived')}</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isPublic}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            isPublic: e.target.checked
                                                        }))}
                                                    />
                                                    {t('forms.isPublic', 'Public Form')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Target Users Section */}
                                    <div className="form-section">
                                        <h4>{t('forms.targetUsers', 'Target Users')}</h4>
                                        <div className="target-users-grid">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={targetUsers.hosts}
                                                    onChange={() => handleTargetUserChange('hosts')}
                                                />
                                                {t('forms.hosts', 'Hosts')}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Form Fields Section */}
                                    <div className="form-section">
                                        <div className="section-header">
                                            <h4>{t('forms.formFields', 'Form Fields')}</h4>
                                            <div className="field-type-buttons">
                                                {fieldTypes.map(fieldType => (
                                                    <button
                                                        key={fieldType.value}
                                                        type="button"
                                                        className="field-type-btn"
                                                        onClick={() => addField(fieldType.value)}
                                                        title={fieldType.label}
                                                    >
                                                        <span className="field-icon">{fieldType.icon}</span>
                                                        {fieldType.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fields List */}
                                        <div className="fields-list">
                                            {formData.fields.length === 0 ? (
                                                <div className="empty-fields">
                                                    <p>{t('forms.noFields', 'No fields added yet. Click buttons above to add fields.')}</p>
                                                </div>
                                            ) : (
                                                formData.fields
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((field, index) => (
                                                        <div key={field.id} className="field-editor">
                                                            <div className="field-header">
                                                                <span className="field-type-label">
                                                                    {fieldTypes.find(ft => ft.value === field.type)?.icon}
                                                                    {fieldTypes.find(ft => ft.value === field.type)?.label}
                                                                </span>
                                                                <div className="field-actions">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveField(field.id, 'up')}
                                                                        disabled={index === 0}
                                                                        className="field-action-btn"
                                                                        title={t('forms.moveUp', 'Move Up')}
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveField(field.id, 'down')}
                                                                        disabled={index === formData.fields.length - 1}
                                                                        className="field-action-btn"
                                                                        title={t('forms.moveDown', 'Move Down')}
                                                                    >
                                                                        ↓
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeField(field.id)}
                                                                        className="field-action-btn delete"
                                                                        title={t('forms.deleteField', 'Delete Field')}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="field-config">
                                                                <div className="field-config-grid">
                                                                    <div className="config-group">
                                                                        <label>{t('forms.fieldLabel', 'Label')} *</label>
                                                                        <input
                                                                            type="text"
                                                                            value={field.label}
                                                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                                            placeholder={t('forms.fieldLabelPlaceholder', 'Enter field label...')}
                                                                            className="config-input"
                                                                        />
                                                                    </div>

                                                                    {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
                                                                        <div className="config-group">
                                                                            <label>{t('forms.placeholder', 'Placeholder')}</label>
                                                                            <input
                                                                                type="text"
                                                                                value={field.placeholder || ''}
                                                                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                                                placeholder={t('forms.placeholderPlaceholder', 'Enter placeholder text...')}
                                                                                className="config-input"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="config-group">
                                                                        <label className="checkbox-label">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={field.required}
                                                                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                                            />
                                                                            {t('forms.required', 'Required Field')}
                                                                        </label>
                                                                    </div>
                                                                </div>

                                                                {/* Options for select/checkbox/radio fields */}
                                                                {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                                                                    <div className="field-options">
                                                                        <div className="options-header">
                                                                            <label>{t('forms.options', 'Options')}</label>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addOption(field.id)}
                                                                                className="add-option-btn"
                                                                            >
                                                                                <Plus size={14} />
                                                                                {t('forms.addOption', 'Add Option')}
                                                                            </button>
                                                                        </div>
                                                                        <div className="options-list">
                                                                            {field.options?.map((option, optionIndex) => (
                                                                                <div key={optionIndex} className="option-item">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={option}
                                                                                        onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                                                                        placeholder={t('forms.optionPlaceholder', 'Option text...')}
                                                                                        className="option-input"
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeOption(field.id, optionIndex)}
                                                                                        disabled={field.options.length <= 1}
                                                                                        className="remove-option-btn"
                                                                                    >
                                                                                        <X size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Field Preview */}
                                                                <div className="field-preview">
                                                                    <label className="preview-label">
                                                                        {field.label || t('forms.untitled', 'Untitled Field')}
                                                                        {field.required && <span className="required-star">*</span>}
                                                                    </label>

                                                                    {field.type === 'text' && (
                                                                        <input
                                                                            type="text"
                                                                            placeholder={field.placeholder}
                                                                            className="preview-input"
                                                                            disabled
                                                                        />
                                                                    )}

                                                                    {field.type === 'textarea' && (
                                                                        <textarea
                                                                            placeholder={field.placeholder}
                                                                            className="preview-textarea"
                                                                            rows={3}
                                                                            disabled
                                                                        />
                                                                    )}

                                                                    {field.type === 'number' && (
                                                                        <input
                                                                            type="number"
                                                                            placeholder={field.placeholder}
                                                                            className="preview-input"
                                                                            disabled
                                                                        />
                                                                    )}

                                                                    {field.type === 'date' && (
                                                                        <input
                                                                            type="date"
                                                                            className="preview-input"
                                                                            disabled
                                                                        />
                                                                    )}

                                                                    {field.type === 'select' && (
                                                                        <select className="preview-select" disabled>
                                                                            <option>{t('forms.selectOption', 'Select an option...')}</option>
                                                                            {field.options?.map((option, idx) => (
                                                                                <option key={idx} value={option}>
                                                                                    {option}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    )}

                                                                    {field.type === 'checkbox' && (
                                                                        <div className="preview-checkboxes">
                                                                            {field.options?.map((option, idx) => (
                                                                                <label key={idx} className="preview-checkbox-label">
                                                                                    <input type="checkbox" disabled />
                                                                                    {option}
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {field.type === 'radio' && (
                                                                        <div className="preview-radios">
                                                                            {field.options?.map((option, idx) => (
                                                                                <label key={idx} className="preview-radio-label">
                                                                                    <input type="radio" name={field.id} disabled />
                                                                                    {option}
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {field.type === 'file' && (
                                                                        <input
                                                                            type="file"
                                                                            className="preview-file"
                                                                            disabled
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowFormBuilder(false);
                                            setEditingForm(null);
                                        }}
                                        className="btn btn-cancel"
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveForm}
                                        disabled={!formData.title || formData.fields.length === 0}
                                        className="btn btn-success"
                                    >
                                        <Save size={16} />
                                        {editingForm ?
                                            t('forms.updateForm', 'Update Form') :
                                            t('forms.createForm', 'Create Form')
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Forms Overview Section */}
                    <div className="form-section forms-overview-section">
                        <div className="section-header">
                            <FileText className="section-icon form-icon" size={24} />
                            <h3>{t('forms.activeForms', '📋 Active Forms')}</h3>
                        </div>

                        {/* Search and Filters */}
                        <div className="search-filter-section">
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <Search className="search-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder={t('forms.searchForms', 'Search forms...')}
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

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
                                    <option value="all">{t('forms.allForms', 'All Forms')}</option>
                                    <option value="active">{t('forms.status.active', 'Active')}</option>
                                    <option value="draft">{t('forms.status.draft', 'Draft')}</option>
                                    <option value="archived">{t('forms.status.archived', 'Archived')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Forms Grid */}
                        {isLoading ? (
                            <div className="loading-state">
                                <div className="loading-content">
                                    <Clock className="loading-spinner" size={30} />
                                    <p>{t('forms.loadingForms', 'Loading forms...')}</p>
                                </div>
                            </div>
                        ) : filteredForms.length > 0 ? (
                            <div className="forms-grid">
                                {filteredForms.map(form => (
                                    <div key={form.id} className="form-card">
                                        <div className="form-card-header">
                                            <FileText className="form-card-icon" size={20} />
                                            <h4 className="form-card-title">{form.title}</h4>
                                            <span className={`status-badge ${form.status}`}>
                                                {getStatusLabel(form.status)}
                                            </span>
                                        </div>

                                        <div className="form-card-body">
                                            <p>{form.description || t('forms.noDescription', 'No description available')}</p>

                                            <div className="form-meta">
                                                <div className="meta-item">
                                                    <span className="meta-label">{t('forms.fields', 'Fields')}:</span>
                                                    <span className="meta-value">{form.fields?.length || 0}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="meta-label">{t('forms.targetUsers', 'Target Users')}:</span>
                                                    <span className="meta-value">
                                                        {form.targetUsers?.join(', ') || t('forms.none', 'None')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-card-stats">
                                            <div className="form-stat">
                                                <div className="form-stat-number">
                                                    {submissions.filter(s => s.formId === form.id).length}
                                                </div>
                                                <div className="form-stat-label">{t('forms.submissions', 'Submissions')}</div>
                                            </div>
                                            <div className="form-stat">
                                                <div className="form-stat-number">{form.viewCount || 0}</div>
                                                <div className="form-stat-label">{t('forms.views', 'Views')}</div>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <button
                                                className="btn-action view"
                                                onClick={() => navigate(`/admin/forms/${form.id}/submissions`)}
                                                title={t('forms.viewSubmissions', 'View Submissions')}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="btn-action edit"
                                                onClick={() => handleEditForm(form)}
                                                title={t('forms.editForm', 'Edit Form')}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {form.status === 'active' && (
                                                <button
                                                    className="btn-action send"
                                                    onClick={() => handleSendForm(form)}
                                                    title={t('forms.sendForm', 'Send Form')}
                                                    disabled={isLoading}
                                                >
                                                    <Send size={16} />
                                                </button>
                                            )}
                                            <button
                                                className="btn-action delete"
                                                onClick={() => handleDeleteForm(form.id)}
                                                title={t('forms.deleteForm', 'Delete Form')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FileText size={80} />
                                </div>
                                <h3>{t('forms.noFormsFound', 'No Forms Found')}</h3>
                                <p>
                                    {searchTerm || statusFilter !== 'all'
                                        ? t('forms.noFormsMatchFilter', 'No forms match your search criteria')
                                        : t('forms.noFormsYet', 'You haven\'t created any forms yet')
                                    }
                                </p>
                                {!searchTerm && statusFilter === 'all' && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowFormBuilder(true)}
                                    >
                                        <Plus size={16} />
                                        {t('forms.createFirstForm', 'Create Your First Form')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default FormsManagementPage;