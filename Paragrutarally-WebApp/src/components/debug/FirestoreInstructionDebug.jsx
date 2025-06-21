// src/components/debug/FirestoreInstructorDebug.jsx - Debug Instructor Data
import React, { useState } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const FirestoreInstructorDebug = () => {
    const { currentUser, userRole } = useAuth();
    const [debugData, setDebugData] = useState({
        teams: [],
        kids: [],
        vehicles: [],
        events: []
    });
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const checkInstructorData = async () => {
        if (!currentUser?.uid) return;

        setLoading(true);
        try {
            const instructorId = currentUser.uid;

            // Check teams
            const teamsQuery = query(
                collection(db, 'teams'),
                where('instructorId', '==', instructorId)
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Check kids
            const kidsQuery = query(
                collection(db, 'kids'),
                where('instructorId', '==', instructorId)
            );
            const kidsSnapshot = await getDocs(kidsQuery);
            const kids = kidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Check all vehicles (for reference)
            const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
            const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Check all events (for reference)
            const eventsSnapshot = await getDocs(collection(db, 'events'));
            const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setDebugData({ teams, kids, vehicles, events });

            console.log('Instructor Data Debug:', {
                instructorId,
                teams,
                kids,
                vehicles: vehicles.length,
                events: events.length
            });

        } catch (error) {
            console.error('Error checking instructor data:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSampleData = async () => {
        if (!currentUser?.uid) return;

        setCreating(true);
        try {
            const instructorId = currentUser.uid;

            // Create a sample team
            const teamRef = await addDoc(collection(db, 'teams'), {
                name: 'Sample Team Alpha',
                instructorId: instructorId,
                description: 'A sample team for testing',
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log('Created team:', teamRef.id);

            // Create a sample kid
            const kidRef = await addDoc(collection(db, 'kids'), {
                participantNumber: '001',
                personalInfo: {
                    firstName: 'Test',
                    lastName: 'Kid',
                    dateOfBirth: '2010-01-01',
                    capabilities: 'Sample capabilities',
                    announcersNotes: 'Sample announcer notes'
                },
                parentInfo: {
                    name: 'Test Parent',
                    email: 'parent@test.com',
                    phone: '123-456-7890'
                },
                teamId: teamRef.id,
                instructorId: instructorId,
                signedFormStatus: 'pending',
                signedDeclaration: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log('Created kid:', kidRef.id);

            // Create a sample vehicle
            const vehicleRef = await addDoc(collection(db, 'vehicles'), {
                name: 'Sample Vehicle 1',
                type: 'Test Vehicle',
                status: 'active',
                assignedTeams: [teamRef.id],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log('Created vehicle:', vehicleRef.id);

            // Create a sample event
            const eventRef = await addDoc(collection(db, 'events'), {
                name: 'Sample Event',
                description: 'A test event',
                eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
                location: 'Test Location',
                participatingTeams: [teamRef.id],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log('Created event:', eventRef.id);

            alert('Sample data created successfully! Refresh the page to see it.');

        } catch (error) {
            console.error('Error creating sample data:', error);
            alert('Error creating sample data: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'white',
            border: '2px solid #e74c3c',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#e74c3c' }}>
                🔍 Instructor Data Debug
            </h3>

            <div style={{ marginBottom: '15px' }}>
                <strong>Current Instructor:</strong>
                <div style={{ marginLeft: '10px', color: '#666' }}>
                    <div>UID: {currentUser?.uid}</div>
                    <div>Email: {currentUser?.email}</div>
                    <div>Role: {userRole}</div>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={checkInstructorData}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '5px 10px' }}
                >
                    {loading ? 'Checking...' : 'Check Firestore Data'}
                </button>

                {debugData.teams.length === 0 && debugData.kids.length === 0 && (
                    <button
                        onClick={createSampleData}
                        disabled={creating}
                        style={{ padding: '5px 10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        {creating ? 'Creating...' : 'Create Sample Data'}
                    </button>
                )}
            </div>

            {debugData.teams.length > 0 || debugData.kids.length > 0 ? (
                <div>
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Data Found:</strong>
                        <div style={{ marginLeft: '10px', color: '#666' }}>
                            <div>Teams: {debugData.teams.length}</div>
                            <div>Kids: {debugData.kids.length}</div>
                            <div>Total Vehicles: {debugData.vehicles.length}</div>
                            <div>Total Events: {debugData.events.length}</div>
                        </div>
                    </div>

                    {debugData.teams.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Your Teams:</strong>
                            {debugData.teams.map(team => (
                                <div key={team.id} style={{
                                    marginLeft: '10px',
                                    padding: '5px',
                                    background: '#f0f8ff',
                                    margin: '2px 0',
                                    borderRadius: '4px',
                                    fontSize: '10px'
                                }}>
                                    <div><strong>{team.name}</strong></div>
                                    <div>ID: {team.id}</div>
                                    <div>Status: {team.status || 'active'}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {debugData.kids.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Your Kids:</strong>
                            {debugData.kids.map(kid => (
                                <div key={kid.id} style={{
                                    marginLeft: '10px',
                                    padding: '5px',
                                    background: '#f0f8ff',
                                    margin: '2px 0',
                                    borderRadius: '4px',
                                    fontSize: '10px'
                                }}>
                                    <div><strong>{kid.personalInfo?.firstName} {kid.personalInfo?.lastName}</strong></div>
                                    <div>Participant #: {kid.participantNumber}</div>
                                    <div>Team ID: {kid.teamId}</div>
                                    <div>Form Status: {kid.signedFormStatus || 'pending'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ color: '#e74c3c' }}>
                    <strong>No data found for this instructor!</strong>
                    <p>This is why the dashboard is showing an error. You need:</p>
                    <ul style={{ fontSize: '10px' }}>
                        <li>Teams with instructorId = {currentUser?.uid}</li>
                        <li>Kids with instructorId = {currentUser?.uid}</li>
                        <li>Vehicles assigned to your teams</li>
                        <li>Events involving your teams</li>
                    </ul>
                    <p style={{ fontSize: '10px', marginTop: '10px' }}>
                        Click "Create Sample Data" to generate test data.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FirestoreInstructorDebug;