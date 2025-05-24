// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import './Sidebar.css';

const Sidebar = ({ userRole }) => {
    const { isDarkMode } = useTheme();
    const location = useLocation();

    return (
        <div className={`sidebar ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="sidebar-links">
                {/* Admin Links */}
                {userRole === 'admin' && (
                    <>
                        <NavLink
                            to="/admin/dashboard"
                            className={({ isActive }) => isActive ? 'active' : ''}
                            end
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/admin/events"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Event Management
                        </NavLink>
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            User Management
                        </NavLink>
                        <NavLink
                            to="/admin/forms"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Forms
                        </NavLink>
                        <NavLink
                            to="/admin/backup"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Backup/Sync
                        </NavLink>
                        <NavLink
                            to="/admin/import-export"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Import/Export Data
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Gallery
                        </NavLink>
                    </>
                )}

                {/* Instructor Links */}
                {userRole === 'instructor' && (
                    <>
                        <NavLink
                            to="/instructor/dashboard"
                            className={({ isActive }) => isActive ? 'active' : ''}
                            end
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/instructor/events"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Events
                        </NavLink>
                        <NavLink
                            to="/instructor/teams"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Teams
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Gallery
                        </NavLink>
                    </>
                )}

                {/* Host Links */}
                {userRole === 'host' && (
                    <>
                        <NavLink
                            to="/host/dashboard"
                            className={({ isActive }) => isActive ? 'active' : ''}
                            end
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/host/events"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Events
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            Gallery
                        </NavLink>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;