import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp, collection } from 'firebase/firestore';
import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import { db } from '../../firebase';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';

const UserForm = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const isEditing = userId !== 'new';
    const auth = getAuth();

    const [user, setUser] = useState({
        displayName: '',
        email: '',
        role: 'user',
        department: '',
        phone: '',
        notes: ''
    });

    const [loading, setLoading] = useState(isEditing);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [sendResetEmail, setSendResetEmail] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Get current user
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, [auth]);

    // Fetch user data if editing
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const userDoc = await getDoc(doc(db, 'users', userId));

                if (userDoc.exists()) {
                    setUser(userDoc.data());
                } else {
                    setError(new Error('User not found'));
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (isEditing) {
            fetchUser();
        }
    }, [userId, isEditing]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Save user
    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            // Validate form
            if (!user.displayName || !user.email || !user.role) {
                throw new Error('Please fill in all required fields');
            }

            if (!isEditing) {
                // Validate password for new user
                if (!password) {
                    throw new Error('Password is required for new users');
                }

                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }

                // Create new user in Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    user.email,
                    password
                );

                // Update user profile
                await updateProfile(userCredential.user, {
                    displayName: user.displayName
                });

                // Create user document in Firestore
                const newUser = {
                    ...user,
                    uid: userCredential.user.uid,
                    createdAt: Timestamp.now(),
                    createdBy: currentUser?.uid || null
                };

                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);

                // Send welcome/reset email if requested
                if (sendResetEmail) {
                    await sendPasswordResetEmail(auth, user.email);
                }
            } else {
                // Check if user is trying to edit their own role
                if (userId === currentUser?.uid && user.role !== currentUser.role) {
                    throw new Error('You cannot change your own role');
                }

                // Update user document in Firestore
                const updatedUser = {
                    ...user,
                    updatedAt: Timestamp.now(),
                    updatedBy: currentUser?.uid || null
                };

                await setDoc(doc(db, 'users', userId), updatedUser, { merge: true });

                // Send password reset email if requested
                if (sendResetEmail) {
                    await sendPasswordResetEmail(auth, user.email);
                }
            }

            navigate('/users');
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {isEditing ? `Edit User: ${user.displayName}` : 'Create New User'}
                </h1>
                <button
                    onClick={() => navigate('/users')}
                    className="bg-gray-200 px-4 py-2 rounded"
                    disabled={saving}
                >
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={user.displayName}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            required
                            disabled={isEditing} // Email can't be changed for existing users
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        {isEditing && (
                            <p className="mt-1 text-xs text-gray-500">
                                Email cannot be changed after user creation
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={user.role}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={userId === currentUser?.uid} // Users can't change their own role
                        >
                            <option value="user">User</option>
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                        {userId === currentUser?.uid && (
                            <p className="mt-1 text-xs text-gray-500">
                                You cannot change your own role
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                            Department
                        </label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={user.department || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={user.phone || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {!isEditing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t border-gray-200 pt-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex items-center">
                                <input
                                    id="sendResetEmail"
                                    type="checkbox"
                                    checked={sendResetEmail}
                                    onChange={(e) => setSendResetEmail(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="sendResetEmail" className="ml-2 block text-sm text-gray-900">
                                    Send password reset email to user
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                The user will receive an email with instructions to set their own password
                            </p>
                        </div>
                    </div>
                )}

                {isEditing && (
                    <div className="grid grid-cols-1 gap-6 mb-6 border-t border-gray-200 pt-6">
                        <div>
                            <div className="flex items-center">
                                <input
                                    id="sendResetEmail"
                                    type="checkbox"
                                    checked={sendResetEmail}
                                    onChange={(e) => setSendResetEmail(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="sendResetEmail" className="ml-2 block text-sm text-gray-900">
                                    Send password reset email to user
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                The user will receive an email with instructions to reset their password
                            </p>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={user.notes || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Additional information about this user"
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;