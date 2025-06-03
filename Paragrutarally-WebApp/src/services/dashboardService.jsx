// src/services/dashboardService.js
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get total count of users
 * @returns {Promise<number>} Total user count
 */
export const getTotalUsers = async () => {
    try {
        const usersQuery = collection(db, 'users');
        const querySnapshot = await getDocs(usersQuery);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting total users:', error);
        return 0;
    }
};

/**
 * Get total count of kids
 * @returns {Promise<number>} Total kids count
 */
export const getTotalKids = async () => {
    try {
        const kidsQuery = collection(db, 'kids');
        const querySnapshot = await getDocs(kidsQuery);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting total kids:', error);
        return 0;
    }
};

/**
 * Get total count of active teams
 * @returns {Promise<number>} Active teams count
 */
export const getActiveTeams = async () => {
    try {
        // Assuming teams have an 'active' field or we count all teams
        const teamsQuery = collection(db, 'teams');
        const querySnapshot = await getDocs(teamsQuery);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting active teams:', error);
        return 0;
    }
};

/**
 * Get upcoming events count and details
 * @returns {Promise<{count: number, events: Array}>} Upcoming events data
 */
export const getUpcomingEvents = async () => {
    try {
        const now = Timestamp.now();
        const eventsQuery = query(
            collection(db, 'events'),
            where('date', '>=', now),
            orderBy('date', 'asc'),
            limit(10) // Get first 10 upcoming events
        );

        const querySnapshot = await getDocs(eventsQuery);
        const events = [];

        querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            events.push({
                id: doc.id,
                name: eventData.name || eventData.title || 'Unnamed Event',
                date: eventData.date?.toDate?.() || new Date(),
                location: eventData.location || 'TBD',
                description: eventData.description || '',
                ...eventData
            });
        });

        return {
            count: events.length,
            events: events
        };
    } catch (error) {
        console.error('Error getting upcoming events:', error);
        return { count: 0, events: [] };
    }
};

/**
 * Get recent activities from multiple collections
 * @returns {Promise<Array>} Recent activities
 */
export const getRecentActivities = async () => {
    try {
        const activities = [];

        // Get recent users (last 5)
        const recentUsersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const usersSnapshot = await getDocs(recentUsersQuery);

        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            activities.push({
                type: 'user_created',
                timestamp: userData.createdAt?.toDate?.() || new Date(),
                description: `New user ${userData.displayName || userData.name || 'Unknown'} was added.`,
                icon: '👤'
            });
        });

        // Get recent events (last 3)
        const recentEventsQuery = query(
            collection(db, 'events'),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
        const eventsSnapshot = await getDocs(recentEventsQuery);

        eventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            activities.push({
                type: 'event_created',
                timestamp: eventData.createdAt?.toDate?.() || new Date(),
                description: `Event ${eventData.name || eventData.title || 'Unnamed Event'} was created.`,
                icon: '📅'
            });
        });

        // Get recent kids registrations (last 3)
        const recentKidsQuery = query(
            collection(db, 'kids'),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
        const kidsSnapshot = await getDocs(recentKidsQuery);

        kidsSnapshot.forEach((doc) => {
            const kidData = doc.data();
            activities.push({
                type: 'kid_registered',
                timestamp: kidData.createdAt?.toDate?.() || new Date(),
                description: `${kidData.firstName} ${kidData.lastName || ''} was registered.`,
                icon: '👶'
            });
        });

        // Sort all activities by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp - a.timestamp);

        // Return only the 10 most recent activities
        return activities.slice(0, 10);

    } catch (error) {
        console.error('Error getting recent activities:', error);
        return [];
    }
};

/**
 * Get all dashboard data in one call
 * @returns {Promise<Object>} Complete dashboard data
 */
export const getDashboardData = async () => {
    try {
        const [
            totalUsers,
            totalKids,
            activeTeams,
            upcomingEventsData,
            recentActivities
        ] = await Promise.all([
            getTotalUsers(),
            getTotalKids(),
            getActiveTeams(),
            getUpcomingEvents(),
            getRecentActivities()
        ]);

        return {
            stats: {
                totalUsers,
                totalKids,
                activeTeams,
                upcomingEventsCount: upcomingEventsData.count
            },
            upcomingEvents: upcomingEventsData.events,
            recentActivities
        };
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        return {
            stats: {
                totalUsers: 0,
                totalKids: 0,
                activeTeams: 0,
                upcomingEventsCount: 0
            },
            upcomingEvents: [],
            recentActivities: []
        };
    }
};

/**
 * Format time ago string
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTimeAgo = (date) => {
    if (!date) return 'Unknown time';

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
};

/**
 * Format event date for display
 * @param {Date} date - Event date
 * @returns {string} Formatted date string
 */
export const formatEventDate = (date) => {
    if (!date) return 'TBD';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};