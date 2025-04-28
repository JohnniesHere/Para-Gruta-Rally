import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const InstructorDetail = ({ instructorId }) => {
    const [instructor, setInstructor] = useState(null);
    const [assignedEvents, setAssignedEvents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [specialty, setSpecialty] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch instructor details
                const instructorDoc = await getDoc(doc(db, 'instructors', instructorId));
                if (!instructorDoc.exists()) {
                    setError('Instructor not found');
                    setLoading(false);
                    return;
                }

                const instructorData = instructorDoc.data();
                setInstructor({ id: instructorDoc.id, ...instructorData });

                // Initialize edit data
                setEditData({ id: instructorDoc.id, ...instructorData });

                // Fetch events this instructor is assigned to
                if (instructorData.assignedEvents && instructorData.assignedEvents.length > 0) {
                    const eventPromises = instructorData.assignedEvents.map(eventId =>
                        getDoc(doc(db, 'events', eventId))
                    );

                    const eventDocs = await Promise.all(eventPromises);
                    const eventsList = eventDocs
                        .filter(doc => doc.exists())
                        .map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                    setAssignedEvents(eventsList);
                }
            } catch (err) {
                setError('Failed to load instructor data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instructorId]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvailabilityChange = (day) => {
        setEditData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: !prev.availability[day]
            }
        }));
    };

    const handleAddSpecialty = () => {
        if (specialty.trim() && !editData.specialties.includes(specialty.trim())) {
            setEditData(prev => ({
                ...prev,
                specialties: [...prev.specialties, specialty.trim()]
            }));
            setSpecialty('');
        }
    };

    const handleRemoveSpecialty = (index) => {
        setEditData(prev => ({
            ...prev,
            specialties: prev.specialties.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            const instructorRef = doc(db, 'instructors', instructorId);
            await updateDoc(instructorRef, {
                name: editData.name,
                email: editData.email,
                phone: editData.phone,
                specialties: editData.specialties,
                availability: editData.availability
            });

            // Update local state
            setInstructor(editData);
            setIsEditing(false);
            setSuccess(true);
        } catch (err) {
            setError('Failed to update instructor');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading instructor data...</div>;
    if (error && !instructor) return <div className="error-message">{error}</div>;

    return (
        <div className="instructor-detail">
            <div className="detail-header">
                <h2>{isEditing ? 'Edit Instructor' : instructor?.name}</h2>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="edit-btn"
                    >
                        Edit Details
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Instructor updated successfully!</div>}

            <div className="instructor-card detail">
                {isEditing ? (
                    // Edit mode
                    <div className="instructor-edit-form">
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={editData.name}
                                onChange={handleEditChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={editData.email}
                                onChange={handleEditChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={editData.phone}
                                onChange={handleEditChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Specialties</label>
                            <div className="specialty-input">
                                <input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    placeholder="Add a specialty"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSpecialty}
                                    className="add-specialty-btn"
                                >
                                    Add
                                </button>
                            </div>

                            {editData.specialties.length > 0 && (
                                <div className="specialties-list editing">
                                    {editData.specialties.map((spec, index) => (
                                        <div key={index} className="specialty-tag">
                                            <span>{spec}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSpecialty(index)}
                                                className="remove-specialty-btn"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Availability</label>
                            <div className="availability-checkboxes">
                                {Object.keys(editData.availability).map((day) => (
                                    <div key={day} className="availability-day">
                                        <input
                                            type="checkbox"
                                            id={`edit-day-${day}`}
                                            checked={editData.availability[day]}
                                            onChange={() => handleAvailabilityChange(day)}
                                        />
                                        <label htmlFor={`edit-day-${day}`} className="day-label">
                                            {day.charAt(0).toUpperCase() + day.slice(1)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="save-btn"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="cancel-btn"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    // View mode
                    <div className="instructor-info">
                        <div className="info-section">
                            <h3>Contact Information</h3>
                            <p><strong>Email:</strong> {instructor?.email}</p>
                            <p><strong>Phone:</strong> {instructor?.phone}</p>
                        </div>

                        <div className="info-section">
                            <h3>Specialties</h3>
                            {instructor?.specialties && instructor.specialties.length > 0 ? (
                                <div className="specialties-list">
                                    {instructor.specialties.map((specialty, index) => (
                                        <span key={index} className="specialty-badge">
                      {specialty}
                    </span>
                                    ))}
                                </div>
                            ) : (
                                <p>No specialties listed</p>
                            )}
                        </div>

                        <div className="info-section">
                            <h3>Availability</h3>
                            {instructor?.availability ? (
                                <div className="availability-days">
                                    {Object.entries(instructor.availability)
                                        .map(([day, isAvailable]) => (
                                            <div key={day} className={`day-item ${isAvailable ? 'available' : 'unavailable'}`}>
                                                <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                                <span className="day-status">{isAvailable ? 'Available' : 'Unavailable'}</span>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p>No availability information</p>
                            )}
                        </div>

                        <div className="info-section">
                            <h3>Assigned Events</h3>
                            {assignedEvents.length > 0 ? (
                                <div className="assigned-events-list">
                                    {assignedEvents.map(event => (
                                        <div key={event.id} className="event-item">
                                            <span className="event-name">{event.name}</span>
                                            <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                                            <a href={`/admin/events/${event.id}`} className="button small">View Event</a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Not assigned to any events</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructorDetail;