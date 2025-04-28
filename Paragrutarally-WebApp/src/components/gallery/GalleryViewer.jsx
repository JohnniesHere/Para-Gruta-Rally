import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const GalleryViewer = ({ eventId }) => {
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                let photosQuery;

                if (eventId) {
                    // Fetch photos for a specific event
                    photosQuery = query(
                        collection(db, 'gallery'),
                        where('eventId', '==', eventId),
                        orderBy('uploadedAt', 'desc')
                    );
                } else {
                    // Fetch all photos
                    photosQuery = query(
                        collection(db, 'gallery'),
                        orderBy('uploadedAt', 'desc')
                    );
                }

                const querySnapshot = await getDocs(photosQuery);

                let allPhotos = [];
                querySnapshot.forEach(doc => {
                    const galleryData = doc.data();
                    // Flatten the photos from each gallery document
                    if (galleryData.photos && galleryData.photos.length > 0) {
                        galleryData.photos.forEach(photo => {
                            allPhotos.push({
                                id: `${doc.id}_${photo.url}`, // Create a unique ID
                                eventId: galleryData.eventId,
                                ...photo
                            });
                        });
                    }
                });

                setPhotos(allPhotos);
            } catch (err) {
                setError('Failed to load gallery photos');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, [eventId]);

    const openPhotoModal = (photo) => {
        setSelectedPhoto(photo);
    };

    const closePhotoModal = () => {
        setSelectedPhoto(null);
    };

    if (loading) return <div>Loading gallery...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="gallery-viewer">
            {photos.length === 0 ? (
                <div className="info-message">
                    <p>No photos available{eventId ? ' for this event' : ''}.</p>
                </div>
            ) : (
                <div className="photo-grid">
                    {photos.map(photo => (
                        <div
                            key={photo.id}
                            className="photo-thumbnail"
                            onClick={() => openPhotoModal(photo)}
                        >
                            <img src={photo.url} alt={photo.caption || 'Event photo'} />
                            {photo.caption && <div className="caption">{photo.caption}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Photo modal */}
            {selectedPhoto && (
                <div className="photo-modal">
                    <div className="modal-backdrop" onClick={closePhotoModal}></div>
                    <div className="modal-content">
                        <button className="close-button" onClick={closePhotoModal}>&times;</button>
                        <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Event photo'} />
                        {selectedPhoto.caption && (
                            <div className="modal-caption">{selectedPhoto.caption}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryViewer;