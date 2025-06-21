// functions/index.js - Callable Functions (No CORS Issues)
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Callable Cloud Function to delete a user (Admin only)
 * This automatically handles CORS and authentication
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
    try {
        console.log('🗑️ Delete user callable function invoked');
        console.log('📦 Data received:', data);
        console.log('👤 Auth context:', context.auth ? context.auth.uid : 'No auth');

        // Check if user is authenticated
        if (!context.auth) {
            console.log('❌ Unauthenticated request');
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated to delete users.'
            );
        }

        const callingUserId = context.auth.uid;
        console.log(`📋 Delete request from user: ${callingUserId}`);

        // Check if the calling user is an admin
        const callingUserDoc = await admin.firestore()
            .collection('users')
            .doc(callingUserId)
            .get();

        if (!callingUserDoc.exists) {
            console.log('❌ Calling user document not found');
            throw new functions.https.HttpsError(
                'permission-denied',
                'User profile not found. Please contact support.'
            );
        }

        const callingUserData = callingUserDoc.data();
        console.log(`👤 Calling user role: ${callingUserData.role}`);

        if (callingUserData.role !== 'admin') {
            console.log(`❌ Unauthorized delete attempt by non-admin: ${callingUserId}, role: ${callingUserData.role}`);
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only admin users can delete other users.'
            );
        }

        console.log('✅ Admin verification successful');

        // Get the user ID to delete
        const { userIdToDelete } = data;

        if (!userIdToDelete) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing userIdToDelete parameter.'
            );
        }

        // Validate user ID format
        if (typeof userIdToDelete !== 'string' || userIdToDelete.length < 10) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid user ID format.'
            );
        }

        // Prevent admin from deleting themselves
        if (userIdToDelete === callingUserId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Cannot delete your own account. Please have another admin delete your account.'
            );
        }

        console.log(`🎯 Attempting to delete user: ${userIdToDelete}`);

        // Get user data before deletion for logging
        let userToDeleteData = null;
        try {
            const userToDeleteDoc = await admin.firestore()
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
            await admin.auth().deleteUser(userIdToDelete);
            console.log(`✅ Successfully deleted auth user: ${userIdToDelete}`);
        } catch (authError) {
            console.error('❌ Auth deletion error:', authError);

            // If user doesn't exist in auth, that's okay
            if (authError.code === 'auth/user-not-found') {
                console.log('ℹ️ User not found in auth system (may have been deleted already)');
            } else {
                console.error(`❌ Failed to delete auth user ${userIdToDelete}:`, authError.message);
                throw new functions.https.HttpsError(
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
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Otherwise, wrap it in a generic HttpsError
        throw new functions.https.HttpsError(
            'internal',
            'An unexpected error occurred while deleting the user.'
        );
    }
});

/**
 * Callable function to get user information (Admin only)
 */
exports.getUserInfo = functions.https.onCall(async (data, context) => {
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated.'
            );
        }

        const callingUserId = context.auth.uid;

        // Check if calling user is admin
        const callingUserDoc = await admin.firestore()
            .collection('users')
            .doc(callingUserId)
            .get();

        if (!callingUserDoc.exists || callingUserDoc.data().role !== 'admin') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Admin access required.'
            );
        }

        const { userId } = data;
        if (!userId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Missing userId parameter.'
            );
        }

        // Get user info from Auth and Firestore
        const authUser = await admin.auth().getUser(userId);
        const userDoc = await admin.firestore().collection('users').doc(userId).get();

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

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to get user information.'
        );
    }
});

/**
 * Simple health check callable function
 */
exports.healthCheck = functions.https.onCall(async (data, context) => {
    return {
        success: true,
        message: 'Admin callable functions are running correctly.',
        timestamp: new Date().toISOString(),
        authenticated: !!context.auth,
        userId: context.auth?.uid || null
    };
});