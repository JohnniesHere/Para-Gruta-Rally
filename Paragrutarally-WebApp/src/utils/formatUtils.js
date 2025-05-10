// src/utils/formatUtils.js

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: user's locale)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = undefined) => {
    if (amount === null || amount === undefined) return '';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `${amount} ${currency}`;
    }
};

/**
 * Format a number with thousands separators
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {string} locale - Locale for formatting (default: user's locale)
 * @returns {string} - Formatted number
 */
export const formatNumber = (number, decimals = 0, locale = undefined) => {
    if (number === null || number === undefined) return '';

    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return number.toString();
    }
};

/**
 * Format a percentage
 * @param {number} value - Value to format (0-1)
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {string} locale - Locale for formatting (default: user's locale)
 * @returns {string} - Formatted percentage
 */
export const formatPercent = (value, decimals = 0, locale = undefined) => {
    if (value === null || value === undefined) return '';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    } catch (error) {
        console.error('Error formatting percentage:', error);
        return `${(value * 100).toFixed(decimals)}%`;
    }
};

/**
 * Truncate text to a specified length and add ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length (default: 100)
 * @param {string} ellipsis - Ellipsis string (default: '...')
 * @returns {string} - Truncated text
 */
export const truncateText = (text, length = 100, ellipsis = '...') => {
    if (!text) return '';

    if (text.length <= length) {
        return text;
    }

    return text.slice(0, length - ellipsis.length) + ellipsis;
};

/**
 * Format a phone number
 * @param {string} phone - Phone number to format
 * @param {string} format - Format type ('local', 'international')
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone, format = 'local') => {
    if (!phone) return '';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format based on length and format type
    if (format === 'international') {
        if (cleaned.length === 10) {
            return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length === 11 && cleaned[0] === '1') {
            return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        } else {
            return phone; // Return original if not a standard format
        }
    } else {
        // Local format
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length === 7) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        } else {
            return phone; // Return original if not a standard format
        }
    }
};

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Convert camelCase or snake_case to Title Case
 * @param {string} text - Text to convert
 * @returns {string} - Converted text
 */
export const toTitleCase = (text) => {
    if (!text) return '';

    // Handle camelCase
    const fromCamelCase = text.replace(/([A-Z])/g, ' $1');

    // Handle snake_case
    const fromSnakeCase = fromCamelCase.replace(/_/g, ' ');

    // Capitalize first letter of each word
    return fromSnakeCase
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Format a name (first, last) to a full name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} format - Format ('FL', 'LF', 'F', 'L')
 * @returns {string} - Formatted name
 */
export const formatName = (firstName, lastName, format = 'FL') => {
    if (!firstName && !lastName) return '';

    switch (format) {
        case 'FL': // First Last
            return `${firstName || ''} ${lastName || ''}`.trim();
        case 'LF': // Last, First
            return [lastName, firstName].filter(Boolean).join(', ');
        case 'F': // First only
            return firstName || '';
        case 'L': // Last only
            return lastName || '';
        default:
            return `${firstName || ''} ${lastName || ''}`.trim();
    }
};

/**
 * Format an address to a single line
 * @param {Object} address - Address object with street, city, state, zip
 * @returns {string} - Formatted address
 */
export const formatAddress = (address) => {
    if (!address) return '';

    const {
        street,
        city,
        state,
        zip,
        country
    } = address;

    const parts = [];

    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zip) parts.push(zip);
    if (country) parts.push(country);

    return parts.join(', ');
};