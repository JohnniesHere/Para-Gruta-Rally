// src/components/DeleteEventModal.jsx - UPDATED WITH STANDARD MODAL STRUCTURE
import React from 'react';
import {
    IconX as X,
    IconAlertTriangle as AlertTriangle,
    IconTrash as Trash2,
    IconClock as Clock,
    IconFolder as Folder,
    IconExclamationCircle as ExclamationCircle
} from '@tabler/icons-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import './DeleteEventModal.css';

const DeleteEventModal = ({
                              isOpen,
                              eventToDelete,
                              deleteGalleryToo,
                              setDeleteGalleryToo,
                              isDeleting,
                              onConfirm,
                              onCancel
                          }) => {
    const { t, isRTL } = useLanguage();
    const { appliedTheme } = useTheme();

    if (!isOpen || !eventToDelete) {
        return null;
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="form-creation-modal-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-creation-modal-content">
                <div className="form-creation-modal-header">
                    <h3>
                        <AlertTriangle size={24} />
                        {t('events.deleteEvent', 'Delete Event')}
                    </h3>
                    <button
                        className="form-creation-modal-close"
                        onClick={onCancel}
                        disabled={isDeleting}
                        type="button"
                        aria-label={t('common.close', 'Close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="form-creation-modal-body">
                    {/* Warning Section */}
                    <div className="form-section">
                        <div className="delete-warning">
                            <AlertTriangle className="warning-icon" size={48} />
                            <h3>{t('events.deleteConfirmTitle', 'Are you sure you want to delete this event?')}</h3>
                            <p>
                                {t('events.deleteConfirmMessage', 'You are about to delete "{eventName}". This action cannot be undone.', {
                                    eventName: eventToDelete.name || t('events.unnamedEvent', 'Unnamed Event')
                                })}
                            </p>

                            {/* Show what will be deleted */}
                            <div className="deletion-summary">
                                <h4>{t('events.deletionSummaryTitle', 'The following will be permanently deleted:')}</h4>
                                <ul>
                                    <li>✅ {t('events.eventInformation', 'Event information and details')}</li>
                                    {eventToDelete.image && !eventToDelete.image.includes('unsplash.com') && (
                                        <li>🖼️ {t('events.eventCoverImage', 'Event cover image')}</li>
                                    )}
                                    {deleteGalleryToo && eventToDelete.hasGalleryFolder && (
                                        <li>📷 {t('events.allGalleryPhotos', 'All photos in the event gallery')}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Gallery Options Section */}
                    {eventToDelete.hasGalleryFolder && (
                        <div className="form-section">
                            <h4>
                                <Folder size={18} />
                                {t('events.galleryOptions', 'Gallery Options')}
                            </h4>

                            <div className="gallery-delete-section">
                                <div className="gallery-warning">
                                    <Folder className="folder-icon" size={24} />
                                    <div className="gallery-warning-content">
                                        <h4>{t('events.galleryFolderDetected', 'Gallery Folder Detected')}</h4>
                                        <p>{t('events.galleryFolderQuestion', 'This event has an associated photo gallery. What would you like to do with the photos?')}</p>
                                    </div>
                                </div>

                                <div className="delete-options">
                                    <label className="delete-option">
                                        <input
                                            type="radio"
                                            name="galleryAction"
                                            checked={!deleteGalleryToo}
                                            onChange={() => setDeleteGalleryToo(false)}
                                        />
                                        <div className="option-content">
                                            <strong>{t('events.keepGalleryPhotos', 'Keep Gallery Photos')}</strong>
                                            <p>{t('events.keepGalleryDescription', 'Delete only the event, preserve all photos in the gallery')}</p>
                                        </div>
                                    </label>

                                    <label className="delete-option danger">
                                        <input
                                            type="radio"
                                            name="galleryAction"
                                            checked={deleteGalleryToo}
                                            onChange={() => setDeleteGalleryToo(true)}
                                        />
                                        <div className="option-content">
                                            <strong>{t('events.deleteGalleryToo', 'Delete Gallery Too')}</strong>
                                            <p>{t('events.deleteGalleryDescription', 'Delete the event AND permanently remove all photos from the gallery')}</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Final Warning */}
                    <div className="form-section">
                        <h4>
                            <ExclamationCircle size={18} />
                            {t('events.finalWarning', 'Final Warning')}
                        </h4>

                        <div className="error-alert">
                            ⚠️ {t('events.irreversibleAction', 'This action is irreversible and cannot be undone!')}
                        </div>
                    </div>
                </div>

                <div className="form-creation-modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        {t('general.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <div className="loading-spinner-mini" aria-hidden="true"></div>
                                {t('events.deleting', 'Deleting...')}
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                {deleteGalleryToo ? t('events.deleteEventAndGallery', 'Delete Event & Gallery') : t('events.deleteEventOnly', 'Delete Event Only')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteEventModal;