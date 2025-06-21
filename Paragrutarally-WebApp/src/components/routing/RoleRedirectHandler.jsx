// src/components/routing/RoleRedirectHandler.jsx - Enhanced with Better Debugging
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleRedirectHandler = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { shouldRedirect, userRole, authInitialized, currentUser } = useAuth();

    useEffect(() => {
        console.log('RoleRedirectHandler useEffect triggered:', {
            authInitialized,
            currentUser: !!currentUser,
            userRole,
            shouldRedirect,
            currentPath: location.pathname
        });

        // Only redirect if:
        // 1. Auth is initialized
        // 2. User is logged in
        // 3. We have a redirect destination
        // 4. We have a valid user role
        if (authInitialized && currentUser && shouldRedirect && userRole) {
            console.log(`RoleRedirectHandler: Redirecting ${userRole} to ${shouldRedirect} from ${location.pathname}`);

            // Small delay to ensure state has settled
            const redirectTimer = setTimeout(() => {
                navigate(shouldRedirect, { replace: true });
            }, 100);

            return () => clearTimeout(redirectTimer);
        }
    }, [shouldRedirect, authInitialized, currentUser, userRole, navigate, location.pathname]);

    return children;
};

export default RoleRedirectHandler;