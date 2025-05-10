// src/utils/excelUtils.js

import * as XLSX from 'xlsx';

/**
 * Parse Excel file to JSON
 * @param {File} file - Excel file to parse
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} - Parsed data { data, headers, sheets }
 */
export const parseExcelFile = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, {
                    type: 'binary',
                    cellDates: true,
                    ...options
                });

                // Get first sheet name
                const firstSheetName = workbook.SheetNames[0];

                // Get all sheet data
                const sheets = {};
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        raw: false,
                        ...options
                    });
                });

                // Get headers and data from first sheet
                const headers = sheets[firstSheetName][0] || [];
                const sheetData = sheets[firstSheetName].slice(1);

                // Create array of objects with keys from headers
                const dataObjects = sheetData.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        if (header) { // Skip empty headers
                            obj[header] = row[index];
                        }
                    });
                    return obj;
                });

                resolve({
                    data: dataObjects,
                    headers,
                    sheets,
                    workbook
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsBinaryString(file);
    });
};

/**
 * Convert JSON data to Excel file
 * @param {Array} data - Array of objects to convert
 * @param {string} fileName - File name (without extension)
 * @param {Object} options - Excel options
 * @returns {Blob} - Excel file blob
 */
export const jsonToExcel = (data, fileName = 'export', options = {}) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data, options);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create blob
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Download Excel file
 * @param {Blob} blob - Excel file blob
 * @param {string} fileName - File name (without extension)
 */
export const downloadExcel = (blob, fileName = 'export') => {
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 0);
};

/**
 * Validate Excel file structure against expected headers
 * @param {Array} headers - Actual headers from Excel file
 * @param {Array} expectedHeaders - Expected headers
 * @returns {Object} - Validation result { isValid, missingHeaders, extraHeaders }
 */
export const validateExcelHeaders = (headers, expectedHeaders) => {
    if (!headers || !expectedHeaders) {
        return {
            isValid: false,
            missingHeaders: expectedHeaders || [],
            extraHeaders: []
        };
    }

    // Find missing headers
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));

    // Find extra headers
    const extraHeaders = headers.filter(header => !expectedHeaders.includes(header));

    return {
        isValid: missingHeaders.length === 0,
        missingHeaders,
        extraHeaders
    };
};

/**
 * Validate Excel data against validation rules
 * @param {Array} data - Array of objects to validate
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} - Validation result { isValid, errors }
 */
export const validateExcelData = (data, validationRules) => {
    if (!data || !Array.isArray(data) || !validationRules) {
        return {
            isValid: false,
            errors: [{ row: 0, message: 'Invalid data or validation rules' }]
        };
    }

    const errors = [];

    // Validate each row
    data.forEach((row, rowIndex) => {
        // Validate each field
        Object.keys(validationRules).forEach(field => {
            const value = row[field];
            const rules = validationRules[field];

            // Required check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    row: rowIndex + 1, // +1 because data starts from row 1
                    field,
                    message: `Missing required field: ${field}`
                });
                return; // Skip other validations if empty
            }

            // Skip other validations if empty and not required
            if (value === undefined || value === null || value === '') {
                return;
            }

            // Type check
            if (rules.type) {
                let isValidType = true;

                switch (rules.type) {
                    case 'string':
                        isValidType = typeof value === 'string';
                        break;
                    case 'number':
                        isValidType = !isNaN(parseFloat(value)) && isFinite(value);
                        break;
                    case 'date':
                        isValidType = value instanceof Date || !isNaN(Date.parse(value));
                        break;
                    case 'boolean':
                        isValidType = typeof value === 'boolean' || value === 'true' || value === 'false' || value === 1 || value === 0;
                        break;
                    case 'email':
                        isValidType = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                        break;
                    case 'phone':
                        isValidType = /^\+?[\d\s-]{7,}$/.test(value);
                        break;
                }

                if (!isValidType) {
                    errors.push({
                        row: rowIndex + 1,
                        field,
                        message: `Invalid ${rules.type} format: ${field}`
                    });
                }
            }

            // Custom validation
            if (rules.validate && typeof rules.validate === 'function') {
                try {
                    const isValid = rules.validate(value, row);

                    if (isValid !== true) {
                        errors.push({
                            row: rowIndex + 1,
                            field,
                            message: isValid || `Invalid value for ${field}`
                        });
                    }
                } catch (error) {
                    errors.push({
                        row: rowIndex + 1,
                        field,
                        message: `Validation error: ${error.message}`
                    });
                }
            }
        });
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Format Excel data for display in a table
 * @param {Array} data - Array of objects to format
 * @param {Array} columns - Column definitions
 * @returns {Array} - Formatted data
 */
export const formatExcelData = (data, columns) => {
    if (!data || !Array.isArray(data) || !columns || !Array.isArray(columns)) {
        return [];
    }

    return data.map(row => {
        const formattedRow = {};

        columns.forEach(column => {
            const { key, format } = column;
            const value = row[key];

            // Apply formatter if provided
            if (format && typeof format === 'function') {
                formattedRow[key] = format(value, row);
            } else {
                formattedRow[key] = value;
            }
        });

        return formattedRow;
    });
};

/**
 * Create Excel template with headers
 * @param {Array} headers - Headers for template
 * @param {string} fileName - File name (without extension)
 */
export const createExcelTemplate = (headers, fileName = 'template') => {
    // Create empty row with headers
    const data = [headers.reduce((obj, header) => {
        obj[header] = '';
        return obj;
    }, {})];

    // Convert to Excel
    const blob = jsonToExcel(data, fileName);

    // Download
    downloadExcel(blob, fileName);
};

/**
 * Common column formatters for Excel data
 */
export const columnFormatters = {
    // Format date in DD/MM/YYYY format
    date: (value) => {
        if (!value) return '';

        try {
            const date = new Date(value);
            return date.toLocaleDateString();
        } catch (error) {
            return value;
        }
    },

    // Format currency
    currency: (value, currencyCode = 'USD') => {
        if (value === undefined || value === null) return '';

        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currencyCode
            }).format(value);
        } catch (error) {
            return value;
        }
    },

    // Format percentage
    percentage: (value) => {
        if (value === undefined || value === null) return '';

        try {
            return `${(value * 100).toFixed(2)}%`;
        } catch (error) {
            return value;
        }
    },

    // Format boolean as Yes/No
    boolean: (value) => {
        if (value === true || value === 'true' || value === 1 || value === '1') {
            return 'Yes';
        } else if (value === false || value === 'false' || value === 0 || value === '0') {
            return 'No';
        }

        return value;
    },

    // Format phone number
    phone: (value) => {
        if (!value) return '';

        // Remove non-digit characters
        const cleaned = `${value}`.replace(/\D/g, '');

        // Format based on length
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else {
            return value;
        }
    },

    // Format name (combines first and last name)
    name: (value, row) => {
        if (row.firstName && row.lastName) {
            return `${row.firstName} ${row.lastName}`;
        } else if (row.firstName) {
            return row.firstName;
        } else if (row.lastName) {
            return row.lastName;
        } else {
            return value;
        }
    },

    // Format address
    address: (value, row) => {
        const parts = [];

        if (row.street) parts.push(row.street);
        if (row.city) parts.push(row.city);
        if (row.state) parts.push(row.state);
        if (row.zip) parts.push(row.zip);
        if (row.country) parts.push(row.country);

        if (parts.length > 0) {
            return parts.join(', ');
        } else {
            return value;
        }
    }
};

/**
 * Common validation rules for Excel data
 */
export const excelValidationRules = {
    // Kids data validation rules
    kids: {
        firstName: {
            required: true,
            type: 'string'
        },
        lastName: {
            required: true,
            type: 'string'
        },
        age: {
            required: true,
            type: 'number',
            validate: (value) => {
                const age = parseFloat(value);
                return (age >= 0 && age <= 100) || 'Age must be between 0 and 100';
            }
        },
        gender: {
            type: 'string'
        },
        email: {
            type: 'email'
        },
        phone: {
            type: 'phone'
        },
        address: {
            type: 'string'
        },
        emergencyContact: {
            type: 'string'
        },
        emergencyPhone: {
            type: 'phone'
        },
        teamId: {
            type: 'string'
        }
    },

    // Teams data validation rules
    teams: {
        name: {
            required: true,
            type: 'string'
        },
        description: {
            type: 'string'
        },
        instructorId: {
            type: 'string'
        },
        maxCapacity: {
            type: 'number',
            validate: (value) => {
                const capacity = parseFloat(value);
                return (capacity > 0) || 'Maximum capacity must be greater than 0';
            }
        },
        meetingDays: {
            type: 'string'
        },
        meetingTime: {
            type: 'string'
        },
        location: {
            type: 'string'
        }
    }
};

/**
 * Common column definitions for Excel data
 */
export const excelColumnDefinitions = {
    // Kids data column definitions
    kids: [
        { key: 'firstName', header: 'First Name', sortable: true },
        { key: 'lastName', header: 'Last Name', sortable: true },
        { key: 'age', header: 'Age', sortable: true, format: (value) => value || 'N/A' },
        { key: 'gender', header: 'Gender', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'phone', header: 'Phone', sortable: true, format: columnFormatters.phone },
        { key: 'address', header: 'Address', sortable: true },
        { key: 'emergencyContact', header: 'Emergency Contact', sortable: true },
        { key: 'emergencyPhone', header: 'Emergency Phone', sortable: true, format: columnFormatters.phone },
        { key: 'teamId', header: 'Team', sortable: true },
        { key: 'createdAt', header: 'Created', sortable: true, format: columnFormatters.date }
    ],

    // Teams data column definitions
    teams: [
        { key: 'name', header: 'Team Name', sortable: true },
        { key: 'description', header: 'Description', sortable: true },
        { key: 'instructorId', header: 'Instructor', sortable: true },
        { key: 'maxCapacity', header: 'Max Capacity', sortable: true },
        { key: 'meetingDays', header: 'Meeting Days', sortable: true },
        { key: 'meetingTime', header: 'Meeting Time', sortable: true },
        { key: 'location', header: 'Location', sortable: true },
        { key: 'createdAt', header: 'Created', sortable: true, format: columnFormatters.date }
    ]
};