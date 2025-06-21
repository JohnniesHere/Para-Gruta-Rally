// src/pages/admin/EditKidPage.jsx - FIXED VERSION with updated instructors query
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import CreateUserModal from '../../components/modals/CreateUserModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getKidById, updateKid } from '../../services/kidService';
import { uploadKidPhoto, deleteKidPhoto, getKidPhotoInfo } from '../../services/kidPhotoService';
import { getAllTeams, getAllInstructors } from '../../services/teamService'; // Updated import
import { getAllVehicles, updateVehicle, getVehicleById } from '../../services/vehicleService';
import { getVehiclePhotoInfo } from '../../services/vehiclePhotoService';
import { validateKid, formStatusOptions } from '../../schemas/kidSchema';
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
    IconEdit as Edit,
    IconCamera as Camera,
    IconX as X,
    IconLock as Lock,
    IconPlus as Plus,
    IconSend as Send,
    IconMessage as MessageCircle,
    IconTrash as Trash2,
    IconSettings as Settings,
    IconBattery as Battery
} from '@tabler/icons-react';
import { updateKidVehicleAssignments } from '../../services/vehicleAssignmentService';

const EditKidPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { permissions, userRole, userData } = usePermissions();

    const [isLoading, setIsLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [parents, setParents] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
        participantNumber: '',
        personalInfo: {
            firstName: '',
            lastName: '',
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
        signedFormStatus: 'pending',
        additionalComments: '',
        instructorsComments: []
    });
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusTeam, setFocusTeam] = useState(false);

    // Photo upload state
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState('');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Notes section state
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [showAddComment, setShowAddComment] = useState(false);

    useEffect(() => {
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
                setErrors({ general: t('editKid.kidNotFound', 'Kid not found!') });
                return;
            }

            // Check permissions (simplified for now)
            if (userRole !== 'admin' && userRole !== 'instructor') {
                setErrors({ general: t('editKid.noPermission', 'You do not have permission to edit this kid.') });
                return;
            }

            setOriginalData(kidData);
            setFormData(kidData);

            // Set photo preview if exists
            const photoInfo = getKidPhotoInfo(kidData);
            if (photoInfo.hasPhoto) {
                setPhotoPreview(photoInfo.url);
            }

            // Load supporting data - FIXED: Use getAllInstructors instead of manual query
            const [teamsData, vehiclesData, instructorsData, parentsData] = await Promise.all([
                getAllTeams({ active: true }),
                getAllVehicles(),
                getAllInstructors(), // FIXED: Use the service function instead of manual query
                getDocs(query(collection(db, 'users'), where('role', '==', 'parent')))
            ]);

            setTeams(teamsData);
            setVehicles(vehiclesData);

            // Filter available vehicles (active and not assigned to other kids)
            const available = vehiclesData.filter(vehicle =>
                vehicle.active &&
                (!vehicle.currentKidId || vehicle.currentKidId === id)
            );
            setAvailableVehicles(available);

            // FIXED: instructorsData is already formatted by getAllInstructors()
            setInstructors(instructorsData);
            setParents(parentsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            console.log('✅ Loaded instructors:', instructorsData.length);
            console.log('✅ Loaded teams:', teamsData.length);
            console.log('✅ Loaded vehicles:', vehiclesData.length);

        } catch (error) {
            console.error('Error loading kid data:', error);
            setErrors({ general: t('editKid.loadError', 'Failed to load kid data. Please try again.') });
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

    // Vehicle assignment handlers
    const handleVehicleAssignment = async (vehicleId) => {
        try {
            if (!vehicleId) {
                // Remove vehicle assignment
                setFormData(prev => ({
                    ...prev,
                    vehicleIds: []
                }));
                return;
            }

            // Assign vehicle (replace existing assignment for now)
            setFormData(prev => ({
                ...prev,
                vehicleIds: [vehicleId]
            }));

        } catch (error) {
            console.error('Error handling vehicle assignment:', error);
            alert(t('editKid.vehicleAssignmentError', 'Failed to update vehicle assignment. Please try again.'));
        }
    };

    // Get assigned vehicle data
    const getAssignedVehicle = () => {
        if (!formData.vehicleIds || formData.vehicleIds.length === 0) return null;
        return vehicles.find(v => v.id === formData.vehicleIds[0]);
    };

    // Enhanced photo handling with old photo cleanup
    const handlePhotoSelection = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setPhotoError('');

        try {
            // Basic validation
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setPhotoError(t('editKid.photoUploadError.invalidType', 'Please upload a JPEG, PNG, or WebP image file.'));
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setPhotoError(t('editKid.photoUploadError.tooLarge', 'Photo file size must be less than 5MB.'));
                return;
            }

            setSelectedPhoto(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Error processing photo:', error);
            setPhotoError(t('editKid.photoUploadError.processingFailed', 'Failed to process photo. Please try again.'));
        }
    };

    const handleRemovePhoto = async () => {
        try {
            // Delete old photo from storage if it exists
            if (formData.personalInfo?.photo) {
                console.log('🗑️ Deleting old photo from storage...');
                await deleteKidPhoto(id, formData.personalInfo.photo);
                console.log('✅ Old photo deleted successfully');
            }

            // Update form data to remove photo
            setFormData(prev => ({
                ...prev,
                personalInfo: {
                    ...prev.personalInfo,
                    photo: ''
                }
            }));

            // Clear local state
            setSelectedPhoto(null);
            setPhotoPreview(null);
            setPhotoError('');

            // Clear file input
            const fileInput = document.getElementById('photo-upload');
            if (fileInput) fileInput.value = '';

            console.log('✅ Photo removed successfully');

        } catch (error) {
            console.error('❌ Error removing photo:', error);
            setPhotoError(t('editKid.photoError', 'Failed to remove photo. Please try again.'));
        }
    };

    // Notes handling
    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setIsAddingComment(true);
        try {
            const timestamp = new Date().toISOString();
            const commentData = {
                text: newComment.trim(),
                author: userData?.name || userData?.email || 'Unknown User',
                authorRole: userRole,
                timestamp: timestamp
            };

            const updatedComments = [...(formData.instructorsComments || []), commentData];

            setFormData(prev => ({
                ...prev,
                instructorsComments: updatedComments
            }));

            // Auto-save the comment
            await updateKid(id, {
                ...formData,
                instructorsComments: updatedComments
            });

            setNewComment('');
            setShowAddComment(false);

        } catch (error) {
            console.error('Error adding comment:', error);
            alert(t('editKid.commentError', 'Failed to add comment. Please try again.'));
        } finally {
            setIsAddingComment(false);
        }
    };

    // SIMPLIFIED: Just validate and save - no change detection
    const validateForm = () => {
        const validation = validateKid(formData);

        if (!validation.isValid) {
            setErrors(validation.errors);
            const newFieldErrors = {};
            Object.keys(validation.errors).forEach(field => {
                newFieldErrors[field] = true;
            });
            setFieldErrors(newFieldErrors);
            alert(t('editKid.validation.fixErrors', 'Please fix the following errors:') + '\n' + Object.values(validation.errors).join('\n'));
        } else {
            setErrors({});
            setFieldErrors({});
        }

        return validation.isValid;
    };

    // Update vehicle assignments using the new service
    const updateVehicleAssignments = async (newVehicleIds, oldVehicleIds) => {
        try {
            const kidName = `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim();
            const assignedBy = userData?.name || userData?.email || 'Unknown User';

            await updateKidVehicleAssignments(
                id,
                kidName,
                assignedBy,
                newVehicleIds,
                oldVehicleIds
            );
        } catch (error) {
            console.error('Error updating vehicle assignments:', error);
            throw error;
        }
    };

    // SIMPLIFIED: Submit function with vehicle integration
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate the form first
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        let finalFormData = { ...formData };

        try {
            // Upload photo if one was selected
            if (selectedPhoto) {
                try {
                    setIsUploadingPhoto(true);

                    // Delete old photo first if it exists
                    if (formData.personalInfo?.photo) {
                        console.log('🗑️ Deleting old photo before uploading new one...');
                        try {
                            await deleteKidPhoto(id, formData.personalInfo.photo);
                            console.log('✅ Old photo deleted successfully');
                        } catch (deleteError) {
                            console.warn('⚠️ Failed to delete old photo:', deleteError.message);
                            // Continue with upload even if old photo deletion fails
                        }
                    }

                    // Upload new photo
                    console.log('📷 Uploading new photo...');
                    const photoUrl = await uploadKidPhoto(id, selectedPhoto);
                    finalFormData = {
                        ...finalFormData,
                        personalInfo: {
                            ...finalFormData.personalInfo,
                            photo: photoUrl
                        }
                    };
                    console.log('✅ New photo uploaded successfully:', photoUrl);
                } catch (photoError) {
                    console.error('❌ Photo upload failed:', photoError);
                    alert(t('editKid.photoUploadError', 'Photo upload failed: {error}. The kid will be updated without the new photo.', { error: photoError.message }));
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            // Update vehicle assignments
            const oldVehicleIds = originalData?.vehicleIds || [];
            const newVehicleIds = finalFormData.vehicleIds || [];

            if (JSON.stringify(oldVehicleIds.sort()) !== JSON.stringify(newVehicleIds.sort())) {
                console.log('🚗 Updating vehicle assignments...');
                await updateVehicleAssignments(newVehicleIds, oldVehicleIds);
                console.log('✅ Vehicle assignments updated successfully');
            }

            // Update the kid
            await updateKid(id, finalFormData);

            // Navigate with success message
            const firstName = finalFormData.personalInfo?.firstName;
            const successMessage = firstName
                ? t('editKid.updateSuccess', '🎉 {firstName} has been updated successfully! 🏎️', { firstName })
                : t('editKid.updateSuccessGeneric', '🎉 Racer has been updated successfully! 🏎️');

            navigate(`/admin/kids/view/${id}`, {
                state: {
                    message: successMessage,
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error updating kid:', error);
            setErrors({ general: t('editKid.updateError', 'Failed to update kid: {error}', { error: error.message }) });
            alert(t('editKid.updateError', 'Failed to update kid: {error}', { error: error.message }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(`/admin/kids/view/${id}`);
    };

    // Get photo display info
    const getPhotoDisplay = () => {
        if (photoPreview) {
            return {
                hasPhoto: true,
                url: photoPreview,
                placeholder: null
            };
        }

        const firstName = formData.personalInfo?.firstName || '';
        const lastName = formData.personalInfo?.lastName || '';
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || formData.participantNumber?.charAt(0) || '?';

        return {
            hasPhoto: false,
            url: null,
            placeholder: initials
        };
    };

    // Get vehicle display component for assignment section
    const getVehicleAssignmentDisplay = () => {
        const assignedVehicle = getAssignedVehicle();

        return (
            <div className="vehicle-assignment-section">
                <div className="vehicle-assignment-header">
                    <Settings size={20} />
                    <h4>{t('editKid.racingVehicleAssignment', 'Racing Vehicle Assignment')}</h4>
                </div>

                <div className="vehicle-selection">
                    <label className="form-label">
                        <Car className="label-icon" size={16} />
                        {t('editKid.assignedVehicle', 'Assigned Vehicle')}
                    </label>
                    <select
                        value={formData.vehicleIds[0] || ''}
                        onChange={(e) => handleVehicleAssignment(e.target.value)}
                        className="form-select vehicle-select"
                    >
                        <option value="">{t('editKid.noVehicleAssigned', '🚫 No Vehicle Assigned')}</option>
                        {availableVehicles.map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>
                                {t('editKid.vehicleOption', '🏎️ {make} {model} ({licensePlate})', {
                                    make: vehicle.make,
                                    model: vehicle.model,
                                    licensePlate: vehicle.licensePlate
                                })}
                            </option>
                        ))}
                    </select>
                </div>

                {assignedVehicle && (
                    <div className="assigned-vehicle-preview">
                        <h5>{t('editKid.currentAssignment', 'Current Assignment:')}</h5>
                        <div className="vehicle-preview-card">
                            <div className="vehicle-preview-photo">
                                {(() => {
                                    const vehiclePhotoInfo = getVehiclePhotoInfo(assignedVehicle);
                                    return vehiclePhotoInfo.hasPhoto ? (
                                        <img
                                            src={vehiclePhotoInfo.url}
                                            alt={`${assignedVehicle.make} ${assignedVehicle.model}`}
                                            className="vehicle-preview-img"
                                        />
                                    ) : (
                                        <div className="vehicle-preview-placeholder">
                                            {vehiclePhotoInfo.placeholder}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="vehicle-preview-details">
                                <h6>{assignedVehicle.make} {assignedVehicle.model}</h6>
                                <div className="vehicle-preview-info">
                                    <span className="license-plate">{assignedVehicle.licensePlate}</span>
                                    <div className="battery-info">
                                        <Battery size={14} />
                                        <span>{assignedVehicle.batteryType || 'N/A'}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/vehicles/view/${assignedVehicle.id}`)}
                                    className="btn-preview-vehicle"
                                >
                                    <Settings size={14} />
                                    {t('editKid.viewVehicleDetails', 'View Vehicle Details')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Get error message for a field
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
                <div className={`admin-page add-kid-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('editKid.loadingRacerData', 'Loading racer data...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (errors.general && !originalData) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page add-kid-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('editKid.error', 'Error')}</h3>
                        <p>{errors.general}</p>
                        <button onClick={() => navigate('/admin/kids')} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            {t('editKid.backToKids', 'Back to Kids')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const photoDisplay = getPhotoDisplay();
    const firstName = formData.personalInfo?.firstName;

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page add-kid-page ${appliedTheme}-mode`}>
                {/* Page Title */}
                <button onClick={handleCancel} className={`back-button ${appliedTheme}-back-button`}>
                    <ArrowLeft className="btn-icon" size={20} />
                    {t('editKid.backToProfile', 'Back to Profile')}
                </button>
                <div className="page-header">
                    <div className="title-section">
                        <h1>
                            <Edit size={32} className="page-title-icon" />
                            {firstName
                                ? t('editKid.title', 'Update {firstName}\'s Info!', { firstName })
                                : t('editKid.titleGeneric', 'Update Racer\'s Info!')
                            }
                            <Sparkles size={24} className="sparkle-icon" />
                        </h1>
                    </div>
                </div>

                <div className="add-kid-container">
                    {errors.general && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20} />
                            {errors.general}
                        </div>
                    )}

                    {!firstName ? (
                        <div className="alert info-alert">
                            <Check size={20} />
                            {t('editKid.editingInfoGeneric', 'You\'re editing this racer\'s information. Make changes below to update! 🏎️')}
                        </div>
                    ) : (
                        <div className="alert info-alert">
                            <Check size={20} />
                            {t('editKid.editingInfo', 'You\'re editing {firstName}\'s information. Make changes below to update! 🏎️', { firstName })}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="add-kid-form">
                        {/* Basic Info Section with Photo */}
                        <div className="form-section racing-section">
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h2>{t('editKid.racerProfile', '🏎️ Racer Profile')}</h2>
                            </div>
                            <div className="form-grid">
                                {/* Enhanced Photo Upload Section */}
                                <div className="form-group full-width">
                                    <label className="form-label">{t('editKid.racingPhoto', '📸 Racing Photo')}</label>
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

                                            {/* Action Buttons Below Photo */}
                                            <div className="photo-action-buttons">
                                                <button
                                                    type="button"
                                                    className="photo-action-btn upload-btn"
                                                    onClick={() => document.getElementById('photo-upload').click()}
                                                    title={photoDisplay.hasPhoto ? t('editKid.changePhoto', 'Change Photo') : t('editKid.uploadPhoto', 'Upload Photo')}
                                                >
                                                    <Camera size={18} />
                                                    <span className="btn-text">
                                                        {photoDisplay.hasPhoto ? t('editKid.changePhoto', 'Change') : t('editKid.uploadPhoto', 'Upload')}
                                                    </span>
                                                </button>

                                                {photoDisplay.hasPhoto && (
                                                    <button
                                                        type="button"
                                                        className="photo-action-btn remove-btn"
                                                        onClick={handleRemovePhoto}
                                                        title={t('editKid.removePhoto', 'Remove Photo')}
                                                    >
                                                        <Trash2 size={18} />
                                                        <span className="btn-text">{t('editKid.removePhoto', 'Remove')}</span>
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
                                            <p>{t('editKid.photoRequirements', '📸 Update racing photo! (Max 5MB, JPEG/PNG)')}</p>
                                            {photoError && (
                                                <p className="photo-error">{photoError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editKid.raceNumber', '🏁 Race Number')} {t('editKid.required', '*')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${hasFieldError('participantNumber') ? 'error' : ''}`}
                                        placeholder={t('editKid.raceNumberPlaceholder', '001')}
                                        value={formData.participantNumber}
                                        onChange={(e) => handleInputChange('participantNumber', e.target.value)}
                                    />
                                    {getErrorMessage('participantNumber') && (
                                        <span className="error-text">{getErrorMessage('participantNumber')}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editKid.firstName', '👤 First Name')} {t('editKid.required', '*')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${hasFieldError('personalInfo.firstName') ? 'error' : ''}`}
                                        placeholder={t('editKid.firstNamePlaceholder', 'Future champion\'s first name')}
                                        value={formData.personalInfo.firstName}
                                        onChange={(e) => handleInputChange('personalInfo.firstName', e.target.value)}
                                    />
                                    {getErrorMessage('personalInfo.firstName') && (
                                        <span className="error-text">{getErrorMessage('personalInfo.firstName')}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editKid.lastName', '👨‍👩‍👧‍👦 Last Name')} {t('editKid.required', '*')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${hasFieldError('personalInfo.lastName') ? 'error' : ''}`}
                                        placeholder={t('editKid.lastNamePlaceholder', 'Racing family name')}
                                        value={formData.personalInfo.lastName}
                                        onChange={(e) => handleInputChange('personalInfo.lastName', e.target.value)}
                                    />
                                    {getErrorMessage('personalInfo.lastName') && (
                                        <span className="error-text">{getErrorMessage('personalInfo.lastName')}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editKid.birthday', '🎂 Birthday')} {t('editKid.required', '*')}</label>
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
                                    <label className="form-label">{t('editKid.homeBaseLocation', '🏠 Home Base Location')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('editKid.homeBaseLocationPlaceholder', 'Where our racer calls home')}
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
                                <h2>{t('editKid.superPowersSkills', '💪 Super Powers & Skills')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">{t('editKid.amazingAbilities', '🌟 Amazing Abilities')}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={t('editKid.amazingAbilitiesPlaceholder', 'Tell us about this racer\'s awesome skills and abilities!')}
                                        value={formData.personalInfo.capabilities}
                                        onChange={(e) => handleInputChange('personalInfo.capabilities', e.target.value)}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">{t('editKid.announcerNotes', '📢 Announcer\'s Special Notes')}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={t('editKid.announcerNotesPlaceholder', 'Fun facts to share during the race!')}
                                        value={formData.personalInfo.announcersNotes}
                                        onChange={(e) => handleInputChange('personalInfo.announcersNotes', e.target.value)}
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parent Information - LOCKED */}
                        <div className="form-section parent-section">
                            <div className="section-header">
                                <Heart className="section-icon" size={24} />
                                <h2>{t('editKid.racingFamilyInfo', '👨‍👩‍👧‍👦 Racing Family Info')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        {t('editKid.parentGuardianName', '👤 Parent/Guardian Name')} {t('editKid.required', '*')}
                                        <Lock size={14} className="lock-icon" />
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input locked"
                                        value={formData.parentInfo.name}
                                        readOnly
                                        disabled
                                        title={t('editKid.lockedField', 'This field cannot be edited')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        {t('editKid.emailAddress', '📧 Email Address')} {t('editKid.required', '*')}
                                        <Lock size={14} className="lock-icon" />
                                    </label>
                                    <input
                                        type="email"
                                        className="form-input locked"
                                        value={formData.parentInfo.email}
                                        readOnly
                                        disabled
                                        title={t('editKid.lockedField', 'This field cannot be edited')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        {t('editKid.phoneNumber', '📱 Phone Number')} {t('editKid.required', '*')}
                                        <Lock size={14} className="lock-icon" />
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-input locked"
                                        value={formData.parentInfo.phone}
                                        readOnly
                                        disabled
                                        title={t('editKid.lockedField', 'This field cannot be edited')}
                                    />
                                </div>

                                {/* Grandparents Info - EDITABLE */}
                                <div className="form-group">
                                    <label className="form-label">{t('editKid.grandparentsNames', '👵👴 Grandparents Names')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('editKid.grandparentsNamesPlaceholder', 'Racing legends in the family')}
                                        value={formData.parentInfo.grandparentsInfo.names}
                                        onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.names', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editKid.grandparentsPhone', '☎️ Grandparents Phone')}</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder={t('editKid.grandparentsPhonePlaceholder', 'Backup racing support')}
                                        value={formData.parentInfo.grandparentsInfo.phone}
                                        onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Team Assignment with Vehicle Integration */}
                        <div className={`form-section team-section ${focusTeam ? 'highlight-section' : ''}`}>
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>
                                    {t('editKid.teamVehicleAssignment', '🏎️ Team & Vehicle Assignment')}
                                    {focusTeam && <span className="focus-indicator">{t('editKid.focusIndicator', '← Update Here!')}</span>}
                                </h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <Users className="label-icon" size={16} />
                                            {t('editKid.racingTeam', 'Racing Team')}
                                        </label>
                                        <select
                                            value={formData.teamId}
                                            onChange={(e) => handleInputChange('teamId', e.target.value)}
                                            className={`form-select ${focusTeam ? 'focus-field' : ''}`}
                                        >
                                            <option value="">{t('editKid.noTeamAssigned', '🚫 No Team Assigned (Yet!)')}</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>
                                                    {t('editKid.teamOption', '🏁 {teamName} ({memberCount} racers)', {
                                                        teamName: team.name,
                                                        memberCount: team.kidIds?.length || 0
                                                    })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <User className="label-icon" size={16} />
                                            {t('editKid.racingInstructor', 'Racing Instructor')}
                                        </label>
                                        <select
                                            value={formData.instructorId}
                                            onChange={(e) => handleInputChange('instructorId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">{t('editKid.noInstructorAssigned', '👨‍🏫 No Instructor Assigned')}</option>
                                            {instructors.map(instructor => (
                                                <option key={instructor.id} value={instructor.id}>
                                                    {t('editKid.instructorOption', '🏎️ {instructorName}', { instructorName: instructor.name })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Assignment Section */}
                            <div className="vehicle-assignment-wrapper">
                                {getVehicleAssignmentDisplay()}
                            </div>
                        </div>

                        {/* Racing Status */}
                        <div className="form-section status-section">
                            <div className="section-header">
                                <Check className="section-icon" size={24} />
                                <h2>{t('editKid.racingStatusForms', '📋 Racing Status & Forms')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="field-wrapper">
                                        <label className="form-label">
                                            <FileText className="label-icon" size={16} />
                                            {t('editKid.formStatus', 'Form Status')}
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
                                        {t('editKid.healthDeclarationSigned', '🛡️ Health Declaration Signed')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="form-section comments-section">
                            <div className="section-header">
                                <MessageCircle className="section-icon" size={24} />
                                <h2>{t('editKid.racingNotesCommunication', '💬 Racing Notes & Team Communication')}</h2>
                            </div>

                            {/* Existing Comments Display */}
                            <div className="comments-timeline">
                                {formData.instructorsComments && formData.instructorsComments.length > 0 ? (
                                    formData.instructorsComments.map((comment, index) => (
                                        <div key={index} className="comment-timeline-item">
                                            <div className="comment-avatar">
                                                <User size={16} />
                                            </div>
                                            <div className="comment-content">
                                                <div className="comment-header">
                                                    <span className="comment-author">{comment.author}</span>
                                                    <span className="comment-role">({comment.authorRole})</span>
                                                    <span className="comment-timestamp">
                                                        {new Date(comment.timestamp).toLocaleDateString()} {new Date(comment.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="comment-text">{comment.text}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-comments">
                                        <MessageCircle size={40} className="no-comments-icon" />
                                        <p>{t('editKid.noTeamNotesYet', 'No team notes yet. Be the first to add one!')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Add New Comment */}
                            <div className="add-comment-section">
                                {!showAddComment ? (
                                    <button
                                        type="button"
                                        className="btn-add-comment"
                                        onClick={() => setShowAddComment(true)}
                                    >
                                        <Plus size={16} />
                                        {t('editKid.addTeamNote', 'Add Team Note')}
                                    </button>
                                ) : (
                                    <div className="comment-form">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={t('editKid.commentPlaceholder', 'Add a note about this racer\'s progress, behavior, or any important information...')}
                                            className="comment-textarea"
                                            rows="3"
                                        />
                                        <div className="comment-actions">
                                            <button
                                                type="button"
                                                className="btn-cancel-comment"
                                                onClick={() => {
                                                    setShowAddComment(false);
                                                    setNewComment('');
                                                }}
                                            >
                                                {t('editKid.cancel', 'Cancel')}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-submit-comment"
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim() || isAddingComment}
                                            >
                                                {isAddingComment ? (
                                                    <>
                                                        <div className="loading-spinner-mini"></div>
                                                        {t('editKid.adding', 'Adding...')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={16} />
                                                        {t('editKid.addNote', 'Add Note')}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Comments Field */}
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">{t('editKid.additionalRacingNotes', '🗒️ Additional Racing Notes')}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={t('editKid.additionalRacingNotesPlaceholder', 'Any special notes about our racing star!')}
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
                                {t('editKid.cancelButton', 'Cancel')}
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting || isUploadingPhoto}
                                className="btn btn-submit racing-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="loading-spinner-mini"></div>
                                        {isUploadingPhoto
                                            ? t('editKid.uploadingPhoto', 'Uploading Photo...')
                                            : t('editKid.updatingRacer', 'Updating Racer...')
                                        }
                                    </>
                                ) : (
                                    <>
                                        <Save className="btn-icon" size={18} />
                                        {t('editKid.saveUpdates', 'Save Updates! 🏁')}
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