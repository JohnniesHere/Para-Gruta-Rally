// functions/index.js - Callable Functions (2nd Gen)
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Set global options for 2nd gen functions
setGlobalOptions({
    maxInstances: 10,
    region: 'us-central1'
});

// Initialize Firebase Admin SDK
initializeApp();

const auth = getAuth();
const firestore = getFirestore();

/**
 * Callable Cloud Function to delete a user (Admin only)
 * This automatically handles CORS and authentication
 */
export const deleteUser = onCall(
    {
        timeoutSeconds: 540,
        memory: '1GiB',
        maxInstances: 5
    },
    async (request) => {
        try {
            console.log('🗑️ Delete user callable function invoked');
            console.log('📦 Data received:', request.data);
            console.log('👤 Auth context:', request.auth ? request.auth.uid : 'No auth');

            // Check if user is authenticated
            if (!request.auth) {
                console.log('❌ Unauthenticated request');
                throw new HttpsError(
                    'unauthenticated',
                    'User must be authenticated to delete users.'
                );
            }

            const callingUserId = request.auth.uid;
            console.log(`📋 Delete request from user: ${callingUserId}`);

            // Check if the calling user is an admin
            const callingUserDoc = await firestore
                .collection('users')
                .doc(callingUserId)
                .get();

            if (!callingUserDoc.exists) {
                console.log('❌ Calling user document not found');
                throw new HttpsError(
                    'permission-denied',
                    'User profile not found. Please contact support.'
                );
            }

            const callingUserData = callingUserDoc.data();
            console.log(`👤 Calling user role: ${callingUserData.role}`);

            if (callingUserData.role !== 'admin') {
                console.log(`❌ Unauthorized delete attempt by non-admin: ${callingUserId}, role: ${callingUserData.role}`);
                throw new HttpsError(
                    'permission-denied',
                    'Only admin users can delete other users.'
                );
            }

            console.log('✅ Admin verification successful');

            // Get the user ID to delete
            const { userIdToDelete } = request.data;

            if (!userIdToDelete) {
                throw new HttpsError(
                    'invalid-argument',
                    'Missing userIdToDelete parameter.'
                );
            }

            // Validate user ID format
            if (typeof userIdToDelete !== 'string' || userIdToDelete.length < 10) {
                throw new HttpsError(
                    'invalid-argument',
                    'Invalid user ID format.'
                );
            }

            // Prevent admin from deleting themselves
            if (userIdToDelete === callingUserId) {
                throw new HttpsError(
                    'invalid-argument',
                    'Cannot delete your own account. Please have another admin delete your account.'
                );
            }

            console.log(`🎯 Attempting to delete user: ${userIdToDelete}`);

            // Get user data before deletion for logging
            let userToDeleteData = null;
            try {
                const userToDeleteDoc = await firestore
                    .collection('users')
                    .doc(userIdToDelete)
                    .get();

                if (userToDeleteDoc.exists) {
                    userToDeleteData = userToDeleteDoc.data();
                    console.log(`📋 User to delete found: ${userToDeleteData.email}`);
                } else {
                    console.log('⚠️ User document not found in Firestore, but continuing with auth deletion...');
                }
            } catch (error) {
                console.log('⚠️ Could not fetch user data for logging:', error.message);
            }

            // Delete user from Firebase Authentication
            try {
                await auth.deleteUser(userIdToDelete);
                console.log(`✅ Successfully deleted auth user: ${userIdToDelete}`);
            } catch (authError) {
                console.error('❌ Auth deletion error:', authError);

                // If user doesn't exist in auth, that's okay
                if (authError.code === 'auth/user-not-found') {
                    console.log('ℹ️ User not found in auth system (may have been deleted already)');
                } else {
                    console.error(`❌ Failed to delete auth user ${userIdToDelete}:`, authError.message);
                    throw new HttpsError(
                        'internal',
                        `Failed to delete authentication account: ${authError.message}`
                    );
                }
            }

            // Log the successful deletion
            console.log(`🎉 User deleted by admin ${callingUserId}:`, {
                deletedUserId: userIdToDelete,
                deletedUserEmail: userToDeleteData?.email || 'unknown',
                deletedUserName: userToDeleteData?.displayName || 'unknown',
                deletedUserRole: userToDeleteData?.role || 'unknown',
                timestamp: new Date().toISOString()
            });

            // Return success
            return {
                success: true,
                message: 'User authentication account deleted successfully.',
                deletedUserId: userIdToDelete,
                deletedUserEmail: userToDeleteData?.email || null
            };

        } catch (error) {
            console.error('💥 Unexpected error in deleteUser function:', error);

            // If it's already a HttpsError, re-throw it
            if (error instanceof HttpsError) {
                throw error;
            }

            // Otherwise, wrap it in a generic HttpsError
            throw new HttpsError(
                'internal',
                'An unexpected error occurred while deleting the user.'
            );
        }
    }
);

/**
 * Callable function to get user information (Admin only)
 */
export const getUserInfo = onCall(
    {
        timeoutSeconds: 540,
        memory: '1GiB'
    },
    async (request) => {
        try {
            // Check authentication
            if (!request.auth) {
                throw new HttpsError(
                    'unauthenticated',
                    'User must be authenticated.'
                );
            }

            const callingUserId = request.auth.uid;

            // Check if calling user is admin
            const callingUserDoc = await firestore
                .collection('users')
                .doc(callingUserId)
                .get();

            if (!callingUserDoc.exists || callingUserDoc.data().role !== 'admin') {
                throw new HttpsError(
                    'permission-denied',
                    'Admin access required.'
                );
            }

            const { userId } = request.data;
            if (!userId) {
                throw new HttpsError(
                    'invalid-argument',
                    'Missing userId parameter.'
                );
            }

            // Get user info from Auth and Firestore
            const authUser = await auth.getUser(userId);
            const userDoc = await firestore.collection('users').doc(userId).get();

            return {
                success: true,
                authUser: {
                    uid: authUser.uid,
                    email: authUser.email,
                    emailVerified: authUser.emailVerified,
                    disabled: authUser.disabled,
                    creationTime: authUser.metadata.creationTime,
                    lastSignInTime: authUser.metadata.lastSignInTime
                },
                firestoreUser: userDoc.exists ? userDoc.data() : null
            };

        } catch (error) {
            console.error('Error in getUserInfo function:', error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                'internal',
                'Failed to get user information.'
            );
        }
    }
);

/**
 * Simple health check callable function
 */
export const healthCheck = onCall(
    {
        timeoutSeconds: 60,
        memory: '256MiB'
    },
    async (request) => {
        return {
            success: true,
            message: 'Admin callable functions are running correctly.',
            timestamp: new Date().toISOString(),
            authenticated: !!request.auth,
            userId: request.auth?.uid || null
        };
    }
);