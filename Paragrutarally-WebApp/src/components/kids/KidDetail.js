import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreService } from './dataSync';
import Tabs from './common/Tabs';
import Spinner from './common/Spinner';
import ErrorMessage from './common/ErrorMessage';
import AttendanceHistory from './AttendanceHistory';
import CategoryBadges from './CategoryBadges';

// Child detail view component
const KidDetail = () => {
    const { kidId } = useParams();
    const navigate = useNavigate();
    const [kid, setKid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [editing, setEditing] = useState(false);
    const [formValues, setFormValues] = useState({});

    // Fetch child data
    useEffect(() => {
        const fetchKid = async () => {
            try {
                setLoading(true);
                const kidDoc = await getDoc(doc(db, 'children', kidId));

                if (kidDoc.exists()) {
                    const kidData = { id: kidDoc.id, ...kidDoc.data() };
                    setKid(kidData);
                    setFormValues(kidData);
                } else {
                    setError(new Error('Child not found'));
                }
            } catch (err) {
                console.error('Error fetching child:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (kidId) {
            fetchKid();
        }
    }, [kidId]);

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
            await FirestoreService.saveDocument('children', formValues, kidId);
            setKid(formValues);
            setEditing(false);
        } catch (err) {
            setError(err);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        setFormValues(kid);
        setEditing(false);
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!kid) return <ErrorMessage message="Child not found" />;

    const tabs = [
        { id: 'info', label: 'Basic Info' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'categories', label: 'Categories' },
        { id: 'teams', label: 'Teams' },
        { id: 'notes', label: 'Notes' }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {editing ? 'Edit Child' : kid.firstName + ' ' + kid.lastName}
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
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formValues.firstName || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formValues.lastName || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formValues.dateOfBirth || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                                        <input
                                            type="text"
                                            name="guardianName"
                                            value={formValues.guardianName || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formValues.contactNumber || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formValues.email || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea
                                        name="address"
                                        value={formValues.address || ''}
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
                                    <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                                    <p className="mt-1">{kid.firstName}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                                    <p className="mt-1">{kid.lastName}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                                    <p className="mt-1">{kid.dateOfBirth}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Age</h3>
                                    <p className="mt-1">{calculateAge(kid.dateOfBirth)} years</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Guardian Name</h3>
                                    <p className="mt-1">{kid.guardianName}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                                    <p className="mt-1">{kid.contactNumber}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                    <p className="mt-1">{kid.email}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                                    <p className="mt-1">{kid.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <AttendanceHistory childId={kidId} />
                )}

                {activeTab === 'categories' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Categories</h2>
                        <CategoryBadges categories={kid.categories || []} />
                        <button
                            onClick={() => navigate(`/category-assignment/${kidId}`)}
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Manage Categories
                        </button>
                    </div>
                )}

                {activeTab === 'teams' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Teams</h2>
                        {kid.teams && kid.teams.length > 0 ? (
                            <ul className="space-y-2">
                                {kid.teams.map(team => (
                                    <li key={team.id} className="p-3 bg-gray-50 rounded-md">
                                        <p className="font-medium">{team.name}</p>
                                        {team.instructorName && <p className="text-sm text-gray-600">Instructor: {team.instructorName}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Not assigned to any teams</p>
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
                                {kid.notes ? (
                                    <p className="whitespace-pre-line">{kid.notes}</p>
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
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export default KidDetail;