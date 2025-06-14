// src/pages/admin/AddKidPage.jsx - Updated for Global Theme System
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import ProtectedField from '../../hooks/ProtectedField';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { addKid, getNextParticipantNumber } from '../../services/kidService';
import { getAllTeams } from '../../services/teamService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
    IconUserCircle as Baby,
    IconPlus as Plus,
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
    IconSparkles as Sparkles
} from '@tabler/icons-react';
import './AddKidPage.css';

const AddKidPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [isLoading, setIsLoading] = useState(false);
    const [teams, setTeams] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [parents, setParents] = useState([]);
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

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [nextNumber, teamsData] = await Promise.all([
                getNextParticipantNumber(),
                getAllTeams({ active: true })
            ]);

            setFormData(prev => ({
                ...prev,
                participantNumber: nextNumber
            }));
            setTeams(teamsData);

            // Load instructors
            const instructorsQuery = query(collection(db, 'instructors'));
            const instructorsSnapshot = await getDocs(instructorsQuery);
            const instructorsData = instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInstructors(instructorsData);

            // Load parents (users with parent role)
            const parentsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'parent')
            );
            const parentsSnapshot = await getDocs(parentsQuery);
            const parentsData = parentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setParents(parentsData);

        } catch (error) {
            console.error('Error loading initial data:', error);
            setErrors({ general: 'Failed to load form data. Please refresh and try again.' });
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
            const kidId = await addKid(formData);

            // Navigate to the new kid's view page with success message
            navigate(`/admin/kids/view/${kidId}`, {
                state: {
                    message: `🎉 ${formData.personalInfo.firstName || 'New kid'} has been added to the race! Welcome to the team! 🏎️`,
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error adding kid:', error);
            setErrors({ general: 'Failed to add kid. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/kids');
    };

    if (!permissions) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page add-kid-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading permissions...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page add-kid-page ${appliedTheme}-mode`}>
                {/* Page Title - Outside container */}
                <h1>
                    <Baby size={32} className="page-title-icon" />
                    Add New Racing Star!
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                {/* Main Container */}
                <div className="admin-container add-kid-container">
                    {/* Racing Theme Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <button onClick={handleCancel} className="back-button">
                                <ArrowLeft className="btn-icon" size={20} />
                                Back to Kids
                            </button>
                            <div className="title-section">
                                <p className="subtitle">Let's get this future champion on the track! 🏁</p>
                            </div>
                        </div>
                    </div>

                    {errors.general && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20} />
                            {errors.general}
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
                                            className="form-select"
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

                        {/* Team Assignment */}
                        <div className="form-section team-section">
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>🏎️ Racing Team Assignment</h2>
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
                                            className="form-select"
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
                                            className="form-select"
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
                                            className="form-select"
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
                                        field="additionalComments"
                                        label="🗒️ Additional Racing Notes"
                                        value={formData.additionalComments}
                                        onChange={(value) => handleInputChange('additionalComments', value)}
                                        placeholder="Any special notes about our new racing star!"
                                        multiline
                                        kidData={formData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Racing Action Buttons */}
                        <div className="racing-actions">
                            <button type="button" onClick={handleCancel} className="btn btn-cancel">
                                <ArrowLeft className="btn-icon" size={18} />
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
                                        Adding Racer...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="btn-icon" size={18} />
                                        Add to Racing Team! 🏁
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

export default AddKidPage;