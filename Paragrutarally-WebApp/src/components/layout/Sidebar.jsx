// src/components/layout/Sidebar.jsx - Updated with Kids and Teams Management
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ userRole }) => {
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
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
                            {t('nav.dashboard', 'Dashboard')}
                        </NavLink>
                        <NavLink
                            to="/admin/events"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.eventManagement', 'Event Management')}
                        </NavLink>
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.userManagement', 'User Management')}
                        </NavLink>
                        <NavLink
                            to="/admin/kids"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.kidsManagement', 'Kids Management')}
                        </NavLink>
                        <NavLink
                            to="/admin/teams"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.teamsManagement', 'Teams Management')}
                        </NavLink>
                        <NavLink
                            to="/admin/forms"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.forms', 'Forms')}
                        </NavLink>
                        <NavLink
                            to="/admin/backup"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.backupSync', 'Backup/Sync')}
                        </NavLink>
                        <NavLink
                            to="/admin/import-export"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.importExport', 'Import/Export Data')}
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.gallery', 'Gallery')}
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
                            {t('nav.dashboard', 'Dashboard')}
                        </NavLink>
                        <NavLink
                            to="/instructor/events"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.events', 'Events')}
                        </NavLink>
                        <NavLink
                            to="/instructor/teams"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.teams', 'Teams')}
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.gallery', 'Gallery')}
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
                            {t('nav.dashboard', 'Dashboard')}
                        </NavLink>
                        <NavLink
                            to="/host/events"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.events', 'Events')}
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {t('nav.gallery', 'Gallery')}
                        </NavLink>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;