// src/pages/parent/ParentKidDetailPage.jsx
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
    IconCamera as Camera
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

    useEffect(() => {
        const loadKidDetails = async () => {
            if (!user?.uid || userRole !== 'parent') {
                setError('Access denied: Parent credentials required');
                setLoading(false);
                return;
            }

            try {
                setError('');

                const kidDoc = await getDoc(doc(db, 'kids', kidId));

                if (!kidDoc.exists()) {
                    setError('Kid not found');
                    setLoading(false);
                    return;
                }

                const kidData = { id: kidDoc.id, ...kidDoc.data() };

                // Check if this kid belongs to the current parent
                if (kidData.parentInfo?.parentId !== user.uid) {
                    setError('Access denied: You can only view your own kids');
                    setLoading(false);
                    return;
                }

                setKid(kidData);
                setCommentText(kidData.comments?.parent || '');

            } catch (err) {
                console.error('Error loading kid details:', err);
                setError('Failed to load kid details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (kidId) {
            loadKidDetails();
        }
    }, [kidId, user, userRole]);

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
            const kidRef = doc(db, 'kids', kidId);
            await updateDoc(kidRef, {
                'comments.parent': commentText || ''
            });

            // Update local state
            setKid({
                ...kid,
                comments: {
                    ...kid.comments,
                    parent: commentText || ''
                }
            });

            setIsEditingComment(false);
        } catch (err) {
            console.error('Error saving comments:', err);
            setError('Failed to save comments. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const cancelEditing = () => {
        setIsEditingComment(false);
        setCommentText(kid.comments?.parent || '');
    };

    const getFormStatus = () => {
        if (!kid) return { status: 'unknown', label: 'Unknown', color: 'secondary' };

        if (kid.signedFormStatus === 'completed' && kid.signedDeclaration) {
            return { status: 'complete', label: 'Complete', color: 'success' };
        } else if (kid.signedFormStatus === 'pending' || !kid.signedDeclaration) {
            return { status: 'pending', label: 'Pending', color: 'warning' };
        }
        return { status: 'incomplete', label: 'Incomplete', color: 'danger' };
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

    return (
        <Dashboard userRole={userRole}>
            <div className="admin-page">
                <div className="page-header">
                    <h1>
                        <User className="page-title-icon" size={48} />
                        {getFieldValue('personalInfo.firstName')} {getFieldValue('personalInfo.lastName')}
                    </h1>
                    <Link to="/parent/dashboard" className="back-button">
                        <ArrowLeft size={18} />
                        {t('parent.backToMyKids', 'Back to My Kids')}
                    </Link>
                </div>

                <div className="admin-container">
                    {/* Kid Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <User size={40} />
                                    {getFieldValue('personalInfo.firstName')} {getFieldValue('personalInfo.lastName')}
                                </h1>
                                <p className="subtitle">
                                    {t('common.participantNumber', 'Participant #')}: {getFieldValue('participantNumber')} •
                                    <span className={`status-badge ${formStatus.color === 'success' ? 'ready' : formStatus.color === 'warning' ? 'pending' : 'inactive'}`} style={{ marginLeft: '10px' }}>
                                        {formStatus.label}
                                    </span>
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
                            <div className="form-group">
                                <label className="form-label">
                                    <User size={16} />
                                    {t('common.fullName', 'Full Name')}
                                </label>
                                <div className="form-display-value">
                                    {getFieldValue('personalInfo.firstName')} {getFieldValue('personalInfo.lastName')}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Calendar size={16} />
                                    {t('common.dateOfBirth', 'Date of Birth')}
                                </label>
                                <div className="form-display-value">
                                    {getFieldValue('personalInfo.dateOfBirth')
                                        ? new Date(getFieldValue('personalInfo.dateOfBirth')).toLocaleDateString()
                                        : '-'
                                    }
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">
                                    <MapPin size={16} />
                                    {t('common.address', 'Address')}
                                </label>
                                <div className="form-display-value">
                                    {getFieldValue('personalInfo.address')}
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">
                                    <FileText size={16} />
                                    {t('common.capabilities', 'Capabilities & Special Needs')}
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
                            <div className="form-group">
                                <label className="form-label">
                                    <User size={16} />
                                    {t('common.parentName', 'Parent Name')}
                                </label>
                                <div className="form-display-value">
                                    {getFieldValue('parentInfo.name')}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Mail size={16} />
                                    {t('common.email', 'Email')}
                                </label>
                                <div className="form-display-value" style={{ fontFamily: 'monospace' }}>
                                    {getFieldValue('parentInfo.email')}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Phone size={16} />
                                    {t('common.phone', 'Phone')}
                                </label>
                                <div className="form-display-value" style={{ fontFamily: 'monospace', direction: 'ltr' }}>
                                    {getFieldValue('parentInfo.phone')}
                                </div>
                            </div>

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
                                    {t('common.signedFormStatus', 'Form Status')}
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
                                    {t('common.declaration', 'Declaration')}
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
                                        {t('common.team', 'Team')}
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
                                            {t('common.save', 'Save Comments')}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={cancelEditing}
                                            disabled={saving}
                                        >
                                            <X size={18} />
                                            {t('common.cancel', 'Cancel')}
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
                                        {commentText ? t('common.edit', 'Edit Comments') : t('parent.addComments', 'Add Comments')}
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