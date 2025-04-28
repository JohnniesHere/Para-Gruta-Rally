import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const InstructorList = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingInstructor, setEditingInstructor] = useState(null);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const instructorsCollection = collection(db, 'instructors');
                const instructorSnapshot = await getDocs(instructorsCollection);
                const instructorList = instructorSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInstructors(instructorList);
            } catch (err) {
                setError('Failed to fetch instructors');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, []);

    const handleEditClick = (instructor) => {
        setEditingInstructor({ ...instructor });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingInstructor(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEdit = async () => {
        try {
            const instructorRef = doc(db, 'instructors', editingInstructor.id);
            await updateDoc(instructorRef, {
                name: editingInstructor.name,
                email: editingInstructor.email,
                phone: editingInstructor.phone
                // Note: Specialties and availability would need specific UI for editing
            });

            // Update local state
            setInstructors(instructors.map(instructor =>
                instructor.id === editingInstructor.id ? editingInstructor : instructor
            ));

            // Exit edit mode
            setEditingInstructor(null);
        } catch (err) {
            setError('Failed to update instructor');
            console.error(err);
        }
    };

    const handleCancelEdit = () => {
        setEditingInstructor(null);
    };

    const handleDeleteInstructor = async (instructorId) => {
        if (!window.confirm('Are you sure you want to delete this instructor?')) return;

        try {
            await deleteDoc(doc(db, 'instructors', instructorId));
            setInstructors(instructors.filter(instructor => instructor.id !== instructorId));
        } catch (err) {
            setError('Failed to delete instructor');
            console.error(err);
        }
    };

    if (loading) return <div>Loading instructors...</div>;

    return (
        <div className="instructor-list">
            <h2>Instructors</h2>
            {error && <div className="error-message">{error}</div>}

            {instructors.length === 0 ? (
                <p>No instructors available. Add some instructors to get started.</p>
            ) : (
                <div className="instructors-table-container">
                    <table className="instructors-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Specialties</th>
                            <th>Availability</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {instructors.map(instructor => (
                            <tr key={instructor.id}>
                                {editingInstructor && editingInstructor.id === instructor.id ? (
                                    // Edit mode
                                    <>
                                        <td>
                                            <input
                                                type="text"
                                                name="name"
                                                value={editingInstructor.name}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="email"
                                                name="email"
                                                value={editingInstructor.email}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={editingInstructor.phone}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        <td colSpan="2">
                                            <div className="editing-message">Specialties and availability can be edited in detail view</div>
                                        </td>
                                        <td className="actions-cell">
                                            <button onClick={handleSaveEdit} className="save-btn">Save</button>
                                            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    // View mode
                                    <>
                                        <td>{instructor.name}</td>
                                        <td>{instructor.email}</td>
                                        <td>{instructor.phone}</td>
                                        <td>
                                            <div className="specialties-container">
                                                {instructor.specialties && instructor.specialties.map((specialty, index) => (
                                                    <span key={index} className="specialty-badge">
                              {specialty}
                            </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="availability-container">
                                                {instructor.availability && Object.entries(instructor.availability)
                                                    .filter(([_, isAvailable]) => isAvailable)
                                                    .map(([day]) => (
                                                        <span key={day} className="day-badge">
                                {day.substring(0, 3)}
                              </span>
                                                    ))}
                                            </div>
                                        </td>
                                        <td className="actions-cell">
                                            <button onClick={() => handleEditClick(instructor)} className="edit-btn">Edit</button>
                                            <button onClick={() => handleDeleteInstructor(instructor.id)} className="delete-btn">Delete</button>
                                            <a href={`/admin/instructors/${instructor.id}`} className="button view-btn">Details</a>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InstructorList;