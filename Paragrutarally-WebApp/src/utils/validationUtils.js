// src/utils/validationUtils.js - ENHANCED VERSION WITH TRANSLATION SUPPORT

/**
 * Email validation with translation support
 * @param {string} email - Email to validate
 * @param {function} t - Translation function
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email, t) => {
    if (!email || !email.trim()) {
        return t('validation.emailRequired', 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return t('validation.emailInvalid', 'Please enter a valid email address');
    }

    return null;
};

/**
 * Israeli phone number validation with translation support
 * @param {string} phone - Phone number to validate
 * @param {function} t - Translation function
 * @param {boolean} isRequired - Whether the field is required
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhone = (phone, t, isRequired = true) => {
    if (!phone || !phone.trim()) {
        return isRequired ? t('validation.phoneRequired', 'Phone number is required') : null;
    }

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Israeli phone number validation
    // Mobile: 050/051/052/053/054/055/056/057/058/059 followed by 7 digits
    // Landline: Area code (02/03/04/08/09) followed by 7 digits
    const israeliMobileRegex = /^05[0-9]\d{7}$/;
    const israeliLandlineRegex = /^0[2-4,8-9]\d{7}$/;

    if (!israeliMobileRegex.test(digitsOnly) && !israeliLandlineRegex.test(digitsOnly)) {
        return t('validation.phoneInvalid', 'Please enter a valid Israeli phone number (10 digits)');
    }

    return null;
};

/**
 * Name validation with Hebrew character support
 * @param {string} name - Name to validate
 * @param {function} t - Translation function
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} minLength - Minimum length required
 * @returns {string|null} - Error message or null if valid
 */
export const validateName = (name, t, fieldName = 'name', minLength = 2) => {
    if (!name || !name.trim()) {
        return t('validation.fieldRequired', `${fieldName} is required`, { field: fieldName });
    }

    if (name.trim().length < minLength) {
        return t('validation.minLength', `${fieldName} must be at least {min} characters`, {
            field: fieldName,
            min: minLength
        });
    }

    // Allow Hebrew, English letters, spaces, hyphens, and apostrophes
    const validNameRegex = /^[\u0590-\u05FFa-zA-Z\s'-]+$/;
    if (!validNameRegex.test(name.trim())) {
        return t('validation.nameInvalidChars', `${fieldName} contains invalid characters`);
    }

    return null;
};

/**
 * Required field validation
 * @param {any} value - Value to validate
 * @param {function} t - Translation function
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value, t, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return t('validation.fieldRequired', `${fieldName} is required`, { field: fieldName });
    }
    return null;
};

/**
 * Date validation with translation support
 * @param {string|Date} date - Date to validate
 * @param {function} t - Translation function
 * @param {Object} options - Validation options
 * @returns {string|null} - Error message or null if valid
 */
export const validateDate = (date, t, options = {}) => {
    const { fieldName = 'Date', required = false, mustBePast = false, mustBeFuture = false } = options;

    if (!date) {
        return required ? t('validation.fieldRequired', `${fieldName} is required`, { field: fieldName }) : null;
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        return t('validation.dateInvalid', 'Please enter a valid date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (mustBePast && dateObj >= today) {
        return t('validation.dateMustBePast', 'Date must be in the past');
    }

    if (mustBeFuture && dateObj <= today) {
        return t('validation.dateMustBeFuture', 'Date must be in the future');
    }

    return null;
};

/**
 * Password validation with translation support
 * @param {string} password - Password to validate
 * @param {function} t - Translation function
 * @returns {Object} - Validation result with isValid, strength, and message
 */
export const validatePassword = (password, t) => {
    if (!password) {
        return {
            isValid: false,
            strength: 0,
            message: t('validation.passwordRequired', 'Password is required')
        };
    }

    let strength = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    Object.values(checks).forEach(check => {
        if (check) strength++;
    });

    let message;
    if (strength === 0) {
        message = t('validation.passwordVeryWeak', 'Very weak password');
    } else if (strength === 1) {
        message = t('validation.passwordWeak', 'Weak password');
    } else if (strength === 2) {
        message = t('validation.passwordFair', 'Fair password');
    } else if (strength === 3) {
        message = t('validation.passwordGood', 'Good password');
    } else if (strength === 4) {
        message = t('validation.passwordStrong', 'Strong password');
    } else {
        message = t('validation.passwordVeryStrong', 'Very strong password');
    }

    if (!checks.length) {
        message = t('validation.passwordMinLength', 'Password must be at least 8 characters long');
    }

    return {
        isValid: strength >= 3 && checks.length,
        strength,
        message,
        checks
    };
};

/**
 * Role validation
 * @param {string} role - Role to validate
 * @param {function} t - Translation function
 * @param {Array} allowedRoles - List of allowed roles
 * @returns {string|null} - Error message or null if valid
 */
export const validateRole = (role, t, allowedRoles = ['admin', 'instructor', 'parent', 'host']) => {
    if (!role) {
        return t('validation.roleRequired', 'Role is required');
    }

    if (!allowedRoles.includes(role)) {
        return t('validation.roleInvalid', 'Please select a valid role');
    }

    return null;
};

/**
 * Comprehensive form validation hook that uses translation
 */
export const useFormValidation = () => {
    const validateField = (fieldName, value, rules = {}, t) => {
        // Handle nested field names (e.g., 'personalInfo.firstName')
        const displayName = rules.displayName || t(`fields.${fieldName}`, fieldName);

        switch (fieldName) {
            case 'email':
                return validateEmail(value, t);

            case 'phone':
                return validatePhone(value, t, rules.required);

            case 'firstName':
            case 'lastName':
            case 'displayName':
            case 'name':
            case 'parentName':
                return validateName(value, t, displayName, rules.minLength || 2);

            case 'password':
                { const result = validatePassword(value, t);
                return result.isValid ? null : result.message; }

            case 'confirmPassword':
                if (rules.matchField && value !== rules.matchValue) {
                    return t('validation.passwordsDoNotMatch', 'Passwords do not match');
                }
                return null;

            case 'role':
                return validateRole(value, t, rules.allowedValues);

            case 'dateOfBirth':
                return validateDate(value, t, {
                    fieldName: displayName,
                    required: rules.required,
                    mustBePast: true
                });

            case 'eventDate':
                return validateDate(value, t, {
                    fieldName: displayName,
                    required: rules.required,
                    mustBeFuture: true
                });

            default:
                // Generic required validation
                if (rules.required) {
                    return validateRequired(value, t, displayName);
                }
                return null;
        }
    };

    const validateForm = (formData, validationRules, t) => {
        const errors = {};

        for (const [fieldName, rules] of Object.entries(validationRules)) {
            // Handle nested field paths (e.g., 'personalInfo.firstName')
            const value = fieldName.includes('.')
                ? fieldName.split('.').reduce((obj, key) => obj?.[key], formData)
                : formData[fieldName];

            const error = validateField(fieldName, value, rules, t);
            if (error) {
                errors[fieldName] = error;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    return { validateField, validateForm };
};

/**
 * Common validation rules for different forms
 */
export const validationRules = {
    // User creation/editing
    user: {
        displayName: {
            required: true,
            minLength: 2,
            displayName: 'Display Name'
        },
        email: {
            required: true,
            displayName: 'Email'
        },
        name: {
            required: true,
            minLength: 2,
            displayName: 'Full Name'
        },
        phone: {
            required: true,
            displayName: 'Phone Number'
        },
        role: {
            required: true,
            allowedValues: ['admin', 'instructor', 'parent', 'host'],
            displayName: 'Role'
        }
    },

    // Kid registration/editing
    kid: {
        participantNumber: {
            required: true,
            displayName: 'Participant Number'
        },
        'personalInfo.firstName': {
            required: true,
            minLength: 2,
            displayName: 'First Name'
        },
        'personalInfo.lastName': {
            required: true,
            minLength: 2,
            displayName: 'Last Name'
        },
        'personalInfo.dateOfBirth': {
            required: true,
            displayName: 'Date of Birth'
        },
        'parentInfo.email': {
            required: true,
            displayName: 'Parent Email'
        },
        'parentInfo.phone': {
            required: true,
            displayName: 'Parent Phone'
        },
        'parentInfo.name': {
            required: true,
            minLength: 2,
            displayName: 'Parent Name'
        }
    },

    // Team creation/editing
    team: {
        name: {
            required: true,
            minLength: 2,
            displayName: 'Team Name'
        },
        maxCapacity: {
            required: true,
            displayName: 'Maximum Capacity'
        },
        description: {
            required: false,
            maxLength: 500,
            displayName: 'Team Description'
        }
    },
    // Vehicle creation/editing
    vehicle: {
        make: {
            required: true,
            minLength: 2,
            displayName: 'Vehicle Make'
        },
        model: {
            required: true,
            minLength: 2,
            displayName: 'Vehicle Model'
        },
        licensePlate: {
            required: true,
            minLength: 2,
            displayName: 'License Plate'
        },
        batteryType: {
            required: false,
            displayName: 'Battery Type'
        },
        driveType: {
            required: false,
            displayName: 'Drive Type'
        },
        steeringType: {
            required: false,
            displayName: 'Steering Type'
        }
    },
    // Event creation/editing
    event: {
        name: {
            required: true,
            minLength: 3,
            displayName: 'Event Name'
        },
        description: {
            required: false,
            maxLength: 1000,
            displayName: 'Event Description'
        },
        date: {
            required: true,
            displayName: 'Event Date'
        },
        time: {
            required: false,
            displayName: 'Event Time'
        },
        location: {
            required: true,
            minLength: 3,
            displayName: 'Event Location'
        },
        address: {
            required: false,
            displayName: 'Event Address'
        },
        organizer: {
            required: false,
            displayName: 'Event Organizer'
        },
        eventType: {
            required: true,
            allowedValues: ['race', 'newcomers', 'social'],
            displayName: 'Event Type'
        }
    },

    // Login form
    login: {
        email: {
            required: true,
            displayName: 'Email'
        },
        password: {
            required: true,
            displayName: 'Password'
        }
    },
    // Parent kid editing (limited fields)
    parentKidEdit: {
        'personalInfo.firstName': {
            required: true,
            minLength: 2,
            displayName: 'First Name'
        },
        'personalInfo.lastName': {
            required: true,
            minLength: 2,
            displayName: 'Last Name'
        },
        'personalInfo.address': {
            required: false,
            displayName: 'Address'
        },
        'personalInfo.announcersNotes': {
            required: false,
            maxLength: 500,
            displayName: 'Announcer Notes'
        },
        'parentInfo.name': {
            required: true,
            minLength: 2,
            displayName: 'Parent Name'
        },
        'parentInfo.phone': {
            required: true,
            displayName: 'Parent Phone'
        },
        'parentInfo.grandparentsInfo.names': {
            required: false,
            displayName: 'Grandparents Names'
        },
        'parentInfo.grandparentsInfo.phone': {
            required: false,
            displayName: 'Grandparents Phone'
        }
    },
    // Export forms validation
    export: {
        statusFilter: {
            required: true,
            allowedValues: ['all', 'active', 'inactive', 'pending', 'completed', 'cancelled'],
            displayName: 'Status Filter'
        },
        teamFilter: {
            required: false,
            displayName: 'Team Filter'
        },
        includeTimestamps: {
            required: false,
            displayName: 'Include Timestamps'
        }
    },

    // Team assignment validation
    teamAssignment: {
        teamId: {
            required: true,
            displayName: 'Team'
        },
        kidIds: {
            required: false,
            displayName: 'Selected Kids'
        }
    },

    // Contact/Legal forms
    contact: {
        name: {
            required: true,
            minLength: 2,
            displayName: 'Name'
        },
        email: {
            required: true,
            displayName: 'Email'
        },
        subject: {
            required: true,
            minLength: 5,
            displayName: 'Subject'
        },
        message: {
            required: true,
            minLength: 10,
            maxLength: 1000,
            displayName: 'Message'
        }
    }
};

/**
 * Utility to clean phone number input (remove non-digits)
 * @param {string} phone - Phone number to clean
 * @returns {string} - Cleaned phone number
 */
export const cleanPhoneNumber = (phone) => {
    return phone ? phone.replace(/\D/g, '') : '';
};

/**
 * Utility to format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    const cleaned = cleanPhoneNumber(phone);
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return cleaned;
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean} - True if there are errors
 */
export const hasErrors = (errors) => {
    return errors && Object.keys(errors).length > 0;
};

/**
 * Get first error message from errors object
 * @param {Object} errors - Errors object
 * @returns {string|null} - First error message or null
 */
export const getFirstError = (errors) => {
    if (!hasErrors(errors)) return null;
    return Object.values(errors)[0];
};