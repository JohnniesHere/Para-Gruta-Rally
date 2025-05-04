import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const InstructorAssignment = ({ eventId }) => {
    const [event, setEvent] = useState(null);
    const [instructors, setInstructors] = useState([]);
    const [assignedInstructors, setAssignedInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!eventId) return;

            try {
                // Fetch event details
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                if (!eventDoc.exists()) {
                    setError('Event not found');
                    setLoading(false);
                    return;
                }

                const eventData = eventDoc.data();
                setEvent({ id: eventDoc.id, ...eventData });

                // Get assigned instructors
                setAssignedInstructors(eventData.instructors || []);

                // Fetch all instructors
                const instructorsCollection = collection(db, 'instructors');
                const instructorsSnapshot = await getDocs(instructorsCollection);

                const instructorsList = instructorsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setInstructors(instructorsList);
            } catch (err) {
                setError('Failed to load data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    const isInstructorAssigned = (instructorId) => {
        return assignedInstructors.includes(instructorId);
    };

    const handleToggleAssignment = (instructorId) => {
        if (isInstructorAssigned(instructorId)) {
            // Remove assignment
            setAssignedInstructors(
                assignedInstructors.filter(id => id !== instructorId)
            );
        } else {
            // Add assignment
            setAssignedInstructors([...assignedInstructors, instructorId]);
        }
    };

    const handleSaveAssignments = async () => {
        if (!event) return;

        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            // Update event with assigned instructors
            await updateDoc(doc(db, 'events', eventId), {
                instructors: assignedInstructors
            });

            // Update each instructor's assignedEvents field
            for (const instructor of instructors) {
                const instructorRef = doc(db, 'instructors', instructor.id);

                if (assignedInstructors.includes(instructor.id)) {
                    // Add this event to instructor's assignedEvents if not already there
                    if (!instructor.assignedEvents?.includes(eventId)) {
                        await updateDoc(instructorRef, {
                            assignedEvents: arrayUnion(eventId)
                        });
                    }
                } else {
                    // Remove this event from instructor's assignedEvents
                    if (instructor.assignedEvents?.includes(eventId)) {
                        await updateDoc(instructorRef, {
                            assignedEvents: arrayRemove(eventId)
                        });
                    }
                }
            }

            setSuccess(true);
        } catch (err) {
            setError('Failed to save instructor assignments');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading assignment data...</div>;
    if (error && !event) return <div className="error-message">{error}</div>;

    return (
        <div className="instructor-assignment">
            <h2>Instructor Assignments for {event?.name}</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Assignments saved successfully!</div>}

            {instructors.length === 0 ? (
                <p>No instructors available. Add some instructors first.</p>
            ) : (
                <>
                    <div className="instructors-grid">
                        {instructors.map(instructor => (
                            <div
                                key={instructor.id}
                                className={`instructor-card ${isInstructorAssigned(instructor.id) ? 'assigned' : ''}`}
                                onClick={() => handleToggleAssignment(instructor.id)}
                            >
                                <div className="instructor-header">
                                    <h3>{instructor.name}</h3>
                                    <div className="assignment-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={isInstructorAssigned(instructor.id)}
                                            onChange={() => {}} // Handled by the onClick on the card
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="instructor-details">
                                    <p><strong>Email:</strong> {instructor.email}</p>
                                    <p><strong>Phone:</strong> {instructor.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="assignment-summary">
                        <p>
                            <strong>Selected Instructors:</strong> {assignedInstructors.length} of {instructors.length}
                        </p>
                    </div>

                    <div className="button-container">
                        <button
                            onClick={handleSaveAssignments}
                            disabled={saving}
                            className="save-btn"
                        >
                            {saving ? 'Saving...' : 'Save Assignments'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default InstructorAssignment;