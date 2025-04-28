import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';

const EventRegistration = ({ eventId }) => {
    const { currentUser } = useAuth();
    const [event, setEvent] = useState(null);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Fetch event details and parent's children
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser || !eventId) return;

            try {
                // Fetch event details
                const eventRef = doc(db, 'events', eventId);
                const eventDoc = await getDoc(eventRef);

                if (!eventDoc.exists()) {
                    setError('Event not found');
                    setLoading(false);
                    return;
                }

                setEvent({ id: eventDoc.id, ...eventDoc.data() });

                // Fetch parent's children
                const childrenRef = collection(db, 'children');
                const q = query(childrenRef, where('parentId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);

                const childrenList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setChildren(childrenList);
            } catch (err) {
                setError('Error loading data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, eventId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedChild || !eventId) return;

        setSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            // Check if child is already registered
            const isAlreadyRegistered = event.participants.some(
                participant => participant.childId === selectedChild
            );

            if (isAlreadyRegistered) {
                setError('This child is already registered for this event');
                return;
            }

            // Register child to event
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, {
                participants: arrayUnion({
                    childId: selectedChild,
                    registeredAt: new Date().toISOString(),
                    vehicleId: null, // Will be assigned by admin later
                    notes: ''
                })
            });

            // Update child's participated events
            const childRef = doc(db, 'children', selectedChild);
            await updateDoc(childRef, {
                participatedEvents: arrayUnion(eventId)
            });

            setSuccess(true);
            setSelectedChild('');
        } catch (err) {
            setError('Failed to register for event');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error && !event) return <div className="error-message">{error}</div>;

    return (
        <div className="event-registration">
            <h2>Register for {event?.name}</h2>

            {error && <div className="error-message">{error}</div>}
            {success && (
                <div className="success-message">
                    Registration successful! Your child has been registered for this event.
                </div>
            )}

            <div className="event-details">
                <p><strong>Date:</strong> {new Date(event?.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {event?.location}</p>
                <p><strong>Description:</strong> {event?.description}</p>
                <p><strong>Available Spots:</strong> {(event?.maxParticipants - (event?.participants?.length || 0))}</p>
            </div>

            {children.length === 0 ? (
                <div className="info-message">
                    <p>You need to register a child before signing up for events.</p>
                    <a href="/parent/register-child" className="button">Register a Child</a>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="childSelect">Select Child</label>
                        <select
                            id="childSelect"
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                            required
                        >
                            <option value="">-- Select a child --</option>
                            {children.map(child => (
                                <option key={child.id} value={child.id}>
                                    {child.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !selectedChild || (event?.participants?.length >= event?.maxParticipants)}
                    >
                        {submitting ? 'Registering...' : 'Register for Event'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default EventRegistration;