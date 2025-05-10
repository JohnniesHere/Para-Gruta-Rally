import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreService } from './dataSync';
import Tabs from './common/Tabs';
import Spinner from './common/Spinner';
import ErrorMessage from './common/ErrorMessage';

const TeamDetail = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [editing, setEditing] = useState(false);
    const [formValues, setFormValues] = useState({});

    // Fetch team data
    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);

                // Fetch team details
                const teamDoc = await getDoc(doc(db, 'teams', teamId));
                if (!teamDoc.exists()) {
                    throw new Error('Team not found');
                }

                const teamData = { id: teamDoc.id, ...teamDoc.data() };
                setTeam(teamData);
                setFormValues(teamData);

                // Fetch team members (children)
                const membersQuery = query(
                    collection(db, 'children'),
                    where('teamIds', 'array-contains', teamId)
                );

                const membersSnapshot = await getDocs(membersQuery);
                const membersData = membersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMembers(membersData);

                // Fetch instructors
                if (teamData.instructorIds && teamData.instructorIds.length > 0) {
                    const instructorsQuery = query(
                        collection(db, 'instructors'),
                        where('__name__', 'in', teamData.instructorIds)
                    );

                    const instructorsSnapshot = await getDocs(instructorsQuery);
                    const instructorsData = instructorsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setInstructors(instructorsData);
                }
            } catch (err) {
                console.error('Error fetching team data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (teamId) {
            fetchTeamData();
        }
    }, [teamId]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Save changes
    const handleSave = async () => {
        try {
            await FirestoreService.saveDocument('teams', formValues, teamId);
            setTeam(formValues);
            setEditing(false);
        } catch (err) {
            setError(err);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        setFormValues(team);
        setEditing(false);
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!team) return <ErrorMessage message="Team not found" />;

    const tabs = [
        { id: 'info', label: 'Basic Info' },
        { id: 'members', label: 'Members' },
        { id: 'instructors', label: 'Instructors' },
        { id: 'schedule', label: 'Schedule' },
        { id: 'notes', label: 'Notes' }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {editing ? 'Edit Team' : team.name}
                </h1>
                <div className="space-x-2">
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Edit
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                className="bg-gray-300 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-green-500 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-gray-200 px-4 py-2 rounded"
                    >
                        Back
                    </button>
                </div>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6">
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        {editing ? (
                            // Edit form
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Team Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formValues.name || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formValues.location || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Age Group</label>
                                        <input
                                            type="text"
                                            name="ageGroup"
                                            value={formValues.ageGroup || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Capacity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            name="capacity"
                                            value={formValues.capacity || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        name="description"
                                        value={formValues.description || ''}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            // Display info
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Team Name</h3>
                                    <p className="mt-1">{team.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                                    <p className="mt-1">{team.location || 'Not specified'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Age Group</h3>
                                    <p className="mt-1">{team.ageGroup || 'Not specified'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Capacity</h3>
                                    <p className="mt-1">{team.capacity || 'Not limited'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                    <p className="mt-1">{team.description || 'No description available'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Number of Members</h3>
                                    <p className="mt-1">{members.length}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Number of Instructors</h3>
                                    <p className="mt-1">{instructors.length}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Team Members</h2>
                            <button
                                onClick={() => navigate(`/instructor-assignment/${teamId}`)}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Manage Members
                            </button>
                        </div>
                        {members.length > 0 ? (
                            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Age
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Guardian
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {members.map(member => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/kid/${member.id}`} className="text-blue-600 hover:text-blue-900">
                                                    {member.firstName} {member.lastName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {calculateAge(member.dateOfBirth) || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {member.guardianName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/kid/${member.id}`} className="text-blue-600 hover:text-blue-900">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No members in this team</p>
                        )}
                    </div>
                )}

                {activeTab === 'instructors' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Team Instructors</h2>
                            <button
                                onClick={() => navigate(`/instructor-assignment/${teamId}`)}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Manage Instructors
                            </button>
                        </div>
                        {instructors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {instructors.map(instructor => (
                                    <div key={instructor.id} className="bg-white p-4 rounded-lg shadow-md">
                                        <h3 className="text-lg font-medium">{instructor.firstName} {instructor.lastName}</h3>
                                        <p className="text-gray-600">{instructor.role || 'Instructor'}</p>
                                        {instructor.email && (
                                            <p className="text-sm mt-2">
                                                <span className="font-medium">Email:</span> {instructor.email}
                                            </p>
                                        )}
                                        {instructor.phone && (
                                            <p className="text-sm">
                                                <span className="font-medium">Phone:</span> {instructor.phone}
                                            </p>
                                        )}
                                        <div className="mt-4">
                                            <button
                                                onClick={() => navigate(`/instructor/${instructor.id}`)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No instructors assigned to this team</p>
                        )}
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Team Schedule</h2>
                        {team.schedule && team.schedule.length > 0 ? (
                            <div className="space-y-4">
                                {team.schedule.map((session, index) => (
                                    <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                                        <h3 className="font-medium">{session.day} - {session.time}</h3>
                                        <p className="text-gray-600">{session.location}</p>
                                        {session.description && (
                                            <p className="text-sm mt-2">{session.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No schedule available</p>
                                {editing && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        You can add schedule information in the editing form
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Notes</h2>
                        {editing ? (
                            <textarea
                                name="notes"
                                value={formValues.notes || ''}
                                onChange={handleInputChange}
                                rows="5"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            ></textarea>
                        ) : (
                            <div className="p-4 bg-gray-50 rounded-md">
                                {team.notes ? (
                                    <p className="whitespace-pre-line">{team.notes}</p>
                                ) : (
                                    <p className="text-gray-500">No notes available</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Utility function to calculate age
const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export default TeamDetail;