// src/pages/instructor/InstructorKidsManagementPage.jsx - FIXED instructor ID and translations
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import {
    IconUsers as Users,
    IconEye as Eye,
    IconEdit as Edit,
    IconSearch as Search,
    IconFilter as Filter,
    IconUsersGroup as Team,
    IconUser as User
} from '@tabler/icons-react';

const InstructorKidsManagementPage = () => {
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();

    const [kids, setKids] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [teamFilter, setTeamFilter] = useState('');

    // Load instructor's kids and teams
    useEffect(() => {
        const loadInstructorData = async () => {
            // FIXED: Use same logic as InstructorEventsPage
            const instructorId = user?.uid || userData?.id;

            if (!instructorId || userRole !== 'instructor') {
                console.log('Access check failed:', { instructorId, userRole, userData, user });
                setError(t('instructor.accessDenied', 'Access denied: Instructor credentials required'));
                setLoading(false);
                return;
            }

            try {
                setError('');
                console.log('Loading kids for instructor:', instructorId);

                // FIXED: Use instructorIds array for teams (same as Events page)
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorIds', 'array-contains', instructorId)
                );

                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort in memory instead
                teamsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                console.log('Found teams for instructor:', teamsData.length, teamsData);

                // Load kids from instructor's teams
                let kidsData = [];
                if (teamsData.length > 0) {
                    const teamIds = teamsData.map(team => team.id);

                    // FIXED: Remove orderBy to avoid index requirement
                    const kidsQuery = query(
                        collection(db, 'kids'),
                        where('teamId', 'in', teamIds)
                    );

                    const kidsSnapshot = await getDocs(kidsQuery);
                    kidsData = kidsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Sort in memory instead
                    kidsData.sort((a, b) => {
                        const aLastName = a.personalInfo?.lastName || '';
                        const bLastName = b.personalInfo?.lastName || '';
                        return aLastName.localeCompare(bLastName);
                    });
                }

                console.log('Found kids for instructor:', kidsData.length);

                setKids(kidsData);
                setTeams(teamsData);
            } catch (err) {
                console.error('Error loading instructor data:', err);
                setError(t('instructor.failedToLoad', 'Failed to load data. Please try again.'));
            } finally {
                setLoading(false);
            }
        };

        loadInstructorData();
    }, [userData, userRole, user, t]);

    // Filter kids based on search and team filter
    const filteredKids = useMemo(() => {
        return kids.filter(kid => {
            // Check if instructor can view this kid
            if (!permissions.canViewKid(kid, userData, user)) {
                return false;
            }

            const matchesSearch = searchTerm === '' ||
                kid.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kid.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kid.participantNumber?.toString().includes(searchTerm);

            const matchesTeam = teamFilter === '' || kid.teamId === teamFilter;

            return matchesSearch && matchesTeam;
        });
    }, [kids, searchTerm, teamFilter, permissions, userData, user]);

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : t('common.unassigned', 'Unassigned');
    };

    // Check if instructor can edit this kid
    const canEditKid = (kid) => {
        return permissions.canEditKid(kid, userData, user);
    };

    // Helper function to safely display field data based on permissions
    const getFieldValue = (kid, fieldPath, defaultValue = '-') => {
        const context = { kidData: kid, userData, user };

        if (!permissions.canViewField(fieldPath, context)) {
            return '***'; // Hidden field indicator
        }

        // Navigate nested object path
        const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], kid);
        return value || defaultValue;
    };

    // Get translated status
    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return t('common.completed', 'Completed');
            case 'pending':
                return t('common.pending', 'Pending');
            case 'ready':
                return t('common.ready', 'Ready');
            default:
                return t('common.pending', 'Pending');
        }
    };

    if (loading) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading', 'Loading...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard userRole={userRole}>
                <div className="admin-page">
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard userRole={userRole}>
            <div className="admin-page">
                <h1>
                    <Users className="page-title-icon" size={48} />
                    {t('nav.kids', 'Kids')}
                </h1>

                <div className="admin-container">
                    {/* Racing Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <Users size={40} />
                                    {t('nav.kids', 'Kids Management')}
                                </h1>
                                <p className="subtitle">
                                    {t('instructor.manageAssignedKids', 'Manage kids assigned to your teams')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <Users size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.totalKids', 'Total Kids')}</h3>
                                <div className="stat-value">{filteredKids.length}</div>
                                <div className="stat-subtitle">{t('stats.assignedToYou', 'Assigned to You')}</div>
                            </div>
                        </div>

                        <div className="stat-card teams">
                            <div className="stat-icon">
                                <Team size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.myTeams', 'My Teams')}</h3>
                                <div className="stat-value">{teams.length}</div>
                                <div className="stat-subtitle">{t('stats.activeTeams', 'Active Teams')}</div>
                            </div>
                        </div>

                        <div className="stat-card avg-kids">
                            <div className="stat-icon">
                                <User size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.avgPerTeam', 'Avg per Team')}</h3>
                                <div className="stat-value">
                                    {teams.length > 0 ? Math.round(filteredKids.length / teams.length) : 0}
                                </div>
                                <div className="stat-subtitle">{t('stats.kidsPerTeam', 'Kids per Team')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="search-filter-section">
                        <div className="search-container">
                            <label className="search-label">
                                <Search size={16} />
                                {t('common.search', 'Search')}
                            </label>
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder={t('kids.searchPlaceholder', 'Search by name or participant number...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        className="clear-search"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Filter size={16} />
                                {t('common.filterByTeam', 'Filter by Team')}
                            </label>
                            <select
                                className="filter-select"
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                            >
                                <option value="">{t('common.allTeams', 'All Teams')}</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Results Summary */}
                    {(searchTerm || teamFilter) && (
                        <div className="results-summary">
                            <span>{t('common.showing', 'Showing')} {filteredKids.length} {t('common.results', 'results')}</span>
                            {searchTerm && <span className="search-applied">for "{searchTerm}"</span>}
                            {teamFilter && <span className="filter-applied">in team "{getTeamName(teamFilter)}"</span>}
                        </div>
                    )}

                    {/* Kids Table */}
                    <div className="table-container">
                        {filteredKids.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Users size={80} />
                                </div>
                                <h3>{t('kids.noKidsFound', 'No Kids Found')}</h3>
                                <p>
                                    {searchTerm || teamFilter
                                        ? t('kids.noKidsMatchFilter', 'No kids match your current filter')
                                        : t('instructor.noAssignedKids', 'You have no kids assigned to your teams yet')
                                    }
                                </p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>{t('common.participantNumber', 'Participant #')}</th>
                                    <th>{t('common.name', 'Name')}</th>
                                    <th>{t('common.team', 'Team')}</th>
                                    <th>{t('common.parentContact', 'Parent Contact')}</th>
                                    <th>{t('common.capabilities', 'Capabilities')}</th>
                                    <th>{t('common.status', 'Status')}</th>
                                    <th>{t('common.actions', 'Actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredKids.map(kid => (
                                    <tr key={kid.id}>
                                        <td>
                                            <strong>{getFieldValue(kid, 'participantNumber')}</strong>
                                        </td>
                                        <td>
                                            <div className="kid-name">
                                                {getFieldValue(kid, 'personalInfo.firstName')} {getFieldValue(kid, 'personalInfo.lastName')}
                                            </div>
                                        </td>
                                        <td>
                                                <span className="badge secondary">
                                                    {getTeamName(kid.teamId)}
                                                </span>
                                        </td>
                                        <td>
                                            <div>
                                                <div><strong>{getFieldValue(kid, 'parentInfo.name')}</strong></div>
                                                <div className="phone-number">{getFieldValue(kid, 'parentInfo.phone')}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="capabilities">
                                                {getFieldValue(kid, 'personalInfo.capabilities', t('common.none', 'None'))}
                                            </div>
                                        </td>
                                        <td>
                                                <span className={`status-badge ${kid.signedFormStatus === 'completed' ? 'ready' : 'pending'}`}>
                                                    {getStatusLabel(getFieldValue(kid, 'signedFormStatus', 'pending'))}
                                                </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/instructor/kids/view/${kid.id}`}
                                                    className="btn-action view"
                                                    title={t('common.view', 'View')}
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                {canEditKid(kid) && (
                                                    <Link
                                                        to={`/instructor/kids/edit/${kid.id}`}
                                                        className="btn-action edit"
                                                        title={t('common.edit', 'Edit')}
                                                    >
                                                        <Edit size={14} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorKidsManagementPage;