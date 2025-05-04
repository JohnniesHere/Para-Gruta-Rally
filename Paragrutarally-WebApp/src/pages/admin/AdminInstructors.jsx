import React, { useState } from 'react';
import InstructorList from '../../components/instructors/InstructorList';
import InstructorForm from '../../components/instructors/InstructorForm';

const AdminInstructors = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [instructors, setInstructors] = useState([]);

    const handleInstructorAdded = (newInstructor) => {
        setInstructors([...instructors, newInstructor]);
        setShowAddForm(false);
    };

    return (
        <div className="admin-instructors-page">
            <div className="page-header">
                <h1>Instructor Management</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="add-button"
                >
                    {showAddForm ? 'Cancel' : 'Add New Instructor'}
                </button>
            </div>

            {showAddForm && (
                <div className="card">
                    <InstructorForm onInstructorAdded={handleInstructorAdded} />
                </div>
            )}

            <div className="card">
                <InstructorList />
            </div>
        </div>
    );
};

export default AdminInstructors;