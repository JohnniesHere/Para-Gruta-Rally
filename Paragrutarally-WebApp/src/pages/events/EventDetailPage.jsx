import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import EventRegistration from '../../components/parent/EventRegistration';
import VehicleAssignment from '../../components/vehicles/VehicleAssignment';
import InstructorAssignment from '../../components/instructors/InstructorAssignment';
import GalleryViewer from '../../components/gallery/GalleryViewer';
import PhotoUploader from '../../components/admin/PhotoUploader';

const EventDetailPage = () => {
    const { eventId } = useParams();
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                if (eventDoc.exists()) {
                    setEvent({ id: eventDoc.id, ...eventDoc.data() });
                } else {
                    setError('Event not found');
                }
            } catch (err) {
                setError('Failed to load event');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                navigate('/admin/events');
            } catch (err) {
                setError('Failed to delete event');
                console.error(err);
            }
        }
    };

    if (loading) return <div>Loading event details...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const isAdmin = userRole === 'admin';
    const isParent = userRole === 'parent';
    const eventDate = new Date(event?.date);
    const isPastEvent = eventDate < new Date();

    return (
        <div className="event-detail-page">
            <div className="page-header">
                <div className="breadcrumbs">
                    {isAdmin ? (
                        <Link to="/admin/events">Events</Link>
                    ) : (
                        <Link to="/parent/events">Events</Link>
                    )} / {event?.name}
                </div>

                {isAdmin && (
                    <div className="action-buttons">
                        <Link to={`/admin/events/${eventId}/edit`} className="button">Edit Event</Link>
                        <button onClick={handleDelete} className="delete-btn">Delete</button>
                    </div>
                )}
            </div>

            <div className="event-header">
                <h1>{event?.name}</h1>
                <div className="event-meta">
          <span className="event-date">
            <i className="fa fa-calendar"></i> {eventDate.toLocaleDateString()}
          </span>
                    <span className="event-location">
            <i className="fa fa-map-marker"></i> {event?.location}
          </span>
                    <span className="event-participants">
            <i className="fa fa-users"></i> {event?.participants?.length || 0} / {event?.maxParticipants}
          </span>
                </div>
            </div>

            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>

                {isAdmin && (
                    <>
                        <button
                            className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
                            onClick={() => setActiveTab('participants')}
                        >
                            Participants
                        </button>

                        <button
                            className={`tab-button ${activeTab === 'vehicles' ? 'active' : ''}`}
                            onClick={() => setActiveTab('vehicles')}
                        >
                            Vehicles
                        </button>

                        <button
                            className={`tab-button ${activeTab === 'instructors' ? 'active' : ''}`}
                            onClick={() => setActiveTab('instructors')}
                        >
                            Instructors
                        </button>
                    </>
                )}

                <button
                    className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gallery')}
                >
                    Gallery
                </button>

                {isParent && !isPastEvent && (
                    <button
                        className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Register
                    </button>
                )}
            </div>

            <div className="tab-content">
                {activeTab === 'details' && (
                    <div className="card">
                        <h2>Event Details</h2>
                        <p className="event-description">{event?.description}</p>

                        <div className="event-info">
                            <h3>Event Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Date:</span>
                                    <span className="info-value">{eventDate.toLocaleDateString()}</span>
                                </div>

                                <div className="info-item">
                                    <span className="info-label">Time:</span>
                                    <span className="info-value">{eventDate.toLocaleTimeString()}</span>
                                </div>

                                <div className="info-item">
                                    <span className="info-label">Location:</span>
                                    <span className="info-value">{event?.location}</span>
                                </div>

                                <div className="info-item">
                                    <span className="info-label">Max Participants:</span>
                                    <span className="info-value">{event?.maxParticipants}</span>
                                </div>

                                <div className="info-item">
                                    <span className="info-label">Current Participants:</span>
                                    <span className="info-value">{event?.participants?.length || 0}</span>
                                </div>

                                <div className="info-item">
                                    <span className="info-label">Status:</span>
                                    <span className="info-value">
                    {isPastEvent ? 'Completed' : 'Upcoming'}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && isAdmin && (
                    <div className="card">
                        <h2>Participants</h2>
                        {event?.participants?.length === 0 ? (
                            <p>No participants registered for this event yet.</p>
                        ) : (
                            <ParticipantsList eventId={eventId} participants={event?.participants} />
                        )}
                    </div>
                )}

                {activeTab === 'vehicles' && isAdmin && (
                    <div className="card">
                        <h2>Vehicle Assignment</h2>
                        <VehicleAssignment eventId={eventId} />
                    </div>
                )}

                {activeTab === 'instructors' && isAdmin && (
                    <div className="card">
                        <h2>Instructor Assignment</h2>
                        <InstructorAssignment eventId={eventId} />
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="card">
                        <h2>Event Gallery</h2>
                        <GalleryViewer eventId={eventId} />

                        {isAdmin && (
                            <div className="upload-section">
                                <h3>Upload Photos</h3>
                                <PhotoUploader eventId={eventId} />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'register' && isParent && !isPastEvent && (
                    <div className="card">
                        <h2>Register for Event</h2>
                        <EventRegistration eventId={eventId} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for displaying participants
const ParticipantsList = ({ eventId, participants }) => {
    const [childrenData, setChildrenData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChildrenData = async () => {
            try {
                const data = {};

                for (const participant of participants) {
                    if (participant.childId) {
                        const childDoc = await getDoc(doc(db, 'children', participant.childId));
                        if (childDoc.exists()) {
                            // Get parent info as well
                            const childData = childDoc.data();
                            let parentData = { name: 'Unknown' };

                            if (childData.parentId) {
                                const parentDoc = await getDoc(doc(db, 'users', childData.parentId));
                                if (parentDoc.exists()) {
                                    parentData = parentDoc.data();
                                }
                            }

                            data[participant.childId] = {
                                ...childData,
                                parent: parentData
                            };
                        }
                    }
                }

                setChildrenData(data);
            } catch (err) {
                console.error('Error fetching children data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChildrenData();
    }, [participants]);

    if (loading) return <div>Loading participants data...</div>;

    return (
        <div className="participants-table-container">
            <table className="participants-table">
                <thead>
                <tr>
                    <th>Child Name</th>
                    <th>Parent</th>
                    <th>Special Needs</th>
                    <th>Assigned Vehicle</th>
                    <th>Registration Date</th>
                </tr>
                </thead>
                <tbody>
                {participants.map((participant) => {
                    const childData = childrenData[participant.childId] || {};
                    return (
                        <tr key={participant.childId}>
                            <td>{childData.name || 'Unknown'}</td>
                            <td>{childData.parent?.name || 'Unknown'}</td>
                            <td>{childData.specialNeeds || 'None'}</td>
                            <td>{participant.vehicleId ? 'Assigned' : 'Not Assigned'}</td>
                            <td>
                                {participant.registeredAt ?
                                    new Date(participant.registeredAt).toLocaleDateString() :
                                    'Unknown'}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default EventDetailPage;