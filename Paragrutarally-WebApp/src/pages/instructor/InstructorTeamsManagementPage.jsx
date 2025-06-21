// src/pages/instructor/InstructorTeamsManagementPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import {
    IconUsersGroup as Team,
    IconEye as Eye,
    IconEdit as Edit,
    IconSearch as Search,
    IconUsers as Users,
    IconCar as Car,
    IconCalendar as Calendar,
    IconUser as User
} from '@tabler/icons-react';

const InstructorTeamsManagementPage = () => {
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();

    const [teams, setTeams] = useState([]);
    const [kids, setKids] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Load instructor's teams and related data
    useEffect(() => {
        const loadInstructorTeams = async () => {
            if (!userData?.instructorId || userRole !== 'instructor') {
                setError('Access denied: Instructor credentials required');
                setLoading(false);
                return;
            }

            try {
                setError('');

                // Load teams for this instructor
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorId', '==', userData.instructorId),
                    orderBy('name', 'asc')
                );

                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Load kids for these teams
                const kidsQuery = query(
                    collection(db, 'kids'),
                    where('instructorId', '==', userData.instructorId),
                    orderBy('personalInfo.lastName', 'asc')
                );

                const kidsSnapshot = await getDocs(kidsQuery);
                const kidsData = kidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Load events that include these teams
                const eventsQuery = query(
                    collection(db, 'events'),
                    orderBy('eventDate', 'desc')
                );

                const eventsSnapshot = await getDocs(eventsQuery);
                const eventsData = eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).filter(event =>
                    teamsData.some(team => event.participatingTeams?.includes(team.id))
                );

                setTeams(teamsData);
                setKids(kidsData);
                setEvents(eventsData);
            } catch (err) {
                console.error('Error loading instructor teams:', err);
                setError('Failed to load teams data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadInstructorTeams();
    }, [userData, userRole]);

    // Filter teams based on search
    const filteredTeams = useMemo(() => {
        return teams.filter(team => {
            const matchesSearch = searchTerm === '' ||
                team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                team.description?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [teams, searchTerm]);

    // Get kids count for a team
    const getTeamKidsCount = (teamId) => {
        return kids.filter(kid => kid.teamId === teamId).length;
    };

    // Get active events for a team
    const getTeamActiveEvents = (teamId) => {
        return events.filter(event =>
            event.participatingTeams?.includes(teamId) &&
            new Date(event.eventDate) >= new Date()
        ).length;
    };

    // Check if instructor can edit this team
    const canEditTeam = (team) => {
        return permissions.canEditKid(team, userData, user); // Using canEditKid logic for consistency
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
                    <Team className="page-title-icon" size={48} />
                    {t('instructor.myTeams', 'My Teams')}
                </h1>

                <div className="admin-container">
                    {/* Racing Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <Team size={40} />
                                    {t('instructor.teamsManagement', 'Teams Management')}
                                </h1>
                                <p className="subtitle">
                                    {t('instructor.manageYourTeams', 'Manage and monitor your assigned teams')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <Team size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.totalTeams', 'Total Teams')}</h3>
                                <div className="stat-value">{teams.length}</div>
                                <div className="stat-subtitle">{t('stats.underManagement', 'Under Management')}</div>
                            </div>
                        </div>

                        <div className="stat-card kids">
                            <div className="stat-icon">
                                <Users size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.totalMembers', 'Total Members')}</h3>
                                <div className="stat-value">{kids.length}</div>
                                <div className="stat-subtitle">{t('stats.acrossAllTeams', 'Across All Teams')}</div>
                            </div>
                        </div>

                        <div className="stat-card instructors">
                            <div className="stat-icon">
                                <Calendar size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.activeEvents', 'Active Events')}</h3>
                                <div className="stat-value">{events.length}</div>
                                <div className="stat-subtitle">{t('stats.involving YourTeams', 'Involving Your Teams')}</div>
                            </div>
                        </div>

                        <div className="stat-card avg-kids">
                            <div className="stat-icon">
                                <User size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.avgTeamSize', 'Avg Team Size')}</h3>
                                <div className="stat-value">
                                    {teams.length > 0 ? Math.round(kids.length / teams.length) : 0}
                                </div>
                                <div className="stat-subtitle">{t('stats.membersPerTeam', 'Members per Team')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search Section */}
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
                                    placeholder={t('instructor.searchTeamsPlaceholder', 'Search teams by name or description...')}
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
                    </div>

                    {/* Results Summary */}
                    {searchTerm && (
                        <div className="results-summary">
                            <span>{t('common.showing', 'Showing')} {filteredTeams.length} {t('common.results', 'results')}</span>
                            <span className="search-applied">for "{searchTerm}"</span>
                        </div>
                    )}

                    {/* Teams Display */}
                    {filteredTeams.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Team size={80} />
                            </div>
                            <h3>{t('instructor.noTeamsFound', 'No Teams Found')}</h3>
                            <p>
                                {searchTerm
                                    ? t('instructor.noTeamsMatchSearch', 'No teams match your search criteria')
                                    : t('instructor.noAssignedTeams', 'You have no teams assigned yet')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                            {filteredTeams.map(team => (
                                <div key={team.id} className="card team-card" style={{ padding: '25px' }}>
                                    <div className="card-header">
                                        <Team className="card-icon" size={24} />
                                        <h3 className="card-title">{team.name}</h3>
                                        <span className={`status-badge ${team.status || 'active'}`}>
                                            {team.status || 'active'}
                                        </span>
                                    </div>

                                    <div className="card-body">
                                        <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                                            {team.description || t('common.noDescription', 'No description available')}
                                        </p>

                                        <div className="team-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                            <div className="stat-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                    <Users size={16} style={{ color: 'var(--success-color)' }} />
                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                        {t('common.members', 'Members')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success-color)' }}>
                                                    {getTeamKidsCount(team.id)}
                                                </div>
                                            </div>

                                            <div className="stat-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                    <Calendar size={16} style={{ color: 'var(--info-color)' }} />
                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                        {t('common.events', 'Events')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--info-color)' }}>
                                                    {getTeamActiveEvents(team.id)}
                                                </div>
                                            </div>
                                        </div>

                                        {team.maxMembers && (
                                            <div className="capacity-info" style={{ marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                                        {t('common.capacity', 'Capacity')}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {getTeamKidsCount(team.id)}/{team.maxMembers}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    width: '100%',
                                                    height: '6px',
                                                    backgroundColor: 'var(--border-color)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${Math.min((getTeamKidsCount(team.id) / team.maxMembers) * 100, 100)}%`,
                                                        height: '100%',
                                                        backgroundColor: getTeamKidsCount(team.id) >= team.maxMembers ? 'var(--error-color)' : 'var(--success-color)',
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer">
                                        <Link
                                            to={`/instructor/teams/view/${team.id}`}
                                            className="btn btn-info btn-sm"
                                        >
                                            <Eye size={14} />
                                            {t('common.view', 'View')}
                                        </Link>
                                        {canEditTeam(team) && (
                                            <Link
                                                to={`/instructor/teams/edit/${team.id}`}
                                                className="btn btn-success btn-sm"
                                            >
                                                <Edit size={14} />
                                                {t('common.edit', 'Edit')}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorTeamsManagementPage;