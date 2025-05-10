import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth, deleteUser as deleteAuthUser } from 'firebase/auth';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import SearchBar from '../common/SearchBar';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Get current user
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);

                // Fetch users from Firestore
                const usersQuery = query(
                    collection(db, 'users'),
                    orderBy('displayName', 'asc')
                );

                const usersSnapshot = await getDocs(usersQuery);
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setUsers(usersData);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Filter users based on search term
    useEffect(() => {
        if (users) {
            const filtered = users.filter(user =>
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [users, searchTerm]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        try {
            // Check if deleting would remove all admin users
            const remainingAdmins = users.filter(user =>
                user.role === 'admin' && user.id !== userId
            );

            if (remainingAdmins.length === 0) {
                alert('Cannot delete the last admin user');
                setConfirmDelete(null);
                return;
            }

            // Check if user has associated data
            // This is just an example, you would expand this to check all relevant collections
            const associatedDataQuery = query(
                collection(db, 'some_user_data_collection'),
                where('userId', '==', userId)
            );

            const associatedDataSnapshot = await getDocs(associatedDataQuery);

            if (!associatedDataSnapshot.empty) {
                if (!window.confirm('This user has associated data. Deleting the user will not delete this data. Continue?')) {
                    setConfirmDelete(null);
                    return;
                }
            }

            // Delete user document from Firestore
            await deleteDoc(doc(db, 'users', userId));

            // Note: Deleting the actual auth user requires admin SDK or Cloud Functions
            // This example doesn't include that part

            // Update local state
            setUsers(prev => prev.filter(user => user.id !== userId));
            setConfirmDelete(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(`Error deleting user: ${err.message}`);
        }
    };

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get role badge
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Admin</span>;
            case 'manager':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Manager</span>;
            case 'staff':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Staff</span>;
            case 'user':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">User</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{role}</span>;
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={() => navigate('/users/new')}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Add New User
                </button>
            </div>

            <div className="mb-6">
                <SearchBar
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {filteredUsers.length > 0 ? (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                className="h-10 w-10 rounded-full mr-3"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-gray-500 text-lg">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                          </span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.displayName || 'No Name'}
                                            </div>
                                            {user.id === currentUser?.uid && (
                                                <div className="text-xs text-green-600">
                                                    You
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email || 'No Email'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(user.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(user.lastLoginAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => navigate(`/users/${user.id}`)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/users/${user.id}/edit`)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        disabled={user.id === currentUser?.uid && user.role === 'admin'}
                                    >
                                        Edit
                                    </button>
                                    {confirmDelete === user.id ? (
                                        <>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-600 hover:text-red-900 mr-2"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                            disabled={
                                                user.id === currentUser?.uid ||
                                                (user.role === 'admin' && currentUser?.role !== 'admin')
                                            }
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'No users match your search criteria.' : 'Get started by creating a new user.'}
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/users/new')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg
                                className="-ml-1 mr-2 h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            New User
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;