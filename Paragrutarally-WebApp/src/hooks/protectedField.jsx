// src/components/ProtectedField.jsx
import React from 'react';
import { usePermissions } from './usePermissions.jsx';

const ProtectedField = ({
                            field,
                            value,
                            kidData,
                            vehicleData,
                            type = 'text',
                            placeholder = '',
                            onChange,
                            className = '',
                            label = '',
                            multiline = false,
                            disabled = false
                        }) => {
    const { permissions, userRole } = usePermissions();

    if (!permissions) {
        return <div className="animate-pulse bg-gray-200 h-6 rounded"></div>;
    }

    const canView = permissions.canView(field, { kidData, vehicleData });
    const canEdit = permissions.canEdit(field, { kidData, vehicleData });

    // If user cannot view this field, show restricted indicator
    if (!canView) {
        return (
            <div className="flex items-center">
                {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
                <span className="text-red-500 font-mono text-sm bg-red-50 px-2 py-1 rounded border">
          • • • • • (Restricted)
        </span>
            </div>
        );
    }

    // If user can view but not edit, show read-only
    if (!canEdit || disabled) {
        return (
            <div className="space-y-1">
                {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
                <div className={`text-gray-700 bg-gray-50 px-3 py-2 rounded border min-h-[2.5rem] flex items-center ${className}`}>
                    {value || <span className="text-gray-400 italic">{placeholder || 'No data'}</span>}
                </div>
            </div>
        );
    }

    // User can edit - show appropriate input
    const inputClass = `
    border border-gray-300 rounded-md px-3 py-2 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${className}
  `;

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {canEdit && (
                        <span className="ml-1 text-purple-600 text-xs">
              ({userRole === 'parent' ? 'You can edit' :
                            userRole === 'instructor' ? 'Team leader can edit' :
                                userRole === 'guest' ? 'Organization can edit' : 'Editable'})
            </span>
                    )}
                </label>
            )}

            {multiline ? (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} min-h-[4rem] resize-vertical`}
                    rows={3}
                />
            ) : type === 'date' ? (
                <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    className={inputClass}
                />
            ) : type === 'tel' ? (
                <input
                    type="tel"
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                />
            ) : type === 'email' ? (
                <input
                    type="email"
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                />
            ) : type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => onChange && onChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{placeholder}</span>
                </div>
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                />
            )}
        </div>
    );
};

export default ProtectedField;