// src/components/routing/RoleRedirectHandler.jsx - FIXED VERSION that allows shared pages
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

        // Only redirect if all conditions are met
        if (authInitialized && currentUser && shouldRedirect && userRole) {

            // FIXED: Define shared/allowed pages that should NOT be redirected
            const sharedPages = [
                '/my-account',
                '/gallery',
                '/kid/', // for /kid/:id routes
                '/kids/view/', // for /kids/view/:id routes
                '/teams/view/', // for /teams/view/:id routes
                '/vehicles/view/', // for /vehicles/view/:id routes
            ];

            // Check if current path is a shared page
            const isSharedPage = sharedPages.some(sharedPath => {
                if (sharedPath.endsWith('/')) {
                    // For dynamic routes like /kid/:id
                    return location.pathname.startsWith(sharedPath);
                } else {
                    // For exact matches
                    return location.pathname === sharedPath || location.pathname.startsWith(sharedPath + '/');
                }
            });

            if (isSharedPage) {
                console.log(`Current path ${location.pathname} is a shared page, allowing access`);
                return;
            }

            // Check if we're already on the target page or in the correct area
            if (location.pathname === shouldRedirect) {
                console.log(`Already on target page ${shouldRedirect}, skipping redirect`);
                return;
            }

            // Check if we're already in the correct role area
            const currentArea = location.pathname.split('/')[1]; // Get the first part of the path
            const targetArea = shouldRedirect.split('/')[1]; // Get the target area

            if (currentArea === targetArea) {
                console.log(`Already in ${targetArea} area, skipping redirect`);
                return;
            }

            // Only redirect from login page, root, or wrong dashboard areas
            const shouldActuallyRedirect = (
                location.pathname === '/login' ||
                location.pathname === '/' ||
                location.pathname === '/dashboard' ||
                // Wrong dashboard areas (but not shared pages)
                (userRole === 'admin' && location.pathname.startsWith('/instructor') && !isSharedPage) ||
                (userRole === 'admin' && location.pathname.startsWith('/parent') && !isSharedPage) ||
                (userRole === 'admin' && location.pathname.startsWith('/host') && !isSharedPage) ||
                (userRole === 'instructor' && location.pathname.startsWith('/admin') && !isSharedPage) ||
                (userRole === 'instructor' && location.pathname.startsWith('/parent') && !isSharedPage) ||
                (userRole === 'instructor' && location.pathname.startsWith('/host') && !isSharedPage) ||
                (userRole === 'parent' && location.pathname.startsWith('/admin') && !isSharedPage) ||
                (userRole === 'parent' && location.pathname.startsWith('/instructor') && !isSharedPage) ||
                (userRole === 'parent' && location.pathname.startsWith('/host') && !isSharedPage) ||
                (userRole === 'host' && location.pathname.startsWith('/admin') && !isSharedPage) ||
                (userRole === 'host' && location.pathname.startsWith('/instructor') && !isSharedPage) ||
                (userRole === 'host' && location.pathname.startsWith('/parent') && !isSharedPage)
            );

            if (shouldActuallyRedirect) {
                console.log(`Redirecting ${userRole} to ${shouldRedirect} from ${location.pathname}`);

                // Small delay to ensure state has settled
                const redirectTimer = setTimeout(() => {
                    navigate(shouldRedirect, { replace: true });
                }, 100);

                return () => clearTimeout(redirectTimer);
            } else {
                console.log(`No redirect needed for ${userRole} on ${location.pathname}`);
            }
        }
    }, [shouldRedirect, authInitialized, currentUser, userRole, navigate, location.pathname]);

    return children;
};

export default RoleRedirectHandler;