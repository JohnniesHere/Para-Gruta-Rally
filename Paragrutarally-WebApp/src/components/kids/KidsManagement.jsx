// src/components/kids/KidsManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

function KidsManagement() {
    const [kids, setKids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [teams, setTeams] = useState([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    // Stats state
    const [stats, setStats] = useState({
        totalKids: 0,
        activeKids: 0,
        inactiveKids: 0,
        kidsWithTeams: 0,
        kidsWithoutTeams: 0
    });

    // Fetch data from Firebase
    const fetchData = useCallback(async (retryCount = 0) => {
        setLoading(true);
        try {
            console.log('🔥 Fetching data from Firestore...');
            console.log('📊 Firebase config check:', {
                hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
                hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
            });

            // Fetch teams and kids concurrently
            const [teamsSnapshot, kidsSnapshot] = await Promise.all([
                getDocs(collection(db, 'teams')),
                getDocs(collection(db, 'kids'))
            ]);

            console.log('✅ Teams found:', teamsSnapshot.size);
            console.log('✅ Kids found:', kidsSnapshot.size);

            const teamsData = teamsSnapshot.docs.map(doc => {
                const data = { id: doc.id, ...doc.data() };
                console.log('👥 Team data:', data);
                return data;
            });

            // Transform kids data to match component expectations
            const kidsData = kidsSnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('👶 Raw kid data:', data);

                // Extract name parts
                const fullName = data.personalInfo?.name || '';
                const nameParts = fullName.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                // Calculate age from birth date
                const age = calculateAgeFromBirthDate(data.personalInfo?.dateOfBirth);

                const transformedKid = {
                    id: doc.id,
                    firstName,
                    lastName,
                    fullName,
                    age,
                    guardianName: data.parentInfo?.name || '',
                    guardianPhone: data.parentInfo?.phone || '',
                    guardianEmail: data.parentInfo?.email || '',
                    teamId: data.teamId || '',
                    isActive: data.isActive !== false,
                    medicalNotes: data.personalInfo?.medicalInfo || '',
                    address: data.personalInfo?.address || '',
                    signedFormStatus: data.signedFormStatus || 'pending',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };

                console.log('🔄 Transformed kid:', transformedKid);
                return transformedKid;
            });

            console.log('📝 Total transformed kids data:', kidsData.length);

            setTeams(teamsData);
            setKids(kidsData);

            // Calculate stats
            calculateStats(kidsData, teamsData);
            setError('');
            console.log('✅ Data fetch completed successfully');
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            console.error('❌ Error details:', {
                code: err.code,
                message: err.message
            });

            if (retryCount < 2) {
                console.log(`🔄 Retrying fetch (attempt ${retryCount + 1})...`);
                setTimeout(() => fetchData(retryCount + 1), 1000);
                return;
            }

            setError(`Failed to load data: ${err.message}. Please check your Firebase configuration.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate age from birth date string
    const calculateAgeFromBirthDate = (birthDateStr) => {
        if (!birthDateStr) return '';

        try {
            let birthDate;
            if (typeof birthDateStr === 'string' && birthDateStr.includes(' ')) {
                birthDate = new Date(birthDateStr);
            } else if (birthDateStr.seconds) {
                birthDate = new Date(birthDateStr.seconds * 1000);
            } else {
                birthDate = new Date(birthDateStr);
            }

            if (isNaN(birthDate.getTime())) {
                console.warn('Invalid birth date:', birthDateStr);
                return '';
            }

            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age >= 0 ? age : '';
        } catch (error) {
            console.error('Error calculating age:', error);
            return '';
        }
    };

    // Calculate statistics
    const calculateStats = (kidsData, teamsData) => {
        const totalKids = kidsData.length;
        const activeKids = kidsData.filter(kid => kid.isActive !== false).length;
        const inactiveKids = totalKids - activeKids;
        const kidsWithTeams = kidsData.filter(kid => kid.teamId).length;
        const kidsWithoutTeams = totalKids - kidsWithTeams;

        const newStats = {
            totalKids,
            activeKids,
            inactiveKids,
            kidsWithTeams,
            kidsWithoutTeams
        };

        console.log('📊 Calculated stats:', newStats);
        setStats(newStats);
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Enhanced filtering
    const filteredKids = kids.filter(kid => {
        const matchesSearch = searchTerm === '' ||
            kid.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            kid.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            kid.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            kid.guardianName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTeam = teamFilter === '' || kid.teamId === teamFilter;

        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'active' && kid.isActive !== false) ||
            (statusFilter === 'inactive' && kid.isActive === false);

        return matchesSearch && matchesTeam && matchesStatus;
    });

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setTeamFilter('');
        setStatusFilter('');
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirmation) return;

        try {
            await deleteDoc(doc(db, 'kids', deleteConfirmation.id));
            const updatedKids = kids.filter(kid => kid.id !== deleteConfirmation.id);
            setKids(updatedKids);
            calculateStats(updatedKids, teams);
            setDeleteConfirmation(null);
        } catch (err) {
            console.error('Error deleting kid:', err);
            setError('Failed to delete. Please try again.');
        }
    };

    return (
        <div className="admin-dashboard">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Kids Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage and organize your program participants
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchData()}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Refresh
                        </button>
                        <Link
                            to="/admin/kids/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Add New Kid
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Stats Dashboard */}
                <div className="dashboard-stats mb-6">
                    <div className="stat-card">
                        <h3>Total Kids</h3>
                        <div className="stat-value">{stats.totalKids}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Active Kids</h3>
                        <div className="stat-value" style={{ color: 'var(--success-color, #10b981)' }}>
                            {stats.activeKids}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Kids with Teams</h3>
                        <div className="stat-value">{stats.kidsWithTeams}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Kids without Teams</h3>
                        <div className="stat-value" style={{ color: 'var(--warning-color, #f59e0b)' }}>
                            {stats.kidsWithoutTeams}
                        </div>
                    </div>
                </div>

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
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setError('')}
                                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="recent-activities">
                    <div className="px-4 py-5 sm:p-6">
                        {/* Search and filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="search"
                                        id="search"
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Search by name or guardian"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Team
                                </label>
                                <select
                                    id="team-filter"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    value={teamFilter}
                                    onChange={(e) => setTeamFilter(e.target.value)}
                                >
                                    <option value="">All Teams</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    id="status-filter"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Results summary */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-700">
                                Showing {filteredKids.length} of {kids.length} kids
                                {(searchTerm || teamFilter || statusFilter) && (
                                    <span className="text-indigo-600 ml-1">(filtered)</span>
                                )}
                            </p>
                        </div>

                        {/* Table or Empty State */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-gray-600">Loading kids data...</span>
                                </div>
                            </div>
                        ) : filteredKids.length > 0 ? (
                            <div className="overflow-x-auto">
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
                                            Team
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredKids.map((kid) => {
                                        const team = teams.find(t => t.id === kid.teamId);
                                        const isActive = kid.isActive !== false;

                                        return (
                                            <tr key={kid.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                    <span className="text-indigo-700 font-medium">
                                                                        {(kid.firstName?.[0] || kid.fullName?.[0] || '?')}{(kid.lastName?.[0] || '')}
                                                                    </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {kid.fullName || `${kid.firstName || ''} ${kid.lastName || ''}`.trim()}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {kid.guardianName || 'No guardian info'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{kid.age || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {team ? team.name : 'No Team'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link
                                                            to={`/admin/kids/${kid.id}`}
                                                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200"
                                                        >
                                                            View
                                                        </Link>
                                                        <Link
                                                            to={`/admin/kids/${kid.id}/edit`}
                                                            className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs hover:bg-indigo-200"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteConfirmation(kid)}
                                                            className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs hover:bg-red-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {searchTerm || teamFilter || statusFilter ? 'No kids match your search' : 'No kids found'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || teamFilter || statusFilter
                                        ? 'Try adjusting your search criteria or clear the filters.'
                                        : 'Get started by adding a new kid to your program.'
                                    }
                                </p>
                                <div className="mt-6">
                                    <Link
                                        to="/admin/kids/new"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Add Kid
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {deleteConfirmation && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={() => setDeleteConfirmation(null)}
                        ></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Delete Kid
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete{' '}
                                                <span className="font-medium">
                                                    {deleteConfirmation.fullName || `${deleteConfirmation.firstName} ${deleteConfirmation.lastName}`}
                                                </span>
                                                ? This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setDeleteConfirmation(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KidsManagement;