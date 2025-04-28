import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ChildrenList = () => {
    const { currentUser } = useAuth();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChildren = async () => {
            if (!currentUser) return;

            try {
                const childrenRef = collection(db, 'children');
                const q = query(childrenRef, where('parentId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);

                const childrenList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setChildren(childrenList);
            } catch (err) {
                setError('Failed to load children');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, [currentUser]);

    const handleDeleteChild = async (childId) => {
        if (!window.confirm('Are you sure you want to remove this child?')) return;

        try {
            // Check if child is registered for any events
            const childDoc = children.find(child => child.id === childId);
            if (childDoc.participatedEvents && childDoc.participatedEvents.length > 0) {
                alert('Cannot delete a child who is registered for events. Please unregister from events first.');
                return;
            }

            await deleteDoc(doc(db, 'children', childId));
            setChildren(children.filter(child => child.id !== childId));
        } catch (err) {
            setError('Failed to delete child');
            console.error(err);
        }
    };

    if (loading) return <div>Loading children...</div>;

    return (
        <div className="children-list">
            <h2>Your Children</h2>
            {error && <div className="error-message">{error}</div>}

            {children.length === 0 ? (
                <div className="info-message">
                    <p>You haven't registered any children yet.</p>
                    <a href="/parent/register-child" className="button">Register a Child</a>
                </div>
            ) : (
                <>
                    <div className="add-child-button">
                        <a href="/parent/register-child" className="button">Add Another Child</a>
                    </div>

                    <div className="children-grid">
                        {children.map(child => (
                            <div key={child.id} className="child-card">
                                <h3>{child.name}</h3>
                                <p><strong>Date of Birth:</strong> {new Date(child.dateOfBirth).toLocaleDateString()}</p>

                                {child.specialNeeds && (
                                    <p><strong>Special Needs:</strong> {child.specialNeeds}</p>
                                )}

                                <div className="child-events">
                                    <strong>Events:</strong>
                                    {child.participatedEvents && child.participatedEvents.length > 0 ? (
                                        <span>{child.participatedEvents.length} event(s)</span>
                                    ) : (
                                        <span>No events registered</span>
                                    )}
                                </div>

                                <div className="child-actions">
                                    <a href={`/parent/child/${child.id}`} className="button">View Details</a>
                                    <button
                                        onClick={() => handleDeleteChild(child.id)}
                                        className="button delete"
                                        disabled={child.participatedEvents && child.participatedEvents.length > 0}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChildrenList;