// src/components/kids/KidForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import ProtectedField from '../../hooks/ProtectedField';

function KidForm() {
    const { kidId } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!kidId;
    const { userRole, permissions } = usePermissions();

    // Form state - simplified structure
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        teamId: '',
        personalInfo: {
            dateOfBirth: '',
            address: '',
            capabilities: '',
            announcersNotes: '',
            photo: ''
        },
        parentInfo: {
            name: '',
            email: '',
            phone: '',
            grandparentsInfo: {
                names: '',
                phone: ''
            }
        },
        comments: {
            parent: '',
            organization: '',
            teamLeader: '',
            familyContact: ''
        },
        emergencyContact: '',
        emergencyPhone: '',
        notes: '',
        participantNumber: '',
        signedDeclaration: false
    });

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(isEditMode);
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);

    // Fetch data effect
    useEffect(() => {
        const fetchData = async () => {
            if (!permissions) return;

            try {
                // Fetch teams
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeams(teamsData);

                // If editing, fetch kid data
                if (isEditMode) {
                    const kidDoc = await getDoc(doc(db, 'kids', kidId));
                    if (kidDoc.exists()) {
                        const kidData = kidDoc.data();

                        // Check permissions
                        if (!permissions?.canViewKid(kidData) && userRole !== 'admin') {
                            setError('Access denied: You cannot edit this kid\'s information');
                            return;
                        }

                        // Map existing data to form structure
                        setFormData({
                            firstName: kidData.firstName || '',
                            lastName: kidData.lastName || '',
                            age: kidData.age ? kidData.age.toString() : '',
                            gender: kidData.gender || '',
                            teamId: kidData.teamId || '',
                            personalInfo: {
                                dateOfBirth: kidData.personalInfo?.dateOfBirth || kidData.dateOfBirth || '',
                                address: kidData.personalInfo?.address || kidData.address || '',
                                capabilities: kidData.personalInfo?.capabilities || '',
                                announcersNotes: kidData.personalInfo?.announcersNotes || '',
                                photo: kidData.personalInfo?.photo || ''
                            },
                            parentInfo: {
                                name: kidData.parentInfo?.name || kidData.guardianName || '',
                                email: kidData.parentInfo?.email || kidData.email || '',
                                phone: kidData.parentInfo?.phone || kidData.contactNumber || '',
                                grandparentsInfo: {
                                    names: kidData.parentInfo?.grandparentsInfo?.names || '',
                                    phone: kidData.parentInfo?.grandparentsInfo?.phone || ''
                                }
                            },
                            comments: {
                                parent: kidData.comments?.parent || '',
                                organization: kidData.comments?.organization || '',
                                teamLeader: kidData.comments?.teamLeader || '',
                                familyContact: kidData.comments?.familyContact || ''
                            },
                            emergencyContact: kidData.emergencyContact || '',
                            emergencyPhone: kidData.emergencyPhone || '',
                            notes: kidData.notes || '',
                            participantNumber: kidData.participantNumber || '',
                            signedDeclaration: kidData.signedDeclaration || false
                        });
                    } else {
                        setError('Kid not found');
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setFetchingData(false);
            }
        };

        fetchData(); // No need to await here since we handle errors inside
    }, [kidId, isEditMode, permissions, userRole]);

    // Simple field update handlers
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedField = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    const updateDoubleNestedField = (parent, child, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: { ...prev[parent][child], [field]: value }
            }
        }));
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.firstName || !formData.lastName) {
                throw new Error('First name and last name are required');
            }

            const processedData = {
                ...formData,
                age: formData.age ? parseInt(formData.age, 10) : null,
                updatedAt: serverTimestamp(),
                parentInfo: {
                    ...formData.parentInfo,
                    parentId: formData.parentInfo.parentId || ''
                }
            };

            if (isEditMode) {
                await setDoc(doc(db, 'kids', kidId), processedData, { merge: true });
            } else {
                processedData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'kids'), processedData);
            }

            navigate('/admin/kids');
        } catch (err) {
            console.error('Error saving kid:', err);
            setError(err.message || 'Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <div className="flex justify-center items-center h-96">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-gray-600 ml-3">Loading...</span>
            </div>
        );
    }

    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isEditMode ? 'Edit Kid' : 'Add New Kid'}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Editing as: <span className="font-medium capitalize">{userRole}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 py-5 sm:p-6">
                            {error && (
                                <div className="rounded-md bg-red-50 p-4 mb-6">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-red-800">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                        <ProtectedField
                                            field="participantNumber"
                                            value={formData.participantNumber}
                                            kidData={formData}
                                            label="Participant Number"
                                            onChange={(value) => updateField('participantNumber', value)}
                                        />

                                        <ProtectedField
                                            field="firstName"
                                            value={formData.firstName}
                                            kidData={formData}
                                            label="First Name *"
                                            onChange={(value) => updateField('firstName', value)}
                                        />

                                        <ProtectedField
                                            field="lastName"
                                            value={formData.lastName}
                                            kidData={formData}
                                            label="Last Name *"
                                            onChange={(value) => updateField('lastName', value)}
                                        />

                                        <ProtectedField
                                            field="personalInfo.dateOfBirth"
                                            value={formData.personalInfo.dateOfBirth}
                                            kidData={formData}
                                            label="Date of Birth"
                                            type="date"
                                            onChange={(value) => updateNestedField('personalInfo', 'dateOfBirth', value)}
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                            <input
                                                type="number"
                                                value={formData.age}
                                                onChange={(e) => updateField('age', e.target.value)}
                                                min="0"
                                                max="100"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => updateField('gender', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                            <select
                                                value={formData.teamId}
                                                onChange={(e) => updateField('teamId', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">No Team</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>
                                                        {team.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                                    <div className="space-y-4">

                                        <ProtectedField
                                            field="personalInfo.address"
                                            value={formData.personalInfo.address}
                                            kidData={formData}
                                            label="Address"
                                            onChange={(value) => updateNestedField('personalInfo', 'address', value)}
                                        />

                                        <ProtectedField
                                            field="personalInfo.capabilities"
                                            value={formData.personalInfo.capabilities}
                                            kidData={formData}
                                            label="Capabilities & Challenges"
                                            multiline={true}
                                            onChange={(value) => updateNestedField('personalInfo', 'capabilities', value)}
                                        />

                                        <ProtectedField
                                            field="personalInfo.announcersNotes"
                                            value={formData.personalInfo.announcersNotes}
                                            kidData={formData}
                                            label="Announcer Notes"
                                            multiline={true}
                                            onChange={(value) => updateNestedField('personalInfo', 'announcersNotes', value)}
                                        />
                                    </div>
                                </div>

                                {/* Parent Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                        <ProtectedField
                                            field="parentInfo.name"
                                            value={formData.parentInfo.name}
                                            kidData={formData}
                                            label="Parent/Guardian Name"
                                            onChange={(value) => updateNestedField('parentInfo', 'name', value)}
                                        />

                                        <ProtectedField
                                            field="parentInfo.email"
                                            value={formData.parentInfo.email}
                                            kidData={formData}
                                            label="Parent Email"
                                            type="email"
                                            onChange={(value) => updateNestedField('parentInfo', 'email', value)}
                                        />

                                        <ProtectedField
                                            field="parentInfo.phone"
                                            value={formData.parentInfo.phone}
                                            kidData={formData}
                                            label="Parent Phone"
                                            type="tel"
                                            onChange={(value) => updateNestedField('parentInfo', 'phone', value)}
                                        />

                                        <ProtectedField
                                            field="parentInfo.grandparentsInfo.names"
                                            value={formData.parentInfo.grandparentsInfo.names}
                                            kidData={formData}
                                            label="Grandparents Names"
                                            onChange={(value) => updateDoubleNestedField('parentInfo', 'grandparentsInfo', 'names', value)}
                                        />

                                        <ProtectedField
                                            field="emergencyContact"
                                            value={formData.emergencyContact}
                                            kidData={formData}
                                            label="Emergency Contact (Restricted)"
                                            onChange={(value) => updateField('emergencyContact', value)}
                                        />

                                        <ProtectedField
                                            field="emergencyPhone"
                                            value={formData.emergencyPhone}
                                            kidData={formData}
                                            label="Emergency Phone (Restricted)"
                                            type="tel"
                                            onChange={(value) => updateField('emergencyPhone', value)}
                                        />
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Comments (Role-Based Access)</h3>
                                    <div className="space-y-4">

                                        <ProtectedField
                                            field="comments.parent"
                                            value={formData.comments.parent}
                                            kidData={formData}
                                            label="Parent Comments"
                                            multiline={true}
                                            onChange={(value) => updateNestedField('comments', 'parent', value)}
                                        />

                                        <ProtectedField
                                            field="comments.teamLeader"
                                            value={formData.comments.teamLeader}
                                            kidData={formData}
                                            label="Team Leader Comments"
                                            multiline={true}
                                            onChange={(value) => updateNestedField('comments', 'teamLeader', value)}
                                        />

                                        <ProtectedField
                                            field="comments.organization"
                                            value={formData.comments.organization}
                                            kidData={formData}
                                            label="Organization Comments"
                                            multiline={true}
                                            onChange={(value) => updateNestedField('comments', 'organization', value)}
                                        />

                                        <ProtectedField
                                            field="comments.familyContact"
                                            value={formData.comments.familyContact}
                                            kidData={formData}
                                            label="Family Contact Comments (Restricted)"
                                            multiline={true}
                                            onChange={(value) => updateNestedField('comments', 'familyContact', value)}
                                        />
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                                    <div className="space-y-4">

                                        <ProtectedField
                                            field="signedDeclaration"
                                            value={formData.signedDeclaration}
                                            kidData={formData}
                                            label="Signed Declaration"
                                            type="checkbox"
                                            placeholder="Declaration has been signed"
                                            onChange={(value) => updateField('signedDeclaration', value)}
                                        />

                                        <ProtectedField
                                            field="notes"
                                            value={formData.notes}
                                            kidData={formData}
                                            label="General Notes"
                                            multiline={true}
                                            onChange={(value) => updateField('notes', value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/kids')}
                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default KidForm;