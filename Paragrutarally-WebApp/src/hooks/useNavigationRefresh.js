// src/hooks/useNavigationRefresh.js
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useNavigationRefresh() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // This function will run when the component mounts and
        // whenever the location changes
        const handlePopState = () => {
            // Force a refresh of the current route
            navigate(0);
        };

        // Listen for browser navigation events
        window.addEventListener('popstate', handlePopState);

        // Clean up the listener when the component unmounts
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    return location;
}