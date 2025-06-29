// src/pages/admin/ExportPage.jsx - Clean Export-Only Page
import React, { useState } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ExportUsersModal from '../../components/modals/ExportUsersModal';
import ExportKidsModal from '../../components/modals/ExportKidsModal';
import ExportEventsModal from '../../components/modals/ExportEventsModal';
import ExportTeamsModal from '../../components/modals/ExportTeamsModal';
import {
    IconUsers as Users,
    IconUserCheck as Kids,
    IconCalendarEvent as Events,
    IconUsersGroup as Teams,
    IconDownload as Download
} from '@tabler/icons-react';
import './ExportPage.css';

const ExportPage = () => {
    const { isDarkMode, appliedTheme } = useTheme();
    const { t } = useLanguage();

    // Modal states
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showKidsModal, setShowKidsModal] = useState(false);
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [showTeamsModal, setShowTeamsModal] = useState(false);

    const exportCards = [
        {
            id: 'users',
            title: t('import.users', 'Users'),
            description: t('export.usersDescription', 'Export user accounts, roles, and contact information'),
            icon: Users,
            color: 'users',
            onClick: () => setShowUsersModal(true)
        },
        {
            id: 'kids',
            title: t('import.kids', 'Kids'),
            description: t('export.kidsDescription', 'Export kids profiles, parent info, and team assignments'),
            icon: Kids,
            color: 'kids',
            onClick: () => setShowKidsModal(true)
        },
        {
            id: 'events',
            title: t('import.events', 'Events'),
            description: t('export.eventsDescription', 'Export events, schedules, and participant data'),
            icon: Events,
            color: 'events',
            onClick: () => setShowEventsModal(true)
        },
        {
            id: 'teams',
            title: t('import.teams', 'Teams'),
            description: t('export.teamsDescription', 'Export team information, members, and instructors'),
            icon: Teams,
            color: 'teams',
            onClick: () => setShowTeamsModal(true)
        }
    ];

    return (
        <Dashboard requiredRole="admin">
            <div className={`export-page ${appliedTheme}-mode`}>
                {/* Page Header */}
                <h1 className="page-title">
                    <Download className="page-title-icon" size={40} />
                    {t('export.title', 'Export Data')}
                </h1>
                <br/>
                <br/>

                {/* Export Cards Grid */}
                <div className="export-cards-grid">
                    {exportCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <div
                                key={card.id}
                                className={`export-card ${card.color}`}
                                onClick={card.onClick}
                            >
                                <div className="export-card-header">
                                    <div className="export-card-icon">
                                        <IconComponent size={32} />
                                    </div>
                                    <div className="export-card-download">
                                        <Download size={20} />
                                    </div>
                                </div>
                                <div className="export-card-content">
                                    <h3 className="export-card-title">{card.title}</h3>
                                    <p className="export-card-description">{card.description}</p>
                                </div>
                                <div className="export-card-footer">
                                    <span className="export-card-action">
                                        {t('export.clickToExport', 'Click to Export')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Export Information */}
                <div className="export-info-section">
                    <div className="export-info-card">
                        <h3>{t('export.exportInfo', 'Export Information')}</h3>
                        <ul>
                            <li>{t('export.csvFormat', 'All exports are in CSV format for easy import into Excel or other tools')}</li>
                            <li>{t('export.filterOptions', 'Use filter options in each export to customize your data')}</li>
                            <li>{t('export.timestampInfo', 'Timestamps can be included for data tracking purposes')}</li>
                            <li>{t('export.permissionInfo', 'Export permissions are based on your role and access level')}</li>
                        </ul>
                    </div>
                </div>

                {/* Export Modals */}
                <ExportUsersModal
                    isOpen={showUsersModal}
                    onClose={() => setShowUsersModal(false)}
                />
                <ExportKidsModal
                    isOpen={showKidsModal}
                    onClose={() => setShowKidsModal(false)}
                />
                <ExportEventsModal
                    isOpen={showEventsModal}
                    onClose={() => setShowEventsModal(false)}
                />
                <ExportTeamsModal
                    isOpen={showTeamsModal}
                    onClose={() => setShowTeamsModal(false)}
                />
            </div>
        </Dashboard>
    );
};

export default ExportPage;