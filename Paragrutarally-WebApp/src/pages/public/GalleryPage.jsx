import React from 'react';
import GalleryViewer from '../../components/gallery/GalleryViewer';

const GalleryPage = () => {
    return (
        <div className="gallery-page">
            <div className="page-header">
                <h1>Event Gallery</h1>
            </div>

            <div className="card">
                <p className="gallery-intro">
                    Browse photos from our past events. Each image captures the joy, excitement,
                    and unique experiences of our participants.
                </p>

                <GalleryViewer />
            </div>
        </div>
    );
};

export default GalleryPage;