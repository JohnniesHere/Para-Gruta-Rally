import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreService } from './dataSync';
import Spinner from './common/Spinner';
import ErrorMessage from './common/ErrorMessage';
import Tabs from './common/Tabs';

const InstructorAssignment = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [instructors, setInstructors] = useState([]);
    const [children, setChildren] = useState([]);
    const [selectedInstructors, setSelectedInstructors] = useState([]);
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('instructors');

    // Fetch team, instructors, and children data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch team data
                const teamDoc = await getDoc(doc(db, 'teams', teamId));
                if (!teamDoc.exists()) {
                    throw new Error('Team not found');
                }
                const teamData = { id: teamDoc.id, ...teamDoc.data() };
                setTeam(teamData);

                // Set initially selected instructors
                if (teamData.instructorIds) {
                    setSelectedInstructors(teamData.instructorIds);
                }

                // Set initially selected children
                if (teamData.childrenIds) {
                    setSelectedChildren(teamData.childrenIds);
                }

                // Fetch all instructors
                const instructorsSnapshot = await getDocs(collection(db, 'instructors'));
                const instructorsData = instructorsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInstructors(instructorsData);

                // Fetch all children
                const childrenSnapshot = await getDocs(collection(db, 'children'));
                const childrenData = childrenSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setChildren(childrenData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [teamId]);

    // Toggle instructor selection
    const toggleInstructor = (instructorId) => {
        setSelectedInstructors(prev => {
            if (prev.includes(instructorId)) {
                return prev.filter(id => id !== instructorId);
            } else {
                return [...prev, instructorId];
            }
        });
    };

    // Toggle child selection
    const toggleChild = (childId) => {
        setSelectedChildren(prev => {
            if (prev.includes(childId)) {
                return prev.filter(id => id !== childId);
            } else {
                return [...prev, childId];
            }
        });
    };

    // Save assignments
    const handleSave = async () => {
        try {
            setSaving(true);

            // Update team with selected instructors and children
            await FirestoreService.saveDocument('teams', {
                ...team,
                instructorIds: selectedInstructors,
                childrenIds: selectedChildren
            }, teamId);

            // Update each child's teams array
            for (const child of children) {
                const isSelected = selectedChildren.includes(child.id);
                const teamAlreadyAssigned = child.teamIds?.includes(teamId) || false;

                if (isSelected && !teamAlreadyAssigned) {
                    // Add team to child
                    const teamIds = [...(child.teamIds || []), teamId];
                    const teams = [...(child.teams || []), {
                        id: teamId,
                        name: team.name
                    }];

                    await FirestoreService.saveDocument('children', {
                        ...child,
                        teamIds,
                        teams
                    }, child.id);
                } else if (!isSelected && teamAlreadyAssigned) {
                    // Remove team from child
                    const teamIds = (child.teamIds || []).filter(id => id !== teamId);
                    const teams = (child.teams || []).filter(t => t.id !== teamId);

                    await FirestoreService.saveDocument('children', {
                        ...child,
                        teamIds,
                        teams
                    }, child.id);
                }
            }

            navigate(`/team/${teamId}`);
        } catch (err) {
            console.error('Error saving assignments:', err);
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!team) return <ErrorMessage message="Team not found" />;

    const tabs = [
        { id: 'instructors', label: 'Instructors' },
        { id: 'children', label: 'Children' }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Manage Team: {team.name}
                </h1>
                <div className="space-x-2">
                    <button
                        onClick={() => navigate(`/team/${teamId}`)}
                        className="bg-gray-200 px-4 py-2 rounded"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Assignments'}
                    </button>
                </div>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6">
                {activeTab === 'instructors' && (
                    <div>
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Assign instructors to this team. Selected instructors will be responsible for leading and managing team activities.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {instructors.map(instructor => (
                                <div
                                    key={instructor.id}
                                    className={`p-4 rounded-md cursor-pointer border-2 ${
                                        selectedInstructors.includes(instructor.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => toggleInstructor(instructor.id)}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedInstructors.includes(instructor.id)}
                                            onChange={() => toggleInstructor(instructor.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-3">
                                            <h3 className="text-lg font-medium">
                                                {instructor.firstName} {instructor.lastName}
                                            </h3>
                                            {instructor.role && (
                                                <p className="text-sm text-gray-500">{instructor.role}</p>
                                            )}
                                            {instructor.specialties && (
                                                <p className="text-sm text-gray-500">
                                                    {instructor.specialties.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {instructors.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No instructors available. Create instructors first.</p>
                                <button
                                    onClick={() => navigate('/instructors')}
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Manage Instructors
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'children' && (
                    <div>
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Assign children to this team. Selected children will be members of this team.
                            </p>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search children..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-white shadow-md rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Age
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Guardian
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Other Teams
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {children.map(child => (
                                    <tr
                                        key={child.id}
                                        className={`hover:bg-gray-50 cursor-pointer ${
                                            selectedChildren.includes(child.id) ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => toggleChild(child.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedChildren.includes(child.id)}
                                                onChange={() => toggleChild(child.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {child.firstName} {child.lastName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {calculateAge(child.dateOfBirth) || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {child.guardianName || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {child.teams && child.teams
                                                .filter(t => t.id !== teamId)
                                                .map(t => t.name)
                                                .join(', ')}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {children.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No children available. Add children first.</p>
                                <button
                                    onClick={() => navigate('/children')}
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Manage Children
                                </button>
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

export default InstructorAssignment;