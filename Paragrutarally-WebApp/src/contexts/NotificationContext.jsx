// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function useNotification() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const notifySuccess = (message) => {
        const notification = { type: 'success', message, id: Date.now() };
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => removeNotification(notification.id), 5000);
    };

    const notifyError = (message) => {
        const notification = { type: 'error', message, id: Date.now() };
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => removeNotification(notification.id), 5000);
    };

    const notifyWarning = (message) => {
        const notification = { type: 'warning', message, id: Date.now() };
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => removeNotification(notification.id), 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const value = {
        notifications,
        notifySuccess,
        notifyError,
        notifyWarning,
        removeNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <div className="notification-container">
                {notifications.map(notification => (
                    <div key={notification.id} className={`notification notification-${notification.type}`}>
                        <span>{notification.message}</span>
                        <button onClick={() => removeNotification(notification.id)}>&times;</button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}