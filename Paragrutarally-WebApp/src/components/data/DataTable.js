// src/components/data/DataTable.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../layout/LoadingSpinner';

function DataTable({
                       data = [],
                       columns = [],
                       loading = false,
                       error = null,
                       actions = [],
                       onRowClick = null,
                       pagination = true,
                       pageSize = 10,
                       sortable = true,
                       filterable = true,
                       emptyMessage = 'No data available',
                       onSort = null,
                       onFilter = null,
                       className = ''
                   }) {
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(pageSize);

    // State for sorting
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    // State for filtering
    const [filters, setFilters] = useState({});

    // Reset pagination when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);

    // Handle sorting
    const handleSort = (columnKey) => {
        if (!sortable) return;

        // If clicking the same column, toggle direction
        if (sortColumn === columnKey) {
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDirection);

            // If external sort handler is provided
            if (onSort) {
                onSort(columnKey, newDirection);
            }
        } else {
            // New column, default to ascending
            setSortColumn(columnKey);
            setSortDirection('asc');

            // If external sort handler is provided
            if (onSort) {
                onSort(columnKey, 'asc');
            }
        }
    };

    // Handle filtering
    const handleFilterChange = (columnKey, value) => {
        const newFilters = {
            ...filters,
            [columnKey]: value
        };

        // If value is empty, remove the filter
        if (!value) {
            delete newFilters[columnKey];
        }

        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page on filter change

        // If external filter handler is provided
        if (onFilter) {
            onFilter(newFilters);
        }
    };

    // Apply sorting and filtering locally if no external handlers
    const processData = () => {
        let processedData = [...data];

        // Apply filters if no external filter handler
        if (!onFilter && filterable) {
            processedData = processedData.filter(item => {
                return Object.keys(filters).every(key => {
                    const filterValue = filters[key].toLowerCase();
                    const columnValue = String(item[key] || '').toLowerCase();
                    return columnValue.includes(filterValue);
                });
            });
        }

        // Apply sorting if no external sort handler
        if (!onSort && sortable && sortColumn) {
            processedData.sort((a, b) => {
                const valueA = a[sortColumn] || '';
                const valueB = b[sortColumn] || '';

                // Handle different data types
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortDirection === 'asc'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                } else {
                    return sortDirection === 'asc'
                        ? valueA - valueB
                        : valueB - valueA;
                }
            });
        }

        return processedData;
    };

    // Get current page items
    const getCurrentItems = () => {
        const processedData = processData();

        if (!pagination) return processedData;

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return processedData.slice(indexOfFirstItem, indexOfLastItem);
    };

    // Paginate
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Render column headers with sort indicators
    const renderHeaders = () => {
        return columns.map((column) => (
            <th
                key={column.key}
                onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${sortColumn === column.key ? 'bg-gray-50' : ''}`}
            >
                <div className="flex items-center">
                    {column.header}
                    {sortable && column.sortable !== false && (
                        <span className="ml-2">
              {sortColumn === column.key && (
                  <svg
                      className={`h-4 w-4 text-gray-400 ${
                          sortDirection === 'desc' ? 'transform rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                  >
                      <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                      />
                  </svg>
              )}
            </span>
                    )}
                </div>
                {filterable && column.filterable !== false && (
                    <div className="mt-1">
                        <input
                            type="text"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full text-xs sm:text-sm border-gray-300 rounded-md"
                            placeholder={`Filter ${column.header}`}
                            value={filters[column.key] || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleFilterChange(column.key, e.target.value)}
                        />
                    </div>
                )}
            </th>
        ));
    };

    // Render a row cell with appropriate formatting
    const renderCell = (item, column) => {
        if (column.render) {
            return column.render(item);
        }

        const value = item[column.key];

        if (column.format) {
            return column.format(value, item);
        }

        if (value === null || value === undefined) {
            return '-';
        }

        return value;
    };

    // Render pagination controls
    const renderPagination = () => {
        if (!pagination) return null;

        const processedData = processData();
        const totalPages = Math.ceil(processedData.length / itemsPerPage);

        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxPageButtons = 5; // Show max 5 page buttons

        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        // Adjust if we're at the end
        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                            currentPage === 1
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50'
                        }`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                            currentPage === totalPages
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50'
                        }`}
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{processedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                            <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, processedData.length)}
              </span>{' '}
                            of <span className="font-medium">{processedData.length}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                                    currentPage === 1
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="sr-only">Previous</span>
                                <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {pageNumbers.map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        currentPage === number
                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {number}
                                </button>
                            ))}

                            <button
                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                                    currentPage === totalPages
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="sr-only">Next</span>
                                <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    // Render actions for a row
    const renderActions = (item) => {
        if (!actions || actions.length === 0) return null;

        return (
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                    {actions.map((action, index) => {
                        // Skip if the action has a condition and it's not met
                        if (action.condition && !action.condition(item)) {
                            return null;
                        }

                        // Render link or button
                        if (action.to) {
                            return (
                                <Link
                                    key={index}
                                    to={typeof action.to === 'function' ? action.to(item) : action.to}
                                    className={action.className || 'text-indigo-600 hover:text-indigo-900'}
                                >
                                    {action.label}
                                </Link>
                            );
                        } else {
                            return (
                                <button
                                    key={index}
                                    onClick={() => action.onClick(item)}
                                    className={action.className || 'text-indigo-600 hover:text-indigo-900'}
                                >
                                    {action.label}
                                </button>
                            );
                        }
                    })}
                </div>
            </td>
        );
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        {loading ? (
                            <div className="bg-white p-8 flex justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        {renderHeaders()}
                                        {actions && actions.length > 0 && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {getCurrentItems().length > 0 ? (
                                        getCurrentItems().map((item, rowIndex) => (
                                            <tr
                                                key={item.id || rowIndex}
                                                className={
                                                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                                                }
                                                onClick={() => onRowClick && onRowClick(item)}
                                            >
                                                {columns.map((column) => (
                                                    <td
                                                        key={`${item.id || rowIndex}-${column.key}`}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                    >
                                                        {renderCell(item, column)}
                                                    </td>
                                                ))}
                                                {actions && actions.length > 0 && renderActions(item)}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                                                className="px-6 py-4 text-center text-sm text-gray-500"
                                            >
                                                {emptyMessage}
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                                {renderPagination()}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DataTable;