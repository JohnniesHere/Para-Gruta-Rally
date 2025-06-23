// src/components/modals/ParentKidEditModal.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconX as X,
    IconDeviceFloppy as Save,
    IconUserCircle as Baby,
    IconHeart as Heart,
    IconCamera as Camera,
    IconTrash as Trash2,
    IconEdit as Edit,
    IconSparkles as Sparkles,
    IconPhone as Phone,
    IconMapPin as MapPin,
    IconUser as User,
    IconUsers as Users
} from '@tabler/icons-react';
import { updateKid } from '../../services/kidService';
import { uploadKidPhoto, deleteKidPhoto, getKidPhotoInfo } from '../../services/kidPhotoService';
import { validateKid } from '../../schemas/kidSchema';
import './ParentKidEditModal.css';

const ParentKidEditModal = ({ kid, isOpen, onClose, onSuccess }) => {
    const { t, isRTL } = useLanguage();

    const [formData, setFormData] = useState({
        personalInfo: {
            firstName: '',
            lastName: '',
            announcersNotes: '',
            address: '',
            photo: ''
        },
        parentInfo: {
            name: '',
            phone: '',
            grandparentsInfo: {
                names: '',
                phone: ''
            }
        }
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Photo upload state
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState('');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Initialize form data when modal opens or kid changes
    useEffect(() => {
        if (isOpen && kid) {
            setFormData({
                personalInfo: {
                    firstName: kid.personalInfo?.firstName || '',
                    lastName: kid.personalInfo?.lastName || '',
                    announcersNotes: kid.personalInfo?.announcersNotes || '',
                    address: kid.personalInfo?.address || '',
                    photo: kid.personalInfo?.photo || ''
                },
                parentInfo: {
                    name: kid.parentInfo?.name || '',
                    phone: kid.parentInfo?.phone || '',
                    grandparentsInfo: {
                        names: kid.parentInfo?.grandparentsInfo?.names || '',
                        phone: kid.parentInfo?.grandparentsInfo?.phone || ''
                    }
                }
            });

            // Set photo preview if exists
            const photoInfo = getKidPhotoInfo(kid);
            if (photoInfo.hasPhoto) {
                setPhotoPreview(photoInfo.url);
            } else {
                setPhotoPreview(null);
            }

            // Reset other state
            setSelectedPhoto(null);
            setPhotoError('');
            setErrors({});
        }
    }, [isOpen, kid]);

    if (!isOpen || !kid) return null;

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

        // Clear error for this field
        if (errors[path]) {
            setErrors(prev => ({
                ...prev,
                [path]: undefined
            }));
        }
    };

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
            // Delete photo from storage if it exists
            if (formData.personalInfo?.photo) {
                console.log('🗑️ Deleting photo from storage...');
                await deleteKidPhoto(kid.id, formData.personalInfo.photo);
                console.log('✅ Photo deleted successfully');
            }

            // Update form data
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
            const fileInput = document.getElementById('parent-photo-upload');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error('❌ Error removing photo:', error);
            setPhotoError(t('editKid.photoError', 'Failed to remove photo. Please try again.'));
        }
    };

    const validateForm = () => {
        // Create full kid object for validation by merging with existing data
        const fullKidData = {
            ...kid,
            personalInfo: {
                ...kid.personalInfo,
                ...formData.personalInfo
            },
            parentInfo: {
                ...kid.parentInfo,
                ...formData.parentInfo
            }
        };

        const validation = validateKid(fullKidData);

        // Only show errors for fields we're editing
        const editableFields = [
            'personalInfo.firstName',
            'personalInfo.lastName',
            'personalInfo.announcersNotes',
            'personalInfo.address',
            'parentInfo.name',
            'parentInfo.phone',
            'parentInfo.grandparentsInfo.names',
            'parentInfo.grandparentsInfo.phone'
        ];

        const relevantErrors = {};
        editableFields.forEach(field => {
            if (validation.errors[field]) {
                relevantErrors[field] = validation.errors[field];
            }
        });

        setErrors(relevantErrors);
        return Object.keys(relevantErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const errorMessages = Object.values(errors).join('\n');
            alert(t('editKid.validation.fixErrors', 'Please fix the following errors:') + '\n' + errorMessages);
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
                            await deleteKidPhoto(kid.id, formData.personalInfo.photo);
                            console.log('✅ Old photo deleted successfully');
                        } catch (deleteError) {
                            console.warn('⚠️ Failed to delete old photo:', deleteError.message);
                        }
                    }

                    // Upload new photo
                    console.log('📷 Uploading new photo...');
                    const photoUrl = await uploadKidPhoto(kid.id, selectedPhoto);
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
                    alert(t('editKid.photoUploadError', 'Photo upload failed: {error}. Your other changes will still be saved.', { error: photoError.message }));
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            // Create the update object with only the changed fields
            const updateData = {
                ...kid,
                personalInfo: {
                    ...kid.personalInfo,
                    ...finalFormData.personalInfo
                },
                parentInfo: {
                    ...kid.parentInfo,
                    ...finalFormData.parentInfo
                }
            };

            // Update the kid
            await updateKid(kid.id, updateData);

            // Success callback
            if (onSuccess) {
                const firstName = finalFormData.personalInfo?.firstName || kid.personalInfo?.firstName;
                const successMessage = firstName
                    ? t('parentKidEdit.updateSuccess', '{firstName}\'s information has been updated successfully! 🎉', { firstName })
                    : t('parentKidEdit.updateSuccessGeneric', 'Information has been updated successfully! 🎉');

                onSuccess(successMessage);
            }

            onClose();

        } catch (error) {
            console.error('Error updating kid:', error);
            alert(t('parentKidEdit.updateError', 'Failed to update information: {error}', { error: error.message }));
        } finally {
            setIsSubmitting(false);
        }
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

        const firstName = formData.personalInfo?.firstName || kid.personalInfo?.firstName || '';
        const lastName = formData.personalInfo?.lastName || kid.personalInfo?.lastName || '';
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || kid.participantNumber?.charAt(0) || '?';

        return {
            hasPhoto: false,
            url: null,
            placeholder: initials
        };
    };

    const photoDisplay = getPhotoDisplay();
    const firstName = formData.personalInfo?.firstName || kid.personalInfo?.firstName;

    return (
        <div className="parent-kid-edit-overlay" onClick={onClose}>
            <div className="parent-kid-edit-modal" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <header className="edit-modal-header">
                    <div className="edit-header-content">
                        <div className="edit-title-section">
                            <Edit size={28} className="edit-icon" />
                            <h1 className="edit-title">
                                {firstName
                                    ? t('parentKidEdit.title', 'Edit {firstName}\'s Information', { firstName })
                                    : t('parentKidEdit.titleGeneric', 'Edit Information')
                                }
                            </h1>
                        </div>
                    </div>
                    <button className="edit-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </header>

                {/* Form Content */}
                <main className="edit-modal-body">
                    <form onSubmit={handleSubmit} className="edit-form">

                        {/* Photo and Basic Info Section */}
                        <section className="edit-section">
                            <div className="section-header">
                                <Baby size={20} />
                                <h2>{t('parentKidEdit.basicInfo', 'Basic Information')}</h2>
                            </div>

                            <div className="edit-grid">
                                {/* Photo Upload */}
                                <div className="edit-group full-width">
                                    <label className="edit-label">{t('parentKidEdit.photo', 'Photo')}</label>
                                    <div className="photo-section">
                                        <div className="photo-container">
                                            {photoDisplay.hasPhoto ? (
                                                <img
                                                    src={photoDisplay.url}
                                                    alt={t('addKid.photoAlt', 'Kid preview')}
                                                    className="kid-photo"
                                                />
                                            ) : (
                                                <div className="kid-photo-placeholder">
                                                    {photoDisplay.placeholder}
                                                </div>
                                            )}
                                        </div>

                                        <div className="photo-actions">
                                            <button
                                                type="button"
                                                className="photo-btn upload-btn"
                                                onClick={() => document.getElementById('parent-photo-upload').click()}
                                            >
                                                <Camera size={16} />
                                                {photoDisplay.hasPhoto ? t('parentKidEdit.changePhoto', 'Change') : t('parentKidEdit.uploadPhoto', 'Upload')}
                                            </button>

                                            {photoDisplay.hasPhoto && (
                                                <button
                                                    type="button"
                                                    className="photo-btn remove-btn"
                                                    onClick={handleRemovePhoto}
                                                >
                                                    <Trash2 size={16} />
                                                    {t('parentKidEdit.removePhoto', 'Remove')}
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            id="parent-photo-upload"
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handlePhotoSelection}
                                            style={{ display: 'none' }}
                                        />

                                        {photoError && (
                                            <p className="photo-error">{photoError}</p>
                                        )}
                                    </div>
                                </div>

                                {/* First Name */}
                                <div className="edit-group">
                                    <label className="edit-label">
                                        <User size={16} />
                                        {t('parentKidEdit.firstName', 'First Name')} *
                                    </label>
                                    <input
                                        type="text"
                                        className={`edit-input ${errors['personalInfo.firstName'] ? 'error' : ''}`}
                                        value={formData.personalInfo.firstName}
                                        onChange={(e) => handleInputChange('personalInfo.firstName', e.target.value)}
                                        placeholder={t('parentKidEdit.firstNamePlaceholder', 'Enter first name')}
                                    />
                                    {errors['personalInfo.firstName'] && (
                                        <span className="error-text">{errors['personalInfo.firstName']}</span>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div className="edit-group">
                                    <label className="edit-label">
                                        <Users size={16} />
                                        {t('parentKidEdit.lastName', 'Last Name')} *
                                    </label>
                                    <input
                                        type="text"
                                        className={`edit-input ${errors['personalInfo.lastName'] ? 'error' : ''}`}
                                        value={formData.personalInfo.lastName}
                                        onChange={(e) => handleInputChange('personalInfo.lastName', e.target.value)}
                                        placeholder={t('parentKidEdit.lastNamePlaceholder', 'Enter last name')}
                                    />
                                    {errors['personalInfo.lastName'] && (
                                        <span className="error-text">{errors['personalInfo.lastName']}</span>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="edit-group full-width">
                                    <label className="edit-label">
                                        <MapPin size={16} />
                                        {t('parentKidEdit.address', 'Address')}
                                    </label>
                                    <input
                                        type="text"
                                        className="edit-input"
                                        value={formData.personalInfo.address}
                                        onChange={(e) => handleInputChange('personalInfo.address', e.target.value)}
                                        placeholder={t('parentKidEdit.addressPlaceholder', 'Enter home address')}
                                    />
                                </div>

                                {/* Announcer Notes */}
                                <div className="edit-group full-width">
                                    <label className="edit-label">
                                        <Sparkles size={16} />
                                        {t('parentKidEdit.announcerNotes', 'Announcer Notes')}
                                    </label>
                                    <textarea
                                        className="edit-textarea"
                                        value={formData.personalInfo.announcersNotes}
                                        onChange={(e) => handleInputChange('personalInfo.announcersNotes', e.target.value)}
                                        placeholder={t('parentKidEdit.announcerNotesPlaceholder', 'Fun facts to share during the race!')}
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Parent Information Section */}
                        <section className="edit-section">
                            <div className="section-header">
                                <Heart size={20} />
                                <h2>{t('parentKidEdit.parentInfo', 'Parent Information')}</h2>
                            </div>

                            <div className="edit-grid">
                                {/* Parent Name */}
                                <div className="edit-group">
                                    <label className="edit-label">
                                        <User size={16} />
                                        {t('parentKidEdit.parentName', 'Parent Name')} *
                                    </label>
                                    <input
                                        type="text"
                                        className={`edit-input ${errors['parentInfo.name'] ? 'error' : ''}`}
                                        value={formData.parentInfo.name}
                                        onChange={(e) => handleInputChange('parentInfo.name', e.target.value)}
                                        placeholder={t('parentKidEdit.parentNamePlaceholder', 'Enter parent name')}
                                    />
                                    {errors['parentInfo.name'] && (
                                        <span className="error-text">{errors['parentInfo.name']}</span>
                                    )}
                                </div>

                                {/* Parent Phone */}
                                <div className="edit-group">
                                    <label className="edit-label">
                                        <Phone size={16} />
                                        {t('parentKidEdit.parentPhone', 'Parent Phone')} *
                                    </label>
                                    <input
                                        type="tel"
                                        className={`edit-input ${errors['parentInfo.phone'] ? 'error' : ''}`}
                                        value={formData.parentInfo.phone}
                                        onChange={(e) => handleInputChange('parentInfo.phone', e.target.value)}
                                        placeholder={t('parentKidEdit.parentPhonePlaceholder', 'Enter phone number')}
                                    />
                                    {errors['parentInfo.phone'] && (
                                        <span className="error-text">{errors['parentInfo.phone']}</span>
                                    )}
                                </div>

                                {/* Grandparents Names */}
                                <div className="edit-group">
                                    <label className="edit-label">
                                        <Users size={16} />
                                        {t('parentKidEdit.grandparentsNames', 'Grandparents Names')}
                                    </label>
                                    <input
                                        type="text"
                                        className="edit-input"
                                        value={formData.parentInfo.grandparentsInfo.names}
                                        onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.names', e.target.value)}
                                        placeholder={t('parentKidEdit.grandparentsNamesPlaceholder', 'Enter grandparents names')}
                                    />
                                </div>

                                {/* Grandparents Phone */}
                                <div className="edit-group">
                                    <label className="edit-label">
                                        <Phone size={16} />
                                        {t('parentKidEdit.grandparentsPhone', 'Grandparents Phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        className="edit-input"
                                        value={formData.parentInfo.grandparentsInfo.phone}
                                        onChange={(e) => handleInputChange('parentInfo.grandparentsInfo.phone', e.target.value)}
                                        placeholder={t('parentKidEdit.grandparentsPhonePlaceholder', 'Enter grandparents phone')}
                                    />
                                </div>
                            </div>
                        </section>

                    </form>
                </main>

                {/* Footer */}
                <footer className="edit-modal-footer">
                    <button type="button" className="edit-btn cancel-btn" onClick={onClose}>
                        {t('parentKidEdit.cancel', 'Cancel')}
                    </button>

                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploadingPhoto}
                        className="edit-btn save-btn"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="loading-spinner-mini"></div>
                                {isUploadingPhoto
                                    ? t('parentKidEdit.uploadingPhoto', 'Uploading Photo...')
                                    : t('parentKidEdit.saving', 'Saving...')
                                }
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {t('parentKidEdit.saveChanges', 'Save Changes')}
                            </>
                        )}
                    </button>
                </footer>

            </div>
        </div>
    );
};

export default ParentKidEditModal;