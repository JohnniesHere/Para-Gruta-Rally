// src/pages/admin/EditTeamPage.jsx - Updated with Schema Integration
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getTeamById, updateTeam, getAllInstructors, getAllTeams } from '@/services/teamService.js';
import { getAllKids } from '@/services/kidService.js';
import { validateTeam } from '@/schemas/teamSchema.js'; // Fixed import path
import {
    IconUsers as UsersGroup,
    IconDeviceFloppy as Save,
    IconArrowLeft as ArrowLeft,
    IconArrowRight as ArrowRight,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconUser as User,
    IconUsers as Users,
    IconCar as Car,
    IconUserCircle as Baby,
    IconNotes as FileText,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconTarget as Target,
    IconEdit as Edit
} from '@tabler/icons-react';
import './EditTeamPage.css';

const EditTeamPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t, isHebrew, isRTL } = useLanguage();
    const { permissions, userRole } = usePermissions();

    const [isLoading, setIsLoading] = useState(true);
    const [instructors, setInstructors] = useState([]);
    const [allKids, setAllKids] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxCapacity: 15,
        active: true,
        instructorIds: [],
        kidIds: [],
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusInstructor, setFocusInstructor] = useState(false);
    const [focusKids, setFocusKids] = useState(false);

    useEffect(() => {
        // Check if we should focus on specific sections
        if (location.state?.focusInstructor) {
            setFocusInstructor(true);
        }
        if (location.state?.focusKids) {
            setFocusKids(true);
        }
        loadTeamData();
    }, [id]);

    const getAvailableInstructors = () => {
        return instructors.filter(instructor => {
            // Check if instructor is assigned to any other team
            const isAssignedToOtherTeam = allTeams.some(team =>
                team.id !== id && // Exclude current team
                team.instructorIds &&
                team.instructorIds.includes(instructor.id)
            );

            // Include instructor if:
            // 1. Not assigned to other teams, OR
            // 2. Already assigned to current team
            return !isAssignedToOtherTeam || formData.instructorIds.includes(instructor.id);
        });
    };

    const loadTeamData = async () => {
        try {
            setIsLoading(true);

            // Load team data
            const teamData = await getTeamById(id);
            if (!teamData) {
                setErrors({ general: t('teams.teamNotFound', 'Team not found!') });
                return;
            }

            setOriginalData(teamData);
            setFormData(teamData);

            // Load supporting data including all teams
            const [instructorsData, allKidsData, allTeamsData] = await Promise.all([
                getAllInstructors(),
                getAllKids(),
                getAllTeams() // Add this import if not already imported
            ]);

            setInstructors(instructorsData);
            setAllKids(allKidsData);
            setAllTeams(allTeamsData); // Store all teams

        } catch (error) {
            console.error('❌ Error loading team data:', error);
            setErrors({ general: t('teams.loadDataError', 'Failed to load team data. Please try again.') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear specific error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: false
            }));
        }
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleInstructorToggle = (instructorId) => {
        setFormData(prev => ({
            ...prev,
            instructorIds: prev.instructorIds.includes(instructorId)
                ? prev.instructorIds.filter(id => id !== instructorId)
                : [...prev.instructorIds, instructorId]
        }));
    };

    const handleKidToggle = (kidId) => {
        setFormData(prev => ({
            ...prev,
            kidIds: prev.kidIds.includes(kidId)
                ? prev.kidIds.filter(id => id !== kidId)
                : [...prev.kidIds, kidId]
        }));
    };

    const validateForm = () => {

        // Use schema validation
        const validation = validateTeam(formData, true); // true = is an update

        if (!validation.isValid) {
            setErrors(validation.errors);

            // Set field errors for visual indicators
            const newFieldErrors = {};
            Object.keys(validation.errors).forEach(field => {
                newFieldErrors[field] = true;
            });
            setFieldErrors(newFieldErrors);

            return false;
        }

        setErrors({});
        setFieldErrors({});
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await updateTeam(id, formData);

            // Navigate back with success message
            navigate(`/admin/teams/view/${id}`, {
                state: {
                    message: t('teams.updateSuccess', '🏁 Team "{teamName}" has been updated successfully! 🏎️', { teamName: formData.name }),
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('❌ Error updating team:', error);
            setErrors({ general: error.message || t('teams.updateError', 'Failed to update team. Please try again.') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/teams');
    };

    const hasChanges = () => {
        return JSON.stringify(formData) !== JSON.stringify(originalData);
    };

    // Get available kids (not in other teams, or already in this team)
    const getAvailableKids = () => {
        return allKids.filter(kid =>
            !kid.teamId || kid.teamId === id
        );
    };

    // Helper function to get instructor display name
    const getInstructorDisplayName = (instructor) => {
        return instructor.displayName || instructor.name || instructor.email || 'Unknown Instructor';
    };

    // Helper function to get error message for a field
    const getErrorMessage = (fieldPath) => {
        return errors[fieldPath];
    };

    // Check if field has error
    const hasFieldError = (fieldPath) => {
        return fieldErrors[fieldPath] || false;
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`add-team-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('teams.loadingTeamData', 'Loading team data...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (errors.general && !originalData) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`add-team-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{errors.general}</p>
                        <button onClick={() => navigate('/admin/teams')} className={`btn-primary ${isRTL ? 'rtl' : ''}`}>
                            {isHebrew ? (
                                <>
                                    {t('teams.backToTeams', 'Back to Teams')}
                                    <ArrowRight className="btn-icon" size={18} />
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="btn-icon" size={18} />
                                    {t('teams.backToTeams', 'Back to Teams')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const availableKids = getAvailableKids();
        //debugging:
        const currentCount = formData.kidIds?.length || 0;
        const maxCount = formData.maxCapacity || 15;


    return (
        <Dashboard requiredRole={userRole}>
            <div className={`add-team-page ${appliedTheme}-mode`}>
                {/* Racing Theme Header */}
                <button
                    onClick={handleCancel}
                    className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                    {isHebrew ? (
                        <>
                            {t('teams.backToTeams', 'Back to Teams')}
                            <ArrowRight className="btn-icon" size={20} />
                        </>
                    ) : (
                        <>
                            <ArrowLeft className="btn-icon" size={20} />
                            {t('teams.backToTeams', 'Back to Teams')}
                        </>
                    )}
                </button>
                <div className="header-content">
                    <div className="title-section">
                        <h1>
                            <Edit size={32} className="page-title-icon" />
                            {t('teams.updateRacingTeam', 'Update Racing Team!')}
                            <Trophy size={24} className="trophy-icon" />
                        </h1>
                    </div>
                </div>

                <div className="add-team-container">
                    {errors.general && (
                        <div className="error-alert">
                            <AlertTriangle size={20} />
                            {errors.general}
                        </div>
                    )}

                    {!hasChanges() && (
                        <div className="alert info-alert">
                            <Check size={20} />
                            {t('teams.viewingCurrentInfo', 'You\'re viewing Team {teamName}\'s current information. Make changes below to update! 🏎️', { teamName: formData.name })}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="add-team-form">
                        {/* Team Info Section */}
                        <div className="form-section team-info-section">
                            <div className="section-header">
                                <Trophy className="section-icon" size={24} />
                                <h2>{t('teams.teamIdentity', '🏎️ Team Identity')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Target className="label-icon" size={16} />
                                            {t('teams.teamName', 'Team Name')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder={t('teams.teamNamePlaceholder', 'Thunder Racers, Speed Demons, Lightning Bolts...')}
                                            className={`form-input racing-input ${hasFieldError('name') ? 'error' : ''}`}
                                        />
                                        {getErrorMessage('name') && <span className="error-text">{getErrorMessage('name')}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Users className="label-icon" size={16} />
                                            {t('teams.maxRacers', 'Max Racers')}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={formData.maxCapacity}
                                            onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value) || 15)}
                                            className={`form-input racing-input ${hasFieldError('maxCapacity') ? 'error' : ''}`}
                                        />
                                        {getErrorMessage('maxCapacity') && <span className="error-text">{getErrorMessage('maxCapacity')}</span>}
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <FileText className="label-icon" size={16} />
                                            {t('teams.teamDescription', 'Team Description')}
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder={t('teams.teamDescriptionPlaceholder', 'What makes this team special? Their racing spirit, teamwork, or special skills...')}
                                            className="form-textarea racing-textarea"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Check className="label-icon" size={16} />
                                            {t('teams.teamStatus', 'Team Status')}
                                        </label>
                                        <select
                                            value={formData.active ? 'active' : 'inactive'}
                                            onChange={(e) => handleInputChange('active', e.target.value === 'active')}
                                            className="form-select racing-select"
                                        >
                                            <option value="active">{t('teams.activeReady', '✅ Active & Ready to Race')}</option>
                                            <option value="inactive">{t('teams.inactivePrep', '⏸️ Inactive (Prep Mode)')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructors Section - Highlighted if focusInstructor */}
                        <div className={`form-section instructors-section ${focusInstructor ? 'highlight-section' : ''}`}>
                            <div className="section-header">
                                <User className="section-icon" size={24} />
                                <h2>
                                    {t('teams.racingInstructors', '👨‍🏫 Racing Instructors')}
                                    {focusInstructor && <span className="focus-indicator">{t('teams.focusIndicator', '← Update Here!')}</span>}
                                </h2>
                            </div>
                            <div className="instructors-grid">
                                {(() => {
                                    const availableInstructors = getAvailableInstructors();

                                    if (availableInstructors.length === 0) {
                                        return (
                                            <div className="empty-state">
                                                <User className="empty-icon" size={40} />
                                                <p>{t('teams.noInstructorsAvailable', 'No instructors available. All instructors are already assigned to other teams!')}</p>
                                                {instructors.length > availableInstructors.length && (
                                                    <small>{t('teams.someInstructorsAssigned', `${instructors.length - availableInstructors.length} instructor(s) are assigned to other teams.`)}</small>
                                                )}
                                            </div>
                                        );
                                    }

                                    return availableInstructors.map(instructor => (
                                        <div
                                            key={instructor.id}
                                            className={`instructor-card ${formData.instructorIds.includes(instructor.id) ? 'selected' : ''} ${focusInstructor ? 'focus-card' : ''}`}
                                            onClick={() => handleInstructorToggle(instructor.id)}
                                        >
                                            <div className="card-header">
                                                <User className="card-icon" size={20} />
                                                <span className="instructor-name">{getInstructorDisplayName(instructor)}</span>
                                                {formData.instructorIds.includes(instructor.id) && (
                                                    <Check className="selected-icon" size={16} />
                                                )}
                                            </div>
                                            <div className="instructor-details">
                                                {instructor.email && (
                                                    <div>📧 {instructor.email}</div>
                                                )}
                                                {instructor.phone && (
                                                    <div>📱 {instructor.phone}</div>
                                                )}
                                                {/* Optional: Show if instructor was previously in current team */}
                                                {originalData?.instructorIds?.includes(instructor.id) && !formData.instructorIds.includes(instructor.id) && (
                                                    <div className="status-indicator removed">
                                                        🚫 {t('teams.removedFromTeam', 'Being removed from team')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Kids Assignment Section - Highlighted if focusKids */}
                        <div className={`form-section kids-section ${focusKids ? 'highlight-section' : ''}`}>
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h2>
                                 <h2>
                                  {t('teams.teamRacers', '🏎️ Team Racers ({current}/{max})', {
                                    current: currentCount,
                                    max: maxCount
                                  })}
                                </h2>
                                    {focusKids && <span className="focus-indicator">{t('teams.focusIndicator', '← Update Here!')}</span>}
                                </h2>
                            </div>

                            {getErrorMessage('kidIds') && (
                                <div className="capacity-warning">
                                    <AlertTriangle size={16} />
                                    {getErrorMessage('kidIds')}
                                </div>
                            )}

                            <div className="kids-grid">
                                {availableKids.length === 0 ? (
                                    <div className="empty-state">
                                        <Baby className="empty-icon" size={40} />
                                        <p>{t('teams.noKidsAvailable', 'No kids available for assignment! 🎉')}</p>
                                        <small>{t('teams.allKidsAssigned', 'All kids are already assigned to teams.')}</small>
                                    </div>
                                ) : (
                                    availableKids.map(kid => (
                                        <div
                                            key={kid.id}
                                            className={`kid-card ${formData.kidIds.includes(kid.id) ? 'selected' : ''} ${focusKids ? 'focus-card' : ''}`}
                                            onClick={() => handleKidToggle(kid.id)}
                                        >
                                            <div className="card-header">
                                                <Baby className="card-icon" size={20} />
                                                <span className="kid-name">
                                                    {kid.personalInfo?.firstName || 'Unknown'} {kid.personalInfo?.lastName || ''}
                                                </span>
                                                {formData.kidIds.includes(kid.id) && (
                                                    <Check className="selected-icon" size={16} />
                                                )}
                                            </div>
                                            <div className="kid-details">
                                                <div>🏁 #{kid.participantNumber}</div>
                                                {kid.parentInfo?.name && (
                                                    <div>👨‍👩‍👧‍👦 {kid.parentInfo.name}</div>
                                                )}
                                                {kid.teamId && kid.teamId !== id && (
                                                    <div className="current-team">{t('teams.currentlyInOtherTeam', '📍 Currently in other team')}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="form-section notes-section">
                            <div className="section-header">
                                <FileText className="section-icon" size={24} />
                                <h2>{t('teams.teamNotes', '📝 Team Notes')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Sparkles className="label-icon" size={16} />
                                            {t('teams.specialNotesStrategy', '📝 Special Notes & Strategy')}
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            placeholder={t('teams.notesPlaceholder', 'Team strategy, special requirements, or any other important notes...')}
                                            className="form-textarea racing-textarea"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Racing Action Buttons */}
                        <div className="form-actions racing-actions">
                            <button type="button" onClick={handleCancel} className="btn-cancel">
                                {t('general.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !hasChanges()}
                                className="btn-submit racing-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="loading-spinner-mini"></div>
                                        {t('teams.updatingTeam', 'Updating Team...')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="btn-icon" size={18} />
                                        {hasChanges() ? t('teams.saveUpdates', 'Save Updates! 🏁') : t('teams.noChangesToSave', 'No Changes to Save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Dashboard>
    );
};

export default EditTeamPage;