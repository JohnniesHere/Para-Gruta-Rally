import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const VehicleAssignment = ({ eventId }) => {
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [assignments, setAssignments] = useState({});
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

                // Initialize participants
                const participantsList = [];
                const initialAssignments = {};

                // Fetch child details for each participant
                if (eventData.participants && eventData.participants.length > 0) {
                    for (const participant of eventData.participants) {
                        try {
                            const childDoc = await getDoc(doc(db, 'children', participant.childId));
                            if (childDoc.exists()) {
                                const childData = childDoc.data();

                                participantsList.push({
                                    ...participant,
                                    childName: childData.name,
                                    childInfo: childData
                                });

                                // Initialize assignment from existing data
                                initialAssignments[participant.childId] = participant.vehicleId || '';
                            }
                        } catch (err) {
                            console.error(`Error fetching child ${participant.childId}:`, err);
                        }
                    }
                }

                setParticipants(participantsList);
                setAssignments(initialAssignments);

                // Fetch available vehicles
                const vehiclesRef = collection(db, 'vehicles');
                const vehiclesQuery = query(vehiclesRef, where('status', 'in', ['available', 'in-use']));
                const vehiclesSnapshot = await getDocs(vehiclesQuery);

                const vehiclesList = vehiclesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setVehicles(vehiclesList);
            } catch (err) {
                setError('Failed to load event data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    const handleAssignmentChange = (childId, vehicleId) => {
        setAssignments(prev => ({
            ...prev,
            [childId]: vehicleId
        }));
    };

    const handleSaveAssignments = async () => {
        if (!event) return;

        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            // Update event participants with vehicle assignments
            const updatedParticipants = event.participants.map(participant => {
                const vehicleId = assignments[participant.childId] || null;
                return {
                    ...participant,
                    vehicleId
                };
            });

            // Update event document
            await updateDoc(doc(db, 'events', eventId), {
                participants: updatedParticipants
            });

            // Update vehicles status
            const usedVehicleIds = Object.values(assignments).filter(id => id);

            for (const vehicle of vehicles) {
                const isInUse = usedVehicleIds.includes(vehicle.id);
                const newStatus = isInUse ? 'in-use' : 'available';

                // Only update if status needs to change
                if (vehicle.status !== newStatus) {
                    await updateDoc(doc(db, 'vehicles', vehicle.id), {
                        status: newStatus
                    });
                }
            }

            setSuccess(true);
        } catch (err) {
            setError('Failed to save vehicle assignments');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading assignment data...</div>;
    if (error && !event) return <div className="error-message">{error}</div>;

    return (
        <div className="vehicle-assignment">
            <h2>Vehicle Assignments for {event?.name}</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Assignments saved successfully!</div>}

            {participants.length === 0 ? (
                <p>No participants registered for this event yet.</p>
            ) : (
                <>
                    <div className="assignment-table-container">
                        <table className="assignment-table">
                            <thead>
                            <tr>
                                <th>Child</th>
                                <th>Special Needs</th>
                                <th>Assigned Vehicle</th>
                            </tr>
                            </thead>
                            <tbody>
                            {participants.map(participant => (
                                <tr key={participant.childId}>
                                    <td>{participant.childName}</td>
                                    <td>{participant.childInfo.specialNeeds || 'None'}</td>
                                    <td>
                                        <select
                                            value={assignments[participant.childId] || ''}
                                            onChange={(e) => handleAssignmentChange(participant.childId, e.target.value)}
                                            disabled={saving}
                                        >
                                            <option value="">-- No Vehicle --</option>
                                            {vehicles.map(vehicle => (
                                                <option key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.name} ({vehicle.type})
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
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

export default VehicleAssignment;