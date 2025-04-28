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

// src/pages/admin/InstructorDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import InstructorDetail from '../../components/instructors/InstructorDetail';

const InstructorDetailPage = () => {
    const { instructorId } = useParams();

    return (
        <div className="instructor-detail-page">
            <div className="page-header">
                <div className="breadcrumbs">
                    <Link to="/admin/instructors">Instructors</Link> / Instructor Details
                </div>
            </div>

            <div className="card">
                <InstructorDetail instructorId={instructorId} />
            </div>
        </div>
    );
};

export default InstructorDetailPage;