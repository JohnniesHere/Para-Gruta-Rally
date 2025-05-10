// src/components/layout/LoadingSpinner.js

import React from 'react';

function LoadingSpinner({ size = 'medium', color = 'indigo', text = 'Loading...' }) {
    // Map size to classes
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12'
    };

    // Map color to classes
    const colorClasses = {
        indigo: 'text-indigo-500',
        blue: 'text-blue-500',
        green: 'text-green-500',
        red: 'text-red-500',
        yellow: 'text-yellow-500',
        gray: 'text-gray-500',
        white: 'text-white'
    };

    // Get the appropriate classes
    const spinnerSize = sizeClasses[size] || sizeClasses.medium;
    const spinnerColor = colorClasses[color] || colorClasses.indigo;

    return (
        <div className="flex items-center justify-center">
            <svg
                className={`animate-spin -ml-1 mr-3 ${spinnerSize} ${spinnerColor}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            {text && <span className="text-gray-600">{text}</span>}
        </div>
    );
}

export default LoadingSpinner;