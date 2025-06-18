// src/pages/admin/AddTeamPage.jsx - Updated for Global Theme System
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import {useTheme} from '../../contexts/ThemeContext';
import {usePermissions} from '../../hooks/usePermissions.jsx';
import {addTeam} from '../../services/teamService';
import {getAllKids} from '../../services/kidService';
import {getDocs, collection, query, where} from 'firebase/firestore';
import {db} from '../../firebase/config';
import {
    IconUsers as UsersGroup,
    IconPlus as Plus,
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
    IconTarget as Target
} from '@tabler/icons-react';
import './AddTeamPage.css';

const AddTeamPage = () => {
    const navigate = useNavigate();
    const {isDarkMode, appliedTheme} = useTheme();
    const {permissions, userRole} = usePermissions();

    const [isLoading, setIsLoading] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [availableKids, setAvailableKids] = useState([]);
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

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);

            // Load instructors
            const instructorsQuery = query(collection(db, 'instructors'));
            const instructorsSnapshot = await getDocs(instructorsQuery);
            const instructorsData = instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInstructors(instructorsData);

            // Load kids without teams
            const allKids = await getAllKids();
            const kidsWithoutTeams = allKids.filter(kid => !kid.teamId);
            setAvailableKids(kidsWithoutTeams);

        } catch (error) {
            console.error('Error loading initial data:', error);
            setErrors({general: 'Failed to load form data. Please refresh and try again.'});
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
            const teamId = await addTeam(formData);

            // Navigate to the new team's view page with success message
            navigate(`/admin/teams/view/${teamId}`, {
                state: {
                    message: `🏁 Team "${formData.name}" is ready for action! Let the racing begin! 🏎️`,
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error adding team:', error);
            setErrors({general: 'Failed to add team. Please try again.'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/teams');
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page add-team-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading team setup...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page add-team-page ${appliedTheme}-mode`}>
                {/* Page Title - Outside container */}
                <button
                    onClick={handleCancel}
                    className={`back-button ${appliedTheme}-back-button`}>
                    <ArrowLeft className="btn-icon" size={20}/>
                    Back to Teams
                </button>
                    <div className="page-header">
                        <div className="title-section">
                            <h1>
                                <UsersGroup size={32} className="page-title-icon"/>
                                Create A Team!
                                <Trophy size={24} className="trophy-icon"/>
                            </h1>
                        </div>
                    </div>


                {/* Main Container */}
                <div className="admin-container add-team-container">
                    {/* Racing Theme Header */}
                    <div className="racing-header">
                        <div className="header-content">

                            <div className="title-section">
                                <p className="subtitle">Let's build the ultimate racing squad! 🏁</p>
                            </div>
                        </div>
                    </div>

                    {errors.general && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20}/>
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="add-team-form">
                        {/* Team Info Section */}
                        <div className="form-section team-info-section">
                            <div className="section-header">
                                <Trophy className="section-icon" size={24}/>
                                <h2>🏎️ Team Identity</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Target className="label-icon" size={16}/>
                                            Team Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Thunder Racers, Speed Demons, Lightning Bolts..."
                                            className="form-input"
                                        />
                                        {errors.name && <span className="error-text">{errors.name}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Users className="label-icon" size={16}/>
                                            Max Racers
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={formData.maxCapacity}
                                            onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value) || 15)}
                                            className="form-input"
                                        />
                                        {errors.maxCapacity && <span className="error-text">{errors.maxCapacity}</span>}
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <FileText className="label-icon" size={16}/>
                                            Team Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="What makes this team special? Their racing spirit, teamwork, or special skills..."
                                            className="form-textarea"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Check className="label-icon" size={16}/>
                                            Team Status
                                        </label>
                                        <select
                                            value={formData.active ? 'active' : 'inactive'}
                                            onChange={(e) => handleInputChange('active', e.target.value === 'active')}
                                            className="form-select"
                                        >
                                            <option value="active">✅ Active & Ready to Race</option>
                                            <option value="inactive">⏸️ Inactive (Prep Mode)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructors Section */}
                        <div className="form-section instructors-section">
                            <div className="section-header">
                                <User className="section-icon" size={24}/>
                                <h2>👨‍🏫 Racing Instructors</h2>
                            </div>
                            <div className="instructors-grid">
                                {instructors.length === 0 ? (
                                    <div className="empty-state">
                                        <User className="empty-icon" size={40}/>
                                        <p>No instructors available. Add some instructors first!</p>
                                    </div>
                                ) : (
                                    instructors.map(instructor => (
                                        <div
                                            key={instructor.id}
                                            className={`instructor-card card selectable ${formData.instructorIds.includes(instructor.id) ? 'selected' : ''}`}
                                            onClick={() => handleInstructorToggle(instructor.id)}
                                        >
                                            <div className="card-header">
                                                <User className="card-icon" size={20}/>
                                                <span className="instructor-name card-title">{instructor.name}</span>
                                                {formData.instructorIds.includes(instructor.id) && (
                                                    <Check className="selected-icon" size={16}/>
                                                )}
                                            </div>
                                            {instructor.phone && (
                                                <div className="instructor-details card-body">
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
                                            <Trophy className="label-icon" size={16}/>
                                            Team Leader
                                        </label>
                                        <select
                                            value={formData.teamLeaderId}
                                            onChange={(e) => handleInputChange('teamLeaderId', e.target.value)}
                                            className="form-select"
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

                        {/* Kids Assignment Section */}
                        <div className="form-section kids-section">
                            <div className="section-header">
                                <Baby className="section-icon" size={24}/>
                                <h2>🏎️ Team Racers ({formData.kidIds.length}/{formData.maxCapacity})</h2>
                            </div>

                            {errors.kidIds && (
                                <div className="capacity-warning">
                                    <AlertTriangle size={16}/>
                                    {errors.kidIds}
                                </div>
                            )}

                            <div className="kids-grid">
                                {availableKids.length === 0 ? (
                                    <div className="empty-state">
                                        <Baby className="empty-icon" size={40}/>
                                        <p>All kids are already assigned to teams! 🎉</p>
                                        <small>Add more kids or check existing team assignments.</small>
                                    </div>
                                ) : (
                                    availableKids.map(kid => (
                                        <div
                                            key={kid.id}
                                            className={`kid-card card selectable ${formData.kidIds.includes(kid.id) ? 'selected' : ''}`}
                                            onClick={() => handleKidToggle(kid.id)}
                                        >
                                            <div className="card-header">
                                                <Baby className="card-icon" size={20}/>
                                                <span className="kid-name card-title">
                                                    {kid.personalInfo?.firstName || 'Unknown'} {kid.personalInfo?.lastName || ''}
                                                </span>
                                                {formData.kidIds.includes(kid.id) && (
                                                    <Check className="selected-icon" size={16}/>
                                                )}
                                            </div>
                                            <div className="kid-details card-body">
                                                <div>🏁 #{kid.participantNumber}</div>
                                                {kid.parentInfo?.name && (
                                                    <div>👨‍👩‍👧‍👦 {kid.parentInfo.name}</div>
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
                                <FileText className="section-icon" size={24}/>
                                <h2>📝 Team Notes</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Sparkles className="label-icon" size={16}/>
                                            Special Notes & Strategy
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            placeholder="Team strategy, special requirements, or any other important notes..."
                                            className="form-textarea"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Racing Action Buttons */}
                        <div className="racing-actions">
                            <button type="button" onClick={handleCancel} className="btn btn-cancel">
                                <ArrowLeft className="btn-icon" size={18}/>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-submit racing-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="loading-spinner-mini"></div>
                                        Creating Team...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="btn-icon" size={18}/>
                                        Create Racing Team! 🏁
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

export default AddTeamPage;