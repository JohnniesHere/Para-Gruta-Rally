import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Spinner from './common/Spinner';
import ErrorMessage from './common/ErrorMessage';
import CategoryBadges from './CategoryBadges';

const SearchResults = ({ searchTerm, filters, sortBy = 'lastName', sortDirection = 'asc', pageSize = 20 }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch search results
    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                setResults([]);
                setLastVisible(null);
                setHasMore(true);

                // Build query constraints
                let constraints = [];

                // Search term
                if (searchTerm && searchTerm.trim() !== '') {
                    // Simple search (for demo purposes - in a real app, consider Firestore indexes or a search service)
                    const searchLower = searchTerm.toLowerCase();

                    // Add multiple search term conditions
                    constraints.push(where('firstNameLower', '>=', searchLower));
                    constraints.push(where('firstNameLower', '<=', searchLower + '\uf8ff'));

                    // Note: In a real app, you'd need to handle OR conditions better
                    // For demo, we're just using one field, but ideally search across multiple fields
                }

                // Category filters
                if (filters?.categories && filters.categories.length > 0) {
                    constraints.push(where('categoryIds', 'array-contains-any', filters.categories));
                }

                // Team filters
                if (filters?.teams && filters.teams.length > 0) {
                    constraints.push(where('teamIds', 'array-contains-any', filters.teams));
                }

                // Status filter
                if (filters?.status && filters.status !== 'all') {
                    constraints.push(where('status', '==', filters.status));
                }

                // Age filter is handled client-side (Firestore doesn't have range query on calculated fields)

                // Create the query
                const childrenRef = collection(db, 'children');
                const q = query(
                    childrenRef,
                    ...constraints,
                    orderBy(sortBy, sortDirection),
                    limit(pageSize)
                );

                // Execute query
                const snapshot = await getDocs(q);

                // Process results
                const fetchedResults = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const age = calculateAge(data.dateOfBirth);

                    // Apply age filter client-side
                    if (
                        !filters?.ageRange ||
                        (age >= filters.ageRange[0] && age <= filters.ageRange[1])
                    ) {
                        fetchedResults.push({
                            id: doc.id,
                            ...data,
                            age
                        });
                    }
                });

                setResults(fetchedResults);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(!snapshot.empty && snapshot.docs.length === pageSize);

                // Get approximate total count
                // Note: This is simplified - in a real app, consider alternatives for counting
                const countQuery = query(childrenRef, ...constraints);
                const countSnapshot = await getDocs(countQuery);
                setTotalCount(countSnapshot.size);
            } catch (err) {
                console.error('Error fetching search results:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [searchTerm, filters, sortBy, sortDirection, pageSize]);

    // Load more results
    const loadMore = async () => {
        if (!lastVisible || !hasMore) return;

        try {
            setLoading(true);

            // Build query with same constraints but start after last visible
            let constraints = [];

            // Search term
            if (searchTerm && searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase();
                constraints.push(where('firstNameLower', '>=', searchLower));
                constraints.push(where('firstNameLower', '<=', searchLower + '\uf8ff'));
            }

            // Category filters
            if (filters?.categories && filters.categories.length > 0) {
                constraints.push(where('categoryIds', 'array-contains-any', filters.categories));
            }

            // Team filters
            if (filters?.teams && filters.teams.length > 0) {
                constraints.push(where('teamIds', 'array-contains-any', filters.teams));
            }

            // Status filter
            if (filters?.status && filters.status !== 'all') {
                constraints.push(where('status', '==', filters.status));
            }

            // Create the query
            const q = query(
                collection(db, 'children'),
                ...constraints,
                orderBy(sortBy, sortDirection),
                startAfter(lastVisible),
                limit(pageSize)
            );

            // Execute query
            const snapshot = await getDocs(q);

            // Process results
            const newResults = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const age = calculateAge(data.dateOfBirth);

                // Apply age filter client-side
                if (
                    !filters?.ageRange ||
                    (age >= filters.ageRange[0] && age <= filters.ageRange[1])
                ) {
                    newResults.push({
                        id: doc.id,
                        ...data,
                        age
                    });
                }
            });

            setResults(prev => [...prev, ...newResults]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(!snapshot.empty && snapshot.docs.length === pageSize);
        } catch (err) {
            console.error('Error loading more results:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return <ErrorMessage message={error.message} />;
    }

    return (
        <div>
            {/* Results count */}
            <div className="mb-4">
                <p className="text-gray-600">
                    {loading && results.length === 0 ? (
                        'Searching...'
                    ) : (
                        `Showing ${results.length} of ${totalCount} results`
                    )}
                </p>
            </div>

            {/* Results table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                                // Toggle sort order for name
                            }}
                        >
                            Name
                            {sortBy === 'lastName' && (
                                <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                            )}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Age
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Guardian
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categories
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
                    {results.map(child => (
                        <tr key={child.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link to={`/kid/${child.id}`} className="text-blue-600 hover:text-blue-900">
                                    {child.firstName} {child.lastName}
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {child.age !== undefined ? `${child.age} years` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {child.guardianName || '-'}
                            </td>
                            <td className="px-6 py-4">
                                <CategoryBadges categories={child.categories || []} limit={3} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${child.status === 'active' ? 'bg-green-100 text-green-800' :
                      child.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                  >
                    {child.status || 'unknown'}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link to={`/kid/${child.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                                    View
                                </Link>
                                <Link to={`/kid/${child.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                                    Edit
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="flex justify-center my-4">
                    <Spinner />
                </div>
            )}

            {/* No results message */}
            {!loading && results.length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg shadow-md mt-4">
                    <p className="text-gray-500">No results found</p>
                </div>
            )}

            {/* Load more button */}
            {!loading && hasMore && results.length > 0 && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={loadMore}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Load More
                    </button>
                </div>
            )}
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

export default SearchResults;