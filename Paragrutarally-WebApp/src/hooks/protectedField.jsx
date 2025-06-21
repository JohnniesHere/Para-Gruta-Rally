// src/components/common/ProtectedField.jsx - Field-Level Permission Component
import React from 'react';
import { usePermissions } from './usePermissions';

/**
 * ProtectedField component for field-level access control
 *
 * @param {Object} props
 * @param {string} props.fieldPath - The field path (e.g., 'personalInfo.firstName')
 * @param {ReactNode} props.children - Content to render if user has access
 * @param {ReactNode} props.fallback - Content to render if user doesn't have access (optional)
 * @param {Object} props.context - Additional context for permission checking (kidData, vehicleData, etc.)
 * @param {boolean} props.requireEdit - If true, checks edit permission instead of view permission
 * @param {string} props.className - CSS class for the wrapper
 * @param {Object} props.style - Inline styles for the wrapper
 * @param {string} props.as - HTML element to render as wrapper (default: 'div')
 */
const ProtectedField = ({
                            fieldPath,
                            children,
                            fallback = null,
                            context = {},
                            requireEdit = false,
                            className = '',
                            style = {},
                            as: Component = 'div',
                            ...otherProps
                        }) => {
    const { permissions, userRole, userData, user } = usePermissions();

    // Build context object for permission checking
    const permissionContext = {
        ...context,
        userData,
        user,
        userRole
    };

    // Check if user has the required permission
    const hasPermission = requireEdit
        ? permissions.canEditField(fieldPath, permissionContext)
        : permissions.canViewField(fieldPath, permissionContext);

    // If user doesn't have permission, render fallback or nothing
    if (!hasPermission) {
        return fallback;
    }

    // If no wrapper is needed, just return children
    if (Component === 'fragment') {
        return <>{children}</>;
    }

    // Render with wrapper
    return (
        <Component
            className={className}
            style={style}
            {...otherProps}
        >
            {children}
        </Component>
    );
};

/**
 * ProtectedInput component for form inputs with field-level permissions
 */
export const ProtectedInput = ({
                                   fieldPath,
                                   value,
                                   onChange,
                                   context = {},
                                   readOnlyFallback = null,
                                   hiddenFallback = null,
                                   inputProps = {},
                                   ...otherProps
                               }) => {
    const { permissions, userRole, userData, user } = usePermissions();

    const permissionContext = {
        ...context,
        userData,
        user,
        userRole
    };

    const canView = permissions.canViewField(fieldPath, permissionContext);
    const canEdit = permissions.canEditField(fieldPath, permissionContext);

    // If user can't view the field at all
    if (!canView) {
        return hiddenFallback;
    }

    // If user can view but not edit, show read-only version
    if (!canEdit) {
        return readOnlyFallback || (
            <div className="protected-field-readonly" {...otherProps}>
                <input
                    value={value || ''}
                    readOnly
                    disabled
                    className="readonly-input"
                    {...inputProps}
                />
            </div>
        );
    }

    // User can edit - render editable input
    return (
        <div className="protected-field-editable" {...otherProps}>
            <input
                value={value || ''}
                onChange={onChange}
                {...inputProps}
            />
        </div>
    );
};

/**
 * ProtectedSection component for hiding/showing entire sections
 */
export const ProtectedSection = ({
                                     requiredFields = [],
                                     requireAll = false,
                                     children,
                                     fallback = null,
                                     context = {},
                                     className = '',
                                     style = {}
                                 }) => {
    const { permissions, userRole, userData, user } = usePermissions();

    const permissionContext = {
        ...context,
        userData,
        user,
        userRole
    };

    // Check if user has access to required fields
    const fieldAccess = requiredFields.map(fieldPath =>
        permissions.canViewField(fieldPath, permissionContext)
    );

    const hasAccess = requireAll
        ? fieldAccess.every(Boolean) // All fields must be accessible
        : fieldAccess.some(Boolean);  // At least one field must be accessible

    if (!hasAccess) {
        return fallback;
    }

    return (
        <div className={`protected-section ${className}`} style={style}>
            {children}
        </div>
    );
};

/**
 * RoleBasedComponent - Simple role-based rendering
 */
export const RoleBasedComponent = ({
                                       allowedRoles = [],
                                       children,
                                       fallback = null,
                                       requireAdmin = false
                                   }) => {
    const { userRole } = usePermissions();

    // Admin override
    if (requireAdmin && userRole !== 'admin') {
        return fallback;
    }

    // Check if user role is in allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return fallback;
    }

    return <>{children}</>;
};

/**
 * FieldPermissionWrapper - Comprehensive field wrapper with multiple permission levels
 */
export const FieldPermissionWrapper = ({
                                           fieldPath,
                                           children,
                                           context = {},

                                           // Different views for different permission levels
                                           editableView,
                                           readOnlyView,
                                           hiddenView = null,

                                           // Styling
                                           className = '',
                                           style = {},

                                           // Additional options
                                           showPermissionInfo = false
                                       }) => {
    const { permissions, userRole, userData, user } = usePermissions();

    const permissionContext = {
        ...context,
        userData,
        user,
        userRole
    };

    const canView = permissions.canViewField(fieldPath, permissionContext);
    const canEdit = permissions.canEditField(fieldPath, permissionContext);

    // Permission info for debugging (only show in development)
    const permissionInfo = showPermissionInfo && process.env.NODE_ENV === 'development' && (
        <div style={{
            fontSize: '10px',
            color: '#666',
            fontStyle: 'italic',
            marginTop: '2px'
        }}>
            {userRole} - View: {canView ? '✓' : '✗'}, Edit: {canEdit ? '✓' : '✗'}
        </div>
    );

    // If user can't view the field
    if (!canView) {
        return hiddenView || null;
    }

    // If user can edit
    if (canEdit) {
        return (
            <div className={`field-permission-wrapper editable ${className}`} style={style}>
                {editableView || children}
                {permissionInfo}
            </div>
        );
    }

    // User can view but not edit
    return (
        <div className={`field-permission-wrapper readonly ${className}`} style={style}>
            {readOnlyView || children}
            {permissionInfo}
        </div>
    );
};

export default ProtectedField;