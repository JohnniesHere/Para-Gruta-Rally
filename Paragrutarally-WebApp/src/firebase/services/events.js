// Event management service for Firestore

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    increment,
    writeBatch,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @param {string} userId - User ID creating the event
 * @returns {Promise} - Document reference
 */
export const createEvent = async (eventData, userId) => {
    try {
        // Set defaults and metadata
        const event = {
            ...eventData,
            status: eventData.status || 'draft',
            currentRegistrations: 0,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Add the event to Firestore
        const eventRef = await addDoc(collection(db, 'events'), event);
        
        return { id: eventRef.id, ...event };
    } catch (error) {
        throw error;
    }
};

/**
 * Get an event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise} - Event data
 */
export const getEvent = async (eventId) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
            return { id: eventSnap.id, ...eventSnap.data() };
        } else {
            throw new Error('Event not found');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Update an event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Data to update
 * @returns {Promise} - Updated event
 */
export const updateEvent = async (eventId, eventData) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        // Remove fields that shouldn't be updated directly
        const { createdAt, createdBy, currentRegistrations, ...updateData } = eventData;
        
        // Add updated timestamp
        updateData.updatedAt = serverTimestamp();

        await updateDoc(eventRef, updateData);
        
        // Get the updated event
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

/**
 * Delete an event
 * @param {string} eventId - Event ID
 * @returns {Promise} - Void promise
 */
export const deleteEvent = async (eventId) => {
    try {
        // Check if there are any registrations
        const registrationsQuery = query(
            collection(db, 'event_registrations'),
            where('eventId', '==', eventId)
        );
        
        const registrationsSnap = await getDocs(registrationsQuery);
        
        if (!registrationsSnap.empty) {
            throw new Error('Cannot delete event with active registrations');
        }
        
        const eventRef = doc(db, 'events', eventId);
        return await deleteDoc(eventRef);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all events with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise} - Array of events
 */
export const getEvents = async (options = {}) => {
    try {
        const {
            status,
            startDate,
            endDate,
            teamId,
            instructorId,
            isPublic,
            orderField = 'startDate',
            orderDirection = 'asc',
            limitCount = 20,
            lastVisible = null
        } = options;

        // Start building the query
        let eventsQuery = collection(db, 'events');
        const queryConstraints = [];

        // Add filters if provided
        if (status) {
            queryConstraints.push(where('status', '==', status));
        }

        if (startDate) {
            queryConstraints.push(where('startDate', '>=', startDate));
        }

        if (endDate) {
            queryConstraints.push(where('endDate', '<=', endDate));
        }

        if (teamId) {
            queryConstraints.push(where('teamIds', 'array-contains', teamId));
        }

        if (instructorId) {
            queryConstraints.push(where('instructorIds', 'array-contains', instructorId));
        }

        if (isPublic !== undefined) {
            queryConstraints.push(where('isPublic', '==', isPublic));
        }

        // Add ordering
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        // Add limit
        queryConstraints.push(limit(limitCount));
        
        // Add pagination if a last document is provided
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        // Build the final query
        const q = query(eventsQuery, ...queryConstraints);
        
        // Execute the query
        const querySnapshot = await getDocs(q);
        
        // Transform the results
        const events = [];
        querySnapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Return the results with the last visible document for pagination
        return {
            events,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Register a child for an event
 * @param {string} eventId - Event ID
 * @param {string} kidId - Child ID
 * @param {string} registeredBy - User ID registering the child
 * @param {Object} formResponses - Optional form responses
 * @returns {Promise} - Registration data
 */
export const registerChildForEvent = async (eventId, kidId, registeredBy, formResponses = null) => {
    try {
        // Check if event exists and has capacity
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const eventData = eventSnap.data();
        
        if (eventData.currentRegistrations >= eventData.capacity) {
            throw new Error('Event is at capacity');
        }
        
        // Check if child is already registered
        const existingRegQuery = query(
            collection(db, 'event_registrations'),
            where('eventId', '==', eventId),
            where('kidId', '==', kidId),
            where('status', 'in', ['pending', 'confirmed'])
        );
        
        const existingRegSnap = await getDocs(existingRegQuery);
        
        if (!existingRegSnap.empty) {
            throw new Error('Child is already registered for this event');
        }
        
        // Create registration
        const registrationData = {
            eventId,
            kidId,
            status: 'pending',
            registeredBy,
            registeredAt: serverTimestamp(),
            checkedIn: false,
            formResponses: formResponses || {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Use a batch to update both the registration and event counter
        const batch = writeBatch(db);
        
        // Create registration document
        const registrationRef = doc(collection(db, 'event_registrations'));
        batch.set(registrationRef, registrationData);
        
        // Update event counter
        batch.update(eventRef, {
            currentRegistrations: increment(1),
            updatedAt: serverTimestamp()
        });
        
        // Commit the batch
        await batch.commit();
        
        // Return the registration data
        return {
            id: registrationRef.id,
            ...registrationData
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Update a registration status
 * @param {string} registrationId - Registration ID
 * @param {string} status - New status ('pending', 'confirmed', 'cancelled')
 * @param {string} updatedBy - User ID updating the status
 * @returns {Promise} - Updated registration
 */
export const updateRegistrationStatus = async (registrationId, status, updatedBy) => {
    try {
        if (!['pending', 'confirmed', 'cancelled', 'attended'].includes(status)) {
            throw new Error('Invalid status');
        }
        
        const registrationRef = doc(db, 'event_registrations', registrationId);
        const registrationSnap = await getDoc(registrationRef);
        
        if (!registrationSnap.exists()) {
            throw new Error('Registration not found');
        }
        
        const registrationData = registrationSnap.data();
        const oldStatus = registrationData.status;
        
        // If changing to/from cancelled, we need to update the event counter
        const eventRef = doc(db, 'events', registrationData.eventId);
        
        // If status is the same, no need to update
        if (oldStatus === status) {
            return { id: registrationId, ...registrationData };
        }
        
        // Use a batch to update both documents
        const batch = writeBatch(db);
        
        // Update registration
        batch.update(registrationRef, {
            status,
            updatedAt: serverTimestamp(),
            updatedBy
        });
        
        // Update event counter if transitioning to/from cancelled
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            // Decrement counter when cancelling
            batch.update(eventRef, {
                currentRegistrations: increment(-1),
                updatedAt: serverTimestamp()
            });
        } else if (status !== 'cancelled' && oldStatus === 'cancelled') {
            // Increment counter when un-cancelling
            batch.update(eventRef, {
                currentRegistrations: increment(1),
                updatedAt: serverTimestamp()
            });
        }
        
        // Commit the batch
        await batch.commit();
        
        // Get updated registration
        const updatedSnap = await getDoc(registrationRef);
        return { id: registrationId, ...updatedSnap.data() };
    } catch (error) {
        throw error;
    }
};

/**
 * Check in a child to an event
 * @param {string} registrationId - Registration ID
 * @param {string} checkedInBy - User ID checking in the child
 * @returns {Promise} - Updated registration
 */
export const checkInChild = async (registrationId, checkedInBy) => {
    try {
        const registrationRef = doc(db, 'event_registrations', registrationId);
        const registrationSnap = await getDoc(registrationRef);
        
        if (!registrationSnap.exists()) {
            throw new Error('Registration not found');
        }
        
        const registrationData = registrationSnap.data();
        
        // Only confirmed registrations can be checked in
        if (registrationData.status !== 'confirmed') {
            throw new Error('Registration is not confirmed');
        }
        
        // Already checked in
        if (registrationData.checkedIn) {
            return { id: registrationId, ...registrationData };
        }
        
        // Update registration
        await updateDoc(registrationRef, {
            checkedIn: true,
            checkedInAt: serverTimestamp(),
            checkedInBy,
            status: 'attended',
            updatedAt: serverTimestamp()
        });
        
        // Get updated registration
        const updatedSnap = await getDoc(registrationRef);
        return { id: registrationId, ...updatedSnap.data() };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all registrations for an event
 * @param {string} eventId - Event ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of registrations
 */
export const getEventRegistrations = async (eventId, options = {}) => {
    try {
        const {
            status,
            orderField = 'registeredAt',
            orderDirection = 'asc'
        } = options;
        
        // Build query
        let registrationsQuery = collection(db, 'event_registrations');
        const queryConstraints = [where('eventId', '==', eventId)];
        
        if (status) {
            queryConstraints.push(where('status', '==', status));
        }
        
        queryConstraints.push(orderBy(orderField, orderDirection));
        
        const q = query(registrationsQuery, ...queryConstraints);
        
        // Execute query
        const querySnapshot = await getDocs(q);
        
        // Transform results
        const registrations = [];
        querySnapshot.forEach(doc => {
            registrations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return registrations;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all events a child is registered for
 * @param {string} kidId - Child ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of events with registration data
 */
export const getChildEvents = async (kidId, options = {}) => {
    try {
        const {
            status,
            timeFrame = 'all', // 'past', 'upcoming', 'all'
            orderField = 'startDate',
            orderDirection = 'asc'
        } = options;
        
        // Get registrations for this child
        let registrationsQuery = collection(db, 'event_registrations');
        const regQueryConstraints = [where('kidId', '==', kidId)];
        
        if (status) {
            regQueryConstraints.push(where('status', '==', status));
        }
        
        const regQuery = query(registrationsQuery, ...regQueryConstraints);
        const regSnapshot = await getDocs(regQuery);
        
        if (regSnapshot.empty) {
            return [];
        }
        
        // Get event IDs from registrations
        const eventIds = [];
        const registrationMap = {};
        
        regSnapshot.forEach(doc => {
            const regData = doc.data();
            eventIds.push(regData.eventId);
            registrationMap[regData.eventId] = {
                id: doc.id,
                ...regData
            };
        });
        
        // Get events by IDs
        const now = new Date();
        let eventsQuery = collection(db, 'events');
        let eventQueryConstraints = [];
        
        // Only add the array-contains if we have eventIds to query
        if (eventIds.length > 0) {
            // We need to chunk the array for Firestore's 'in' clause limit (10)
            const chunks = [];
            for (let i = 0; i < eventIds.length; i += 10) {
                chunks.push(eventIds.slice(i, i + 10));
            }
            
            // Process the first chunk
            eventQueryConstraints.push(where('__name__', 'in', chunks[0]));
        }
        
        // Add time frame filter
        if (timeFrame === 'past') {
            eventQueryConstraints.push(where('endDate', '<', now));
        } else if (timeFrame === 'upcoming') {
            eventQueryConstraints.push(where('startDate', '>=', now));
        }
        
        // Add ordering
        eventQueryConstraints.push(orderBy(orderField, orderDirection));
        
        const eventQuery = query(eventsQuery, ...eventQueryConstraints);
        const eventSnapshot = await getDocs(eventQuery);
        
        // Transform results and add registration data
        const events = [];
        eventSnapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data(),
                registration: registrationMap[doc.id]
            });
        });
        
        // If we had multiple chunks, we need to process them and merge results
        if (chunks && chunks.length > 1) {
            for (let i = 1; i < chunks.length; i++) {
                const chunkQuery = query(
                    eventsQuery,
                    where('__name__', 'in', chunks[i]),
                    orderBy(orderField, orderDirection)
                );
                
                const chunkSnapshot = await getDocs(chunkQuery);
                
                chunkSnapshot.forEach(doc => {
                    events.push({
                        id: doc.id,
                        ...doc.data(),
                        registration: registrationMap[doc.id]
                    });
                });
            }
            
            // Resort based on original ordering
            events.sort((a, b) => {
                if (orderDirection === 'asc') {
                    return a[orderField] - b[orderField];
                } else {
                    return b[orderField] - a[orderField];
                }
            });
        }
        
        return events;
    } catch (error) {
        throw error;
    }
};

/**
 * Assign instructors to an event
 * @param {string} eventId - Event ID
 * @param {Array} instructorIds - Array of instructor IDs
 * @returns {Promise} - Updated event
 */
export const assignInstructorsToEvent = async (eventId, instructorIds) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        await updateDoc(eventRef, {
            instructorIds,
            updatedAt: serverTimestamp()
        });
        
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

/**
 * Assign teams to an event
 * @param {string} eventId - Event ID
 * @param {Array} teamIds - Array of team IDs
 * @returns {Promise} - Updated event
 */
export const assignTeamsToEvent = async (eventId, teamIds) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        await updateDoc(eventRef, {
            teamIds,
            updatedAt: serverTimestamp()
        });
        
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

/**
 * Assign vehicles to an event
 * @param {string} eventId - Event ID
 * @param {Array} vehicleIds - Array of vehicle IDs
 * @returns {Promise} - Updated event
 */
export const assignVehiclesToEvent = async (eventId, vehicleIds) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        await updateDoc(eventRef, {
            vehicleIds,
            updatedAt: serverTimestamp()
        });
        
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

/**
 * Add a document to an event
 * @param {string} eventId - Event ID
 * @param {Object} document - Document data
 * @returns {Promise} - Updated event
 */
export const addEventDocument = async (eventId, document) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        const eventData = eventSnap.data();
        const documents = eventData.documents || [];
        
        // Add the document
        await updateDoc(eventRef, {
            documents: arrayUnion(document),
            updatedAt: serverTimestamp()
        });
        
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

/**
 * Remove a document from an event
 * @param {string} eventId - Event ID
 * @param {Object} document - Document data to remove
 * @returns {Promise} - Updated event
 */
export const removeEventDocument = async (eventId, document) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        
        await updateDoc(eventRef, {
            documents: arrayRemove(document),
            updatedAt: serverTimestamp()
        });
        
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

/**
 * Get events for a specific instructor
 * @param {string} instructorId - Instructor ID
 * @param {Object} options - Query options
 * @returns {Promise} - Array of events
 */
export const getInstructorEvents = async (instructorId, options = {}) => {
    try {
        const {
            status,
            timeFrame = 'all', // 'past', 'upcoming', 'all'
            orderField = 'startDate',
            orderDirection = 'asc',
            limitCount = 20
        } = options;
        
        // Build query
        let eventsQuery = collection(db, 'events');
        const queryConstraints = [
            where('instructorIds', 'array-contains', instructorId)
        ];
        
        if (status) {
            queryConstraints.push(where('status', '==', status));
        }
        
        // Add time frame filter
        const now = new Date();
        if (timeFrame === 'past') {
            queryConstraints.push(where('endDate', '<', now));
        } else if (timeFrame === 'upcoming') {
            queryConstraints.push(where('startDate', '>=', now));
        }
        
        // Add ordering and limit
        queryConstraints.push(orderBy(orderField, orderDirection));
        queryConstraints.push(limit(limitCount));
        
        const q = query(eventsQuery, ...queryConstraints);
        
        // Execute query
        const querySnapshot = await getDocs(q);
        
        // Transform results
        const events = [];
        querySnapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return events;
    } catch (error) {
        throw error;
    }
};

/**
 * Create recurring events
 * @param {Object} eventTemplate - Base event data
 * @param {Object} recurringConfig - Recurring configuration
 * @param {string} userId - User ID creating events
 * @returns {Promise} - Array of created events
 */
export const createRecurringEvents = async (eventTemplate, recurringConfig, userId) => {
    try {
        const {
            frequency, // 'daily', 'weekly', 'monthly'
            interval = 1, // How many days/weeks/months between occurrences
            dayOfWeek = [], // For weekly: 0-6 (Sunday-Saturday)
            endDate, // When to stop creating events
            occurrences // Max number of events to create
        } = recurringConfig;
        
        if (!frequency || (!endDate && !occurrences)) {
            throw new Error('Invalid recurring configuration');
        }
        
        // Calculate dates based on recurrence pattern
        const startDate = new Date(eventTemplate.startDate);
        const eventEndDate = new Date(eventTemplate.endDate);
        const duration = eventEndDate - startDate; // Duration in milliseconds
        
        const dates = [];
        let currentDate = new Date(startDate);
        let count = 0;
        
        const maxEnd = endDate ? new Date(endDate) : null;
        const maxCount = occurrences || 1000; // Reasonable limit
        
        // Generate dates based on frequency
        while ((maxEnd === null || currentDate <= maxEnd) && count < maxCount) {
            // For the first occurrence, use the original date
            if (count === 0) {
                dates.push({
                    startDate: new Date(currentDate),
                    endDate: new Date(currentDate.getTime() + duration)
                });
                count++;
            }
            
            // Calculate next date based on frequency
            if (frequency === 'daily') {
                currentDate = new Date(currentDate.setDate(currentDate.getDate() + interval));
                
                dates.push({
                    startDate: new Date(currentDate),
                    endDate: new Date(currentDate.getTime() + duration)
                });
                count++;
            } 
            else if (frequency === 'weekly') {
                // For weekly, we need to handle specific days of the week
                if (dayOfWeek && dayOfWeek.length > 0) {
                    // Sort the days to process them in order
                    const sortedDays = [...dayOfWeek].sort();
                    
                    // Find the next day of week after current day
                    const currentDayOfWeek = currentDate.getDay();
                    let nextDayFound = false;
                    
                    for (const day of sortedDays) {
                        if (day > currentDayOfWeek) {
                            // This day is later in the current week
                            const daysToAdd = day - currentDayOfWeek;
                            const nextDate = new Date(currentDate);
                            nextDate.setDate(nextDate.getDate() + daysToAdd);
                            
                            dates.push({
                                startDate: new Date(nextDate),
                                endDate: new Date(nextDate.getTime() + duration)
                            });
                            count++;
                            nextDayFound = true;
                            
                            if ((maxEnd !== null && nextDate > maxEnd) || count >= maxCount) {
                                break;
                            }
                        }
                    }
                    
                    // If we've processed all days in the current week, move to next week
                    if (!nextDayFound || (count < maxCount && (maxEnd === null || dates[dates.length - 1].startDate < maxEnd))) {
                        // Move to the first specified day in the next week
                        const daysToAdd = 7 - currentDayOfWeek + sortedDays[0];
                        currentDate = new Date(currentDate.setDate(currentDate.getDate() + daysToAdd));
                    } else {
                        // We've reached the end of our recurrence
                        break;
                    }
                } else {
                    // Simple weekly recurrence
                    currentDate = new Date(currentDate.setDate(currentDate.getDate() + (7 * interval)));
                    
                    dates.push({
                        startDate: new Date(currentDate),
                        endDate: new Date(currentDate.getTime() + duration)
                    });
                    count++;
                }
            }
            else if (frequency === 'monthly') {
                // Move to the same day in the next month
                const currentDay = currentDate.getDate();
                currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + interval));
                
                // Handle month length issues (e.g., Jan 31 -> Feb 28)
                const newMonth = currentDate.getMonth();
                const expectedMonth = (startDate.getMonth() + (count * interval)) % 12;
                
                if (newMonth !== expectedMonth) {
                    // Month overflow occurred, set to last day of previous month
                    currentDate = new Date(currentDate.getFullYear(), newMonth, 0);
                }
                
                dates.push({
                    startDate: new Date(currentDate),
                    endDate: new Date(currentDate.getTime() + duration)
                });
                count++;
            }
        }
        
        // Create events for each date
        const batch = writeBatch(db);
        const createdEvents = [];
        
        for (let i = 0; i < dates.length; i++) {
            const { startDate, endDate } = dates[i];
            
            // Create a new event based on the template
            const newEvent = {
                ...eventTemplate,
                startDate,
                endDate,
                status: eventTemplate.status || 'draft',
                currentRegistrations: 0,
                createdBy: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isRecurring: true,
                recurringGroupId: new Date().getTime().toString() // Use timestamp as group ID
            };
            
            if (i === 0) {
                newEvent.isRecurringParent = true;
            }
            
            // Add to batch
            const eventRef = doc(collection(db, 'events'));
            batch.set(eventRef, newEvent);
            
            createdEvents.push({
                id: eventRef.id,
                ...newEvent
            });
        }
        
        // Commit the batch
        await batch.commit();
        
        return createdEvents;
    } catch (error) {
        throw error;
    }
};

/**
 * Cancel an event
 * @param {string} eventId - Event ID
 * @param {string} cancelledBy - User ID cancelling the event
 * @param {string} reason - Cancellation reason
 * @returns {Promise} - Updated event
 */
export const cancelEvent = async (eventId, cancelledBy, reason = '') => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }
        
        // Update event status
        await updateDoc(eventRef, {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledBy,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        // Get all registrations for this event
        const registrationsQuery = query(
            collection(db, 'event_registrations'),
            where('eventId', '==', eventId),
            where('status', 'in', ['pending', 'confirmed'])
        );
        
        const registrationsSnap = await getDocs(registrationsQuery);
        
        // Update all registrations
        const batch = writeBatch(db);
        
        registrationsSnap.forEach(doc => {
            batch.update(doc.ref, {
                status: 'cancelled',
                cancellationReason: 'Event cancelled',
                updatedAt: serverTimestamp(),
                updatedBy: cancelledBy
            });
        });
        
        await batch.commit();
        
        return await getEvent(eventId);
    } catch (error) {
        throw error;
    }
};

export default {
    createEvent,
    getEvent,
    updateEvent,
    deleteEvent,
    getEvents,
    registerChildForEvent,
    updateRegistrationStatus,
    checkInChild,
    getEventRegistrations,
    getChildEvents,
    assignInstructorsToEvent,
    assignTeamsToEvent,
    assignVehiclesToEvent,
    addEventDocument,
    removeEventDocument,
    getInstructorEvents,
    createRecurringEvents,
    cancelEvent
};