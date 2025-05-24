// src/pages/shared/GalleryPage.jsx
import React, { useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './GalleryPage.css';

const GalleryPage = () => {
    const { userRole } = useAuth();
    const { isDarkMode } = useTheme(); // Fixed: was isDark, should be isDarkMode
    const [activeAlbum, setActiveAlbum] = useState('all');

    // Sample gallery data - in a real application, this would come from your database
    const albums = [
        { id: 'all', name: 'All Photos' },
        { id: 'events', name: 'Events' },
        { id: 'races', name: 'Races' },
        { id: 'teams', name: 'Teams' },
        { id: 'awards', name: 'Award Ceremonies' }
    ];

    const photos = [
        { id: 1, albumId: 'races', title: 'Summer Race 2025', thumbnailUrl: '/api/placeholder/300/200', date: 'May 20, 2025' },
        { id: 2, albumId: 'races', title: 'Beach Racing Day', thumbnailUrl: '/api/placeholder/300/200', date: 'June 15, 2025' },
        { id: 3, albumId: 'teams', title: 'Team Red', thumbnailUrl: '/api/placeholder/300/200', date: 'April 5, 2025' },
        { id: 4, albumId: 'teams', title: 'Team Blue', thumbnailUrl: '/api/placeholder/300/200', date: 'April 5, 2025' },
        { id: 5, albumId: 'awards', title: 'Awards Ceremony', thumbnailUrl: '/api/placeholder/300/200', date: 'March 12, 2025' },
        { id: 6, albumId: 'events', title: 'Charity Gala', thumbnailUrl: '/api/placeholder/300/200', date: 'February 28, 2025' },
        { id: 7, albumId: 'events', title: 'Registration Day', thumbnailUrl: '/api/placeholder/300/200', date: 'January 15, 2025' },
        { id: 8, albumId: 'races', title: 'Winter Challenge', thumbnailUrl: '/api/placeholder/300/200', date: 'January 25, 2025' }
    ];

    // Filter photos based on active album
    const filteredPhotos = activeAlbum === 'all'
        ? photos
        : photos.filter(photo => photo.albumId === activeAlbum);

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`gallery-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1>Gallery</h1>

                <div className="gallery-controls">
                    <div className="album-selector">
                        {albums.map(album => (
                            <button
                                key={album.id}
                                className={`album-button ${activeAlbum === album.id ? 'active' : ''}`}
                                onClick={() => setActiveAlbum(album.id)}
                            >
                                {album.name}
                            </button>
                        ))}
                    </div>

                    <div className="gallery-actions">
                        <button className="primary-button">
                            <span className="icon">+</span> Upload Photos
                        </button>
                    </div>
                </div>

                {filteredPhotos.length > 0 ? (
                    <div className="photo-grid">
                        {filteredPhotos.map(photo => (
                            <div className="photo-card" key={photo.id}>
                                <div className="photo-thumbnail">
                                    <img src={photo.thumbnailUrl} alt={photo.title} />
                                </div>
                                <div className="photo-info">
                                    <h3>{photo.title}</h3>
                                    <p className="photo-date">{photo.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-gallery">
                        <p>No photos found in this album.</p>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default GalleryPage;