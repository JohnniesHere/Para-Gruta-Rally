// src/pages/admin/AddKidPage.jsx - Enhanced with Photo Upload - MATCHING EditKidPage UI
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import CreateUserModal from '../../components/modals/CreateUserModal';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { addKid, getNextParticipantNumber } from '../../services/kidService';
import { uploadKidPhoto, validatePhotoFile, resizeImage, getKidPhotoInfo } from '../../services/kidPhotoService';
import { createEmptyKid, validateKid, formStatusOptions } from '../../schemas/kidSchema';
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
    IconSparkles as Sparkles,
    IconUserPlus as UserPlus,
    IconLock as Lock,
    IconCamera as Camera,
    IconUpload as Upload,
    IconX as X,
    IconTrash as Trash2  // ADDED: Import Trash2 for consistency with EditKidPage
} from '@tabler/icons-react';
import './AddKidPage.css'; // CHANGED: Use EditKidPage.css instead of AddKidPage.css

const AddKidPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [isLoading, setIsLoading] = useState(false);
    const [teams, setTeams] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [parents, setParents] = useState([]);
    const [formData, setFormData] = useState(createEmptyKid());
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingError, setLoadingError] = useState(null);

    // Parent selection state
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedParentData, setSelectedParentData] = useState(null);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);

    // Photo upload state
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState('');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            setLoadingError(null);

            // Load participant number first
            try {
                const nextNumber = await getNextParticipantNumber();
                setFormData(prev => ({
                    ...prev,
                    participantNumber: nextNumber
                }));
            } catch (error) {
                console.error('Error loading participant number:', error);
                setFormData(prev => ({
                    ...prev,
                    participantNumber: '001'
                }));
            }

            // Load teams with better error handling
            try {
                console.log('Loading teams...');
                const teamsQuery = collection(db, 'teams');
                const teamsSnapshot = await getDocs(teamsQuery);

                const teamsData = teamsSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(team => team.active !== false);

                console.log('Teams loaded successfully:', teamsData);
                setTeams(teamsData);
            } catch (teamsError) {
                console.error('Error loading teams:', teamsError);
                setTeams([]);
            }

            // Load instructors
            try {
                console.log('Loading instructors...');
                const instructorsQuery = collection(db, 'instructors');
                const instructorsSnapshot = await getDocs(instructorsQuery);
                const instructorsData = instructorsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('Instructors loaded successfully:', instructorsData);
                setInstructors(instructorsData);
            } catch (instructorsError) {
                console.error('Error loading instructors:', instructorsError);
                setInstructors([]);
            }

            // Load parents (users with parent role)
            try {
                console.log('Loading parents...');
                const parentsQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'parent')
                );
                const parentsSnapshot = await getDocs(parentsQuery);
                const parentsData = parentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('Parents loaded successfully:', parentsData);
                setParents(parentsData);
            } catch (parentsError) {
                console.error('Error loading parents:', parentsError);
                setParents([]);
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
            setLoadingError('Some form data failed to load, but you can still create a kid. Please check your internet connection.');
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
        if (fieldErrors[path]) {
            setFieldErrors(prev => ({
                ...prev,
                [path]: false
            }));
        }
        if (errors[path]) {
            setErrors(prev => ({
                ...prev,
                [path]: undefined
            }));
        }
    };

    // Handle photo upload - UPDATED to match EditKidPage
    const handlePhotoSelection = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setPhotoError('');

        try {
            // Basic validation - matching EditKidPage
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setPhotoError('Please upload a JPEG, PNG, or WebP image file.');
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setPhotoError('Photo file size must be less than 5MB.');
                return;
            }

            setSelectedPhoto(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);

            console.log('📸 Photo selected and ready for upload');

        } catch (error) {
            console.error('Error processing photo:', error);
            setPhotoError('Failed to process photo. Please try again.');
        }
    };

    // UPDATED: Remove photo function to match EditKidPage
    const handleRemovePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setPhotoError('');
        // Reset file input
        const fileInput = document.getElementById('photo-upload');
        if (fileInput) fileInput.value = '';
    };

    // Handle parent selection
    const handleParentSelection = (parentId) => {
        if (parentId === 'create_new') {
            if (window.confirm('This will open a form to create a new parent user. Continue?')) {
                setShowCreateUserModal(true);
            }
            setSelectedParentId('');
            return;
        }

        setSelectedParentId(parentId);

        if (parentId) {
            const parent = parents.find(p => p.id === parentId);
            if (parent) {
                setSelectedParentData(parent);
                setFormData(prev => ({
                    ...prev,
                    parentInfo: {
                        ...prev.parentInfo,
                        name: parent.name || parent.displayName || '',
                        email: parent.email || '',
                        phone: parent.phone || '',
                        parentId: parent.id,
                        grandparentsInfo: prev.parentInfo.grandparentsInfo
                    }
                }));
            }
        } else {
            setSelectedParentData(null);
            setFormData(prev => ({
                ...prev,
                parentInfo: {
                    name: '',
                    email: '',
                    phone: '',
                    parentId: '',
                    grandparentsInfo: prev.parentInfo.grandparentsInfo
                }
            }));
        }
    };

    // Handle new user created
    const handleUserCreated = () => {
        setShowCreateUserModal(false);
        loadInitialData();
    };

    const validateForm = () => {
        const validation = validateKid(formData);

        if (!validation.isValid) {
            setErrors(validation.errors);

            // Set field errors for visual indicators
            const newFieldErrors = {};
            Object.keys(validation.errors).forEach(field => {
                newFieldErrors[field] = true;
            });
            setFieldErrors(newFieldErrors);
        }

        return validation.isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // First, create the kid
            const kidId = await addKid(formData);
            console.log('✅ Kid created with ID:', kidId);

            // Upload photo if one was selected
            if (selectedPhoto) {
                try {
                    setIsUploadingPhoto(true);
                    console.log('📸 Uploading photo for kid:', kidId);

                    const photoUrl = await uploadKidPhoto(kidId, selectedPhoto);
                    console.log('✅ Photo uploaded successfully:', photoUrl);

                } catch (photoError) {
                    console.error('⚠️ Photo upload failed:', photoError);
                    // Don't fail the entire operation, just show a warning
                    alert(`Kid was created successfully, but photo upload failed: ${photoError.message}. You can add a photo later by editing the kid.`);
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            // Navigate to the new kid's view page with success message
            const firstName = formData.personalInfo.firstName || 'New racer';
            navigate(`/admin/kids/view/${kidId}`, {
                state: {
                    message: `🎉 ${firstName} has been added to the race! Welcome to the team! 🏎️`,
                    type: 'success'
                }
            });

        } catch (error) {
            console.error('Error adding kid:', error);
            setErrors({ general: error.message || 'Failed to add kid. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/kids');
    };

    // Get dynamic title for the section
    const getSectionTitle = () => {
        const firstName = formData.personalInfo.firstName;
        if (firstName && firstName.trim()) {
            return `🏎️ ${firstName}'s Profile`;
        }
        return `🏎️ Racer Profile`;
    };

    // Get error message for a field
    const getErrorMessage = (fieldPath) => {
        return errors[fieldPath];
    };

    // Check if field has error
    const hasFieldError = (fieldPath) => {
        return fieldErrors[fieldPath] || false;
    };

    // Get photo display info - MATCHES EditKidPage
    const getPhotoDisplay = () => {
        if (photoPreview) {
            return {
                hasPhoto: true,
                url: photoPreview,
                placeholder: null
            };
        }

        // Generate placeholder initials
        const firstName = formData.personalInfo?.firstName || '';
        const lastName = formData.personalInfo?.lastName || '';
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || formData.participantNumber?.charAt(0) || '?';

        return {
            hasPhoto: false,
            url: null,
            placeholder: initials
        };
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

    const photoDisplay = getPhotoDisplay();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page add-kid-page ${appliedTheme}-mode`}>
                {/* Page Title - Outside container */}
                <button
                    onClick={handleCancel}
                    className={`back-button ${appliedTheme}-back-button`}>
                    <ArrowLeft className="btn-icon" size={20} />
                    Back to Kids
                </button>
                <div className="page-header">
                    <div className="title-section">
                        <h1>
                            <Baby size={32} className="page-title-icon" />
                            Add A New Kid
                            <Sparkles size={24} className="sparkle-icon" />
                        </h1>
                    </div>
                </div>
                {/* Main Container */}
                <div className="admin-container add-kid-container">
                    {/* Racing Theme Header */}
                    <div className="racing-header">
                        <div className="header-content">

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

                    {loadingError && (
                        <div className="alert warning-alert">
                            <AlertTriangle size={20} />
                            {loadingError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="add-kid-form">
                        {/* Basic Info Section with Photo - UPDATED TO MATCH EditKidPage */}
                        <div className="form-section racing-section">
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h2>{getSectionTitle()}</h2>
                            </div>
                            <div className="form-grid">
                                {/* Enhanced Photo Upload Section - MATCHING EditKidPage */}
                                <div className="form-group full-width">
                                    <label className="form-label">📸 Racing Photo</label>
                                    <div className="photo-upload-section">
                                        <div className="photo-preview-container">
                                            {/* Photo Display */}
                                            <div className="photo-display-wrapper">
                                                {photoDisplay.hasPhoto ? (
                                                    <img
                                                        src={photoDisplay.url}
                                                        alt="Kid preview"
                                                        className="kid-photo"
                                                    />
                                                ) : (
                                                    <div className="kid-photo-placeholder">
                                                        {photoDisplay.placeholder}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons Below Photo - MATCHING EditKidPage */}
                                            <div className="photo-action-buttons">
                                                <button
                                                    type="button"
                                                    className="photo-action-btn upload-btn"
                                                    onClick={() => document.getElementById('photo-upload').click()}
                                                    title={photoDisplay.hasPhoto ? "Change Photo" : "Upload Photo"}
                                                >
                                                    <Camera size={18} />
                                                    <span className="btn-text">{photoDisplay.hasPhoto ? "Change" : "Upload"}</span>
                                                </button>

                                                {photoDisplay.hasPhoto && (
                                                    <button
                                                        type="button"
                                                        className="photo-action-btn remove-btn"
                                                        onClick={handleRemovePhoto}
                                                        title="Remove Photo"
                                                    >
                                                        <Trash2 size={18} />
                                                        <span className="btn-text">Remove</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handlePhotoSelection}
                                            className="photo-upload-input"
                                            style={{ display: 'none' }}
                                        />

                                        <div className="photo-upload-info">
                                            <p>📸 Upload a racing photo! (Max 5MB, JPEG/PNG)</p>
                                            {photoError && (
                                                <p className="photo-error">{photoError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">🏁 Race Number *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${hasFieldError('participantNumber') ? 'error' : ''}`}
                                        placeholder="001"
                                        value={formData.participantNumber}
                                        onChange={(e) => handleInputChange('participantNumber', e.target.value)}
                                    />
                                    {getErrorMessage('participantNumber') && (
                                        <span className="error-text">{getErrorMessage('participantNumber')}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">👤 First Name *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${hasFieldError('personalInfo.firstName') ? 'error' : ''}`}
                                        placeholder="Future champion's first name"
                                        value={formData.personalInfo.firstName}
                                        onChange={(e) => handleInputChange('personalInfo.firstName', e.target.value)}
                                    />
                                    {getErrorMessage('personalInfo.firstName') && (
                                        <span className="error-text">{getErrorMessage('personalInfo.firstName')}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">👨‍👩‍👧‍👦 Last Name *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${hasFieldError('personalInfo.lastName') ? 'error' : ''}`}
                                        placeholder="Racing family name"
                                        value={formData.personalInfo.lastName}
                                        onChange={(e) => handleInputChange('personalInfo.lastName', e.target.value)}
                                    />
                                    {getErrorMessage('personalInfo.lastName') && (
                                        <span className="error-text">{getErrorMessage('personalInfo.lastName')}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">🎂 Birthday *</label>
                                    <input
                                        type="date"
                                        className={`form-input ${hasFieldError('personalInfo.dateOfBirth') ? 'error' : ''}`}
                                        value={formData.personalInfo.dateOfBirth}
                                        onChange={(e) => handleInputChange('personalInfo.dateOfBirth', e.target.value)}
                                    />
                                    {getErrorMessage('personalInfo.dateOfBirth') && (
                                        <span className="error-text">{getErrorMessage('personalInfo.dateOfBirth')}</span>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">🏠 Home Base Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Where our racer calls home"
                                        value={formData.personalInfo.address}
                                        onChange={(e) => handleInputChange('personalInfo.address', e.target.value)}
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
                                    <label className="form-label">🌟 Amazing Abilities</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Tell us about this racer's awesome skills and abilities!"
                                        value={formData.personalInfo.capabilities}
                                        onChange={(e) => handleInputChange('personalInfo.capabilities', e.target.value)}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">📢 Announcer's Special Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Fun facts to share during the race!"
                                        value={formData.personalInfo.announcersNotes}
                                        onChange={(e) => handleInputChange('personalInfo.announcersNotes', e.target.value)}
                                        rows="3"
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
                                {/* Parent Selection Dropdown */}
                                <div className="form-group full-width">
                                    <label className="form-label">👤 Select Parent/Guardian *</label>
                                    <div className="parent-selection-container">
                                        <select
                                            value={selectedParentId}
                                            onChange={(e) => handleParentSelection(e.target.value)}
                                            className={`form-select ${hasFieldError('parentInfo.parentId') ? 'error' : ''}`}
                                        >
                                            <option value="">🔗 Choose Parent Account</option>
                                            {parents.map(parent => (
                                                <option key={parent.id} value={parent.id}>
                                                    {parent.displayName || parent.name} ({parent.email})
                                                </option>
                                            ))}
                                            <option value="create_new">➕ Create New Parent</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="btn-create-parent"
                                            onClick={() => handleParentSelection('create_new')}
                                        >
                                            <UserPlus size={18} />
                                            Create New Parent
                                        </button>
                                    </div>
                                    {getErrorMessage('parentInfo.parentId') && (
                                        <span className="error-text">{getErrorMessage('parentInfo.parentId')}</span>
                                    )}
                                </div>

                                {/* Parent Info Fields - Show when parent is selected */}
                                {selectedParentData && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">
                                                👤 Parent/Guardian Name *
                                                <Lock size={14} className="lock-icon" />
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input locked"
                                                value={formData.parentInfo.name}
                                                readOnly
                                                disabled
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                📧 Email Address *
                                                <Lock size={14} className="lock-icon" />
                                            </label>
                                            <input
                                                type="email"
                                                className="form-input locked"
                                                value={formData.parentInfo.email}
                                                readOnly
                                                disabled
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                📱 Phone Number *
                                                <Lock size={14} className="lock-icon" />
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-input locked"
                                                value={formData.parentInfo.phone}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Manual Entry Fields - Show when no parent is selected */}
                                {!selectedParentData && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">👤 Parent/Guardian Name *</label>
                                            <input
                                                type="text"
                                                className={`form-input ${hasFieldError('parentInfo.name') ? 'error' : ''}`}
                                                placeholder="Racing coach's name"
                                                value={formData.parentInfo.name}
                                                onChange={(e) => handleInputChange('parentInfo.name', e.target.value)}
                                            />
                                            {getErrorMessage('parentInfo.name') && (
                                                <span className="error-text">{getErrorMessage('parentInfo.name')}</span>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">📧 Email Address *</label>
                                            <input
                                                type="email"
                                                className={`form-input ${hasFieldError('parentInfo.email') ? 'error' : ''}`}
                                                placeholder="parent@racingfamily.com"
                                                value={formData.parentInfo.email}
                                                onChange={(e) => handleInputChange('parentInfo.email', e.target.value)}
                                            />
                                            {getErrorMessage('parentInfo.email') && (
                                                <span className="error-text">{getErrorMessage('parentInfo.email')}</span>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">📱 Phone Number *</label>
                                            <input
                                                type="tel"
                                                className={`form-input ${hasFieldError('parentInfo.phone') ? 'error' : ''}`}
                                                placeholder="Racing hotline"
                                                value={formData.parentInfo.phone}
                                                onChange={(e) => handleInputChange('parentInfo.phone', e.target.value)}
                                            />
                                            {getErrorMessage('parentInfo.phone') && (
                                                <span className="error-text">{getErrorMessage('parentInfo.phone')}</span>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Grandparents Info - Always editable */}
                                <div className="form-group">
                                    <label className="form-label">👵👴 Grandparents Names</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Racing legends in the family"
                                        value={formData.parentInfo.grandparentsInfo.names}
                                        onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.names', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">☎️ Grandparents Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Backup racing support"
                                        value={formData.parentInfo.grandparentsInfo.phone}
                                        onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.phone', e.target.value)}
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
                                            {formStatusOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.signedDeclaration}
                                            onChange={(e) => handleInputChange('signedDeclaration', e.target.checked)}
                                        />
                                        🛡️ Racing Safety Declaration Signed
                                    </label>
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
                                    <label className="form-label">🗒️ Additional Racing Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Any special notes about our new racing star!"
                                        value={formData.additionalComments}
                                        onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                                        rows="3"
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
                                disabled={isSubmitting || isUploadingPhoto}
                                className="btn btn-submit racing-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="loading-spinner-mini"></div>
                                        {isUploadingPhoto ? 'Uploading Photo...' : 'Adding Racer...'}
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

                {/* Create User Modal */}
                <CreateUserModal
                    isOpen={showCreateUserModal}
                    onClose={() => setShowCreateUserModal(false)}
                    onUserCreated={handleUserCreated}
                />
            </div>
        </Dashboard>
    );
};

export default AddKidPage;