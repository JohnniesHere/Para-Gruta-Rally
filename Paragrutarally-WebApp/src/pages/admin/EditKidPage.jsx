// src/pages/admin/EditKidPage.jsx - Fun Racing Theme Edit Kid Form
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import ProtectedField from '../../hooks/ProtectedField';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getKidById, updateKid } from '../../services/kidService';
import { getAllTeams } from '../../services/teamService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
    IconUserCircle as Baby,
    IconDeviceFloppy as Save,
    IconArrowLeft as ArrowLeft,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconCar as Car,
    IconUser as User,
    IconUsers as Users,
    IconHeart as Heart,
    IconPhone as Phone,
    IconMail as Mail,
    IconMapPin as MapPin,
    IconCalendar as Calendar,
    IconNotes as FileText,
    IconSparkles as Sparkles,
    IconEdit as Edit
} from '@tabler/icons-react';
import './AddKidPage.css'; // Reuse the same CSS

const EditKidPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [isLoading, setIsLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [parents, setParents] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
        participantNumber: '',
        personalInfo: {
            address: '',
            dateOfBirth: '',
            capabilities: '',
            announcersNotes: '',
            photo: ''
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
        comments: {
            parent: '',
            organization: '',
            teamLeader: '',
            familyContact: ''
        },
        instructorId: '',
        teamId: '',
        vehicleIds: [],
        signedDeclaration: false,
        signedFormStatus: 'Pending',
        additionalComments: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusTeam, setFocusTeam] = useState(false);

    useEffect(() => {
        // Check if we should focus on team assignment
        if (location.state?.focusTeam) {
            setFocusTeam(true);
        }
        loadKidData();
    }, [id]);

    const loadKidData = async () => {
        try {
            setIsLoading(true);

            // Load kid data
            const kidData = await getKidById(id);
            if (!kidData) {
                setErrors({ general: 'Kid not found!' });
                return;
            }

            // Check permissions
            if (!permissions?.canViewKid(kidData)) {
                setErrors({ general: 'You do not have permission to view this kid.' });
                return;
            }

            setOriginalData(kidData);
            setFormData(kidData);

            // Load supporting data
            const [teamsData, instructorsData, parentsData] = await Promise.all([
                getAllTeams({ active: true }),
                getDocs(query(collection(db, 'instructors'))),
                getDocs(query(collection(db, 'users'), where('role', '==', 'parent')))
            ]);

            setTeams(teamsData);
            setInstructors(instructorsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setParents(parentsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error('Error loading kid data:', error);
            setErrors({ general: 'Failed to load kid data. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (path, value) => {
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

            current[keys[keys.length - 1]] = value;
            return newData;
        });

        // Clear specific error when user starts typing
        if (errors[path]) {
            setErrors(prev => ({
                ...prev,
                [path]: undefined
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required field validations
        if (!formData.participantNumber) {
            newErrors.participantNumber = 'Participant number is required';
        }

        if (!formData.personalInfo.dateOfBirth) {
            newErrors['personalInfo.dateOfBirth'] = 'Date of birth is required';
        }

        if (!formData.parentInfo.name) {
            newErrors['parentInfo.name'] = 'Parent name is required';
        }

        if (!formData.parentInfo.email) {
            newErrors['parentInfo.email'] = 'Parent email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.parentInfo.email)) {
            newErrors['parentInfo.email'] = 'Please enter a valid email address';
        }

        if (!formData.parentInfo.phone) {
            newErrors['parentInfo.phone'] = 'Parent phone is required';
        }

        // Validate date of birth
        if (formData.personalInfo.dateOfBirth) {
            const birthDate = new Date(formData.personalInfo.dateOfBirth);
            const today = new Date();
            if (birthDate >= today) {
                newErrors['personalInfo.dateOfBirth'] = 'Date of birth must be in the past';
            }
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
            await updateKid(id, formData);

            // Navigate back with success message
            navigate(`/admin/kids/view/${id}`, {
                state: {
                    message: `🎉 ${formData.personalInfo?.firstName || 'Racer'} has been updated successfully! 🏎️`,
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error updating kid:', error);
            setErrors({ general: 'Failed to update kid. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/kids');
    };

    const hasChanges = () => {
        return JSON.stringify(formData) !== JSON.stringify(originalData);
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`add-kid-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading racer data...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (errors.general && !originalData) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`add-kid-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>Error</h3>
                        <p>{errors.general}</p>
                        <button onClick={() => navigate('/admin/kids')} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            Back to Kids
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`add-kid-page ${appliedTheme}-mode`}>
                {/* Racing Theme Header */}
                <div className="racing-header">
                    <div className="header-content">
                        <button onClick={handleCancel} className="back-button">
                            <ArrowLeft className="btn-icon" size={20} />
                            Back to Kids
                        </button>
                        <div className="title-section">
                            <h1>
                                <Edit size={32} className="page-title-icon" />
                                Update Racing Star!
                                <Sparkles size={24} className="sparkle-icon" />
                            </h1>
                            <p className="subtitle">Let's keep this champion's info up to date! 🏁</p>
                        </div>
                    </div>
                </div>

                <div className="add-kid-container">
                    {errors.general && (
                        <div className="error-alert">
                            <AlertTriangle size={20} />
                            {errors.general}
                        </div>
                    )}

                    {!hasChanges() && (
                        <div className="info-alert">
                            <Check size={20} />
                            You're viewing {formData.personalInfo?.firstName || 'this racer'}'s current information. Make changes below to update! 🏎️
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="add-kid-form">
                        {/* Basic Info Section */}
                        <div className="form-section racing-section">
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h2>🏎️ Racer Profile</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <ProtectedField
                                        field="participantNumber"
                                        label="🏁 Race Number"
                                        value={formData.participantNumber}
                                        onChange={(value) => handleInputChange('participantNumber', value)}
                                        placeholder="001"
                                        kidData={formData}
                                    />
                                    {errors.participantNumber && <span className="error-text">{errors.participantNumber}</span>}
                                </div>

                                <div className="form-group">
                                    <ProtectedField
                                        field="personalInfo.dateOfBirth"
                                        label="🎂 Birthday"
                                        type="date"
                                        value={formData.personalInfo.dateOfBirth}
                                        onChange={(value) => handleInputChange('personalInfo.dateOfBirth', value)}
                                        kidData={formData}
                                    />
                                    {errors['personalInfo.dateOfBirth'] && <span className="error-text">{errors['personalInfo.dateOfBirth']}</span>}
                                </div>

                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="personalInfo.address"
                                        label="🏠 Home Base Location"
                                        value={formData.personalInfo.address}
                                        onChange={(value) => handleInputChange('personalInfo.address', value)}
                                        placeholder="Where our racer calls home"
                                        kidData={formData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Capabilities Section */}
                        <div className="form-section skills-section">
                            <div className="section-header">
                                <Sparkles className="section-icon" size={24} />
                                <h2>💪 Super Powers & Skills</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="personalInfo.capabilities"
                                        label="🌟 Amazing Abilities"
                                        value={formData.personalInfo.capabilities}
                                        onChange={(value) => handleInputChange('personalInfo.capabilities', value)}
                                        placeholder="Tell us about this racer's awesome skills and abilities!"
                                        multiline
                                        kidData={formData}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="personalInfo.announcersNotes"
                                        label="📢 Announcer's Special Notes"
                                        value={formData.personalInfo.announcersNotes}
                                        onChange={(value) => handleInputChange('personalInfo.announcersNotes', value)}
                                        placeholder="Fun facts to share during the race!"
                                        multiline
                                        kidData={formData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parent Information */}
                        <div className="form-section parent-section">
                            <div className="section-header">
                                <Heart className="section-icon" size={24} />
                                <h2>👨‍👩‍👧‍👦 Racing Family Info</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <ProtectedField
                                        field="parentInfo.name"
                                        label="👤 Parent/Guardian Name"
                                        value={formData.parentInfo.name}
                                        onChange={(value) => handleInputChange('parentInfo.name', value)}
                                        placeholder="Racing coach's name"
                                        kidData={formData}
                                    />
                                    {errors['parentInfo.name'] && <span className="error-text">{errors['parentInfo.name']}</span>}
                                </div>

                                <div className="form-group">
                                    <ProtectedField
                                        field="parentInfo.email"
                                        label="📧 Email Address"
                                        type="email"
                                        value={formData.parentInfo.email}
                                        onChange={(value) => handleInputChange('parentInfo.email', value)}
                                        placeholder="parent@racingfamily.com"
                                        kidData={formData}
                                    />
                                    {errors['parentInfo.email'] && <span className="error-text">{errors['parentInfo.email']}</span>}
                                </div>

                                <div className="form-group">
                                    <ProtectedField
                                        field="parentInfo.phone"
                                        label="📱 Phone Number"
                                        type="tel"
                                        value={formData.parentInfo.phone}
                                        onChange={(value) => handleInputChange('parentInfo.phone', value)}
                                        placeholder="Racing hotline"
                                        kidData={formData}
                                    />
                                    {errors['parentInfo.phone'] && <span className="error-text">{errors['parentInfo.phone']}</span>}
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <User className="label-icon" size={16} />
                                            Link to Parent Account
                                        </label>
                                        <select
                                            value={formData.parentInfo.parentId}
                                            onChange={(e) => handleInputChange('parentInfo.parentId', e.target.value)}
                                            className="form-select racing-select"
                                        >
                                            <option value="">🔗 Choose Parent Account (Optional)</option>
                                            {parents.map(parent => (
                                                <option key={parent.id} value={parent.id}>
                                                    {parent.displayName || parent.name} ({parent.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <ProtectedField
                                        field="parentInfo.grandparentsInfo.names"
                                        label="👵👴 Grandparents Names"
                                        value={formData.parentInfo.grandparentsInfo.names}
                                        onChange={(value) => handleInputChange('parentInfo.grandparentsInfo.names', value)}
                                        placeholder="Racing legends in the family"
                                        kidData={formData}
                                    />
                                </div>

                                <div className="form-group">
                                    <ProtectedField
                                        field="parentInfo.grandparentsInfo.phone"
                                        label="☎️ Grandparents Phone"
                                        type="tel"
                                        value={formData.parentInfo.grandparentsInfo.phone}
                                        onChange={(value) => handleInputChange('parentInfo.grandparentsInfo.phone', value)}
                                        placeholder="Backup racing support"
                                        kidData={formData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Team Assignment - Highlighted if focusTeam */}
                        <div className={`form-section team-section ${focusTeam ? 'highlight-section' : ''}`}>
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>🏎️ Racing Team Assignment {focusTeam && <span className="focus-indicator">← Update Here!</span>}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Users className="label-icon" size={16} />
                                            Racing Team
                                        </label>
                                        <select
                                            value={formData.teamId}
                                            onChange={(e) => handleInputChange('teamId', e.target.value)}
                                            className={`form-select racing-select ${focusTeam ? 'focus-field' : ''}`}
                                        >
                                            <option value="">🚫 No Team Assigned (Yet!)</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>
                                                    🏁 {team.name} ({team.kidIds?.length || 0} racers)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <User className="label-icon" size={16} />
                                            Racing Instructor
                                        </label>
                                        <select
                                            value={formData.instructorId}
                                            onChange={(e) => handleInputChange('instructorId', e.target.value)}
                                            className="form-select racing-select"
                                        >
                                            <option value="">👨‍🏫 No Instructor Assigned</option>
                                            {instructors.map(instructor => (
                                                <option key={instructor.id} value={instructor.id}>
                                                    🏎️ {instructor.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Racing Status */}
                        <div className="form-section status-section">
                            <div className="section-header">
                                <Check className="section-icon" size={24} />
                                <h2>📋 Racing Status & Forms</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <FileText className="label-icon" size={16} />
                                            Form Status
                                        </label>
                                        <select
                                            value={formData.signedFormStatus}
                                            onChange={(e) => handleInputChange('signedFormStatus', e.target.value)}
                                            className="form-select racing-select"
                                        >
                                            <option value="Pending">⏳ Pending - Getting Ready</option>
                                            <option value="Completed">✅ Completed - Ready to Race!</option>
                                            <option value="Needs Review">🔍 Needs Review</option>
                                            <option value="Cancelled">❌ Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <ProtectedField
                                        field="signedDeclaration"
                                        label="Racing Safety Declaration"
                                        type="checkbox"
                                        value={formData.signedDeclaration}
                                        onChange={(value) => handleInputChange('signedDeclaration', value)}
                                        placeholder="Parent has signed the racing safety agreement 🛡️"
                                        kidData={formData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="form-section comments-section">
                            <div className="section-header">
                                <FileText className="section-icon" size={24} />
                                <h2>💬 Racing Notes & Comments</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="comments.parent"
                                        label="👨‍👩‍👧‍👦 Parent Comments"
                                        value={formData.comments.parent}
                                        onChange={(value) => handleInputChange('comments.parent', value)}
                                        placeholder="Comments from the racing family"
                                        multiline
                                        kidData={formData}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="comments.organization"
                                        label="🏢 Organization Comments"
                                        value={formData.comments.organization}
                                        onChange={(value) => handleInputChange('comments.organization', value)}
                                        placeholder="Comments from race organizers"
                                        multiline
                                        kidData={formData}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="comments.teamLeader"
                                        label="👨‍🏫 Team Leader Comments"
                                        value={formData.comments.teamLeader}
                                        onChange={(value) => handleInputChange('comments.teamLeader', value)}
                                        placeholder="Comments from team leader"
                                        multiline
                                        kidData={formData}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <ProtectedField
                                        field="additionalComments"
                                        label="🗒️ Additional Racing Notes"
                                        value={formData.additionalComments}
                                        onChange={(value) => handleInputChange('additionalComments', value)}
                                        placeholder="Any special notes about our racing star!"
                                        multiline
                                        kidData={formData}
                                    />
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
                                        Updating Racer...
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

export default EditKidPage;