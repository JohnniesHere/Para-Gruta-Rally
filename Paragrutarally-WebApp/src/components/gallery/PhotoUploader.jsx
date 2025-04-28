import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../../services/firebase/firebase';

const PhotoUploader = ({ eventId }) => {
    const [files, setFiles] = useState([]);
    const [captions, setCaptions] = useState({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!eventId) return;

            try {
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                if (eventDoc.exists()) {
                    setEvent({ id: eventDoc.id, ...eventDoc.data() });
                }
            } catch (err) {
                console.error('Error fetching event details:', err);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);

        // Initialize captions object
        const initialCaptions = {};
        selectedFiles.forEach((file, index) => {
            initialCaptions[index] = '';
        });
        setCaptions(initialCaptions);
    };

    const handleCaptionChange = (index, caption) => {
        setCaptions(prev => ({
            ...prev,
            [index]: caption
        }));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        if (!eventId) {
            setError('No event specified for these photos');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);
        setUploadProgress(0);

        try {
            // Check if a gallery document exists for this event
            const galleryRef = collection(db, 'gallery');
            const galleryQuerySnapshot = await getDocs(query(galleryRef, where('eventId', '==', eventId)));

            let galleryDocId;
            if (!galleryQuerySnapshot.empty) {
                // Use existing gallery document
                galleryDocId = galleryQuerySnapshot.docs[0].id;
            } else {
                // Create new gallery document
                const newGalleryDoc = await addDoc(galleryRef, {
                    eventId,
                    photos: [],
                    createdAt: serverTimestamp()
                });
                galleryDocId = newGalleryDoc.id;
            }

            // Upload each file
            const uploadedPhotos = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const caption = captions[i] || '';

                // Create storage reference
                const storageRef = ref(storage, `gallery/${eventId}/${Date.now()}_${file.name}`);

                // Upload file
                await uploadBytes(storageRef, file);

                // Get download URL
                const downloadURL = await getDownloadURL(storageRef);

                // Add to uploaded photos array
                uploadedPhotos.push({
                    url: downloadURL,
                    caption,
                    uploadedAt: new Date().toISOString(),
                    tags: event ? [event.name] : []
                });

                // Update progress
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }

            // Update gallery document with new photos
            await updateDoc(doc(db, 'gallery', galleryDocId), {
                photos: arrayUnion(...uploadedPhotos),
                updatedAt: serverTimestamp()
            });

            setSuccess(true);
            setFiles([]);
            setCaptions({});
        } catch (err) {
            setError('Error uploading photos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="photo-uploader">
            <h2>Upload Photos{event ? ` for ${event.name}` : ''}</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Photos uploaded successfully!</div>}

            <div className="file-input-container">
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={loading}
                />
                <p className="help-text">Select multiple images to upload</p>
            </div>

            {files.length > 0 && (
                <div className="selected-files">
                    <h3>Selected Files ({files.length})</h3>

                    <div className="file-list">
                        {files.map((file, index) => (
                            <div key={index} className="file-item">
                                <div className="file-preview">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview of ${file.name}`}
                                    />
                                </div>
                                <div className="file-details">
                                    <p className="file-name">{file.name}</p>
                                    <input
                                        type="text"
                                        placeholder="Add a caption (optional)"
                                        value={captions[index] || ''}
                                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {loading && (
                        <div className="upload-progress">
                            <div
                                className="progress-bar"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                            <span>{uploadProgress}%</span>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="upload-button"
                    >
                        {loading ? 'Uploading...' : 'Upload Photos'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;