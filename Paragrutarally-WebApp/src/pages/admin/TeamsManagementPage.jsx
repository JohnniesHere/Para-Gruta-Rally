// src/pages/admin/TeamsManagementPage.jsx - PROFESSIONAL VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getAllTeams, deleteTeam } from '../../services/teamService';
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
    const { permissions, userRole, loading: permissionsLoading, error: permissionsError } = usePermissions();

    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [capacityFilter, setCapacityFilter] = useState('all');
    const [showingTeamsWithoutKids, setShowingTeamsWithoutKids] = useState(false);

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
            const teamsData = await getAllTeams();
            console.log(`✅ Loaded ${teamsData.length} teams`);

            // Transform teams data for display
            const processedTeams = teamsData.map(team => ({
                id: team.id,
                name: team.name || 'Unnamed Team',
                instructorName: team.instructorName || 'No Instructor',
                instructorId: team.instructorId,
                currentMembers: team.currentMembers || 0,
                maxMembers: team.maxMembers || 'Unlimited',
                status: team.active !== false ? 'active' : 'inactive',
                description: team.description || '',
                createdAt: team.createdAt,
                originalData: team
            }));

            setTeams(processedTeams);
        } catch (err) {
            console.error('💥 Error loading teams:', err);
            setError(`Failed to load teams: ${err.message}`);
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
            alert('Only administrators can delete teams.');
            return;
        }

        if (team.currentMembers > 0) {
            alert(`Cannot delete ${team.name} because it has ${team.currentMembers} members. Please move the kids to other teams first.`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) {
            try {
                await deleteTeam(team.id);
                setTeams(teams.filter(t => t.id !== team.id));
                alert(`✅ ${team.name} has been deleted successfully!`);
            } catch (err) {
                console.error('Error deleting team:', err);
                alert('Failed to delete team. Please try again.');
            }
        }
    };

    const handleViewTeam = (team) => {
        navigate(`/admin/teams/view/${team.id}`);
    };

    const handleEditTeam = (team) => {
        // For now, show alert that this would open edit modal
        alert(`Edit functionality for ${team.name} would go here. You could create an EditTeamModal similar to the EditKidModal.`);
        // navigate(`/admin/teams/edit/${team.id}`);
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
                            <p>Loading permissions...</p>
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
                        <h3>Permission Error</h3>
                        <p>{permissionsError}</p>
                        <button onClick={() => window.location.reload()} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            Reload Page
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
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={loadTeams} className="btn-primary">
                            <RefreshCw className="btn-icon" size={18} />
                            Try Again
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`teams-management-page ${appliedTheme}-mode`}>
                <h1><Team size={32} className="page-title-icon" /> Teams Management</h1>

                <div className="teams-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        {userRole === 'admin' && (
                            <button className="btn-primary" onClick={handleAddTeam}>
                                <Plus className="btn-icon" size={18} />
                                Add New Team
                            </button>
                        )}

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={loadTeams}>
                                <RefreshCw className="btn-icon" size={18} />
                                Refresh
                            </button>
                            {(userRole === 'admin' || userRole === 'instructor') && (
                                <button className="btn-export">
                                    <Download className="btn-icon" size={18} />
                                    Export Teams
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
                                <h3>Total Teams</h3>
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
                                <h3>Active Teams</h3>
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
                                <h3>Teams without Kids</h3>
                                <div className="stat-value">{stats.teamsWithoutKids}</div>
                                <div className="stat-subtitle">Click to view</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card with-teams ${capacityFilter === 'available' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('with-kids')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Car className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Teams with Kids</h3>
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
                                    placeholder="Search by team name or instructor..."
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
                                Status
                            </label>
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">🌈 All Status</option>
                                <option value="active">✅ Active</option>
                                <option value="inactive">❌ Inactive</option>
                            </select>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Tag className="filter-icon" size={16} />
                                Capacity
                            </label>
                            <select
                                className="filter-select"
                                value={capacityFilter}
                                onChange={(e) => setCapacityFilter(e.target.value)}
                            >
                                <option value="all">⭐ All Teams</option>
                                <option value="empty">⚠️ Empty Teams</option>
                                <option value="available">🟢 Available Spots</option>
                                <option value="full">🔴 Full Teams</option>
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            Clear All
                        </button>
                    </div>

                    {/* Results Info with Reset Button */}
                    <div className="results-info">
                        <div className="results-content">
                            <FileSpreadsheet className="results-icon" size={18} />
                            Showing {filteredTeams.length} of {teams.length} teams
                            {showingTeamsWithoutKids && <span className="priority-filter"> • 🚨 PRIORITY: Teams without kids</span>}
                            {statusFilter !== 'all' && <span className="filter-applied"> • Status: {statusFilter}</span>}
                            {capacityFilter !== 'all' && <span className="filter-applied"> • Capacity: {capacityFilter}</span>}
                            {searchTerm && <span className="search-applied"> • Search: "{searchTerm}"</span>}
                        </div>

                        {(statusFilter !== 'all' || capacityFilter !== 'all' || searchTerm || showingTeamsWithoutKids) && (
                            <button className="btn-reset" onClick={handleClearFilters} title="Reset all filters">
                                <RefreshCw className="btn-icon" size={16} />
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Enhanced Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Team size={16} style={{ marginRight: '8px' }} />Team Info</th>
                                <th>👨‍🏫 Instructor</th>
                                <th>👥 Members</th>
                                <th><BarChart3 size={16} style={{ marginRight: '8px' }} />Status</th>
                                <th>⚡ Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="loading-cell">
                                        <div className="loading-content">
                                            <Clock className="loading-spinner" size={30} />
                                            Loading teams...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTeams.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="empty-state">
                                            <Team className="empty-icon" size={60} />
                                            <h3>No teams found</h3>
                                            <p>Try adjusting your search or filters</p>
                                            {userRole === 'admin' && (
                                                <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleAddTeam}>
                                                    <Plus className="btn-icon" size={18} />
                                                    Add First Team
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
                                                <span className={team.instructorName === 'No Instructor' ? 'no-instructor' : 'has-instructor'}>
                                                    {team.instructorName === 'No Instructor' ? (
                                                        <>
                                                            <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                                                            No Instructor
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
                                                    {team.currentMembers}/{team.maxMembers === 'Unlimited' ? '∞' : team.maxMembers}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${team.status}`}>
                                                {team.status === 'active' && <Check size={14} style={{ marginRight: '4px' }} />}
                                                {team.status === 'inactive' && <XCircle size={14} style={{ marginRight: '4px' }} />}
                                                {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewTeam(team)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Edit - Admin and Instructor only */}
                                                {(userRole === 'admin' || userRole === 'instructor') && (
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() => handleEditTeam(team)}
                                                        title="Edit Team"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}

                                                {/* Delete - Admin only */}
                                                {userRole === 'admin' && (
                                                    <button
                                                        className="btn-action delete"
                                                        onClick={() => handleDeleteTeam(team)}
                                                        title="Delete Team"
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