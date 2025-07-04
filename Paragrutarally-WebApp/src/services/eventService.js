// src/services/eventService.js - Simple Event Service
import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get all events from the database
 * @returns {Promise<Array>} Array of events
 */
export const getAllEvents = async () => {
    try {
        const eventsQuery = query(
            collection(db, 'events'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(eventsQuery);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching events:', error);
        throw new Error(`Failed to fetch events: ${error.message}`);
    }
};

/**
 * Get upcoming events only
 * @returns {Promise<Array>} Array of upcoming events
 */
export const getUpcomingEvents = async () => {
    try {
        const eventsQuery = query(
            collection(db, 'events'),
            where('status', '==', 'upcoming'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(eventsQuery);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        throw new Error(`Failed to fetch upcoming events: ${error.message}`);
    }
};

export default {
    getAllEvents,
    getUpcomingEvents
};