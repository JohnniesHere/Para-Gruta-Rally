import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch users from Firestore
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(userList);
            } catch (err) {
                setError('Failed to fetch users');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUpdateUser = async (userId, updatedData) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, updatedData);
            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, ...updatedData } : user
            ));
        } catch (err) {
            setError('Failed to update user');
            console.error(err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteDoc(doc(db, 'users', userId));
                // Update local state
                setUsers(users.filter(user => user.id !== userId));
            } catch (err) {
                setError('Failed to delete user');
                console.error(err);
            }
        }
    };

    if (loading) return <div>Loading users...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="user-management">
            <h2>User Management</h2>
            <table className="user-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                            <button onClick={() => handleUpdateUser(user.id, { /* updated data */ })}>
                                Edit
                            </button>
                            <button onClick={() => handleDeleteUser(user.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;