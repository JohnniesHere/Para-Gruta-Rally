// src/pages/admin/TeamsManagementPage.jsx - Integrated with Permission System
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    getAllTeams,
    getTeamsByInstructor,
    deleteTeam,
    searchTeams,
    getTeamsSummary
} from '../../services/teamService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
    IconUsers as UsersGroup,
    IconPlus as Plus,
    IconRefresh as RefreshCw,
    IconDownload as Download,
    IconUsersGroup as Users,
    IconChartBar as BarChart3,
    IconSearch as Search,
    IconEraser as Eraser,
    IconFileSpreadsheet as FileSpreadsheet,
    IconX as X,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconUserCircle as Baby,
    IconCheck as Check,
    IconCircleX as XCircle,
    IconClock as Clock
} from '@tabler/icons-react';
import './TeamsManagementPage.css';

const TeamsManagementPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { permissions, userRole, userData } = usePermissions();

    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [instructorFilter, setInstructorFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [instructors, setInstructors] = useState([]);

    // Load teams and instructors based on user role
    useEffect(() => {
        loadTeamsAndInstructors();
    }, [userRole, userData]);

    // Filter teams when search term or filters change
    useEffect(() => {
        filterTeams();
    }, [teams, searchTerm, instructorFilter, statusFilter]);

    const loadTeamsAndInstructors = async () => {
        if (!permissions) return;

        setIsLoading(true);
        setError(null);

        try {
            let teamsData = [];
            let instructorsData = [];

            // Load teams based on user role
            switch (userRole) {
                case 'admin':
                    teamsData = await getAllTeams();
                    break;

                case 'instructor':
                    if (userData?.instructorId) {
                        teamsData = await getTeamsByInstructor(userData.instructorId);
                    }
                    break;

                case 'parent':
                case 'guest':
                    // Limited access - show teams but with restricted info
                    teamsData = await getAllTeams();
                    break;

                default:
                    teamsData = [];
            }

            // Load instructors for statistics
            const instructorsQuery = query(collection(db, 'instructors'));
            const instructorsSnapshot = await getDocs(instructorsQuery);
            instructorsData = instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Transform teams data to match current design
            const transformedTeams = teamsData.map(team => ({
                id: team.id,
                name: team.name || 'Unnamed Team',
                description: team.description || '',
                instructor: team.teamLeaderId ?
                    instructorsData.find(i => i.id === team.teamLeaderId)?.name || 'Unknown' :
                    null,
                instructorId: team.teamLeaderId,
                kidsCount: team.kidIds?.length || 0,
                status: team.active === false ? 'inactive' : 'active',
                maxCapacity: team.maxCapacity || 15,
                createdAt: team.createdAt,
                originalData: team
            }));

            setTeams(transformedTeams);
            setInstructors(instructorsData);
        } catch (err) {
            console.error('Error loading teams and instructors:', err);
            setError('Failed to load teams. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filterTeams = () => {
        let filtered = teams.filter(team => {
            const matchesSearch = team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                team.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesInstructor = instructorFilter === 'all' ||
                (instructorFilter === 'assigned' && team.instructor) ||
                (instructorFilter === 'unassigned' && !team.instructor);

            const matchesStatus = statusFilter === 'all' || team.status === statusFilter;

            return matchesSearch && matchesInstructor && matchesStatus;
        });
        setFilteredTeams(filtered);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setInstructorFilter('all');
        setStatusFilter('all');
    };

    const handleDeleteTeam = async (team) => {
        if (userRole !== 'admin') {
            alert('Only administrators can delete teams.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete team "${team.name}"? This action cannot be undone.`)) {
            try {
                await deleteTeam(team.id);
                setTeams(teams.filter(t => t.id !== team.id));
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
        navigate(`/admin/teams/edit/${team.id}`);
    };

    const handleAddTeam = () => {
        navigate('/admin/teams/add');
    };

    const handleAssignInstructor = (team) => {
        navigate(`/admin/teams/edit/${team.id}`, {
            state: { focusInstructor: true }
        });
    };

    const handleManageKids = (team) => {
        navigate(`/admin/teams/edit/${team.id}`, {
            state: { focusKids: true }
        });
    };

    // Calculate statistics
    const stats = {
        totalTeams: teams.length,
        openInstructors: instructors.filter(instructor =>
            !teams.some(team => team.instructorId === instructor.id)
        ).length,
        avgKidsPerTeam: teams.length > 0 ?
            Math.round(teams.reduce((sum, t) => sum + t.kidsCount, 0) / teams.length) : 0
    };

    if (error) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`teams-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                    <div className="error-container">
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={loadTeamsAndInstructors} className="btn-primary">
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
            <div className={`teams-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1><UsersGroup size={32} className="page-title-icon" /> Teams Management</h1>

                <div className="teams-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        {(userRole === 'admin' || userRole === 'instructor') && (
                            <button className="btn-primary" onClick={handleAddTeam}>
                                <Plus className="btn-icon" size={18} />
                                Add New Team
                            </button>
                        )}

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={loadTeamsAndInstructors}>
                                <RefreshCw className="btn-icon" size={18} />
                                Refresh
                            </button>
                            <button className="btn-export">
                                <Download className="btn-icon" size={18} />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - Removed Active Teams, Changed Teams with Kids to Open Instructors */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <UsersGroup className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Teams</h3>
                                <div className="stat-value">{stats.totalTeams}</div>
                            </div>
                        </div>

                        <div className="stat-card open-instructors clickable">
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Open Instructors</h3>
                                <div className="stat-value">{stats.openInstructors}</div>
                                <div className="stat-subtitle">Available for teams</div>
                            </div>
                        </div>

                        <div className="stat-card avg-kids">
                            <BarChart3 className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Avg Kids/Team</h3>
                                <div className="stat-value">{stats.avgKidsPerTeam}</div>
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
                                    placeholder="Search by team name or description..."
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
                                <Users className="filter-icon" size={16} />
                                Instructor
                            </label>
                            <select
                                className="filter-select"
                                value={instructorFilter}
                                onChange={(e) => setInstructorFilter(e.target.value)}
                            >
                                <option value="all">⭐ All Instructors</option>
                                <option value="assigned">👥 Assigned</option>
                                <option value="unassigned">🆓 Unassigned</option>
                            </select>
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

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            Clear All
                        </button>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        <FileSpreadsheet className="results-icon" size={18} />
                        Showing {filteredTeams.length} of {teams.length} teams
                        {instructorFilter !== 'all' && <span className="filter-applied"> • Instructor: {instructorFilter}</span>}
                        {searchTerm && <span className="search-applied"> • Search: "{searchTerm}"</span>}
                    </div>

                    {/* Enhanced Table */}
                    <div className="table-container">
                        {isLoading ? (
                            <div className="loading-state">
                                <div className="loading-content">
                                    <Clock className="loading-spinner" size={30} />
                                    <p>Loading teams...</p>
                                </div>
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="empty-state">
                                <UsersGroup className="empty-icon" size={80} />
                                <h3>Ready to Create Amazing Teams!</h3>
                                <p>No teams yet, but that's about to change! Let's get these kids racing! 🏎️</p>
                                <div className="empty-actions">
                                    {(userRole === 'admin' || userRole === 'instructor') && (
                                        <button className="btn-primary" style={{ marginRight: '10px' }} onClick={handleAddTeam}>
                                            <Plus className="btn-icon" size={18} />
                                            Create First Team
                                        </button>
                                    )}
                                    <button className="btn-secondary">
                                        <Users className="btn-icon" size={18} />
                                        View Available Instructors ({stats.openInstructors})
                                    </button>
                                </div>

                                {/* Fun illustration */}
                                <div className="fun-illustration">
                                    <div className="race-cars">
                                        <span style={{ fontSize: '40px', margin: '0 10px' }}>🏎️</span>
                                        <span style={{ fontSize: '40px', margin: '0 10px' }}>🏁</span>
                                        <span style={{ fontSize: '40px', margin: '0 10px' }}>🏎️</span>
                                    </div>
                                    <p style={{ color: '#FFD700', fontWeight: 'bold', marginTop: '10px' }}>
                                        Let's get these kids on the track! 🌟
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th><UsersGroup size={16} style={{ marginRight: '8px' }} />Team Info</th>
                                    <th><Users size={16} style={{ marginRight: '8px' }} />Instructor</th>
                                    <th><Baby size={16} style={{ marginRight: '8px' }} />Kids Count</th>
                                    <th><BarChart3 size={16} style={{ marginRight: '8px' }} />Status</th>
                                    <th>⚡ Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredTeams.map(team => (
                                    <tr key={team.id}>
                                        <td>
                                            <div className="team-info">
                                                <div className="team-name">{team.name}</div>
                                                {team.description && (
                                                    <div className="team-description">
                                                        {team.description.length > 60
                                                            ? `${team.description.slice(0, 60)}...`
                                                            : team.description
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                                <span className={`instructor-badge ${team.instructor ? 'assigned' : 'unassigned'}`}>
                                                    {team.instructor ? (
                                                        <>
                                                            <Users size={14} style={{ marginRight: '4px' }} />
                                                            {team.instructor}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Users size={14} style={{ marginRight: '4px' }} />
                                                            Unassigned
                                                        </>
                                                    )}
                                                </span>
                                        </td>
                                        <td>
                                                <span className="kids-count">
                                                    <Baby size={14} style={{ marginRight: '4px' }} />
                                                    {team.kidsCount} / {team.maxCapacity}
                                                </span>
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
                                                    title="View Team"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {!team.instructor ? (
                                                    <button
                                                        className="btn-action assign-instructor priority"
                                                        onClick={() => handleAssignInstructor(team)}
                                                        title="Assign Instructor"
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-action manage-kids"
                                                        onClick={() => handleManageKids(team)}
                                                        title="Manage Kids"
                                                    >
                                                        <Baby size={16} />
                                                    </button>
                                                )}
                                                {(userRole === 'admin' || userRole === 'instructor') && (
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() => handleEditTeam(team)}
                                                        title="Edit Team"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
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

export default TeamsManagementPage;