// src/pages/parent/ParentKidDetailPage.jsx - Updated with validation and error fixes
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import { updateKid } from '../../services/kidService';
import { validateKid, getKidFullName, getKidAge } from '../../schemas/kidSchema';
import {
    IconUser as User,
    IconArrowLeft as ArrowLeft,
    IconEdit as Edit,
    IconDeviceFloppy as Save,
    IconX as X,
    IconCalendar as Calendar,
    IconMapPin as MapPin,
    IconPhone as Phone,
    IconMail as Mail,
    IconFileText as FileText,
    IconAlertTriangle as Alert,
    IconCheck as Check,
    IconCamera as Camera,
    IconExclamationCircle as Warning
} from '@tabler/icons-react';

const ParentKidDetailPage = () => {
    const { id: kidId } = useParams();
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();

    const [kid, setKid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [validationWarnings, setValidationWarnings] = useState({});

    // Validation function
    const performValidation = (kidData) => {
        console.log('🔍 Performing validation on kid data:', kidData);

        const validation = validateKid(kidData, t);
        console.log('📋 Validation result:', validation);

        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            console.log('❌ Validation errors found:', validation.errors);
        } else {
            setValidationErrors({});
            console.log('✅ Validation passed');
        }

        // Check for warnings (non-critical issues)
        const warnings = {};

        // Check if form is incomplete
        if (kidData.signedFormStatus !== 'completed') {
            warnings.formStatus = t('parent.warning.formIncomplete', 'Registration form is not yet complete');
        }

        // Check if declaration is not signed
        if (!kidData.signedDeclaration) {
            warnings.declaration = t('parent.warning.declarationNotSigned', 'Health declaration is not yet signed');
        }

        // Check if required parent info is missing
        if (!kidData.parentInfo?.email || !kidData.parentInfo?.phone) {
            warnings.parentContact = t('parent.warning.contactInfoMissing', 'Parent contact information is incomplete');
        }

        // Check if kid is not assigned to a team
        if (!kidData.teamId) {
            warnings.team = t('parent.warning.noTeamAssigned', 'Child is not yet assigned to a team');
        }

        // Check age-related warnings
        const age = getKidAge(kidData);
        if (age !== null) {
            if (age < 6) {
                warnings.age = t('parent.warning.tooYoung', 'Child may be too young for this program');
            } else if (age > 16) {
                warnings.age = t('parent.warning.tooOld', 'Child may be too old for this program');
            }
        }

        setValidationWarnings(warnings);
        console.log('⚠️ Validation warnings:', warnings);
    };

    // Helper functions
    const hasValidationIssues = () => {
        return Object.keys(validationErrors).length > 0 || Object.keys(validationWarnings).length > 0;
    };

    const getFieldError = (fieldPath) => {
        return validationErrors[fieldPath];
    };

    const renderFieldWithValidation = (fieldPath, value, label, icon) => {
        const error = getFieldError(fieldPath);

        return (
            <div className="form-group">
                <label className="form-label">
                    {icon}
                    {label}
                    {error && <Warning size={16} style={{ color: '#EF4444', marginLeft: '5px' }} />}
                </label>
                <div className={`form-display-value ${error ? 'validation-error' : ''}`}>
                    {value}
                </div>
                {error && (
                    <div className="field-error" style={{
                        color: '#EF4444',
                        fontSize: '12px',
                        marginTop: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}>
                        <Warning size={14} />
                        {error}
                    </div>
                )}
            </div>
        );
    };

    useEffect(() => {
        const loadKidDetails = async () => {
            if (!user?.uid || userRole !== 'parent') {
                setError(t('instructor.accessDenied', 'Access denied: Parent credentials required'));
                setLoading(false);
                return;
            }

            try {
                setError('');

                const kidDoc = await getDoc(doc(db, 'kids', kidId));

                if (!kidDoc.exists()) {
                    setError(t('viewKid.kidNotFound', 'Kid not found'));
                    setLoading(false);
                    return;
                }

                const kidData = { id: kidDoc.id, ...kidDoc.data() };

                // Check if this kid belongs to the current parent
                if (kidData.parentInfo?.parentId !== user.uid) {
                    setError(t('parent.kidNotFound', 'Access denied: You can only view your own kids'));
                    setLoading(false);
                    return;
                }

                setKid(kidData);
                setCommentText(kidData.comments?.parent || '');

            } catch (err) {
                console.error('Error loading kid details:', err);
                setError(t('viewKid.loadDataError', 'Failed to load kid details. Please try again.'));
            } finally {
                setLoading(false);
            }
        };

        if (kidId) {
            loadKidDetails();
        }
    }, [kidId, user, userRole, t]);

    // Validation effect
    useEffect(() => {
        if (kid) {
            performValidation(kid);
        }
    }, [kid, t]);

    // Helper function to safely display field data based on permissions
    const getFieldValue = (fieldPath, defaultValue = '-') => {
        if (!kid) return defaultValue;

        const context = { kidData: kid, userData, user };

        if (!permissions.canViewField(fieldPath, context)) {
            return null; // Don't show restricted fields
        }

        const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], kid);
        return value || defaultValue;
    };

    const canEditField = (fieldPath) => {
        if (!kid) return false;
        const context = { kidData: kid, userData, user };
        return permissions.canEditField(fieldPath, context);
    };

    const saveComments = async () => {
        setSaving(true);

        try {
            // Update through service for proper validation
            const updatedKidData = {
                ...kid,
                comments: {
                    ...kid.comments,
                    parent: commentText || ''
                }
            };

            console.log('💾 Saving comments through kidService...');
            const updatedKid = await updateKid(kidId, updatedKidData);

            // Update local state with validated data
            setKid(updatedKid);
            setIsEditingComment(false);

            console.log('✅ Comments saved successfully');

        } catch (err) {
            console.error('Error saving comments:', err);
            setError(t('editKid.commentError', 'Failed to save comments. Please try again.'));
        } finally {
            setSaving(false);
        }
    };

    const cancelEditing = () => {
        setIsEditingComment(false);
        setCommentText(kid.comments?.parent || '');
    };

    const getFormStatus = () => {
        if (!kid) return { status: 'unknown', label: t('common.unknown', 'Unknown'), color: 'secondary' };

        if (kid.signedFormStatus === 'completed' && kid.signedDeclaration) {
            return { status: 'complete', label: t('status.completed', 'Complete'), color: 'success' };
        } else if (kid.signedFormStatus === 'pending' || !kid.signedDeclaration) {
            return { status: 'pending', label: t('status.pending', 'Pending'), color: 'warning' };
        }
        return { status: 'incomplete', label: t('common.incomplete', 'Incomplete'), color: 'danger' };
    };

    if (loading) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading', 'Loading...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <Link to="/parent/dashboard" className="btn btn-primary">
                            {t('parent.backToMyKids', 'Back to My Kids')}
                        </Link>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (!kid) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="error-container">
                        <h3>{t('common.notFound', 'Not Found')}</h3>
                        <p>{t('parent.kidNotFound', 'Kid not found or access denied')}</p>
                        <Link to="/parent/dashboard" className="btn btn-primary">
                            {t('parent.backToMyKids', 'Back to My Kids')}
                        </Link>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const formStatus = getFormStatus();
    const kidAge = getKidAge(kid);

    return (
        <Dashboard userRole={userRole}>
            <div className="admin-page">
                <div className="page-header">
                    <h1>
                        <User className="page-title-icon" size={48} />
                        {getKidFullName(kid)}
                    </h1>
                    <Link to="/parent/dashboard" className="back-button">
                        <ArrowLeft size={18} />
                        {t('parent.backToMyKids', 'Back to My Kids')}
                    </Link>
                </div>

                <div className="admin-container">
                    {/* Validation Status Alert */}
                    {hasValidationIssues() && (
                        <div className="alert warning-alert" style={{ marginBottom: '20px' }}>
                            <Alert size={20} />
                            <div>
                                <strong>{t('parent.validationIssues', 'Data Validation Issues Found')}</strong>
                                <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
                                    {Object.values(validationErrors).map((error, index) => (
                                        <li key={`error-${index}`} style={{ color: '#EF4444', marginBottom: '5px' }}>
                                            <strong>{t('common.error', 'Error')}:</strong> {error}
                                        </li>
                                    ))}
                                    {Object.values(validationWarnings).map((warning, index) => (
                                        <li key={`warning-${index}`} style={{ color: '#F59E0B', marginBottom: '5px' }}>
                                            <strong>{t('common.warning', 'Warning')}:</strong> {warning}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Kid Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <User size={40} />
                                    {getKidFullName(kid)}
                                    {kidAge && <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                                        ({kidAge} {t('common.yearsOld', 'years old')})
                                    </span>}
                                </h1>
                                <p className="subtitle">
                                    {t('kids.participantNumber', 'Participant #')}: {getFieldValue('participantNumber')} •
                                    <span className={`status-badge ${formStatus.color === 'success' ? 'ready' : formStatus.color === 'warning' ? 'pending' : 'inactive'}`} style={{ marginLeft: '10px' }}>
                                        {formStatus.label}
                                    </span>
                                    {Object.keys(validationErrors).length > 0 && (
                                        <span className="status-badge inactive" style={{ marginLeft: '10px' }}>
                                            <Warning size={14} style={{ marginRight: '5px' }} />
                                            {t('common.validationErrors', 'Data Issues')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Alert */}
                    {formStatus.status !== 'complete' && (
                        <div className="alert warning-alert">
                            <Alert size={20} />
                            <span>
                                {t('parent.incompleteFormsWarning', 'Some forms or declarations are still pending completion')}
                            </span>
                        </div>
                    )}

                    {/* Personal Information Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <User className="section-icon" size={24} />
                            <h3>{t('parent.personalInformation', 'Personal Information')}</h3>
                        </div>

                        <div className="form-grid">
                            {renderFieldWithValidation(
                                'personalInfo.firstName',
                                `${getFieldValue('personalInfo.firstName')} ${getFieldValue('personalInfo.lastName')}`,
                                t('common.fullName', 'Full Name'),
                                <User size={16} />
                            )}

                            {renderFieldWithValidation(
                                'personalInfo.dateOfBirth',
                                getFieldValue('personalInfo.dateOfBirth')
                                    ? `${new Date(getFieldValue('personalInfo.dateOfBirth')).toLocaleDateString()}${kidAge ? ` (${kidAge} years old)` : ''}`
                                    : '-',
                                t('editKid.birthday', 'Date of Birth'),
                                <Calendar size={16} />
                            )}

                            <div className="form-group full-width">
                                {renderFieldWithValidation(
                                    'personalInfo.address',
                                    getFieldValue('personalInfo.address'),
                                    t('editKid.homeBaseLocation', 'Address'),
                                    <MapPin size={16} />
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">
                                    <FileText size={16} />
                                    {t('editKid.amazingAbilities', 'Capabilities & Special Needs')}
                                </label>
                                <div className="form-display-value">
                                    {getFieldValue('personalInfo.capabilities') || t('common.none', 'None specified')}
                                </div>
                            </div>

                            {getFieldValue('personalInfo.announcersNotes') && (
                                <div className="form-group full-width">
                                    <label className="form-label">
                                        <FileText size={16} />
                                        {t('parent.announcersNotes', 'Announcer\'s Notes')}
                                    </label>
                                    <div className="form-display-value">
                                        {getFieldValue('personalInfo.announcersNotes')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <Phone className="section-icon" size={24} />
                            <h3>{t('parent.contactInformation', 'Contact Information')}</h3>
                        </div>

                        <div className="form-grid">
                            {renderFieldWithValidation(
                                'parentInfo.name',
                                getFieldValue('parentInfo.name'),
                                t('editKid.parentGuardianName', 'Parent Name'),
                                <User size={16} />
                            )}

                            {renderFieldWithValidation(
                                'parentInfo.email',
                                getFieldValue('parentInfo.email'),
                                t('editKid.emailAddress', 'Email'),
                                <Mail size={16} />
                            )}

                            {renderFieldWithValidation(
                                'parentInfo.phone',
                                getFieldValue('parentInfo.phone'),
                                t('editKid.phoneNumber', 'Phone'),
                                <Phone size={16} />
                            )}

                            {/* Grandparents Information */}
                            {getFieldValue('parentInfo.grandparentsInfo.names') && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <User size={16} />
                                            {t('parent.grandparentsNames', 'Grandparents Names')}
                                        </label>
                                        <div className="form-display-value">
                                            {getFieldValue('parentInfo.grandparentsInfo.names')}
                                        </div>
                                    </div>

                                    {getFieldValue('parentInfo.grandparentsInfo.phone') && (
                                        <div className="form-group">
                                            <label className="form-label">
                                                <Phone size={16} />
                                                {t('parent.grandparentsPhone', 'Grandparents Phone')}
                                            </label>
                                            <div className="form-display-value" style={{ fontFamily: 'monospace', direction: 'ltr' }}>
                                                {getFieldValue('parentInfo.grandparentsInfo.phone')}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Forms & Status Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <FileText className="section-icon" size={24} />
                            <h3>{t('parent.formsAndStatus', 'Forms & Status')}</h3>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={16} />
                                    {t('editKid.formStatus', 'Form Status')}
                                </label>
                                <div>
                                    <span className={`status-badge ${getFieldValue('signedFormStatus') === 'completed' ? 'ready' : 'pending'}`}>
                                        {getFieldValue('signedFormStatus', 'pending')}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Check size={16} />
                                    {t('editKid.healthDeclarationSigned', 'Declaration')}
                                </label>
                                <div>
                                    <span className={`status-badge ${getFieldValue('signedDeclaration') ? 'ready' : 'pending'}`}>
                                        {getFieldValue('signedDeclaration') ? t('common.signed', 'Signed') : t('common.pending', 'Pending')}
                                    </span>
                                </div>
                            </div>

                            {getFieldValue('teamId') && (
                                <div className="form-group">
                                    <label className="form-label">
                                        <User size={16} />
                                        {t('kids.team', 'Team')}
                                    </label>
                                    <div className="form-display-value">
                                        <span className="badge secondary">
                                            {getFieldValue('teamId')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {getFieldValue('additionalComments') && (
                                <div className="form-group full-width">
                                    <label className="form-label">
                                        <FileText size={16} />
                                        {t('parent.additionalComments', 'Additional Comments')}
                                    </label>
                                    <div className="form-display-value">
                                        {getFieldValue('additionalComments')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Parent Comments - Editable Section */}
                    {canEditField('comments.parent') && (
                        <div className="form-section">
                            <div className="section-header">
                                <Edit className="section-icon" size={24} />
                                <h3>{t('parent.myComments', 'My Comments')}</h3>
                            </div>

                            {isEditingComment ? (
                                <div className="form-group full-width">
                                    <label className="form-label">
                                        <Edit size={16} />
                                        {t('parent.editComments', 'Edit Your Comments')}
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={t('parent.addCommentsPlaceholder', 'Add your comments about your child...')}
                                        rows={6}
                                        style={{ minHeight: '120px' }}
                                    />

                                    <div className="racing-actions" style={{ marginTop: '15px' }}>
                                        <button
                                            className="btn btn-success"
                                            onClick={saveComments}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <div className="loading-spinner-mini" />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            {t('general.save', 'Save Comments')}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={cancelEditing}
                                            disabled={saving}
                                        >
                                            <X size={18} />
                                            {t('general.cancel', 'Cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-group full-width">
                                    <label className="form-label">
                                        <Edit size={16} />
                                        {t('parent.yourComments', 'Your Comments')}
                                    </label>
                                    <div style={{
                                        minHeight: '100px',
                                        padding: '15px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        marginBottom: '15px',
                                        color: 'var(--text-primary)',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {commentText || t('parent.noCommentsYet', 'No comments added yet. Click below to add your thoughts about your child.')}
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsEditingComment(true)}
                                    >
                                        <Edit size={18} />
                                        {commentText ? t('general.edit', 'Edit Comments') : t('parent.addComments', 'Add Comments')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Photo Section */}
                    {getFieldValue('personalInfo.photo') && (
                        <div className="form-section">
                            <div className="section-header">
                                <Camera className="section-icon" size={24} />
                                <h3>{t('parent.photo', 'Photo')}</h3>
                            </div>

                            <div className="form-group">
                                <div style={{ textAlign: 'center' }}>
                                    <img
                                        src={getFieldValue('personalInfo.photo')}
                                        alt={`${getFieldValue('personalInfo.firstName')} ${getFieldValue('personalInfo.lastName')}`}
                                        style={{
                                            maxWidth: '200px',
                                            maxHeight: '200px',
                                            borderRadius: '10px',
                                            border: '2px solid var(--border-color)',
                                            boxShadow: '0 4px 15px var(--shadow-color)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Back to Dashboard */}
                    <div className="racing-actions">
                        <Link to="/parent/dashboard" className="btn btn-primary">
                            <ArrowLeft size={18} />
                            {t('parent.backToMyKids', 'Back to My Kids')}
                        </Link>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ParentKidDetailPage;