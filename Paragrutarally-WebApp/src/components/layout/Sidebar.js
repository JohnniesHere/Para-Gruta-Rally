// src/components/layout/Sidebar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Sidebar({ mobile = false, closeSidebar = () => {} }) {
    const { isAdmin, isStaff } = useAuth();

    // Navigation items based on user role
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: 'home', visible: true },
        { name: 'Kids Management', path: '/kids', icon: 'users', visible: isStaff },
        { name: 'Teams', path: '/teams', icon: 'users-group', visible: isStaff },
        { name: 'Data Management', path: '/data/import', icon: 'database', visible: isStaff },
        { name: 'Forms', path: '/forms', icon: 'document-text', visible: isStaff },
        { name: 'User Management', path: '/users', icon: 'user', visible: isAdmin },
        { name: 'Advanced Search', path: '/search', icon: 'search', visible: true },
    ];

    const handleNavClick = () => {
        if (mobile) {
            closeSidebar();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Logo and brand */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
                <span className="text-white text-lg font-semibold">Charity Manager</span>
            </div>

            {/* Navigation */}
            <div className="mt-5 flex-1 flex flex-col overflow-y-auto">
                <nav className="flex-1 px-2 space-y-1">
                    {navItems
                        .filter(item => item.visible)
                        .map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                        isActive
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                {/* Icon based on item.icon */}
                                {item.icon === 'home' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                        />
                                    </svg>
                                )}
                                {item.icon === 'users' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                        />
                                    </svg>
                                )}
                                {item.icon === 'users-group' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
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
                                )}
                                {item.icon === 'database' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                        />
                                    </svg>
                                )}
                                {item.icon === 'document-text' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                )}
                                {item.icon === 'user' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                )}
                                {item.icon === 'search' && (
                                    <svg
                                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                )}
                                {item.name}
                            </NavLink>
                        ))}
                </nav>
            </div>
        </div>
    );
}

export default Sidebar;