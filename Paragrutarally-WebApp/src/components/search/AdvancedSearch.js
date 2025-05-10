// src/components/search/AdvancedSearch.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

function AdvancedSearch() {
    // State for search parameters
    const [searchParams, setSearchParams] = useState({
        searchType: 'kids',
        nameSearch: '',
        ageRange: {
            min: '',
            max: ''
        },
        teamId: '',
        participationStatus: 'all',
        sortBy: 'name',
        sortDirection: 'asc'
    });

    // State for search results and supporting data
    const [results, setResults] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    // Fetch teams for filtering
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const teamsQuery = query(collection(db, 'teams'), orderBy('name'));
                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTeams(teamsData);
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams for filtering. Please try again later.');
            }
        };

        fetchTeams();
    }, []);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'minAge' || name === 'maxAge') {
            setSearchParams(prev => ({
                ...prev,
                ageRange: {
                    ...prev.ageRange,
                    [name === 'minAge' ? 'min' : 'max']: value
                }
            }));
        } else {
            setSearchParams(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle search form submission
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSearched(true);

        try {
            let searchQuery;

            // Build query based on search type and filters
            if (searchParams.searchType === 'kids') {
                // Start with basic query
                let kidQuery = collection(db, 'kids');
                let queryConstraints = [];

                // Add filters
                if (searchParams.teamId) {
                    queryConstraints.push(where('teamId', '==', searchParams.teamId));
                }

                // Age filters would be added here, but Firestore doesn't support range queries
                // on multiple fields, so we'll filter age range in JavaScript

                // Ordering
                if (searchParams.sortBy === 'name') {
                    queryConstraints.push(orderBy('lastName', searchParams.sortDirection));
                    queryConstraints.push(orderBy('firstName', searchParams.sortDirection));
                } else if (searchParams.sortBy === 'age') {
                    queryConstraints.push(orderBy('age', searchParams.sortDirection));
                }

                // Create and execute the query
                searchQuery = query(kidQuery, ...queryConstraints);
                const kidsSnapshot = await getDocs(searchQuery);

                // Map results
                let kidsResults = kidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'kid',
                    ...doc.data()
                }));

                // Client-side filtering for text search and age range
                if (searchParams.nameSearch) {
                    const searchLower = searchParams.nameSearch.toLowerCase();
                    kidsResults = kidsResults.filter(kid =>
                        kid.firstName?.toLowerCase().includes(searchLower) ||
                        kid.lastName?.toLowerCase().includes(searchLower)
                    );
                }

                if (searchParams.ageRange.min) {
                    kidsResults = kidsResults.filter(kid =>
                        kid.age >= parseInt(searchParams.ageRange.min, 10)
                    );
                }

                if (searchParams.ageRange.max) {
                    kidsResults = kidsResults.filter(kid =>
                        kid.age <= parseInt(searchParams.ageRange.max, 10)
                    );
                }

                setResults(kidsResults);
            }
            else if (searchParams.searchType === 'teams') {
                // Start with basic query
                let teamQuery = collection(db, 'teams');
                let queryConstraints = [];

                // Add filters
                if (searchParams.nameSearch) {
                    queryConstraints.push(orderBy('name'));
                    // This is not ideal for text search, will use client-side filtering below
                }

                // Create and execute the query
                searchQuery = query(teamQuery, ...queryConstraints);
                const teamsSnapshot = await getDocs(searchQuery);

                // Map results
                let teamResults = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'team',
                    ...doc.data()
                }));

                // Client-side filtering for text search
                if (searchParams.nameSearch) {
                    const searchLower = searchParams.nameSearch.toLowerCase();
                    teamResults = teamResults.filter(team =>
                        team.name?.toLowerCase().includes(searchLower) ||
                        team.description?.toLowerCase().includes(searchLower)
                    );
                }

                setResults(teamResults);
            }
        } catch (err) {
            console.error('Error executing search:', err);
            setError('Failed to execute search. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Reset search form
    const handleReset = () => {
        setSearchParams({
            searchType: 'kids',
            nameSearch: '',
            ageRange: {
                min: '',
                max: ''
            },
            teamId: '',
            participationStatus: 'all',
            sortBy: 'name',
            sortDirection: 'asc'
        });
        setResults([]);
        setSearched(false);
        setError('');
    };

    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Search Form */}
                    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
                        <div className="md:grid md:grid-cols-3 md:gap-6">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Search Parameters</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Use these fields to search and filter through records.
                                </p>
                            </div>

                            <div className="mt-5 md:mt-0 md:col-span-2">
                                <form onSubmit={handleSearch}>
                                    {error && (
                                        <div className="rounded-md bg-red-50 p-4 mb-6">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-red-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-6 gap-6">
                                        {/* Search Type */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="searchType" className="block text-sm font-medium text-gray-700">
                                                Search Type
                                            </label>
                                            <select
                                                id="searchType"
                                                name="searchType"
                                                value={searchParams.searchType}
                                                onChange={handleChange}
                                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                <option value="kids">Kids</option>
                                                <option value="teams">Teams</option>
                                            </select>
                                        </div>

                                        {/* Name/Description Search */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label htmlFor="nameSearch" className="block text-sm font-medium text-gray-700">
                                                {searchParams.searchType === 'kids' ? 'Name Search' : 'Name/Description Search'}
                                            </label>
                                            <input
                                                type="text"
                                                name="nameSearch"
                                                id="nameSearch"
                                                value={searchParams.nameSearch}
                                                onChange={handleChange}
                                                placeholder={searchParams.searchType === 'kids' ? "Search by name" : "Search by name or description"}
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                        </div>

                                        {/* Additional filters based on search type */}
                                        {searchParams.searchType === 'kids' && (
                                            <>
                                                {/* Team Filter */}
                                                <div className="col-span-6 sm:col-span-3">
                                                    <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                                                        Team
                                                    </label>
                                                    <select
                                                        id="teamId"
                                                        name="teamId"
                                                        value={searchParams.teamId}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    >
                                                        <option value="">All Teams</option>
                                                        {teams.map(team => (
                                                            <option key={team.id} value={team.id}>
                                                                {team.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Age Range */}
                                                <div className="col-span-6 sm:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Age Range
                                                    </label>
                                                    <div className="mt-1 flex space-x-2">
                                                        <input
                                                            type="number"
                                                            name="minAge"
                                                            id="minAge"
                                                            value={searchParams.ageRange.min}
                                                            onChange={handleChange}
                                                            placeholder="Min"
                                                            min="0"
                                                            max="100"
                                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                        />
                                                        <span className="text-gray-500 self-center">to</span>
                                                        <input
                                                            type="number"
                                                            name="maxAge"
                                                            id="maxAge"
                                                            value={searchParams.ageRange.max}
                                                            onChange={handleChange}
                                                            placeholder="Max"
                                                            min="0"
                                                            max="100"
                                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Participation Status */}
                                                <div className="col-span-6 sm:col-span-3">
                                                    <label htmlFor="participationStatus" className="block text-sm font-medium text-gray-700">
                                                        Participation Status
                                                    </label>
                                                    <select
                                                        id="participationStatus"
                                                        name="participationStatus"
                                                        value={searchParams.participationStatus}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    >
                                                        <option value="all">All</option>
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>

                                                {/* Sort By */}
                                                <div className="col-span-6 sm:col-span-3">
                                                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                                                        Sort By
                                                    </label>
                                                    <div className="mt-1 flex space-x-2">
                                                        <select
                                                            id="sortBy"
                                                            name="sortBy"
                                                            value={searchParams.sortBy}
                                                            onChange={handleChange}
                                                            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        >
                                                            <option value="name">Name</option>
                                                            <option value="age">Age</option>
                                                        </select>
                                                        <select
                                                            id="sortDirection"
                                                            name="sortDirection"
                                                            value={searchParams.sortDirection}
                                                            onChange={handleChange}
                                                            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        >
                                                            <option value="asc">Ascending</option>
                                                            <option value="desc">Descending</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            {loading ? 'Searching...' : 'Search'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Search Results */}
                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Search Results
                                {results.length > 0 && ` (${results.length} found)`}
                            </h3>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span className="text-gray-600">Searching...</span>
                                </div>
                            ) : searched && results.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            vectorEffect="non-scaling-stroke"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Try adjusting your search parameters to find what you're looking for.
                                    </p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="mt-4">
                                    {searchParams.searchType === 'kids' ? (
                                        <div className="flex flex-col">
                                            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                            <tr>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Name
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Age
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Team
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                            {results.map((kid) => {
                                                                const team = teams.find(t => t.id === kid.teamId);

                                                                return (
                                                                    <tr key={kid.id}>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center">
                                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                              <span className="text-indigo-700 font-medium">
                                                {kid.firstName?.[0]}{kid.lastName?.[0]}
                                              </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="ml-4">
                                                                                    <div className="text-sm font-medium text-gray-900">
                                                                                        {kid.firstName} {kid.lastName}
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500">
                                                                                        {kid.email || 'No email'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm text-gray-900">{kid.age}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm text-gray-900">
                                                                                {team ? team.name : 'No Team'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                            <Link
                                                                                to={`/kids/${kid.id}`}
                                                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                                            >
                                                                                View
                                                                            </Link>
                                                                            <Link
                                                                                to={`/kids/${kid.id}/edit`}
                                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                            >
                                                                                Edit
                                                                            </Link>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                            <tr>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Team
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Description
                                                                </th>
                                                                <th
                                                                    scope="col"
                                                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                            {results.map((team) => (
                                                                <tr key={team.id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center">
                                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                                <div className="h-10 w-10 rounded-md bg-indigo-100 flex items-center justify-center">
                                                                                    <svg
                                                                                        className="h-6 w-6 text-indigo-600"
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        stroke="currentColor"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={2}
                                                                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                                                        />
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-4">
                                                                                <div className="text-sm font-medium text-gray-900">
                                                                                    {team.name}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm text-gray-900 line-clamp-2">
                                                                            {team.description || 'No description'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        <Link
                                                                            to={`/teams/${team.id}`}
                                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                                        >
                                                                            View
                                                                        </Link>
                                                                        <Link
                                                                            to={`/teams/${team.id}/edit`}
                                                                            className="text-indigo-600 hover:text-indigo-900"
                                                                        >
                                                                            Edit
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : !searched ? (
                                <div className="text-center py-8">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            vectorEffect="non-scaling-stroke"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Use the search form</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Set your search parameters and click Search to find results.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdvancedSearch;