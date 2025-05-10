// src/contexts/NotificationContext.js

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import Notification from '../components/layout/Notification';

// Create context
const NotificationContext = createContext();

// Action types
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

// Initial state
const initialState = {
    notifications: []
};

// Reducer
function notificationReducer(state, action) {
    switch (action.type) {
        case ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [...state.notifications, action.payload]
            };
        case REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification => notification.id !== action.payload
                )
            };
        default:
            return state;
    }
}

// Provider component
export function NotificationProvider({ children }) {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // Add a notification
    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);

        dispatch({
            type: ADD_NOTIFICATION,
            payload: {
                id,
                message,
                type,
                duration
            }
        });

        return id;
    }, []);

    // Remove a notification
    const removeNotification = useCallback(id => {
        dispatch({
            type: REMOVE_NOTIFICATION,
            payload: id
        });
    }, []);

    // Helper methods for different notification types
    const notifySuccess = useCallback((message, duration) => {
        return addNotification(message, 'success', duration);
    }, [addNotification]);

    const notifyError = useCallback((message, duration) => {
        return addNotification(message, 'error', duration);
    }, [addNotification]);

    const notifyWarning = useCallback((message, duration) => {
        return addNotification(message, 'warning', duration);
    }, [addNotification]);

    const notifyInfo = useCallback((message, duration) => {
        return addNotification(message, 'info', duration);
    }, [addNotification]);

    const value = {
        notifications: state.notifications,
        addNotification,
        removeNotification,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-4 w-80">
                {state.notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        type={notification.type}
                        message={notification.message}
                        duration={notification.duration}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

// Custom hook to use the notification context
export function useNotification() {
    const context = useContext(NotificationContext);

    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }

    return context;
}

export default NotificationContext;