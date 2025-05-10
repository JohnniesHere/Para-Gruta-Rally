import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const FilterPanel = ({ onFilterChange, initialFilters = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        categories: initialFilters.categories || [],
        teams: initialFilters.teams || [],
        ageRange: initialFilters.ageRange || [0, 18],
        status: initialFilters.status || 'all',
        ...initialFilters
    });

    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableTeams, setAvailableTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch available categories and teams
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                setLoading(true);

                // Fetch categories
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAvailableCategories(categoriesData);

                // Fetch teams
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAvailableTeams(teamsData);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilterData();
    }, []);

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        let newFilters;

        switch (filterType) {
            case 'category':
                // Toggle category selection
                newFilters = {
                    ...filters,
                    categories: filters.categories.includes(value)
                        ? filters.categories.filter(id => id !== value)
                        : [...filters.categories, value]
                };
                break;

            case 'team':
                // Toggle team selection
                newFilters = {
                    ...filters,
                    teams: filters.teams.includes(value)
                        ? filters.teams.filter(id => id !== value)
                        : [...filters.teams, value]
                };
                break;

            case 'ageMin':
                newFilters = {
                    ...filters,
                    ageRange: [parseInt(value, 10), filters.ageRange[1]]
                };
                break;

            case 'ageMax':
                newFilters = {
                    ...filters,
                    ageRange: [filters.ageRange[0], parseInt(value, 10)]
                };
                break;

            case 'status':
                newFilters = {
                    ...filters,
                    status: value
                };
                break;

            default:
                newFilters = {
                    ...filters,
                    [filterType]: value
                };
        }

        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    // Clear all filters
    const handleClearFilters = () => {
        const clearedFilters = {
            categories: [],
            teams: [],
            ageRange: [0, 18],
            status: 'all'
        };

        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            <div
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={togglePanel}
            >
                <h2 className="text-lg font-semibold">Filters</h2>
                <div className="flex items-center">
                    {(filters.categories.length > 0 ||
                        filters.teams.length > 0 ||
                        filters.status !== 'all' ||
                        filters.ageRange[0] !== 0 ||
                        filters.ageRange[1] !== 18) && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
              Active Filters
            </span>
                    )}
                    <svg
                        className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Categories Filter */}
                        <div>
                            <h3 className="font-medium mb-2">Categories</h3>
                            {loading ? (
                                <p className="text-sm text-gray-500">Loading...</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {availableCategories.map(category => (
                                        <div key={category.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`category-${category.id}`}
                                                checked={filters.categories.includes(category.id)}
                                                onChange={() => handleFilterChange('category', category.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                                                {category.name}
                                            </label>
                                        </div>
                                    ))}
                                    {availableCategories.length === 0 && (
                                        <p className="text-sm text-gray-500">No categories available</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Teams Filter */}
                        <div>
                            <h3 className="font-medium mb-2">Teams</h3>
                            {loading ? (
                                <p className="text-sm text-gray-500">Loading...</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {availableTeams.map(team => (
                                        <div key={team.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`team-${team.id}`}
                                                checked={filters.teams.includes(team.id)}
                                                onChange={() => handleFilterChange('team', team.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor={`team-${team.id}`} className="ml-2 text-sm text-gray-700">
                                                {team.name}
                                            </label>
                                        </div>
                                    ))}
                                    {availableTeams.length === 0 && (
                                        <p className="text-sm text-gray-500">No teams available</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Age Range Filter */}
                        <div>
                            <h3 className="font-medium mb-2">Age Range</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="age-min" className="block text-xs text-gray-500">
                                        Min Age
                                    </label>
                                    <input
                                        type="number"
                                        id="age-min"
                                        min="0"
                                        max={filters.ageRange[1]}
                                        value={filters.ageRange[0]}
                                        onChange={e => handleFilterChange('ageMin', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="age-max" className="block text-xs text-gray-500">
                                        Max Age
                                    </label>
                                    <input
                                        type="number"
                                        id="age-max"
                                        min={filters.ageRange[0]}
                                        value={filters.ageRange[1]}
                                        onChange={e => handleFilterChange('ageMax', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <h3 className="font-medium mb-2">Status</h3>
                            <select
                                value={filters.status}
                                onChange={e => handleFilterChange('status', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-gray-600 hover:text-gray-900 mr-4"
                        >
                            Clear All Filters
                        </button>
                        <button
                            onClick={togglePanel}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;