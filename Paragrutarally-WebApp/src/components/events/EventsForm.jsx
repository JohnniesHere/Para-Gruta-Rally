import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const EventForm = ({ onEventCreated }) => {
    const [eventData, setEventData] = useState({
        name: '',
        date: '',
        location: '',
        description: '',
        maxParticipants: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData(prevData => ({
            ...prevData,
            [name]: name === 'maxParticipants' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const newEvent = {
                ...eventData,
                createdAt: serverTimestamp(),
                participants: []
            };

            const docRef = await addDoc(collection(db, 'events'), newEvent);
            onEventCreated({ id: docRef.id, ...newEvent });

            // Reset form
            setEventData({
                name: '',
                date: '',
                location: '',
                description: '',
                maxParticipants: 0
            });
        } catch (err) {
            setError('Failed to create event');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="event-form">
            <h2>Create New Event</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Event Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={eventData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={eventData.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={eventData.location}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={eventData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="maxParticipants">Max Participants</label>
                    <input
                        type="number"
                        id="maxParticipants"
                        name="maxParticipants"
                        value={eventData.maxParticipants}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </form>
        </div>
    );
};

export default EventForm;