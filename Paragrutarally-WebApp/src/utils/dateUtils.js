// src/utils/dateUtils.js

/**
 * Format a date object or timestamp to a readable string
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @param {string} format - Format string ('short', 'medium', 'long', 'full', 'date', 'time', 'datetime')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
    if (!date) return '';

    let dateObj;

    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    }
    // Handle Unix timestamp (milliseconds)
    else if (typeof date === 'number') {
        dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
        dateObj = date;
    }
    // Handle ISO string
    else if (typeof date === 'string') {
        dateObj = new Date(date);
    }
    // Default to current date if invalid
    else {
        dateObj = new Date();
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return '';
    }

    const options = {};

    // Format based on specified format
    switch (format) {
        case 'short':
            options.day = 'numeric';
            options.month = 'short';
            options.year = 'numeric';
            break;
        case 'medium':
            options.day = 'numeric';
            options.month = 'short';
            options.year = 'numeric';
            options.hour = '2-digit';
            options.minute = '2-digit';
            break;
        case 'long':
            options.day = 'numeric';
            options.month = 'long';
            options.year = 'numeric';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            break;
        case 'full':
            options.day = 'numeric';
            options.month = 'long';
            options.year = 'numeric';
            options.weekday = 'long';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            break;
        case 'date':
            options.day = 'numeric';
            options.month = 'long';
            options.year = 'numeric';
            break;
        case 'time':
            options.hour = '2-digit';
            options.minute = '2-digit';
            break;
        case 'datetime':
            options.day = 'numeric';
            options.month = 'short';
            options.year = 'numeric';
            options.hour = '2-digit';
            options.minute = '2-digit';
            break;
        default:
            options.day = 'numeric';
            options.month = 'short';
            options.year = 'numeric';
    }

    return dateObj.toLocaleString(undefined, options);
};

/**
 * Get a relative time string (e.g., "2 hours ago", "yesterday")
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
    if (!date) return '';

    let dateObj;

    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    }
    // Handle Unix timestamp (milliseconds)
    else if (typeof date === 'number') {
        dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
        dateObj = date;
    }
    // Handle ISO string
    else if (typeof date === 'string') {
        dateObj = new Date(date);
    }
    // Default to current date if invalid
    else {
        return '';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay === 1) {
        return 'yesterday';
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
        const diffWeek = Math.round(diffDay / 7);
        return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    } else if (diffDay < 365) {
        const diffMonth = Math.round(diffDay / 30);
        return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    } else {
        const diffYear = Math.round(diffDay / 365);
        return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    }
};

/**
 * Convert a date to ISO format (YYYY-MM-DD)
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @returns {string} - ISO date string
 */
export const toISODate = (date) => {
    if (!date) return '';

    let dateObj;

    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    }
    // Handle Unix timestamp (milliseconds)
    else if (typeof date === 'number') {
        dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
        dateObj = date;
    }
    // Handle ISO string
    else if (typeof date === 'string') {
        dateObj = new Date(date);
    }
    // Default to current date if invalid
    else {
        dateObj = new Date();
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return '';
    }

    return dateObj.toISOString().split('T')[0];
};

/**
 * Get the current date in ISO format (YYYY-MM-DD)
 * @returns {string} - Current date in ISO format
 */
export const getCurrentDate = () => {
    return toISODate(new Date());
};

/**
 * Check if a date is in the past
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @returns {boolean} - True if date is in the past
 */
export const isDatePast = (date) => {
    if (!date) return false;

    let dateObj;

    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    }
    // Handle Unix timestamp (milliseconds)
    else if (typeof date === 'number') {
        dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
        dateObj = date;
    }
    // Handle ISO string
    else if (typeof date === 'string') {
        dateObj = new Date(date);
    }
    // Invalid date
    else {
        return false;
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return false;
    }

    return dateObj < new Date();
};

/**
 * Check if a date is in the future
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @returns {boolean} - True if date is in the future
 */
export const isDateFuture = (date) => {
    if (!date) return false;

    let dateObj;

    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    }
    // Handle Unix timestamp (milliseconds)
    else if (typeof date === 'number') {
        dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
        dateObj = date;
    }
    // Handle ISO string
    else if (typeof date === 'string') {
        dateObj = new Date(date);
    }
    // Invalid date
    else {
        return false;
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return false;
    }

    return dateObj > new Date();
};

/**
 * Calculate age from birthdate
 * @param {Date|Object|number|string} birthdate - Birthdate
 * @returns {number} - Age in years
 */
export const calculateAge = (birthdate) => {
    if (!birthdate) return 0;

    let dateObj;

    // Handle Firestore timestamp
    if (birthdate && typeof birthdate === 'object' && birthdate.seconds) {
        dateObj = new Date(birthdate.seconds * 1000);
    }
    // Handle Unix timestamp (milliseconds)
    else if (typeof birthdate === 'number') {
        dateObj = new Date(birthdate);
    }
    // Handle Date object
    else if (birthdate instanceof Date) {
        dateObj = birthdate;
    }
    // Handle ISO string
    else if (typeof birthdate === 'string') {
        dateObj = new Date(birthdate);
    }
    // Invalid date
    else {
        return 0;
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return 0;
    }

    const now = new Date();
    let age = now.getFullYear() - dateObj.getFullYear();
    const monthDiff = now.getMonth() - dateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateObj.getDate())) {
        age--;
    }

    return age;
};