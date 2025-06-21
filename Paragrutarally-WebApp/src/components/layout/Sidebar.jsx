// src/components/layout/Sidebar.jsx - Beautiful Tabler Icons with Vehicles Added + Translations
import React from 'react';
import {NavLink} from 'react-router-dom';
import {
    IconDashboard as Dashboard,
    IconCalendar as Calendar,
    IconUsers as Users,
    IconUserCircle as Baby,
    IconUsersGroup as UserGroup,
    IconCar as Car,
    IconFileText as FileText,
    IconRefresh as RefreshCw,
    IconDownload as Download,
    IconPhoto as Photo,
    IconChartBar as Analytics
} from '@tabler/icons-react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Sidebar.css';

const Sidebar = ({userRole}) => {
    const { t } = useLanguage();

    return (
        <div className="sidebar">
            <div className="sidebar-links">
                {/* Admin Links */}
                {userRole === 'admin' && (
                    <>
                        <NavLink
                            to="/admin/dashboard"
                            className={({isActive}) => isActive ? 'active' : ''}
                            end
                        >
                            <Dashboard className="sidebar-icon" size={20}/>
                            {t('nav.dashboard', 'Dashboard')}
                        </NavLink>
                        <NavLink
                            to="/admin/events"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Calendar className="sidebar-icon" size={20}/>
                            {t('nav.events', 'Events')}
                        </NavLink>
                        <NavLink
                            to="/admin/users"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Users className="sidebar-icon" size={20}/>
                            {t('nav.users', 'Users')}
                        </NavLink>
                        <NavLink
                            to="/admin/kids"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Baby className="sidebar-icon" size={20}/>
                            {t('nav.kids', 'Kids')}
                        </NavLink>
                        <NavLink
                            to="/admin/teams"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <UserGroup className="sidebar-icon" size={20}/>
                            {t('nav.teams', 'Teams')}
                        </NavLink>
                        <NavLink
                            to="/admin/vehicles"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Car className="sidebar-icon" size={20}/>
                            {t('nav.vehicles', 'Vehicles')}
                        </NavLink>
                        <NavLink
                            to="/admin/forms"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <FileText className="sidebar-icon" size={20}/>
                            {t('nav.forms', 'Forms')}
                        </NavLink>
                        <NavLink
                            to="/admin/backup"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <RefreshCw className="sidebar-icon" size={20}/>
                            {t('nav.backupSync', 'Backup/Sync')}
                        </NavLink>
                        <NavLink
                            to="/admin/import-export"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Download className="sidebar-icon" size={20}/>
                            {t('nav.importExport', 'Import/Export')}
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Photo className="sidebar-icon" size={20}/>
                            {t('nav.gallery', 'Gallery')}
                        </NavLink>
                        {userRole === 'admin' && (
                            <li>
                                <NavLink
                                    to="/admin/analytics"
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <Analytics size={20} />
                                    <span>{t('nav.analytics','Analytics')}</span>
                                </NavLink>
                            </li>
                        )}
                    </>
                )}

                {/* Instructor Links */}
                {userRole === 'instructor' && (
                    <>
                        <NavLink
                            to="/instructor/dashboard"
                            className={({isActive}) => isActive ? 'active' : ''}
                            end
                        >
                            <Dashboard className="sidebar-icon" size={20}/>
                            {t('nav.dashboard', 'Dashboard')}
                        </NavLink>
                        <NavLink
                            to="/instructor/events"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Calendar className="sidebar-icon" size={20}/>
                            {t('nav.events', 'Events')}
                        </NavLink>
                        <NavLink
                            to="/instructor/teams"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <UserGroup className="sidebar-icon" size={20}/>
                            {t('nav.teams', 'Teams')}
                        </NavLink>
                        <NavLink
                            to="/admin/vehicles"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Car className="sidebar-icon" size={20}/>
                            {t('nav.vehicles', 'Vehicles')}
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Photo className="sidebar-icon" size={20}/>
                            {t('nav.gallery', 'Gallery')}
                        </NavLink>
                    </>
                )}

                {/* Host Links */}
                {userRole === 'host' && (
                    <>
                        <NavLink
                            to="/host/dashboard"
                            className={({isActive}) => isActive ? 'active' : ''}
                            end
                        >
                            <Dashboard className="sidebar-icon" size={20}/>
                            {t('nav.dashboard', 'Dashboard')}
                        </NavLink>
                        <NavLink
                            to="/host/events"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Calendar className="sidebar-icon" size={20}/>
                            {t('nav.events', 'Events')}
                        </NavLink>
                        <NavLink
                            to="/gallery"
                            className={({isActive}) => isActive ? 'active' : ''}
                        >
                            <Photo className="sidebar-icon" size={20}/>
                            {t('nav.gallery', 'Gallery')}
                        </NavLink>
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;