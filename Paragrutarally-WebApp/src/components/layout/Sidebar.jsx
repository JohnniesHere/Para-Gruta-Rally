// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ userRole }) => {
    // Define navigation links based on user role
    const getNavLinks = () => {
        switch (userRole) {
            case 'admin':
                return (
                    <>
                        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
                        <NavLink to="/admin/events" className={({ isActive }) => isActive ? 'active' : ''}>Event Management</NavLink>
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>User Management</NavLink>
                        <NavLink to="/admin/forms" className={({ isActive }) => isActive ? 'active' : ''}>Forms</NavLink>
                        <NavLink to="/admin/backup" className={({ isActive }) => isActive ? 'active' : ''}>Backup/Sync</NavLink>
                        <NavLink to="/admin/import-export" className={({ isActive }) => isActive ? 'active' : ''}>Import/Export Data</NavLink>
                        <NavLink to="/gallery" className={({ isActive }) => isActive ? 'active' : ''}>Gallery</NavLink>
                    </>
                );
            case 'instructor':
                return (
                    <>
                        <NavLink to="/instructor/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
                        <NavLink to="/instructor/events" className={({ isActive }) => isActive ? 'active' : ''}>View Events</NavLink>
                        <NavLink to="/instructor/teams" className={({ isActive }) => isActive ? 'active' : ''}>My Teams</NavLink>
                        <NavLink to="/gallery" className={({ isActive }) => isActive ? 'active' : ''}>Gallery</NavLink>
                    </>
                );
            case 'host':
                return (
                    <>
                        <NavLink to="/host/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
                        <NavLink to="/host/events" className={({ isActive }) => isActive ? 'active' : ''}>View Events</NavLink>
                        <NavLink to="/gallery" className={({ isActive }) => isActive ? 'active' : ''}>Gallery</NavLink>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-links">
                {getNavLinks()}
            </div>
        </div>
    );
};

export default Sidebar;