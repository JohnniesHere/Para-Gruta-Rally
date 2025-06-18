// src/pages/admin/AddVehiclePage.jsx - Add New Vehicle with Photo Upload
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { addVehicle, updateVehicle } from '../../services/vehicleService';
import { getAllTeams } from '../../services/teamService';
import { uploadVehiclePhoto } from '../../services/vehiclePhotoService'; // You'll need to create this
import {
    IconCar as Car,
    IconPlus as Plus,
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
    IconSettings as Settings
} from '@tabler/icons-react';
import './EditKidPage.css'; // Reuse the enhanced photo button styles

const AddVehiclePage = () => {
    const navigate = useNavigate();
    const { appliedTheme } = useTheme();
    const { permissions, userRole, userData } = usePermissions();

    const [isLoading, setIsLoading] = useState(false);
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        licensePlate: '',
        teamName: '',
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
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);

            // Load teams
            const teamsData = await getAllTeams({ active: true });
            setTeams(teamsData);

            // Set default team for instructors
            if (userRole === 'instructor' && userData?.teamId) {
                const userTeam = teamsData.find(team => team.id === userData.teamId);
                if (userTeam) {
                    setFormData(prev => ({
                        ...prev,
                        teamName: userTeam.name
                    }));
                }
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
            setErrors({ general: 'Failed to load form data. Please try again.' });
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

    // Photo handling - matching EditKidPage style
    const handlePhotoSelection = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setPhotoError('');

        try {
            // Basic validation
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

            console.log('📸 Vehicle photo selected and ready for upload');

        } catch (error) {
            console.error('Error processing photo:', error);
            setPhotoError('Failed to process photo. Please try again.');
        }
    };

    const handleRemovePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setPhotoError('');
        // Reset file input
        const fileInput = document.getElementById('photo-upload');
        if (fileInput) fileInput.value = '';
    };

    const validateForm = () => {
        const newErrors = {};
        const newFieldErrors = {};

        // Required fields
        if (!formData.make.trim()) {
            newErrors.make = 'Vehicle make is required';
            newFieldErrors.make = true;
        }

        if (!formData.model.trim()) {
            newErrors.model = 'Vehicle model is required';
            newFieldErrors.model = true;
        }

        if (!formData.licensePlate.trim()) {
            newErrors.licensePlate = 'License plate is required';
            newFieldErrors.licensePlate = true;
        }

        if (!formData.teamName.trim()) {
            newErrors.teamName = 'Team assignment is required';
            newFieldErrors.teamName = true;
        }

        // Validate license plate format (basic check)
        if (formData.licensePlate && formData.licensePlate.length < 2) {
            newErrors.licensePlate = 'License plate must be at least 2 characters';
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
        try {
            // Create the vehicle first
            const vehicleId = await addVehicle(formData);
            console.log('✅ Vehicle created with ID:', vehicleId);

            // Upload photo if one was selected
            let finalPhotoUrl = '';
            if (selectedPhoto) {
                try {
                    setIsUploadingPhoto(true);
                    console.log('📸 Uploading photo for vehicle:', vehicleId);

                    // You'll need to create uploadVehiclePhoto service
                    finalPhotoUrl = await uploadVehiclePhoto(vehicleId, selectedPhoto);
                    console.log('✅ Photo uploaded successfully:', finalPhotoUrl);

                    // Update vehicle with photo URL
                    await updateVehicle(vehicleId, { photo: finalPhotoUrl });

                } catch (photoError) {
                    console.error('⚠️ Photo upload failed:', photoError);
                    alert(`Vehicle was created successfully, but photo upload failed: ${photoError.message}. You can add a photo later by editing the vehicle.`);
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            // Navigate to the new vehicle's view page with success message
            navigate(`/admin/vehicles/view/${vehicleId}`, {
                state: {
                    message: `🏎️ ${formData.make} ${formData.model} has been added to the fleet! Ready to race! 🏁`,
                    type: 'success'
                }
            });

        } catch (error) {
            console.error('Error adding vehicle:', error);
            setErrors({ general: error.message || 'Failed to add vehicle. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/vehicles');
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

        // Generate placeholder initials from make/model
        const make = formData.make || '';
        const model = formData.model || '';
        const initials = (make.charAt(0) + model.charAt(0)).toUpperCase() || 'V';

        return {
            hasPhoto: false,
            url: null,
            placeholder: initials
        };
    };

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'instructor') {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page add-vehicle-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>Access Denied</h3>
                        <p>You don't have permission to add vehicles.</p>
                        <button onClick={() => navigate('/admin/vehicles')} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            Back to Vehicles
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page add-vehicle-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading form data...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const photoDisplay = getPhotoDisplay();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page add-vehicle-page ${appliedTheme}-mode`}>
                {/* Page Title */}
                <h1>
                    <Car size={32} className="page-title-icon" />
                    Add New Racing Vehicle!
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                <div className="admin-container add-kid-container">
                    {/* Racing Theme Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <button onClick={handleCancel} className="back-button">
                                <ArrowLeft className="btn-icon" size={20} />
                                Back to Vehicles
                            </button>
                            <div className="title-section">
                                <p className="subtitle">Let's add a new racing machine to the fleet! 🏁</p>
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
                        {/* Vehicle Photo Section */}
                        <div className="form-section racing-section">
                            <div className="section-header">
                                <Photo className="section-icon" size={24} />
                                <h2>🏎️ Vehicle Photo</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">📸 Racing Vehicle Photo</label>
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
                                            <p>📸 Upload a racing vehicle photo! (Max 5MB, JPEG/PNG)</p>
                                            {photoError && (
                                                <p className="photo-error">{photoError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Vehicle Information */}
                        <div className="form-section skills-section">
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>🚗 Vehicle Information</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">🏭 Make *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${fieldErrors.make ? 'error' : ''}`}
                                        placeholder="e.g., Ford, Chevrolet, Custom"
                                        value={formData.make}
                                        onChange={(e) => handleInputChange('make', e.target.value)}
                                    />
                                    {errors.make && <span className="error-text">{errors.make}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">🚗 Model *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${fieldErrors.model ? 'error' : ''}`}
                                        placeholder="e.g., Focus, Camaro, Racer X1"
                                        value={formData.model}
                                        onChange={(e) => handleInputChange('model', e.target.value)}
                                    />
                                    {errors.model && <span className="error-text">{errors.model}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">🔢 License Plate *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${fieldErrors.licensePlate ? 'error' : ''}`}
                                        placeholder="e.g., ABC-123 or RACE01"
                                        value={formData.licensePlate}
                                        onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                                    />
                                    {errors.licensePlate && <span className="error-text">{errors.licensePlate}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Users className="label-icon" size={16} />
                                        Team Assignment *
                                    </label>
                                    <select
                                        value={formData.teamName}
                                        onChange={(e) => handleInputChange('teamName', e.target.value)}
                                        className={`form-select ${fieldErrors.teamName ? 'error' : ''}`}
                                        disabled={userRole === 'instructor'} // Instructors can only add to their team
                                    >
                                        <option value="">🏁 Select Racing Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.name}>
                                                🏎️ {team.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.teamName && <span className="error-text">{errors.teamName}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Technical Specifications */}
                        <div className="form-section team-section">
                            <div className="section-header">
                                <Settings className="section-icon" size={24} />
                                <h2>⚙️ Technical Specifications</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        <Engine className="label-icon" size={16} />
                                        Drive Type
                                    </label>
                                    <select
                                        value={formData.driveType}
                                        onChange={(e) => handleInputChange('driveType', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Drive System</option>
                                        <option value="Front-Wheel Drive">Front-Wheel Drive</option>
                                        <option value="Rear-Wheel Drive">Rear-Wheel Drive</option>
                                        <option value="All-Wheel Drive">All-Wheel Drive</option>
                                        <option value="4WD">4WD</option>
                                        <option value="Electric">Electric Motor</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Steering className="label-icon" size={16} />
                                        Steering Type
                                    </label>
                                    <select
                                        value={formData.steeringType}
                                        onChange={(e) => handleInputChange('steeringType', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Steering System</option>
                                        <option value="Manual">Manual Steering</option>
                                        <option value="Power">Power Steering</option>
                                        <option value="Electric">Electric Power Steering</option>
                                        <option value="Hydraulic">Hydraulic Power Steering</option>
                                        <option value="Electronic">Electronic Steering</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Battery className="label-icon" size={16} />
                                        Battery Type
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., 12V Lead Acid, Lithium Ion, AGM"
                                        value={formData.batteryType}
                                        onChange={(e) => handleInputChange('batteryType', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Calendar className="label-icon" size={16} />
                                        Battery Installation Date
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.batteryDate}
                                        onChange={(e) => handleInputChange('batteryDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modifications and Notes */}
                        <div className="form-section comments-section">
                            <div className="section-header">
                                <FileText className="section-icon" size={24} />
                                <h2>📝 Modifications & Notes</h2>
                            </div>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">🔧 Vehicle Modifications</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Describe any modifications made to this vehicle..."
                                        value={formData.modifications}
                                        onChange={(e) => handleInputChange('modifications', e.target.value)}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">📋 Additional Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Any additional notes about this racing vehicle..."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
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
                                        {isUploadingPhoto ? 'Uploading Photo...' : 'Adding Vehicle...'}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="btn-icon" size={18} />
                                        Add to Racing Fleet! 🏁
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

export default AddVehiclePage;