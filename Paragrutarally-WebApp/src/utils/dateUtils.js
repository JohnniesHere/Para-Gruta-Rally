// src/utils/dateUtils.js

/**
 * Format a date object or timestamp to a readable string
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @param {string} format - Format string ('short', 'medium', 'long', 'full', 'date', 'time', 'datetime')
 * @param {string} language - Language code ('en' or 'he')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'medium', language = 'en') => {
    if (!date) return '';

    let dateObj;

    // Handle Firestore timestamp with toDate method
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    }
    // Handle Firestore timestamp with seconds property
    else if (date && typeof date === 'object' && date.seconds) {
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

    // Format based on specified format - ALWAYS DD/MM/YYYY for dates
    switch (format) {
        case 'short':
            // DD/MM/YYYY format
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
            break;
        case 'medium':
            // DD/MM/YYYY HH:MM format
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = language === 'en';
            break;
        case 'long':
            // DD/MM/YYYY HH:MM:SS format
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            options.hour12 = language === 'en';
            break;
        case 'full':
            // Weekday, DD/MM/YYYY HH:MM:SS format
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
            options.weekday = 'long';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            options.hour12 = language === 'en';
            break;
        case 'date':
            // DD/MM/YYYY only
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
            break;
        case 'time':
            // HH:MM only
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = language === 'en';
            break;
        case 'datetime':
            // DD/MM/YYYY HH:MM format
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = language === 'en';
            break;
        default:
            // Default DD/MM/YYYY format
            options.day = '2-digit';
            options.month = '2-digit';
            options.year = 'numeric';
    }

    // Use appropriate locale for formatting
    const locale = language === 'he' ? 'he-IL' : 'en-GB'; // en-GB for DD/MM/YYYY format
    return dateObj.toLocaleString(locale, options);
};

/**
 * Get a relative time string (e.g., "2 hours ago", "yesterday")
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @param {string} language - Language code ('en' or 'he')
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date, language = 'en') => {
    if (!date) return '';

    let dateObj;

    // Handle Firestore timestamp with toDate method
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    }
    // Handle Firestore timestamp with seconds property
    else if (date && typeof date === 'object' && date.seconds) {
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

    if (language === 'he') {
        // Hebrew relative time
        if (diffSec < 60) {
            return 'עכשיו';
        } else if (diffMin < 60) {
            return `לפני ${diffMin} דקות`;
        } else if (diffHour < 24) {
            return `לפני ${diffHour} שעות`;
        } else if (diffDay === 1) {
            return 'אתמול';
        } else if (diffDay < 7) {
            return `לפני ${diffDay} ימים`;
        } else if (diffDay < 30) {
            const diffWeek = Math.round(diffDay / 7);
            return `לפני ${diffWeek} שבועות`;
        } else if (diffDay < 365) {
            const diffMonth = Math.round(diffDay / 30);
            return `לפני ${diffMonth} חודשים`;
        } else {
            const diffYear = Math.round(diffDay / 365);
            return `לפני ${diffYear} שנים`;
        }
    } else {
        // English relative time
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
    }
};

/**
 * Get the current date in ISO format (YYYY-MM-DD)
 * @returns {string} - Current date in ISO format
 */
export const getCurrentDate = () => {
    return formatDate(new Date());
};

/**
 * Get export-friendly date string (always YYYY-MM-DD for filenames)
 * @returns {string} - Current date in YYYY-MM-DD format for filenames
 */
export const getExportDateString = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Check if a date is in the past
 * @param {Date|Object|number} date - Date object, Firestore timestamp or Unix timestamp
 * @returns {boolean} - True if date is in the past
 */
export const isDatePast = (date) => {
    if (!date) return false;

    let dateObj;

    // Handle Firestore timestamp with toDate method
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    }
    // Handle Firestore timestamp with seconds property
    else if (date && typeof date === 'object' && date.seconds) {
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

    // Handle Firestore timestamp with toDate method
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    }
    // Handle Firestore timestamp with seconds property
    else if (date && typeof date === 'object' && date.seconds) {
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

    // Handle Firestore timestamp with toDate method
    if (birthdate && typeof birthdate === 'object' && typeof birthdate.toDate === 'function') {
        dateObj = birthdate.toDate();
    }
    // Handle Firestore timestamp with seconds property
    else if (birthdate && typeof birthdate === 'object' && birthdate.seconds) {
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

/**
 * Check if date is today
 * @param {Date|Object|number|string} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
    if (!date) return false;

    let dateObj;
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
        return false;
    }

    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
};

/**
 * Get week day name in specified language
 * @param {Date|Object|number|string} date - Date
 * @param {string} language - Language code ('en' or 'he')
 * @param {string} format - 'long' or 'short'
 * @returns {string} - Day name
 */
export const getWeekDay = (date, language = 'en', format = 'long') => {
    if (!date) return '';

    let dateObj;
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
        return '';
    }

    const locale = language === 'he' ? 'he-IL' : 'en-GB';
    return dateObj.toLocaleDateString(locale, {
        weekday: format
    });
};