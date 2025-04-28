import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import EventList from '../../components/events/EventList';

const ParentEvents = () => {
    const { currentUser } = useAuth();
    const [childrenIds, setChildrenIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChildren = async () => {
            if (!currentUser) return;

            try {
                const childrenRef = collection(db, 'children');
                const childrenQuery = query(childrenRef, where('parentId', '==', currentUser.uid));
                const childrenSnapshot = await getDocs(childrenQuery);

                const ids = childrenSnapshot.docs.map(doc => doc.id);
                setChildrenIds(ids);
            } catch (err) {
                setError('Failed to load children data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, [currentUser]);

    if (loading) return <div>Loading events...</div>;

    return (
        <div className="parent-events-page">
            <h1>Events</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="card">
                <EventList
                    childrenIds={childrenIds}
                    isParent={true}
                />
            </div>
        </div>
    );
};

export default ParentEvents;