// src/pages/shared/GalleryPage.jsx - Full Translation Support
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes, getMetadata } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Dashboard from '../../components/layout/Dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStorage } from '../../hooks/useStorage';
import {
    IconPhoto as Photo,
    IconUpload as Upload,
    IconDownload as Download,
    IconTrash as Trash,
    IconEye as Eye,
    IconX as X,
    IconChevronLeft as ChevronLeft,
    IconChevronRight as ChevronRight,
    IconGrid3x3 as Grid,
    IconGridDots as GridLarge,
    IconGridPattern as GridSmall,
    IconFolderOpen as Folder,
    IconRefresh as Refresh,
    IconPlus as Plus,
    IconHome as Home
} from '@tabler/icons-react';
import './GalleryPage.css';

const GalleryPage = () => {
    const { userRole } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const { eventId } = useParams(); // For event-specific galleries
    const navigate = useNavigate();

    // Gallery state
    const [albums, setAlbums] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [filteredPhotos, setFilteredPhotos] = useState([]);
    const [activeAlbum, setActiveAlbum] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI state
    const [viewSize, setViewSize] = useState('medium'); // small, medium, large
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Storage hook for uploads
    const { startUpload, progress, error: uploadError, url, isComplete, resetUpload } = useStorage('gallery');

    // Load albums and photos on mount
    useEffect(() => {
        loadGalleryData();
    }, [eventId]);

    // Filter photos when active album changes
    useEffect(() => {
        filterPhotos();
    }, [activeAlbum, photos]);

    const loadGalleryData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Load albums (events + general)
            await loadAlbums();

            // Load photos
            await loadPhotos();

        } catch (err) {
            console.error('Error loading gallery data:', err);
            setError(t('gallery.failedToLoad', 'Failed to load gallery. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const loadAlbums = async () => {
        try {
            const albumsList = [
                { id: 'all', name: t('gallery.allPhotos', 'All Photos'), type: 'all' },
                { id: 'general', name: t('gallery.generalPhotos', 'General Photos'), type: 'folder' }
            ];

            // Load events from Firestore to create event albums
            const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
            const eventsSnapshot = await getDocs(eventsQuery);

            eventsSnapshot.forEach((doc) => {
                const eventData = doc.data();
                albumsList.push({
                    id: `event_${doc.id}`,
                    name: t('gallery.eventAlbum', '{eventName} Album', { eventName: eventData.name }),
                    type: 'event',
                    eventId: doc.id,
                    eventName: eventData.name
                });
            });

            setAlbums(albumsList);

            // If we're viewing a specific event gallery, set it as active
            if (eventId) {
                setActiveAlbum(`event_${eventId}`);
            }
        } catch (err) {
            console.error('Error loading albums:', err);
            throw err;
        }
    };

    const loadPhotos = async () => {
        try {
            const allPhotos = [];

            // Load photos from general folder
            await loadPhotosFromFolder('gallery/general', 'general', allPhotos);

            // Load photos from each event folder
            try {
                const eventsQuery = query(collection(db, 'events'));
                const eventsSnapshot = await getDocs(eventsQuery);

                for (const eventDoc of eventsSnapshot.docs) {
                    const eventData = eventDoc.data();
                    if (eventData.name) {
                        await loadPhotosFromFolder(
                            `gallery/events/${eventData.name}`,
                            `event_${eventDoc.id}`,
                            allPhotos,
                            eventData.name
                        );
                    }
                }
            } catch (eventsError) {
                console.warn('Error loading events for albums:', eventsError);
                // Continue even if events loading fails
            }

            setPhotos(allPhotos);
        } catch (err) {
            console.error('Error loading photos:', err);
            throw err;
        }
    };

    // Helper function to check if a file is an image
    const isImageFile = (filename) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return imageExtensions.includes(extension);
    };

    const loadPhotosFromFolder = async (folderPath, albumId, photosArray, eventName = null) => {
        try {
            console.log(`Loading photos from: ${folderPath}`);
            const folderRef = ref(storage, folderPath);
            const result = await listAll(folderRef);

            console.log(`Found ${result.items.length} items in ${folderPath}`);

            for (const itemRef of result.items) {
                try {
                    // Skip placeholder files and non-image files
                    if (itemRef.name === '.folder_info.json' ||
                        itemRef.name.startsWith('.') ||
                        !isImageFile(itemRef.name)) {
                        console.log(`Skipping non-image file: ${itemRef.name}`);
                        continue;
                    }

                    // Get download URL first
                    const url = await getDownloadURL(itemRef);

                    // Try to get metadata, but don't fail if it's not available
                    let metadata = null;
                    try {
                        metadata = await getMetadata(itemRef);
                    } catch (metadataError) {
                        console.warn(`Failed to get metadata for ${itemRef.name}:`, metadataError);
                        // Use default values if metadata is not available
                        metadata = {
                            timeCreated: new Date().toISOString(),
                            size: 0
                        };
                    }

                    const photo = {
                        id: `${albumId}_${itemRef.name}`,
                        name: itemRef.name,
                        url: url,
                        albumId: albumId,
                        eventName: eventName,
                        uploadDate: metadata.timeCreated || new Date().toISOString(),
                        size: metadata.size || 0,
                        fullPath: itemRef.fullPath,
                        storageRef: itemRef
                    };

                    photosArray.push(photo);
                    console.log(`Successfully loaded photo: ${itemRef.name}`);

                } catch (photoError) {
                    console.warn(`Failed to load photo ${itemRef.name}:`, photoError);
                    // Continue with next photo instead of failing completely
                }
            }
        } catch (err) {
            // Folder might not exist yet, which is okay
            console.log(`Folder ${folderPath} not found or empty:`, err.message);
        }
    };

    const filterPhotos = () => {
        if (activeAlbum === 'all') {
            setFilteredPhotos(photos);
        } else {
            setFilteredPhotos(photos.filter(photo => photo.albumId === activeAlbum));
        }
    };

    const handleAlbumChange = (albumId) => {
        setActiveAlbum(albumId);
        setSelectedPhoto(null);
    };

    const handlePhotoClick = (photo, index) => {
        setSelectedPhoto(photo);
        setCurrentPhotoIndex(index);
    };

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    const handlePreviousPhoto = () => {
        const prevIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : filteredPhotos.length - 1;
        setCurrentPhotoIndex(prevIndex);
        setSelectedPhoto(filteredPhotos[prevIndex]);
    };

    const handleNextPhoto = () => {
        const nextIndex = currentPhotoIndex < filteredPhotos.length - 1 ? currentPhotoIndex + 1 : 0;
        setCurrentPhotoIndex(nextIndex);
        setSelectedPhoto(filteredPhotos[nextIndex]);
    };

    const handleDownload = async (photo) => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = photo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading photo:', err);
            alert(t('gallery.downloadFailed', 'Failed to download photo. Please try again.'));
        }
    };

    const handleDeletePhoto = async (photo) => {
        if (!canDelete()) {
            alert(t('gallery.noPermissionDelete', 'You do not have permission to delete photos.'));
            return;
        }

        if (!window.confirm(t('gallery.deleteConfirm', 'Are you sure you want to delete this photo? This action cannot be undone.'))) {
            return;
        }

        try {
            // Delete from Firebase Storage
            await deleteObject(photo.storageRef);

            // Remove from local state
            setPhotos(photos.filter(p => p.id !== photo.id));

            // Close modal if this photo was selected
            if (selectedPhoto && selectedPhoto.id === photo.id) {
                handleCloseModal();
            }

            alert(t('gallery.deleteSuccess', 'Photo deleted successfully.'));
        } catch (err) {
            console.error('Error deleting photo:', err);
            alert(t('gallery.deleteFailed', 'Failed to delete photo. Please try again.'));
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (!canUpload()) {
            alert(t('gallery.noPermissionUpload', 'You do not have permission to upload photos.'));
            return;
        }

        setIsUploading(true);

        try {
            for (const file of files) {
                // Determine upload path based on active album
                let uploadPath = 'gallery/general'; // default

                if (activeAlbum.startsWith('event_')) {
                    const album = albums.find(a => a.id === activeAlbum);
                    if (album && album.eventName) {
                        uploadPath = `gallery/events/${album.eventName}`;
                    }
                } else if (activeAlbum === 'general') {
                    uploadPath = 'gallery/general';
                }

                // Create unique filename
                const timestamp = Date.now();
                const fileName = `${timestamp}_${file.name}`;
                const storageRef = ref(storage, `${uploadPath}/${fileName}`);

                // Upload file
                await uploadBytes(storageRef, file);
                console.log(`Uploaded ${fileName} to ${uploadPath}`);
            }

            // Reload photos after upload
            await loadPhotos();
            alert(t('gallery.uploadSuccess', 'Successfully uploaded {count} photo(s).', { count: files.length }));

        } catch (err) {
            console.error('Error uploading photos:', err);
            alert(t('gallery.uploadFailed', 'Failed to upload photos. Please try again.'));
        } finally {
            setIsUploading(false);
        }
    };

    // Permission checks
    const canUpload = () => {
        return ['admin', 'host', 'instructor'].includes(userRole);
    };

    const canDelete = () => {
        return userRole === 'admin';
    };

    const canView = () => {
        return ['admin', 'host', 'instructor', 'parent'].includes(userRole);
    };

    // Get grid class based on view size
    const getGridClass = () => {
        switch (viewSize) {
            case 'small': return 'photo-grid-small';
            case 'large': return 'photo-grid-large';
            default: return 'photo-grid-medium';
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!canView()) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className="gallery-page">
                    <div className="error-message">
                        <h2>{t('gallery.accessDenied', 'Access Denied')}</h2>
                        <p>{t('gallery.noPermissionView', 'You do not have permission to view the gallery.')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`gallery-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                {/* Header - TRANSLATED */}
                <h1 className="page-title">
                    <Photo size={32} className="page-title-icon" />
                    {t('gallery.title', 'Photo Gallery')}
                </h1>
                <div className="gallery-header">
                    <div className="gallery-title-section">
                        {eventId && (
                            <button
                                onClick={() => navigate('/gallery')}
                                className="back-to-main-gallery"
                            >
                                <Home size={16} />
                                {t('gallery.backToMainGallery', 'Back to Main Gallery')}
                            </button>
                        )}
                    </div>

                    <div className="gallery-actions">
                        <button
                            onClick={loadGalleryData}
                            className="action-button refresh-button"
                            disabled={isLoading}
                        >
                            <Refresh size={16} />
                            {t('gallery.refresh', 'Refresh')}
                        </button>

                        {canUpload() && (
                            <>
                                <input
                                    type="file"
                                    id="photo-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    onClick={() => document.getElementById('photo-upload').click()}
                                    className="primary-button upload-button"
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="upload-spinner" />
                                            {t('gallery.uploading', 'Uploading...')}
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            {t('gallery.uploadPhotos', 'Upload Photos')}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <p>{error}</p>
                        <button onClick={loadGalleryData}>{t('gallery.tryAgain', 'Try Again')}</button>
                    </div>
                )}

                {/* Controls */}
                <div className="gallery-controls">
                    {/* Album Selector */}
                    <div className="album-selector">
                        {albums.map(album => (
                            <button
                                key={album.id}
                                className={`album-button ${activeAlbum === album.id ? 'active' : ''}`}
                                onClick={() => handleAlbumChange(album.id)}
                            >
                                {album.type === 'folder' && <Folder size={16} />}
                                {album.type === 'event' && <Photo size={16} />}
                                {album.name}
                                {album.type === 'all' && (
                                    <span className="photo-count">({photos.length})</span>
                                )}
                                {album.type !== 'all' && (
                                    <span className="photo-count">
                                        ({photos.filter(p => p.albumId === album.id).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* View Size Controls - TRANSLATED */}
                    <div className="view-controls">
                        <div className="size-controls">
                            <button
                                className={`size-button ${viewSize === 'small' ? 'active' : ''}`}
                                onClick={() => setViewSize('small')}
                                title={t('gallery.smallView', 'Small view')}
                            >
                                <GridSmall size={18} />
                            </button>
                            <button
                                className={`size-button ${viewSize === 'medium' ? 'active' : ''}`}
                                onClick={() => setViewSize('medium')}
                                title={t('gallery.mediumView', 'Medium view')}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                className={`size-button ${viewSize === 'large' ? 'active' : ''}`}
                                onClick={() => setViewSize('large')}
                                title={t('gallery.largeView', 'Large view')}
                            >
                                <GridLarge size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Photos Grid - TRANSLATED */}
                {isLoading ? (
                    <div className="loading-gallery">
                        <div className="loading-spinner" />
                        <p>{t('gallery.loadingPhotos', 'Loading photos...')}</p>
                    </div>
                ) : filteredPhotos.length > 0 ? (
                    <div className={`photo-grid ${getGridClass()}`}>
                        {filteredPhotos.map((photo, index) => (
                            <div key={photo.id} className="photo-card">
                                <div className="photo-thumbnail" onClick={() => handlePhotoClick(photo, index)}>
                                    <img src={photo.url} alt={photo.name} />
                                    <div className="photo-overlay">
                                        <Eye size={24} />
                                    </div>
                                </div>
                                <div className="photo-info">
                                    <h3>{photo.name}</h3>
                                    {photo.eventName && (
                                        <p className="photo-event">{t('gallery.from', 'From:')} {photo.eventName}</p>
                                    )}
                                    <p className="photo-date">
                                        {new Date(photo.uploadDate).toLocaleDateString()}
                                    </p>
                                    <div className="photo-actions">
                                        <button
                                            onClick={() => handleDownload(photo)}
                                            className="action-button download-button"
                                            title={t('gallery.download', 'Download')}
                                        >
                                            <Download size={14} />
                                        </button>
                                        {canDelete() && (
                                            <button
                                                onClick={() => handleDeletePhoto(photo)}
                                                className="action-button delete-button"
                                                title={t('gallery.delete', 'Delete')}
                                            >
                                                <Trash size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-gallery">
                        <Photo size={64} className="empty-icon" />
                        <h3>{t('gallery.noPhotosFound', 'No photos found')}</h3>
                        <p>
                            {activeAlbum === 'all'
                                ? t('gallery.noPhotosUploaded', 'No photos have been uploaded yet.')
                                : t('gallery.albumEmpty', 'This album is empty.')
                            }
                        </p>
                        {canUpload() && (
                            <button
                                onClick={() => document.getElementById('photo-upload').click()}
                                className="primary-button"
                            >
                                <Upload size={16} />
                                {t('gallery.uploadFirstPhoto', 'Upload First Photo')}
                            </button>
                        )}
                    </div>
                )}

                {/* Photo Modal - TRANSLATED */}
                {selectedPhoto && (
                    <div className="photo-modal-overlay" onClick={handleCloseModal}>
                        <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
                            {/* Close button */}
                            <button className="modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>

                            {/* Main content container */}
                            <div className="modal-main-content">
                                {/* Left side - Photo area */}
                                <div className="modal-photo-area">
                                    {/* Navigation buttons */}
                                    <button
                                        className="nav-button prev-button"
                                        onClick={handlePreviousPhoto}
                                        disabled={filteredPhotos.length <= 1}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    {/* Photo container */}
                                    <div className="modal-photo-container">
                                        <img src={selectedPhoto.url} alt={selectedPhoto.name} />
                                    </div>

                                    <button
                                        className="nav-button next-button"
                                        onClick={handleNextPhoto}
                                        disabled={filteredPhotos.length <= 1}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>

                                {/* Right side - Metadata area - TRANSLATED */}
                                <div className="modal-meta-area">
                                    <div className="modal-meta-content">
                                        <h3>{selectedPhoto.name}</h3>

                                        {selectedPhoto.eventName && (
                                            <div className="meta-item">
                                                <span className="meta-label">{t('gallery.from', 'From:')}</span>
                                                <span className="meta-value event-badge">{selectedPhoto.eventName}</span>
                                            </div>
                                        )}

                                        <div className="meta-item">
                                            <span className="meta-label">{t('gallery.uploaded', 'Uploaded:')}</span>
                                            <span className="meta-value">{new Date(selectedPhoto.uploadDate).toLocaleDateString()}</span>
                                        </div>

                                        <div className="meta-item">
                                            <span className="meta-label">{t('gallery.size', 'Size:')}</span>
                                            <span className="meta-value">{formatFileSize(selectedPhoto.size)}</span>
                                        </div>

                                        <div className="meta-item">
                                            <span className="meta-label">{t('gallery.position', 'Position:')}</span>
                                            <span className="meta-value">{currentPhotoIndex + 1} {t('gallery.of', 'of')} {filteredPhotos.length}</span>
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            onClick={() => handleDownload(selectedPhoto)}
                                            className="modal-action-btn download-btn"
                                        >
                                            <Download size={18} />
                                            {t('gallery.download', 'Download')}
                                        </button>
                                        {canDelete() && (
                                            <button
                                                onClick={() => handleDeletePhoto(selectedPhoto)}
                                                className="modal-action-btn delete-btn"
                                            >
                                                <Trash size={18} />
                                                {t('gallery.delete', 'Delete')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default GalleryPage;