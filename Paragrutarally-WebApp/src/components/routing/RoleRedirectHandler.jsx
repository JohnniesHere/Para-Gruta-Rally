// src/components/routing/RoleRedirectHandler.jsx - FIXED VERSION
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
        // 5. CRITICAL: The redirect destination is DIFFERENT from current path
        if (authInitialized && currentUser && shouldRedirect && userRole) {

            // FIXED: Check if we're already on the target page
            if (location.pathname === shouldRedirect) {
                console.log(`RoleRedirectHandler: Already on target page ${shouldRedirect}, skipping redirect`);
                return;
            }

            // FIXED: Also check if we're on a sub-path of the target
            if (shouldRedirect.startsWith('/admin') && location.pathname.startsWith('/admin')) {
                console.log(`RoleRedirectHandler: Already in admin area, skipping redirect`);
                return;
            }
            if (shouldRedirect.startsWith('/host') && location.pathname.startsWith('/host')) {
                console.log(`RoleRedirectHandler: Already in host area, skipping redirect`);
                return;
            }
            if (shouldRedirect.startsWith('/parent') && location.pathname.startsWith('/parent')) {
                console.log(`RoleRedirectHandler: Already in parent area, skipping redirect`);
                return;
            }
            if (shouldRedirect.startsWith('/instructor') && location.pathname.startsWith('/instructor')) {
                console.log(`RoleRedirectHandler: Already in instructor area, skipping redirect`);
                return;
            }

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