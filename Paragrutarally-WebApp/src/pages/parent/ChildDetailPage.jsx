import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ChildDetailPage = () => {
    const { childId } = useParams();
    const { currentUser } = useAuth();
    const [child, setChild] = useState(null);
    const [participatedEvents, setParticipatedEvents] = useState([]);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        dateOfBirth: '',
        specialNeeds: '',
        medicalInfo: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchChildData = async () => {
            if (!currentUser || !childId) return;

            try {
                // Fetch child details
                const childDoc = await getDoc(doc(db, 'children', childId));
                if (!childDoc.exists()) {
                    setError('Child not found');
                    setLoading(false);
                    return;
                }

                const childData = childDoc.data();

                // Verify parent has access to this child
                if (childData.parentId !== currentUser.uid) {
                    setError('You do not have permission to view this child');
                    setLoading(false);
                    return;
                }

                setChild({ id: childDoc.id, ...childData });
                setFormData({
                    name: childData.name || '',
                    dateOfBirth: childData.dateOfBirth || '',
                    specialNeeds: childData.specialNeeds || '',
                    medicalInfo: childData.medicalInfo || ''
                });

                // Fetch events this child has participated in
                if (childData.participatedEvents && childData.participatedEvents.length > 0) {
                    const eventPromises = childData.participatedEvents.map(eventId =>
                        getDoc(doc(db, 'events', eventId))
                    );

                    const eventDocs = await Promise.all(eventPromises);
                    const eventsList = eventDocs
                        .filter(doc => doc.exists())
                        .map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                    setParticipatedEvents(eventsList);
                }
            } catch (err) {
                setError('Failed to load child data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchChildData();
    }, [childId, currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            await updateDoc(doc(db, 'children', childId), {
                name: formData.name,
                dateOfBirth: formData.dateOfBirth,
                specialNeeds: formData.specialNeeds,
                medicalInfo: formData.medicalInfo
            });

            // Update local state
            setChild(prev => ({
                ...prev,
                ...formData
            }));

            setSuccess(true);
            setEditing(false);
        } catch (err) {
            setError('Failed to update child information');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading child data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="child-detail-page">
            <div className="page-header">
                <div className="breadcrumbs">
                    <Link to="/parent/profile">My Children</Link> / {child?.name}
                </div>

                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="edit-btn"
                    >
                        Edit Information
                    </button>
                )}
            </div>

            {success && <div className="success-message">Child information updated successfully!</div>}

            <div className="card">
                {editing ? (
                    <form onSubmit={handleSave}>
                        <h2>Edit Child Information</h2>

                        <div className="form-group">
                            <label htmlFor="name">Child's Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="specialNeeds">Special Needs</label>
                            <textarea
                                id="specialNeeds"
                                name="specialNeeds"
                                value={formData.specialNeeds}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Please describe any special needs or requirements"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="medicalInfo">Medical Information</label>
                            <textarea
                                id="medicalInfo"
                                name="medicalInfo"
                                value={formData.medicalInfo}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Please provide relevant medical information"
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={saving}
                                className="save-btn"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="cancel-btn"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="child-info">
                        <h2>{child?.name}</h2>

                        <div className="info-section">
                            <p><strong>Date of Birth:</strong> {new Date(child?.dateOfBirth).toLocaleDateString()}</p>

                            <h3>Special Needs</h3>
                            <p>{child?.specialNeeds || 'None specified'}</p>

                            <h3>Medical Information</h3>
                            <p>{child?.medicalInfo || 'None specified'}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <h2>Event Participation</h2>

                {participatedEvents.length === 0 ? (
                    <p>This child hasn't participated in any events yet.</p>
                ) : (
                    <div className="events-table-container">
                        <table className="events-table">
                            <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {participatedEvents.map(event => (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{new Date(event.date).toLocaleDateString()}</td>
                                    <td>{event.location}</td>
                                    <td>
                                        <a href={`/parent/events/${event.id}`} className="button small">View Event</a>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChildDetailPage;