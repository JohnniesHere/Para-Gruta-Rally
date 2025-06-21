// src/pages/admin/TeamsManagementPage.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getAllTeams, deleteTeam, getAllInstructors } from '../../services/teamService';
import { getAllKids } from '../../services/kidService';
import {
    IconUsers as Team,
    IconPlus as Plus,
    IconRefresh as RefreshCw,
    IconDownload as Download,
    IconUsers as Users,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconCar as Car,
    IconSearch as Search,
    IconTag as Tag,
    IconChartBar as BarChart3,
    IconEraser as Eraser,
    IconFile as FileSpreadsheet,
    IconX as X,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconClock as Clock,
    IconCircleX as XCircle,
    IconUserPlus as UserPlus
} from '@tabler/icons-react';
import './TeamsManagementPage.css';

const TeamsManagementPage = () => {
    const navigate = useNavigate();
    const { appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { permissions, userRole, loading: permissionsLoading, error: permissionsError } = usePermissions();

    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [capacityFilter, setCapacityFilter] = useState('all');
    const [showingTeamsWithoutKids, setShowingTeamsWithoutKids] = useState(false);

    // Reference data for lookups
    const [instructorsMap, setInstructorsMap] = useState(new Map());
    const [kidsMap, setKidsMap] = useState(new Map());

    // Load teams
    useEffect(() => {
        if (!permissionsLoading && permissions) {
            loadTeams();
        }
    }, [permissionsLoading, permissions]);

    // Filter teams when search term or filters change
    useEffect(() => {
        filterTeams();
    }, [teams, searchTerm, statusFilter, capacityFilter]);

    const loadTeams = async () => {
        if (!permissions) return;

        console.log(`🔄 Loading teams for ${userRole}`);
        setIsLoading(true);
        setError(null);

        try {
            // Load all required data in parallel
            const [teamsData, instructorsData, kidsData] = await Promise.all([
                getAllTeams(),
                getAllInstructors(),
                getAllKids()
            ]);

            console.log(`✅ Loaded ${teamsData.length} teams, ${instructorsData.length} instructors, ${kidsData.length} kids`);

            // Create lookup maps for efficient data processing
            const instructorsLookup = new Map();
            instructorsData.forEach(instructor => {
                instructorsLookup.set(instructor.id, instructor);
            });
            setInstructorsMap(instructorsLookup);

            const kidsLookup = new Map();
            kidsData.forEach(kid => {
                kidsLookup.set(kid.id, kid);
            });
            setKidsMap(kidsLookup);

            // Transform teams data for display with proper lookups
            const processedTeams = teamsData.map(team => {
                console.log('Processing team:', team.name, team);

                // Get instructor information
                let instructorName = t('teams.noInstructor', 'No Instructor');
                let instructorId = null;

                if (team.instructorIds && team.instructorIds.length > 0) {
                    // Get the first instructor (or team leader if specified)
                    const primaryInstructorId = team.teamLeaderId || team.instructorIds[0];
                    const instructor = instructorsLookup.get(primaryInstructorId);

                    if (instructor) {
                        instructorName = instructor.displayName || instructor.name || instructor.email || t('teams.unknownInstructor', 'Unknown Instructor');
                        instructorId = instructor.id;
                    }
                }

                // Count current members from kidIds
                const currentMembers = team.kidIds ? team.kidIds.length : 0;

                // Determine max capacity
                const maxMembers = team.maxCapacity || 15;

                return {
                    id: team.id,
                    name: team.name || t('teams.unnamedTeam', 'Unnamed Team'),
                    instructorName: instructorName,
                    instructorId: instructorId,
                    currentMembers: currentMembers,
                    maxMembers: maxMembers,
                    status: team.active !== false ? 'active' : 'inactive',
                    description: team.description || '',
                    createdAt: team.createdAt,
                    originalData: team
                };
            });

            console.log('Processed teams:', processedTeams);
            setTeams(processedTeams);
        } catch (err) {
            console.error('💥 Error loading teams:', err);
            setError(t('teams.loadError', 'Failed to load teams') + `: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filterTeams = () => {
        let filtered = teams.filter(team => {
            const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                team.instructorName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || team.status === statusFilter;

            const matchesCapacity = capacityFilter === 'all' ||
                (capacityFilter === 'full' && team.currentMembers >= team.maxMembers) ||
                (capacityFilter === 'available' && team.currentMembers < team.maxMembers) ||
                (capacityFilter === 'empty' && team.currentMembers === 0);

            return matchesSearch && matchesStatus && matchesCapacity;
        });
        setFilteredTeams(filtered);
    };

    // Handle stat card clicks to filter teams
    const handleStatCardClick = (filterType) => {
        switch (filterType) {
            case 'total':
                setStatusFilter('all');
                setCapacityFilter('all');
                setShowingTeamsWithoutKids(false);
                break;
            case 'active':
                setStatusFilter('active');
                setCapacityFilter('all');
                setShowingTeamsWithoutKids(false);
                break;
            case 'without-kids':
                setStatusFilter('all');
                setCapacityFilter('empty');
                setShowingTeamsWithoutKids(true);
                break;
            case 'with-kids':
                setStatusFilter('all');
                setCapacityFilter('available');
                setShowingTeamsWithoutKids(false);
                break;
            default:
                break;
        }
        setSearchTerm('');
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCapacityFilter('all');
        setShowingTeamsWithoutKids(false);
    };

    const handleDeleteTeam = async (team) => {
        if (userRole !== 'admin') {
            alert(t('teams.onlyAdminsCanDelete', 'Only administrators can delete teams.'));
            return;
        }

        if (team.currentMembers > 0) {
            alert(t('teams.cannotDelete', 'Cannot delete {teamName} because it has {memberCount} members. Please move the kids to other teams first.', {
                teamName: team.name,
                memberCount: team.currentMembers
            }));
            return;
        }

        if (window.confirm(t('teams.deleteConfirm', 'Are you sure you want to delete {teamName}? This action cannot be undone.', { teamName: team.name }))) {
            try {
                await deleteTeam(team.id);
                setTeams(teams.filter(t => t.id !== team.id));
                alert(t('teams.deleteSuccess', '{teamName} has been deleted successfully!', { teamName: team.name }));
            } catch (err) {
                console.error('Error deleting team:', err);
                alert(t('teams.deleteFailed', 'Failed to delete team. Please try again.'));
            }
        }
    };

    const handleViewTeam = (team) => {
        navigate(`/admin/teams/view/${team.id}`);
    };

    const handleEditTeam = (team) => {
        navigate(`/admin/teams/edit/${team.id}`);
    };

    const handleAddTeam = () => {
        navigate('/admin/teams/add');
    };

    const stats = {
        totalTeams: teams.length,
        activeTeams: teams.filter(t => t.status === 'active').length,
        teamsWithoutKids: teams.filter(t => t.currentMembers === 0).length,
        teamsWithKids: teams.filter(t => t.currentMembers > 0).length
    };

    if (permissionsLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`teams-management-page ${appliedTheme}-mode`}>
                    <div className="loading-state">
                        <div className="loading-content">
                            <Clock className="loading-spinner" size={30} />
                            <p>{t('common.loadingPermissions', 'Loading permissions...')}</p>
                        </div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (permissionsError) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`teams-management-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('teams.permissionError', 'Permission Error')}</h3>
                        <p>{permissionsError}</p>
                        <button onClick={() => window.location.reload()} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            {t('teams.reloadPage', 'Reload Page')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`teams-management-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button onClick={loadTeams} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            {t('teams.tryAgain', 'Try Again')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`teams-management-page ${appliedTheme}-mode`}>
                <h1><Team size={32} className="page-title-icon" /> {t('teams.title', 'Teams Management')}</h1>

                <div className="teams-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        {userRole === 'admin' && (
                            <button className="btn-primary" onClick={handleAddTeam}>
                                <Plus className="btn-icon" size={18} />
                                {t('teams.addNewTeam', 'Add New Team')}
                            </button>
                        )}

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={loadTeams}>
                                <RefreshCw className="btn-icon" size={18} />
                                {t('teams.refresh', 'Refresh')}
                            </button>
                            {(userRole === 'admin' || userRole === 'instructor') && (
                                <button className="btn-export">
                                    <Download className="btn-icon" size={18} />
                                    {t('teams.exportTeams', 'Export Teams')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Clickable Stats Cards */}
                    <div className="stats-grid">
                        <div
                            className={`stat-card total ${statusFilter === 'all' && capacityFilter === 'all' && !showingTeamsWithoutKids ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('total')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('teams.totalTeams', 'Total Teams')}</h3>
                                <div className="stat-value">{stats.totalTeams}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card active ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('active')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Check className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('teams.activeTeams', 'Active Teams')}</h3>
                                <div className="stat-value">{stats.activeTeams}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card priority-warning clickable ${showingTeamsWithoutKids ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('without-kids')}
                            style={{ cursor: 'pointer' }}
                        >
                            <AlertTriangle className="stat-icon warning" size={45} />
                            <div className="stat-content">
                                <h3>{t('teams.teamsWithoutKids', 'Teams without Kids')}</h3>
                                <div className="stat-value">{stats.teamsWithoutKids}</div>
                                <div className="stat-subtitle">{t('common.clickToView', 'Click to view')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card with-teams ${capacityFilter === 'available' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('with-kids')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Car className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('teams.teamsWithKids', 'Teams with Kids')}</h3>
                                <div className="stat-value">{stats.teamsWithKids}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="search-filter-section">
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder={t('teams.searchPlaceholder', 'Search by team name or instructor...')}
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <BarChart3 className="filter-icon" size={16} />
                                {t('teams.status', 'Status')}
                            </label>
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">🌈 {t('teams.allStatus', 'All Status')}</option>
                                <option value="active">✅ {t('teams.active', 'Active')}</option>
                                <option value="inactive">❌ {t('teams.inactive', 'Inactive')}</option>
                            </select>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Tag className="filter-icon" size={16} />
                                {t('teams.capacity', 'Capacity')}
                            </label>
                            <select
                                className="filter-select"
                                value={capacityFilter}
                                onChange={(e) => setCapacityFilter(e.target.value)}
                            >
                                <option value="all">⭐ {t('teams.allTeams', 'All Teams')}</option>
                                <option value="empty">⚠️ {t('teams.emptyTeams', 'Empty Teams')}</option>
                                <option value="available">🟢 {t('teams.availableSpots', 'Available Spots')}</option>
                                <option value="full">🔴 {t('teams.fullTeams', 'Full Teams')}</option>
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            {t('teams.clearAll', 'Clear All')}
                        </button>
                    </div>

                    {/* Results Info with Reset Button */}
                    <div className="results-info">
                        <div className="results-content">
                            <FileSpreadsheet className="results-icon" size={18} />
                            {t('teams.showing', 'Showing')} {filteredTeams.length} {t('teams.of', 'of')} {teams.length} {t('teams.teams', 'teams')}
                            {showingTeamsWithoutKids && <span className="priority-filter"> • 🚨 {t('teams.priorityFilter', 'PRIORITY: Teams without kids')}</span>}
                            {statusFilter !== 'all' && <span className="filter-applied"> • {t('teams.status', 'Status')}: {statusFilter}</span>}
                            {capacityFilter !== 'all' && <span className="filter-applied"> • {t('teams.capacity', 'Capacity')}: {capacityFilter}</span>}
                            {searchTerm && <span className="search-applied"> • {t('general.search', 'Search')}: "{searchTerm}"</span>}
                        </div>

                        {(statusFilter !== 'all' || capacityFilter !== 'all' || searchTerm || showingTeamsWithoutKids) && (
                            <button className="btn-reset" onClick={handleClearFilters} title={t('teams.reset', 'Reset all filters')}>
                                <RefreshCw className="btn-icon" size={16} />
                                {t('teams.reset', 'Reset')}
                            </button>
                        )}
                    </div>

                    {/* Enhanced Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Team size={16} style={{ marginRight: '8px' }} />{t('teams.teamInfo', 'Team Info')}</th>
                                <th>👨‍🏫 {t('teams.instructor', 'Instructor')}</th>
                                <th>👥 {t('teams.members', 'Members')}</th>
                                <th><BarChart3 size={16} style={{ marginRight: '8px' }} />{t('teams.status', 'Status')}</th>
                                <th>⚡ {t('teams.actions', 'Actions')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="loading-cell">
                                        <div className="loading-content">
                                            <Clock className="loading-spinner" size={30} />
                                            {t('teams.loadingTeams', 'Loading teams...')}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTeams.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="empty-state">
                                            <Team className="empty-icon" size={60} />
                                            <h3>{t('teams.noTeamsFound', 'No teams found')}</h3>
                                            <p>{t('teams.adjustFilters', 'Try adjusting your search or filters')}</p>
                                            {userRole === 'admin' && (
                                                <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleAddTeam}>
                                                    <Plus className="btn-icon" size={18} />
                                                    {t('teams.addFirstTeam', 'Add First Team')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTeams.map(team => (
                                    <tr key={team.id} className={team.currentMembers === 0 ? 'priority-row' : ''}>
                                        <td>
                                            <div className="team-info">
                                                <div className="team-name">
                                                    {team.currentMembers === 0 && <AlertTriangle className="priority-indicator" size={16} />}
                                                    {team.name}
                                                </div>
                                                {team.description && (
                                                    <div className="team-description">{team.description}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="instructor-info">
                                                <span className={team.instructorName === t('teams.noInstructor', 'No Instructor') ? 'no-instructor' : 'has-instructor'}>
                                                    {team.instructorName === t('teams.noInstructor', 'No Instructor') ? (
                                                        <>
                                                            <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                                                            {t('teams.noInstructor', 'No Instructor')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus size={14} style={{ marginRight: '4px' }} />
                                                            {team.instructorName}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="members-info">
                                                <span className={`members-count ${team.currentMembers === 0 ? 'empty' : team.currentMembers >= team.maxMembers ? 'full' : 'available'}`}>
                                                    {t('teams.membersCount', '{current}/{max}', {
                                                        current: team.currentMembers,
                                                        max: team.maxMembers === t('teams.unlimited', 'Unlimited') ? '∞' : team.maxMembers
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${team.status}`}>
                                                {team.status === 'active' && <Check size={14} style={{ marginRight: '4px' }} />}
                                                {team.status === 'inactive' && <XCircle size={14} style={{ marginRight: '4px' }} />}
                                                {t(`status.${team.status}`, team.status.charAt(0).toUpperCase() + team.status.slice(1))}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewTeam(team)}
                                                    title={t('teams.viewDetails', 'View Details')}
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Edit - Admin and Instructor only */}
                                                {(userRole === 'admin' || userRole === 'instructor') && (
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() => handleEditTeam(team)}
                                                        title={t('teams.editTeam', 'Edit Team')}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}

                                                {/* Delete - Admin only */}
                                                {userRole === 'admin' && (
                                                    <button
                                                        className="btn-action delete"
                                                        onClick={() => handleDeleteTeam(team)}
                                                        title={t('teams.deleteTeam', 'Delete Team')}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default TeamsManagementPage;