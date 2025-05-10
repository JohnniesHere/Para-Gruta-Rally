// src/utils/validationUtils.js

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
    if (!email) return false;

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate a phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone is valid
 */
export const isValidPhone = (phone) => {
    if (!phone) return false;

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it has 10 digits (US format) or 11 digits with leading 1
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
};

/**
 * Validate a password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result { isValid, strength, message }
 *  strength: 0 (very weak) to 4 (very strong)
 */
export const validatePassword = (password) => {
    if (!password) {
        return {
            isValid: false,
            strength: 0,
            message: 'Password is required'
        };
    }

    let strength = 0;
    let message = '';

    // Length check
    if (password.length < 8) {
        message = 'Password must be at least 8 characters long';
    } else {
        strength += 1;
    }

    // Contains lowercase
    if (/[a-z]/.test(password)) {
        strength += 1;
    }

    // Contains uppercase
    if (/[A-Z]/.test(password)) {
        strength += 1;
    }

    // Contains number
    if (/[0-9]/.test(password)) {
        strength += 1;
    }

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    }

    // Set message based on strength
    if (strength === 0) {
        message = 'Very weak password';
    } else if (strength === 1) {
        message = 'Weak password';
    } else if (strength === 2) {
        message = 'Fair password';
    } else if (strength === 3) {
        message = 'Good password';
    } else if (strength === 4) {
        message = 'Strong password';
    } else {
        message = 'Very strong password';
    }

    return {
        isValid: strength >= 3,
        strength,
        message
    };
};

/**
 * Validate a date is in the future
 * @param {Date|string} date - Date to validate
 * @returns {boolean} - True if date is valid and in the future
 */
export const isDateInFuture = (date) => {
    if (!date) return false;

    let dateObj;

    if (date instanceof Date) {
        dateObj = date;
    } else if (typeof date === 'string') {
        dateObj = new Date(date);
    } else {
        return false;
    }

    if (isNaN(dateObj.getTime())) {
        return false;
    }

    return dateObj > new Date();
};

/**
 * Validate a date is in the past
 * @param {Date|string} date - Date to validate
 * @returns {boolean} - True if date is valid and in the past
 */
export const isDateInPast = (date) => {
    if (!date) return false;

    let dateObj;

    if (date instanceof Date) {
        dateObj = date;
    } else if (typeof date === 'string') {
        dateObj = new Date(date);
    } else {
        return false;
    }

    if (isNaN(dateObj.getTime())) {
        return false;
    }

    return dateObj < new Date();
};

/**
 * Validate a string is not empty
 * @param {string} value - String to validate
 * @returns {boolean} - True if string is not empty
 */
export const isNotEmpty = (value) => {
    return value !== null && value !== undefined && value.trim() !== '';
};

/**
 * Validate a number is within a range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if number is within range
 */
export const isNumberInRange = (value, min, max) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
        return false;
    }

    const num = parseFloat(value);

    if (min !== undefined && max !== undefined) {
        return num >= min && num <= max;
    } else if (min !== undefined) {
        return num >= min;
    } else if (max !== undefined) {
        return num <= max;
    }

    return true; // If no range specified
};

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
export const isValidUrl = (url) => {
    if (!url) return false;

    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Validate form fields against a schema
 * @param {Object} values - Form values to validate
 * @param {Object} schema - Validation schema with field rules
 * @returns {Object} - Object with field errors
 */
export const validateForm = (values, schema) => {
    const errors = {};

    if (!values || !schema) return errors;

    Object.keys(schema).forEach(field => {
        const rules = schema[field];
        const value = values[field];

        // Required check
        if (rules.required && !isNotEmpty(value)) {
            errors[field] = rules.requiredMessage || 'This field is required';
            return; // Skip other validations if empty
        }

        // Skip other validations if empty and not required
        if (value === null || value === undefined || value === '') {
            return;
        }

        // Minimum length check
        if (rules.minLength && value.length < rules.minLength) {
            errors[field] = rules.minLengthMessage || `Minimum length is ${rules.minLength} characters`;
            return;
        }

        // Maximum length check
        if (rules.maxLength && value.length > rules.maxLength) {
            errors[field] = rules.maxLengthMessage || `Maximum length is ${rules.maxLength} characters`;
            return;
        }

        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
            errors[field] = rules.patternMessage || 'Invalid format';
            return;
        }

        // Email check
        if (rules.email && !isValidEmail(value)) {
            errors[field] = rules.emailMessage || 'Invalid email address';
            return;
        }

        // Number range check
        if (rules.min !== undefined || rules.max !== undefined) {
            if (!isNumberInRange(value, rules.min, rules.max)) {
                if (rules.min !== undefined && rules.max !== undefined) {
                    errors[field] = rules.rangeMessage || `Value must be between ${rules.min} and ${rules.max}`;
                } else if (rules.min !== undefined) {
                    errors[field] = rules.minMessage || `Value must be at least ${rules.min}`;
                } else {
                    errors[field] = rules.maxMessage || `Value must be at most ${rules.max}`;
                }
                return;
            }
        }

        // Custom validation
        if (rules.validate && typeof rules.validate === 'function') {
            const validationResult = rules.validate(value, values);
            if (validationResult !== true) {
                errors[field] = validationResult || 'Invalid value';
            }
        }
    });

    return errors;
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
    // Login form validation
    login: {
        email: {
            required: true,
            requiredMessage: 'Email is required',
            email: true,
            emailMessage: 'Please enter a valid email address'
        },
        password: {
            required: true,
            requiredMessage: 'Password is required'
        }
    },

    // Register form validation
    register: {
        email: {
            required: true,
            requiredMessage: 'Email is required',
            email: true,
            emailMessage: 'Please enter a valid email address'
        },
        password: {
            required: true,
            requiredMessage: 'Password is required',
            minLength: 8,
            minLengthMessage: 'Password must be at least 8 characters long',
            validate: (value) => {
                const result = validatePassword(value);
                return result.isValid || result.message;
            }
        },
        confirmPassword: {
            required: true,
            requiredMessage: 'Please confirm your password',
            validate: (value, values) => {
                return values.password === value || 'Passwords do not match';
            }
        },
        displayName: {
            required: true,
            requiredMessage: 'Display name is required'
        }
    },

    // Kid form validation
    kid: {
        firstName: {
            required: true,
            requiredMessage: 'First name is required'
        },
        lastName: {
            required: true,
            requiredMessage: 'Last name is required'
        },
        age: {
            required: true,
            requiredMessage: 'Age is required',
            min: 0,
            max: 100,
            rangeMessage: 'Age must be between 0 and 100'
        },
        email: {
            email: true,
            emailMessage: 'Please enter a valid email address'
        },
        phone: {
            validate: (value) => {
                if (!value) return true;
                return isValidPhone(value) || 'Please enter a valid phone number';
            }
        }
    },

    // Team form validation
    team: {
        name: {
            required: true,
            requiredMessage: 'Team name is required'
        },
        maxCapacity: {
            min: 1,
            minMessage: 'Maximum capacity must be at least 1'
        }
    }
};

/**
 * Format validation errors as a string
 * @param {Object} errors - Validation errors object
 * @returns {string} - Formatted error message
 */
export const formatValidationErrors = (errors) => {
    if (!errors || Object.keys(errors).length === 0) {
        return '';
    }

    return Object.values(errors).join(', ');
};

/**
 * Check if a form has validation errors
 * @param {Object} errors - Validation errors object
 * @returns {boolean} - True if form has errors
 */
export const hasErrors = (errors) => {
    return errors && Object.keys(errors).length > 0;
};