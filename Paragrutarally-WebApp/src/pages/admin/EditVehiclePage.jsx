// src/pages/admin/EditVehiclePage.jsx - Edit Vehicle with Schema Validation and Full Translation Support
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getVehicleById, updateVehicle } from '../../services/vehicleService';
import { uploadVehiclePhoto, deleteVehiclePhoto } from '../../services/vehiclePhotoService';
import { getAllTeams } from '../../services/teamService';
import {
    IconCar as Car,
    IconDeviceFloppy as Save,
    IconArrowLeft as ArrowLeft,
    IconAlertTriangle as AlertTriangle,
    IconBattery as Battery,
    IconEngine as Engine,
    IconSteeringWheel as Steering,
    IconUsers as Users,
    IconCalendar as Calendar,
    IconPhoto as Photo,
    IconFileText as FileText,
    IconCamera as Camera,
    IconTrash as Trash2,
    IconSparkles as Sparkles,
    IconSettings as Settings,
    IconEdit as Edit,
    IconCircle as CheckCircle, IconArrowRight as ArrowRight
} from '@tabler/icons-react';
import './EditKidPage.css';

const EditVehiclePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { appliedTheme } = useTheme();
    const { t, isRTL, isHebrew } = useLanguage();
    const { userRole, userData } = usePermissions();

    const [isLoading, setIsLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        licensePlate: '',
        teamId: '', // Changed from teamName to teamId
        driveType: '',
        steeringType: '',
        batteryType: '',
        batteryDate: '',
        modifications: '',
        notes: '',
        photo: '',
        active: true,
        currentKidId: null,
        history: []
    });
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Photo upload state
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState('');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    useEffect(() => {
        loadVehicleData();
    }, [id]);

    const loadVehicleData = async () => {
        try {
            setIsLoading(true);

            // Load vehicle data
            const vehicleData = await getVehicleById(id);
            if (!vehicleData) {
                setErrors({ general: t('editVehicle.vehicleNotFound', 'Vehicle not found!') });
                return;
            }

            // Check permissions
            if (!canEdit(vehicleData)) {
                setErrors({ general: t('editVehicle.noPermissionEdit', 'You do not have permission to edit this vehicle.') });
                return;
            }

            setOriginalData(vehicleData);

            // ✅ COMPLETE FIX: Only extract form fields, exclude Firestore metadata
            setFormData({
                make: vehicleData.make || '',
                model: vehicleData.model || '',
                licensePlate: vehicleData.licensePlate || '',
                teamId: vehicleData.teamId || '',
                driveType: vehicleData.driveType || '',
                steeringType: vehicleData.steeringType || '',
                batteryType: vehicleData.batteryType || '',
                // ✅ Convert batteryDate to the proper format for date input
                batteryDate: vehicleData.batteryDate ?
                    (typeof vehicleData.batteryDate === 'string' ?
                        vehicleData.batteryDate :
                        vehicleData.batteryDate.toISOString?.()?.split('T')[0] || '') : '',
                modifications: vehicleData.modifications || '',
                notes: vehicleData.notes || '',
                photo: vehicleData.photo || '',
                active: Boolean(vehicleData.active ?? true), // Default to true if undefined
                currentKidId: vehicleData.currentKidId || null,
                history: Array.isArray(vehicleData.history) ? vehicleData.history : []
                // ❌ EXCLUDE: createdAt, updatedAt, id - these cause validation errors
            });

            // Set photo preview if exists
            if (vehicleData.photo) {
                setPhotoPreview(vehicleData.photo);
            }

            // Load teams
            const teamsData = await getAllTeams({ active: true });
            setTeams(teamsData);

        } catch (error) {
            console.error('Error loading vehicle data:', error);
            setErrors({ general: t('editVehicle.failedToLoadVehicle', 'Failed to load vehicle data. Please try again.') });
        } finally {
            setIsLoading(false);
        }
    };

    const canEdit = (vehicle = formData) => {
        if (userRole === 'admin') return true;
        if (userRole === 'instructor' && userData?.teamId === vehicle?.teamId) return true;
        return false;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear specific error when the user starts typing
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

    // Enhanced photo handling with old photo cleanup - TRANSLATED
    const handlePhotoSelection = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setPhotoError('');

        try {
            // Basic validation - TRANSLATED
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setPhotoError(t('editVehicle.photoUploadError.invalidType', 'Please upload a JPEG, PNG, or WebP image file.'));
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setPhotoError(t('editVehicle.photoUploadError.tooLarge', 'Photo file size must be less than 5MB.'));
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
            setPhotoError(t('editVehicle.photoUploadError.processingFailed', 'Failed to process photo. Please try again.'));
        }
    };

    const handleRemovePhoto = async () => {
        try {
            // Delete an old photo from storage if it exists
            if (formData.photo) {
                await deleteVehiclePhoto(id, formData.photo);
            }

            // Update form data to remove a photo
            setFormData(prev => ({
                ...prev,
                photo: ''
            }));

            // Clear local state
            setSelectedPhoto(null);
            setPhotoPreview(null);
            setPhotoError('');

            // Clear file input
            const fileInput = document.getElementById('photo-upload');
            if (fileInput) fileInput.value = '';


        } catch (error) {
            console.error('❌ Error removing photo:', error);
            setPhotoError(t('editVehicle.photoRemoveError', 'Failed to remove photo. Please try again.'));
        }
    };

    // Form validation function - TRANSLATED
    const validateForm = () => {
        // Clear previous errors
        setErrors({});
        setFieldErrors({});

        // The schema validation will be handled by the service
        // Just do basic client-side checks here
        const newErrors = {};
        const newFieldErrors = {};

        // Required fields - basic check (schema will do full validation) - TRANSLATED
        if (!formData.make.trim()) {
            newErrors.make = t('editVehicle.makeRequired', 'Vehicle make is required');
            newFieldErrors.make = true;
        }

        if (!formData.model.trim()) {
            newErrors.model = t('editVehicle.modelRequired', 'Vehicle model is required');
            newFieldErrors.model = true;
        }

        if (!formData.licensePlate.trim()) {
            newErrors.licensePlate = t('editVehicle.licensePlateRequired', 'License plate is required');
            newFieldErrors.licensePlate = true;
        }

        setErrors(newErrors);
        setFieldErrors(newFieldErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // ✅ EXCLUDE history and currentKidId from manual updates
        const cleanedFormData = {
            make: String(formData.make || '').trim(),
            model: String(formData.model || '').trim(),
            licensePlate: String(formData.licensePlate || '').trim(),
            teamId: formData.teamId || '',
            driveType: formData.driveType || '',
            steeringType: formData.steeringType || '',
            batteryType: formData.batteryType || '',
            batteryDate: formData.batteryDate || '',
            modifications: formData.modifications || '',
            notes: formData.notes || '',
            photo: formData.photo || '',
            active: Boolean(formData.active)
            // ❌ REMOVED: history and currentKidId - these are managed by assign/unassign functions
        };


        try {
            // Handle photo upload first if needed
            if (selectedPhoto) {
                try {
                    setIsUploadingPhoto(true);

                    // Delete an old photo first if it exists
                    if (formData.photo) {
                        try {
                            await deleteVehiclePhoto(id, formData.photo);
                        } catch (deleteError) {
                            console.warn('⚠️ Failed to delete old photo:', deleteError.message);
                        }
                    }

                    // Upload a new photo
                    const photoUrl = await uploadVehiclePhoto(id, selectedPhoto);
                    cleanedFormData.photo = String(photoUrl);
                } catch (photoError) {
                    console.error('❌ Photo upload failed:', photoError);
                    alert(t('editVehicle.photoUploadWarning', 'Photo upload failed: {error}. The vehicle will be updated without the new photo.', { error: photoError.message }));
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            // Update the vehicle
            await updateVehicle(id, cleanedFormData);

            // Navigate with a success message - TRANSLATED
            navigate(`/admin/vehicles/view/${id}`, {
                state: {
                    message: t('editVehicle.updateSuccess', '🎉 {make} {model} has been updated successfully! 🏎️', {
                        make: cleanedFormData.make,
                        model: cleanedFormData.model
                    }),
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error updating vehicle:', error);
            setErrors({ general: t('editVehicle.updateError', 'Failed to update vehicle: {error}', { error: error.message }) });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(`/admin/vehicles`);
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

        const make = formData.make || '';
        const model = formData.model || '';
        const initials = (make.charAt(0) + model.charAt(0)).toUpperCase() || 'V';

        return {
            hasPhoto: false,
            url: null,
            placeholder: initials
        };
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page edit-vehicle-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('editVehicle.loadingVehicleData', 'Loading vehicle data...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (errors.general && !originalData) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page edit-vehicle-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('editVehicle.error', 'Error')}</h3>
                        <p>{errors.general}</p>
                        <button onClick={() => navigate('/admin/vehicles')}
                                className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                            {isHebrew ? (
                                <>
                                    {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                                    <ArrowRight className="btn-icon" size={20}/>
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="btn-icon" size={20}/>
                                    {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const photoDisplay = getPhotoDisplay();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page edit-vehicle-page ${appliedTheme}-mode`}>
                {/* Page Title - TRANSLATED */}
                <button onClick={() => navigate('/admin/vehicles')}
                        className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                    {isHebrew ? (
                        <>
                            {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                            <ArrowRight className="btn-icon" size={20}/>
                        </>
                    ) : (
                        <>
                            <ArrowLeft className="btn-icon" size={20}/>
                            {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                        </>
                    )}
                </button>
                <div className="header-content">
                    <div className="title-section">
                        <h1>
                            <Edit size={32} className="page-title-icon"/>
                            {t('editVehicle.title', 'Update Racing Vehicle!')}
                            <Sparkles size={24} className="sparkle-icon"/>
                        </h1>
                    </div>
                </div>

                <div className="admin-container add-kid-container">
                    {/* Error Alert */}
                    {errors.general && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20}/>
                            {errors.general}
                        </div>
                    )}

                    {/* Info Alert - TRANSLATED */}
                    <div className="alert info-alert">
                        <CheckCircle size={20} />
                        {t('editVehicle.editingVehicle', 'You\'re editing {make} {model}. Make changes below to update! 🏎️', {
                            make: formData.make,
                            model: formData.model
                        })}
                    </div>

                    <form onSubmit={handleSubmit} className="add-kid-form">
                        {/* Vehicle Photo Section - TRANSLATED */}
                        <div className="form-section racing-section">
                            <div className="section-header">
                                <Photo className="section-icon" size={24} />
                                <h2>{t('editVehicle.vehiclePhoto', '🏎️ Vehicle Photo')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">{t('editVehicle.racingVehiclePhoto', '📸 Racing Vehicle Photo')}</label>
                                    <div className="photo-upload-section">
                                        <div className="photo-preview-container">
                                            <div className="photo-display-wrapper">
                                                {photoDisplay.hasPhoto ? (
                                                    <img
                                                        src={photoDisplay.url}
                                                        alt="Vehicle preview"
                                                        className="kid-photo"
                                                    />
                                                ) : (
                                                    <div className="kid-photo-placeholder">
                                                        {photoDisplay.placeholder}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="photo-action-buttons">
                                                <button
                                                    type="button"
                                                    className="photo-action-btn upload-btn"
                                                    onClick={() => document.getElementById('photo-upload').click()}
                                                    title={photoDisplay.hasPhoto ? t('editVehicle.changePhoto', 'Change Photo') : t('editVehicle.uploadPhoto', 'Upload Photo')}
                                                >
                                                    <Camera size={18} />
                                                    <span className="btn-text">{photoDisplay.hasPhoto ? t('editVehicle.changePhoto', 'Change') : t('editVehicle.uploadPhoto', 'Upload')}</span>
                                                </button>

                                                {photoDisplay.hasPhoto && (
                                                    <button
                                                        type="button"
                                                        className="photo-action-btn remove-btn"
                                                        onClick={handleRemovePhoto}
                                                        title={t('editVehicle.removePhoto', 'Remove Photo')}
                                                    >
                                                        <Trash2 size={18} />
                                                        <span className="btn-text">{t('editVehicle.removePhoto', 'Remove')}</span>
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
                                            <p>{t('editVehicle.photoRequirements', '📸 Update racing vehicle photo! (Max 5MB, JPEG/PNG)')}</p>
                                            {photoError && (
                                                <p className="photo-error">{photoError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Vehicle Information - TRANSLATED */}
                        <div className="form-section skills-section">
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>{t('editVehicle.vehicleInformation', '🚗 Vehicle Information')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">{t('editVehicle.make', '🏭 Make')} {t('editVehicle.required', '*')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${fieldErrors.make ? 'error' : ''}`}
                                        placeholder={t('editVehicle.makePlaceholder', 'e.g., Ford, Chevrolet, Custom')}
                                        value={formData.make}
                                        onChange={(e) => handleInputChange('make', e.target.value)}
                                    />
                                    {errors.make && <span className="error-text">{errors.make}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editVehicle.model', '🚗 Model')} {t('editVehicle.required', '*')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${fieldErrors.model ? 'error' : ''}`}
                                        placeholder={t('editVehicle.modelPlaceholder', 'e.g., Focus, Camaro, Racer X1')}
                                        value={formData.model}
                                        onChange={(e) => handleInputChange('model', e.target.value)}
                                    />
                                    {errors.model && <span className="error-text">{errors.model}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('editVehicle.licensePlate', '🔢 License Plate')} {t('editVehicle.required', '*')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${fieldErrors.licensePlate ? 'error' : ''}`}
                                        placeholder={t('editVehicle.licensePlatePlaceholder', 'e.g., ABC-123 or RACE01')}
                                        value={formData.licensePlate}
                                        onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                                    />
                                    {errors.licensePlate && <span className="error-text">{errors.licensePlate}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Users className="label-icon" size={16} />
                                        {t('editVehicle.teamAssignment', 'Team Assignment')}
                                    </label>
                                    <select
                                        value={formData.teamId || ''}
                                        onChange={(e) => handleInputChange('teamId', e.target.value)}
                                        className={`form-select ${fieldErrors.teamId ? 'error' : ''}`}
                                        disabled={userRole === 'instructor'} // Instructors can't change team
                                    >
                                        <option value="">{t('editVehicle.unassignedPool', '🏁 Unassigned (Vehicle Pool)')}</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                {t('editVehicle.teamOption', '🏎️ {teamName}', { teamName: team.name })}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.teamId && <span className="error-text">{errors.teamId}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Technical Specifications - TRANSLATED */}
                        <div className="form-section team-section">
                            <div className="section-header">
                                <Settings className="section-icon" size={24} />
                                <h2>{t('editVehicle.technicalSpecifications', '⚙️ Technical Specifications')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        <Engine className="label-icon" size={16} />
                                        {t('editVehicle.driveType', 'Drive Type')}
                                    </label>
                                    <select
                                        value={formData.driveType || ''}
                                        onChange={(e) => handleInputChange('driveType', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">{t('editVehicle.selectDriveSystem', 'Select Drive System')}</option>
                                        <option value="Front-Wheel Drive">{t('editVehicle.frontWheelDrive', 'Front-Wheel Drive')}</option>
                                        <option value="Rear-Wheel Drive">{t('editVehicle.rearWheelDrive', 'Rear-Wheel Drive')}</option>
                                        <option value="All-Wheel Drive">{t('editVehicle.allWheelDrive', 'All-Wheel Drive')}</option>
                                        <option value="4WD">{t('editVehicle.fourWD', '4WD')}</option>
                                        <option value="Electric">{t('editVehicle.electricMotor', 'Electric Motor')}</option>
                                        <option value="Hybrid">{t('editVehicle.hybrid', 'Hybrid')}</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Steering className="label-icon" size={16} />
                                        {t('editVehicle.steeringType', 'Steering Type')}
                                    </label>
                                    <select
                                        value={formData.steeringType || ''}
                                        onChange={(e) => handleInputChange('steeringType', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">{t('editVehicle.selectSteeringSystem', 'Select Steering System')}</option>
                                        <option value="Manual">{t('editVehicle.manualSteering', 'Manual Steering')}</option>
                                        <option value="Power">{t('editVehicle.powerSteering', 'Power Steering')}</option>
                                        <option value="Electric">{t('editVehicle.electricPowerSteering', 'Electric Power Steering')}</option>
                                        <option value="Hydraulic">{t('editVehicle.hydraulicPowerSteering', 'Hydraulic Power Steering')}</option>
                                        <option value="Electronic">{t('editVehicle.electronicSteering', 'Electronic Steering')}</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Battery className="label-icon" size={16} />
                                        {t('editVehicle.batteryType', 'Battery Type')}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('editVehicle.batteryTypePlaceholder', 'e.g., 12V Lead Acid, Lithium Ion, AGM')}
                                        value={formData.batteryType || ''}
                                        onChange={(e) => handleInputChange('batteryType', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Calendar className="label-icon" size={16} />
                                        {t('editVehicle.batteryInstallationDate', 'Battery Installation Date')}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.batteryDate || ''}
                                        onChange={(e) => handleInputChange('batteryDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Controls - Admin Only - TRANSLATED */}
                        {userRole === 'admin' && (
                            <div className="form-section status-section">
                                <div className="section-header">
                                    <CheckCircle className="section-icon" size={24} />
                                    <h2>{t('editVehicle.vehicleStatus', '📋 Vehicle Status')}</h2>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.active}
                                                onChange={(e) => handleInputChange('active', e.target.checked)}
                                            />
                                            {t('editVehicle.vehicleActive', '🏎️ Vehicle Active')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modifications and Notes - TRANSLATED */}
                        <div className="form-section comments-section">
                            <div className="section-header">
                                <FileText className="section-icon" size={24} />
                                <h2>{t('editVehicle.modificationsNotes', '📝 Modifications & Notes')}</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">{t('editVehicle.vehicleModifications', '🔧 Vehicle Modifications')}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={t('editVehicle.modificationsPlaceholder', 'Describe any modifications made to this vehicle...')}
                                        value={formData.modifications || ''}
                                        onChange={(e) => handleInputChange('modifications', e.target.value)}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">{t('editVehicle.additionalNotes', '📋 Additional Notes')}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={t('editVehicle.additionalNotesPlaceholder', 'Any additional notes about this racing vehicle...')}
                                        value={formData.notes || ''}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Racing Action Buttons - TRANSLATED */}
                        <div className="racing-actions">
                            <button type="button" onClick={handleCancel} className="btn btn-cancel">
                                <ArrowLeft className="btn-icon" size={18} />
                                {t('editVehicle.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isUploadingPhoto}
                                className="btn btn-submit racing-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="loading-spinner-mini"></div>
                                        {isUploadingPhoto ? t('editVehicle.uploadingPhoto', 'Uploading Photo...') : t('editVehicle.updatingVehicle', 'Updating Vehicle...')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="btn-icon" size={18} />
                                        {t('editVehicle.saveUpdates', 'Save Updates! 🏁')}
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

export default EditVehiclePage;