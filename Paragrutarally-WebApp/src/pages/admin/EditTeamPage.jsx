// src/pages/admin/EditTeamPage.jsx - Fun Racing Theme Edit Team Form
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getTeamById, updateTeam } from '../../services/teamService';
import { getAllKids } from '../../services/kidService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
    IconUsers as UsersGroup,
    IconDeviceFloppy as Save,
    IconArrowLeft as ArrowLeft,
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
import './AddTeamPage.css'; // Reuse the same CSS

const EditTeamPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [isLoading, setIsLoading] = useState(true);
    const [instructors, setInstructors] = useState([]);
    const [allKids, setAllKids] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxCapacity: 15,
        active: true,
        instructorIds: [],
        kidIds: [],
        teamLeaderId: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});
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

    const loadTeamData = async () => {
        try {
            setIsLoading(true);

            // Load team data
            const teamData = await getTeamById(id);
            if (!teamData) {
                setErrors({ general: 'Team not found!' });
                return;
            }

            setOriginalData(teamData);
            setFormData(teamData);

            // Load supporting data
            const [instructorsData, allKidsData] = await Promise.all([
                getDocs(query(collection(db, 'instructors'))),
                getAllKids()
            ]);

            setInstructors(instructorsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setAllKids(allKidsData);

        } catch (error) {
            console.error('Error loading team data:', error);
            setErrors({ general: 'Failed to load team data. Please try again.' });
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
        const newErrors = {};

        // Required field validations
        if (!formData.name.trim()) {
            newErrors.name = 'Team name is required';
        }

        if (formData.maxCapacity < 1 || formData.maxCapacity > 50) {
            newErrors.maxCapacity = 'Max capacity must be between 1 and 50';
        }

        if (formData.kidIds.length > formData.maxCapacity) {
            newErrors.kidIds = `Cannot assign more kids (${formData.kidIds.length}) than max capacity (${formData.maxCapacity})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
                    message: `🏁 Team "${formData.name}" has been updated successfully! 🏎️`,
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error updating team:', error);
            setErrors({ general: 'Failed to update team. Please try again.' });
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

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`add-team-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading team data...</p>
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
                        <h3>Error</h3>
                        <p>{errors.general}</p>
                        <button onClick={() => navigate('/admin/teams')} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            Back to Teams
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const availableKids = getAvailableKids();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`add-team-page ${appliedTheme}-mode`}>
                {/* Racing Theme Header */}
                <div className="racing-header">
                    <div className="header-content">
                        <button onClick={handleCancel} className="back-button">
                            <ArrowLeft className="btn-icon" size={20} />
                            Back to Teams
                        </button>
                        <div className="title-section">
                            <h1>
                                <Edit size={32} className="page-title-icon" />
                                Update Racing Team!
                                <Trophy size={24} className="trophy-icon" />
                            </h1>
                            <p className="subtitle">Keep the racing squad in top form! 🏁</p>
                        </div>
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
                        <div className="info-alert">
                            <Check size={20} />
                            You're viewing Team {formData.name}'s current information. Make changes below to update! 🏎️
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="add-team-form">
                        {/* Team Info Section */}
                        <div className="form-section team-info-section">
                            <div className="section-header">
                                <Trophy className="section-icon" size={24} />
                                <h2>🏎️ Team Identity</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Target className="label-icon" size={16} />
                                            Team Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Thunder Racers, Speed Demons, Lightning Bolts..."
                                            className="form-input racing-input"
                                        />
                                        {errors.name && <span className="error-text">{errors.name}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Users className="label-icon" size={16} />
                                            Max Racers
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={formData.maxCapacity}
                                            onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value) || 15)}
                                            className="form-input racing-input"
                                        />
                                        {errors.maxCapacity && <span className="error-text">{errors.maxCapacity}</span>}
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <FileText className="label-icon" size={16} />
                                            Team Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="What makes this team special? Their racing spirit, teamwork, or special skills..."
                                            className="form-textarea racing-textarea"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Check className="label-icon" size={16} />
                                            Team Status
                                        </label>
                                        <select
                                            value={formData.active ? 'active' : 'inactive'}
                                            onChange={(e) => handleInputChange('active', e.target.value === 'active')}
                                            className="form-select racing-select"
                                        >
                                            <option value="active">✅ Active & Ready to Race</option>
                                            <option value="inactive">⏸️ Inactive (Prep Mode)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructors Section - Highlighted if focusInstructor */}
                        <div className={`form-section instructors-section ${focusInstructor ? 'highlight-section' : ''}`}>
                            <div className="section-header">
                                <User className="section-icon" size={24} />
                                <h2>👨‍🏫 Racing Instructors {focusInstructor && <span className="focus-indicator">← Update Here!</span>}</h2>
                            </div>
                            <div className="instructors-grid">
                                {instructors.length === 0 ? (
                                    <div className="empty-state">
                                        <User className="empty-icon" size={40} />
                                        <p>No instructors available. Add some instructors first!</p>
                                    </div>
                                ) : (
                                    instructors.map(instructor => (
                                        <div
                                            key={instructor.id}
                                            className={`instructor-card ${formData.instructorIds.includes(instructor.id) ? 'selected' : ''} ${focusInstructor ? 'focus-card' : ''}`}
                                            onClick={() => handleInstructorToggle(instructor.id)}
                                        >
                                            <div className="card-header">
                                                <User className="card-icon" size={20} />
                                                <span className="instructor-name">{instructor.name}</span>
                                                {formData.instructorIds.includes(instructor.id) && (
                                                    <Check className="selected-icon" size={16} />
                                                )}
                                            </div>
                                            {instructor.phone && (
                                                <div className="instructor-details">
                                                    📱 {instructor.phone}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {formData.instructorIds.length > 0 && (
                                <div className="team-leader-section">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Trophy className="label-icon" size={16} />
                                            Team Leader
                                        </label>
                                        <select
                                            value={formData.teamLeaderId}
                                            onChange={(e) => handleInputChange('teamLeaderId', e.target.value)}
                                            className={`form-select racing-select ${focusInstructor ? 'focus-field' : ''}`}
                                        >
                                            <option value="">🎯 Choose Team Leader</option>
                                            {formData.instructorIds.map(instructorId => {
                                                const instructor = instructors.find(i => i.id === instructorId);
                                                return (
                                                    <option key={instructorId} value={instructorId}>
                                                        👑 {instructor?.name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kids Assignment Section - Highlighted if focusKids */}
                        <div className={`form-section kids-section ${focusKids ? 'highlight-section' : ''}`}>
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h2>🏎️ Team Racers ({formData.kidIds.length}/{formData.maxCapacity}) {focusKids && <span className="focus-indicator">← Update Here!</span>}</h2>
                            </div>

                            {errors.kidIds && (
                                <div className="capacity-warning">
                                    <AlertTriangle size={16} />
                                    {errors.kidIds}
                                </div>
                            )}

                            <div className="kids-grid">
                                {availableKids.length === 0 ? (
                                    <div className="empty-state">
                                        <Baby className="empty-icon" size={40} />
                                        <p>No kids available for assignment! 🎉</p>
                                        <small>All kids are already assigned to teams.</small>
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
                                                    <div className="current-team">📍 Currently in other team</div>
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
                                <h2>📝 Team Notes</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Sparkles className="label-icon" size={16} />
                                            Special Notes & Strategy
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            placeholder="Team strategy, special requirements, or any other important notes..."
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
                                <ArrowLeft className="btn-icon" size={18} />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !hasChanges()}
                                className="btn-submit racing-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="loading-spinner-mini"></div>
                                        Updating Team...
                                    </>
                                ) : (
                                    <>
                                        <Save className="btn-icon" size={18} />
                                        {hasChanges() ? 'Save Updates! 🏁' : 'No Changes to Save'}
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