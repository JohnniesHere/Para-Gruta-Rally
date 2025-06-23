// src/components/modals/EditKidModal.jsx - WITH ENHANCED VALIDATION
import React, { useState, useEffect } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { updateKid } from '@/services/kidService.js';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '@/firebase/config.js';
import {
    useFormValidation,
    validationRules,
    cleanPhoneNumber,
    hasErrors
} from '@/utils/validationUtils.js';
import {
    IconX as X,
    IconDeviceFloppy as Save,
    IconUserCircle as Baby,
    IconCar as Car,
    IconUser as User,
    IconUsers as Users,
    IconHeart as Heart,
    IconCheck as Check,
    IconNotes as FileText,
    IconSparkles as Sparkles,
    IconCalendar as Calendar
} from '@tabler/icons-react';
import './EditKidModal.css';

const EditKidModal = ({ kid, isOpen, onClose, onKidUpdated }) => {
    const { t, isRTL } = useLanguage();
    const { validateForm, validateField } = useFormValidation();

    const [formData, setFormData] = useState({
        participantNumber: '',
        personalInfo: {
            address: '',
            dateOfBirth: '',
            capabilities: '',
            announcersNotes: ''
        },
        parentInfo: {
            name: '',
            email: '',
            phone: '',
            parentId: '',
            grandparentsInfo: {
                names: '',
                phone: ''
            }
        },
        instructorId: '',
        teamId: '',
        signedFormStatus: 'Pending',
        signedDeclaration: false,
        additionalComments: ''
    });

    const [teams, setTeams] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [parents, setParents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && kid) {
            // Initialize form data with kid data
            setFormData({
                participantNumber: kid.originalData?.participantNumber || '',
                personalInfo: {
                    address: kid.originalData?.personalInfo?.address || '',
                    dateOfBirth: kid.originalData?.personalInfo?.dateOfBirth || '',
                    capabilities: kid.originalData?.personalInfo?.capabilities || '',
                    announcersNotes: kid.originalData?.personalInfo?.announcersNotes || ''
                },
                parentInfo: {
                    name: kid.originalData?.parentInfo?.name || '',
                    email: kid.originalData?.parentInfo?.email || '',
                    phone: kid.originalData?.parentInfo?.phone || '',
                    parentId: kid.originalData?.parentInfo?.parentId || '',
                    grandparentsInfo: {
                        names: kid.originalData?.parentInfo?.grandparentsInfo?.names || '',
                        phone: kid.originalData?.parentInfo?.grandparentsInfo?.phone || ''
                    }
                },
                instructorId: kid.originalData?.instructorId || '',
                teamId: kid.originalData?.teamId || '',
                signedFormStatus: kid.originalData?.signedFormStatus || 'Pending',
                signedDeclaration: kid.originalData?.signedDeclaration || false,
                additionalComments: kid.originalData?.additionalComments || ''
            });

            loadSupportingData();
        }
    }, [isOpen, kid]);

    const loadSupportingData = async () => {
        setIsLoading(true);
        try {
            const [teamsSnapshot, instructorsSnapshot, parentsSnapshot] = await Promise.all([
                getDocs(collection(db, 'teams')),
                getDocs(collection(db, 'instructors')),
                getDocs(query(collection(db, 'users'), where('role', '==', 'parent')))
            ]);

            setTeams(teamsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(team => team.active !== false)
            );

            setInstructors(instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));

            setParents(parentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error('Error loading supporting data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (path, value) => {
        // Handle nested paths like 'parentInfo.phone'
        setFormData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }

            // Special handling for phone numbers
            if (path.includes('phone')) {
                value = cleanPhoneNumber(value);
                if (value.length > 10) {
                    value = value.slice(0, 10);
                }
            }

            current[keys[keys.length - 1]] = value;
            return newData;
        });

        // Real-time validation for this field
        const fieldError = validateField(path, value, validationRules.kid[path] || {}, t);
        setErrors(prev => ({
            ...prev,
            [path]: fieldError
        }));
    };

    const handleSave = async () => {
        // Validate the entire form
        const validation = validateForm(formData, validationRules.kid, t);

        if (!validation.isValid) {
            setErrors(validation.errors);

            // Show first error to user
            const firstError = Object.values(validation.errors)[0];
            alert(t('validation.pleaseFixErrors', 'Please fix the following errors:') + '\n' + firstError);
            return;
        }

        setIsSaving(true);
        try {
            await updateKid(kid.id, formData);
            onKidUpdated(kid.id, formData);
            onClose();
        } catch (error) {
            console.error('Error updating kid:', error);
            setErrors({
                general: t('editKidModal.updateFailed', 'Failed to update kid. Please try again.')
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content edit-kid-modal" dir={isRTL ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <Baby size={24} style={{ marginRight: '8px' }} />
                        {t('editKidModal.title', 'Edit Racing Star: {kidName}', { kidName: kid?.name || t('editKidModal.unknownKid', 'Unknown Kid') })}
                    </h2>
                    <button className="modal-close" onClick={handleClose} aria-label={t('common.close', 'Close')}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {errors.general && (
                        <div className="alert error-alert" role="alert">
                            {errors.general}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>{t('editKidModal.loadingFormData', 'Loading form data...')}</p>
                        </div>
                    ) : (
                        <form className="edit-kid-form">
                            {/* Basic Info Section */}
                            <div className="form-section racing-section">
                                <div className="section-header">
                                    <Baby className="section-icon" size={20} />
                                    <h3>🏎️ {t('editKidModal.racerProfile', 'Racer Profile')}</h3>
                                </div>
                                <div className="form-grid">
                                    <div className={`form-group ${errors.participantNumber ? 'error' : ''}`}>
                                        <label className="form-label">🏁 {t('editKidModal.raceNumber', 'Race Number')} *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="001"
                                            value={formData.participantNumber}
                                            onChange={(e) => handleInputChange('participantNumber', e.target.value)}
                                            aria-describedby={errors.participantNumber ? 'participantNumber-error' : undefined}
                                            aria-invalid={!!errors.participantNumber}
                                        />
                                        {errors.participantNumber && (
                                            <span id="participantNumber-error" className="error-text" role="alert">
                                                {errors.participantNumber}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`form-group ${errors['personalInfo.dateOfBirth'] ? 'error' : ''}`}>
                                        <label className="form-label">🎂 {t('editKidModal.birthday', 'Birthday')} *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.personalInfo.dateOfBirth}
                                            onChange={(e) => handleInputChange('personalInfo.dateOfBirth', e.target.value)}
                                            aria-describedby={errors['personalInfo.dateOfBirth'] ? 'dateOfBirth-error' : undefined}
                                            aria-invalid={!!errors['personalInfo.dateOfBirth']}
                                        />
                                        {errors['personalInfo.dateOfBirth'] && (
                                            <span id="dateOfBirth-error" className="error-text" role="alert">
                                                {errors['personalInfo.dateOfBirth']}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">🏠 {t('editKidModal.homeBaseLocation', 'Home Base Location')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={t('editKidModal.homeBasePlaceholder', 'Where our racer calls home')}
                                            value={formData.personalInfo.address}
                                            onChange={(e) => handleInputChange('personalInfo.address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Information */}
                            <div className="form-section parent-section">
                                <div className="section-header">
                                    <Heart className="section-icon" size={20} />
                                    <h3>👨‍👩‍👧‍👦 {t('editKidModal.racingFamily', 'Racing Family')}</h3>
                                </div>
                                <div className="form-grid">
                                    <div className={`form-group ${errors['parentInfo.name'] ? 'error' : ''}`}>
                                        <label className="form-label">👤 {t('editKidModal.parentName', 'Parent/Guardian Name')} *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={t('editKidModal.parentNamePlaceholder', 'Racing coach\'s name')}
                                            value={formData.parentInfo.name}
                                            onChange={(e) => handleInputChange('parentInfo.name', e.target.value)}
                                            aria-describedby={errors['parentInfo.name'] ? 'parentName-error' : undefined}
                                            aria-invalid={!!errors['parentInfo.name']}
                                        />
                                        {errors['parentInfo.name'] && (
                                            <span id="parentName-error" className="error-text" role="alert">
                                                {errors['parentInfo.name']}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`form-group ${errors['parentInfo.email'] ? 'error' : ''}`}>
                                        <label className="form-label">📧 {t('editKidModal.emailAddress', 'Email Address')} *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder={t('editKidModal.emailPlaceholder', 'parent@racingfamily.com')}
                                            value={formData.parentInfo.email}
                                            onChange={(e) => handleInputChange('parentInfo.email', e.target.value)}
                                            aria-describedby={errors['parentInfo.email'] ? 'parentEmail-error' : undefined}
                                            aria-invalid={!!errors['parentInfo.email']}
                                        />
                                        {errors['parentInfo.email'] && (
                                            <span id="parentEmail-error" className="error-text" role="alert">
                                                {errors['parentInfo.email']}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`form-group ${errors['parentInfo.phone'] ? 'error' : ''}`}>
                                        <label className="form-label">📱 {t('editKidModal.phoneNumber', 'Phone Number')} *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder={t('editKidModal.phonePlaceholder', 'Racing hotline')}
                                            value={formData.parentInfo.phone}
                                            onChange={(e) => handleInputChange('parentInfo.phone', e.target.value)}
                                            maxLength="10"
                                            aria-describedby={errors['parentInfo.phone'] ? 'parentPhone-error' : undefined}
                                            aria-invalid={!!errors['parentInfo.phone']}
                                        />
                                        {errors['parentInfo.phone'] && (
                                            <span id="parentPhone-error" className="error-text" role="alert">
                                                {errors['parentInfo.phone']}
                                            </span>
                                        )}
                                        <small className="field-hint">
                                            {t('validation.phoneHint', 'Israeli phone number (10 digits)')}
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">🔗 {t('editKidModal.parentAccount', 'Parent Account')}</label>
                                        <select
                                            value={formData.parentInfo.parentId}
                                            onChange={(e) => handleInputChange('parentInfo.parentId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">{t('editKidModal.chooseParentAccount', 'Choose Parent Account (Optional)')}</option>
                                            {parents.map(parent => (
                                                <option key={parent.id} value={parent.id}>
                                                    {parent.displayName || parent.name} ({parent.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">👵👴 {t('editKidModal.grandparentsNames', 'Grandparents Names')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={t('editKidModal.grandparentsPlaceholder', 'Racing legends in the family')}
                                            value={formData.parentInfo.grandparentsInfo.names}
                                            onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.names', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">☎️ {t('editKidModal.grandparentsPhone', 'Grandparents Phone')}</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder={t('editKidModal.grandparentsPhonePlaceholder', 'Backup racing support')}
                                            value={formData.parentInfo.grandparentsInfo.phone}
                                            onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.phone', e.target.value)}
                                            maxLength="10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Team Assignment */}
                            <div className="form-section team-section">
                                <div className="section-header">
                                    <Car className="section-icon" size={20} />
                                    <h3>🏎️ {t('editKidModal.racingTeam', 'Racing Team')}</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">🏁 {t('editKidModal.racingTeam', 'Racing Team')}</label>
                                        <select
                                            value={formData.teamId}
                                            onChange={(e) => handleInputChange('teamId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">🚫 {t('editKidModal.noTeamAssigned', 'No Team Assigned')}</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>
                                                    🏁 {team.name} ({team.kidIds?.length || 0} {t('editKidModal.racers', 'racers')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">👨‍🏫 {t('editKidModal.racingInstructor', 'Racing Instructor')}</label>
                                        <select
                                            value={formData.instructorId}
                                            onChange={(e) => handleInputChange('instructorId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">{t('editKidModal.noInstructorAssigned', 'No Instructor Assigned')}</option>
                                            {instructors.map(instructor => (
                                                <option key={instructor.id} value={instructor.id}>
                                                    🏎️ {instructor.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="form-section status-section">
                                <div className="section-header">
                                    <Check className="section-icon" size={20} />
                                    <h3>📋 {t('editKidModal.racingStatus', 'Racing Status')}</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">📊 {t('editKidModal.formStatus', 'Form Status')}</label>
                                        <select
                                            value={formData.signedFormStatus}
                                            onChange={(e) => handleInputChange('signedFormStatus', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="Pending">⏳ {t('editKidModal.statusPending', 'Pending - Getting Ready')}</option>
                                            <option value="Completed">✅ {t('editKidModal.statusCompleted', 'Completed - Ready to Race!')}</option>
                                            <option value="Needs Review">🔍 {t('editKidModal.statusNeedsReview', 'Needs Review')}</option>
                                            <option value="Cancelled">❌ {t('editKidModal.statusCancelled', 'Cancelled')}</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.signedDeclaration}
                                                onChange={(e) => handleInputChange('signedDeclaration', e.target.checked)}
                                            />
                                            🛡️ {t('editKidModal.safetyDeclaration', 'Safety Declaration Signed')}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Notes */}
                            <div className="form-section skills-section">
                                <div className="section-header">
                                    <Sparkles className="section-icon" size={20} />
                                    <h3>💪 {t('editKidModal.skillsNotes', 'Skills & Notes')}</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">🌟 {t('editKidModal.amazingAbilities', 'Amazing Abilities')}</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder={t('editKidModal.abilitiesPlaceholder', 'Tell us about this racer\'s awesome skills!')}
                                            value={formData.personalInfo.capabilities}
                                            onChange={(e) => handleInputChange('personalInfo.capabilities', e.target.value)}
                                            rows="2"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">📢 {t('editKidModal.announcerNotes', 'Announcer Notes')}</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder={t('editKidModal.announcerPlaceholder', 'Fun facts for race day!')}
                                            value={formData.personalInfo.announcersNotes}
                                            onChange={(e) => handleInputChange('personalInfo.announcersNotes', e.target.value)}
                                            rows="2"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">🗒️ {t('editKidModal.additionalNotes', 'Additional Notes')}</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder={t('editKidModal.additionalPlaceholder', 'Any special notes about this racing star!')}
                                            value={formData.additionalComments}
                                            onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        {t('editKidModal.cancel', 'Cancel')}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={isSaving || isLoading || hasErrors(errors)}
                    >
                        {isSaving ? (
                            <>
                                <div className="loading-spinner-mini"></div>
                                {t('editKidModal.saving', 'Saving...')}
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {t('editKidModal.saveChanges', 'Save Changes')} 🏁
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditKidModal;