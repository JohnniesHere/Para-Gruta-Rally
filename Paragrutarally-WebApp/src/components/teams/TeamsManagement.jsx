// src/components/teams/TeamsManagement.jsx - Enhanced Version

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';

function TeamsManagement() {
    const [teams, setTeams] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [instructorFilter, setInstructorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [kidCountByTeam, setKidCountByTeam] = useState({});

    // Bulk actions state
    const [selectedTeams, setSelectedTeams] = useState(new Set());
    const [bulkActionType, setBulkActionType] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkInstructorId, setBulkInstructorId] = useState('');
    const [bulkStatus, setBulkStatus] = useState('');

    // Stats state
    const [stats, setStats] = useState({
        totalTeams: 0,
        activeTeams: 0,
        teamsWithInstructors: 0,
        teamsWithKids: 0,
        averageKidsPerTeam: 0,
        totalKidsInTeams: 0
    });

    // Enhanced fetch function with stats calculation
    const fetchData = useCallback(async (retryCount = 0) => {
        setLoading(true);
        try {
            // Fetch instructors, teams, and kids concurrently
            const [instructorsSnapshot, teamsSnapshot, kidsSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'users'), where('role', 'in', ['staff', 'admin']))),
                getDocs(query(collection(db, 'teams'), orderBy('name'))),
                getDocs(collection(db, 'kids'))
            ]);

            const instructorsData = instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const kidsData = kidsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setInstructors(instructorsData);
            setTeams(teamsData);

            // Count kids in each team
            const counts = {};
            kidsData.forEach(kid => {
                if (kid.teamId) {
                    counts[kid.teamId] = (counts[kid.teamId] || 0) + 1;
                }
            });
            setKidCountByTeam(counts);

            // Calculate stats
            calculateStats(teamsData, counts, instructorsData);
            setError('');
        } catch (err) {
            console.error('Error fetching data:', err);

            if (retryCount < 2) {
                setTimeout(() => fetchData(retryCount + 1), 1000);
                return;
            }

            setError('Failed to load data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate statistics
    const calculateStats = (teamsData, kidCounts, instructorsData) => {
        const totalTeams = teamsData.length;
        const activeTeams = teamsData.filter(team => team.isActive !== false).length;
        const teamsWithInstructors = teamsData.filter(team => team.instructorId).length;
        const teamsWithKids = Object.keys(kidCounts).length;
        const totalKidsInTeams = Object.values(kidCounts).reduce((sum, count) => sum + count, 0);
        const averageKidsPerTeam = teamsWithKids > 0 ? Math.round(totalKidsInTeams / teamsWithKids * 10) / 10 : 0;

        setStats({
            totalTeams,
            activeTeams,
            teamsWithInstructors,
            teamsWithKids,
            averageKidsPerTeam,
            totalKidsInTeams
        });
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Enhanced filtering
    const filteredTeams = teams.filter(team => {
        const matchesSearch = searchTerm === '' ||
            team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesInstructor = instructorFilter === '' || team.instructorId === instructorFilter;

        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'active' && team.isActive !== false) ||
            (statusFilter === 'inactive' && team.isActive === false);

        return matchesSearch && matchesInstructor && matchesStatus;
    });

    // Enhanced sorting
    const sortedTeams = [...filteredTeams].sort((a, b) => {
        let aValue = a[sortField] || '';
        let bValue = b[sortField] || '';

        if (sortField === 'instructorName') {
            const aInstructor = instructors.find(i => i.id === a.instructorId);
            const bInstructor = instructors.find(i => i.id === b.instructorId);
            aValue = aInstructor?.displayName || aInstructor?.email || '';
            bValue = bInstructor?.displayName || bInstructor?.email || '';
        } else if (sortField === 'kidCount') {
            aValue = kidCountByTeam[a.id] || 0;
            bValue = kidCountByTeam[b.id] || 0;
        }

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedTeams.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTeams = sortedTeams.slice(startIndex, startIndex + itemsPerPage);

    // Export to CSV
    const exportToCSV = () => {
        const csvData = filteredTeams.map(team => {
            const instructor = instructors.find(i => i.id === team.instructorId);
            return {
                'Team Name': team.name || '',
                'Description': team.description || '',
                'Instructor': instructor ? (instructor.displayName || instructor.email) : 'No Instructor',
                'Kid Count': kidCountByTeam[team.id] || 0,
                'Capacity': team.capacity || '',
                'Location': team.location || '',
                'Age Group': team.ageGroup || '',
                'Status': team.isActive !== false ? 'Active' : 'Inactive',
                'Created Date': team.createdAt ? new Date(team.createdAt.seconds * 1000).toLocaleDateString() : ''
            };
        });

        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => {
                const value = row[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `teams-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Bulk selection handlers
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTeams(new Set(paginatedTeams.map(team => team.id)));
        } else {
            setSelectedTeams(new Set());
        }
    };

    const handleSelectTeam = (teamId, checked) => {
        const newSelected = new Set(selectedTeams);
        if (checked) {
            newSelected.add(teamId);
        } else {
            newSelected.delete(teamId);
        }
        setSelectedTeams(newSelected);
    };

    // Bulk actions
    const handleBulkAction = (actionType) => {
        if (selectedTeams.size === 0) return;
        setBulkActionType(actionType);
        setShowBulkModal(true);
    };

    const executeBulkAction = async () => {
        if (selectedTeams.size === 0) return;

        try {
            const batch = writeBatch(db);
            const selectedTeamIds = Array.from(selectedTeams);

            switch (bulkActionType) {
                case 'delete':
                    // Check if any selected teams have kids
                    { const teamsWithKids = selectedTeamIds.filter(teamId => kidCountByTeam[teamId] > 0);
                    if (teamsWithKids.length > 0) {
                        throw new Error(`Cannot delete teams that have kids assigned. ${teamsWithKids.length} selected teams have kids.`);
                    }

                    selectedTeamIds.forEach(teamId => {
                        batch.delete(doc(db, 'teams', teamId));
                    });
                    break; }

                case 'assignInstructor':
                    selectedTeamIds.forEach(teamId => {
                        batch.update(doc(db, 'teams', teamId), { instructorId: bulkInstructorId });
                    });
                    break;

                case 'changeStatus':
                    selectedTeamIds.forEach(teamId => {
                        batch.update(doc(db, 'teams', teamId), { isActive: bulkStatus === 'active' });
                    });
                    break;
            }

            await batch.commit();

            // Update local state
            if (bulkActionType === 'delete') {
                setTeams(prevTeams => prevTeams.filter(team => !selectedTeams.has(team.id)));
            } else {
                setTeams(prevTeams => prevTeams.map(team => {
                    if (selectedTeams.has(team.id)) {
                        const updates = {};
                        if (bulkActionType === 'assignInstructor') updates.instructorId = bulkInstructorId;
                        if (bulkActionType === 'changeStatus') updates.isActive = bulkStatus === 'active';
                        return { ...team, ...updates };
                    }
                    return team;
                }));
            }

            setSelectedTeams(new Set());
            setShowBulkModal(false);
            setBulkInstructorId('');
            setBulkStatus('');

            // Recalculate stats
            const updatedTeams = bulkActionType === 'delete'
                ? teams.filter(team => !selectedTeams.has(team.id))
                : teams;
            calculateStats(updatedTeams, kidCountByTeam, instructors);

        } catch (err) {
            console.error('Error executing bulk action:', err);
            setError(err.message || 'Failed to execute bulk action. Please try again.');
        }
    };

    // Handle sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirmation) return;

        try {
            // Check if team has kids
            if (kidCountByTeam[deleteConfirmation.id] > 0) {
                throw new Error(`Cannot delete team that has ${kidCountByTeam[deleteConfirmation.id]} kids assigned. Please reassign the kids first.`);
            }

            await deleteDoc(doc(db, 'teams', deleteConfirmation.id));
            const updatedTeams = teams.filter(team => team.id !== deleteConfirmation.id);
            setTeams(updatedTeams);
            calculateStats(updatedTeams, kidCountByTeam, instructors);
            setDeleteConfirmation(null);

            const newTotalPages = Math.ceil((sortedTeams.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
        } catch (err) {
            console.error('Error deleting team:', err);
            setError(err.message || 'Failed to delete team. Please try again.');
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setInstructorFilter('');
        setStatusFilter('');
        setCurrentPage(1);
        setSelectedTeams(new Set());
    };

    // Get instructor name by ID
    const getInstructorName = (instructorId) => {
        const instructor = instructors.find(i => i.id === instructorId);
        return instructor ? (instructor.displayName || instructor.email) : 'No instructor';
    };

    // Sort indicator component
    const SortIndicator = ({ field }) => {
        if (sortField !== field) return null;
        return (
            <span className="ml-1">
                {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    // Stats Dashboard Component
    const StatsDashboard = () => (
        <div className="dashboard-stats mb-6">
            <div className="stat-card">
                <h3>Total Teams</h3>
                <div className="stat-value">{stats.totalTeams}</div>
            </div>
            <div className="stat-card">
                <h3>Active Teams</h3>
                <div className="stat-value" style={{ color: 'var(--success-color, #10b981)' }}>
                    {stats.activeTeams}
                </div>
            </div>
            <div className="stat-card">
                <h3>Teams with Kids</h3>
                <div className="stat-value">{stats.teamsWithKids}</div>
            </div>
            <div className="stat-card">
                <h3>Avg Kids/Team</h3>
                <div className="stat-value" style={{ color: 'var(--info-color, #3b82f6)' }}>
                    {stats.averageKidsPerTeam}
                </div>
            </div>
        </div>
    );

    // Pagination component
    const Pagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                            <span className="font-medium">
                                {Math.min(startIndex + itemsPerPage, sortedTeams.length)}
                            </span>{' '}
                            of <span className="font-medium">{sortedTeams.length}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let page;
                                if (totalPages <= 7) {
                                    page = i + 1;
                                } else if (currentPage <= 4) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 3) {
                                    page = totalPages - 6 + i;
                                } else {
                                    page = currentPage - 3 + i;
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                            page === currentPage
                                                ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                        } ${i === 0 ? 'rounded-l-md' : ''} ${i === Math.min(totalPages, 7) - 1 ? 'rounded-r-md' : ''}`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-dashboard">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage and organize your program teams
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportToCSV}
                            disabled={filteredTeams.length === 0}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                        <button
                            onClick={() => fetchData()}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <Link
                            to="/teams/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add New Team
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Stats Dashboard */}
                <StatsDashboard />

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
                        {/* Enhanced search and filters */}
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
                                        placeholder="Search by name or description"
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
                                <label htmlFor="instructor-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Instructor
                                </label>
                                <select
                                    id="instructor-filter"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    value={instructorFilter}
                                    onChange={(e) => setInstructorFilter(e.target.value)}
                                >
                                    <option value="">All Instructors</option>
                                    {instructors.map((instructor) => (
                                        <option key={instructor.id} value={instructor.id}>
                                            {instructor.displayName || instructor.email}
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

                        {/* Bulk Actions Bar */}
                        {selectedTeams.size > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-900">
                                        {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleBulkAction('assignInstructor')}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                        >
                                            Assign Instructor
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('changeStatus')}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                        >
                                            Change Status
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('delete')}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results summary */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-700">
                                Showing {sortedTeams.length} of {teams.length} teams
                                {(searchTerm || instructorFilter || statusFilter) && (
                                    <span className="text-indigo-600 ml-1">(filtered)</span>
                                )}
                            </p>
                        </div>

                        {/* Enhanced table with bulk selection */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-gray-600">Loading teams data...</span>
                                </div>
                            </div>
                        ) : paginatedTeams.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                    checked={paginatedTeams.length > 0 && paginatedTeams.every(team => selectedTeams.has(team.id))}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('name')}
                                            >
                                                Team <SortIndicator field="name" />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('instructorName')}
                                            >
                                                Instructor <SortIndicator field="instructorName" />
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('kidCount')}
                                            >
                                                Kids <SortIndicator field="kidCount" />
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
                                        {paginatedTeams.map((team) => {
                                            const isActive = team.isActive !== false;
                                            const kidCount = kidCountByTeam[team.id] || 0;

                                            return (
                                                <tr key={team.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                            checked={selectedTeams.has(team.id)}
                                                            onChange={(e) => handleSelectTeam(team.id, e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-md bg-indigo-100 flex items-center justify-center">
                                                                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {team.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {team.description || 'No description'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {getInstructorName(team.instructorId)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {kidCount} kid{kidCount !== 1 ? 's' : ''}
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
                                                                to={`/teams/${team.id}`}
                                                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200"
                                                            >
                                                                View
                                                            </Link>
                                                            <Link
                                                                to={`/teams/${team.id}/edit`}
                                                                className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs hover:bg-indigo-200"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => setDeleteConfirmation(team)}
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
                                <Pagination />
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {searchTerm || instructorFilter || statusFilter ? 'No teams match your search' : 'No teams found'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || instructorFilter || statusFilter
                                        ? 'Try adjusting your search criteria or clear the filters.'
                                        : 'Get started by creating your first team.'
                                    }
                                </p>
                                <div className="mt-6 flex justify-center space-x-3">
                                    {(searchTerm || instructorFilter || statusFilter) && (
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                    <Link
                                        to="/teams/new"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Add Team
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Action Modal */}
            {showBulkModal && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={() => setShowBulkModal(false)}
                        ></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            {bulkActionType === 'delete' ? 'Delete Teams' :
                                                bulkActionType === 'assignInstructor' ? 'Assign Instructor' : 'Change Status'}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                You are about to {bulkActionType === 'delete' ? 'delete' : 'update'} {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''}.
                                                {bulkActionType === 'delete' && ' Teams with kids cannot be deleted.'}
                                            </p>

                                            {bulkActionType === 'assignInstructor' && (
                                                <div className="mt-4">
                                                    <label htmlFor="bulk-instructor" className="block text-sm font-medium text-gray-700">
                                                        Select Instructor
                                                    </label>
                                                    <select
                                                        id="bulk-instructor"
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                        value={bulkInstructorId}
                                                        onChange={(e) => setBulkInstructorId(e.target.value)}
                                                    >
                                                        <option value="">Select an instructor...</option>
                                                        {instructors.map((instructor) => (
                                                            <option key={instructor.id} value={instructor.id}>
                                                                {instructor.displayName || instructor.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {bulkActionType === 'changeStatus' && (
                                                <div className="mt-4">
                                                    <label htmlFor="bulk-status" className="block text-sm font-medium text-gray-700">
                                                        Select Status
                                                    </label>
                                                    <select
                                                        id="bulk-status"
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                        value={bulkStatus}
                                                        onChange={(e) => setBulkStatus(e.target.value)}
                                                    >
                                                        <option value="">Select status...</option>
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                                        bulkActionType === 'delete'
                                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                                    } ${
                                        (bulkActionType === 'assignInstructor' && !bulkInstructorId) ||
                                        (bulkActionType === 'changeStatus' && !bulkStatus)
                                            ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    onClick={executeBulkAction}
                                    disabled={
                                        (bulkActionType === 'assignInstructor' && !bulkInstructorId) ||
                                        (bulkActionType === 'changeStatus' && !bulkStatus)
                                    }
                                >
                                    {bulkActionType === 'delete' ? 'Delete' : 'Update'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowBulkModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                            Delete Team
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete the team{' '}
                                                <span className="font-medium">"{deleteConfirmation.name}"</span>?
                                                {kidCountByTeam[deleteConfirmation.id] > 0 ? (
                                                    <span className="block text-red-500 mt-2 font-medium">
                                                        Warning: This team has {kidCountByTeam[deleteConfirmation.id]} kids assigned to it.
                                                        You must reassign these kids before deleting the team.
                                                    </span>
                                                ) : (
                                                    <span className="block mt-2">
                                                        This action cannot be undone.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                                        kidCountByTeam[deleteConfirmation.id] > 0
                                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                                    }`}
                                    onClick={handleDelete}
                                    disabled={kidCountByTeam[deleteConfirmation.id] > 0}
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

export default TeamsManagement;