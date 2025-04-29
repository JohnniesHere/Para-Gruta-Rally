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