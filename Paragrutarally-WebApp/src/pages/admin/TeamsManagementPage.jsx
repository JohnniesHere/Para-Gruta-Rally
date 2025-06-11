// src/pages/admin/TeamsManagementPage.jsx - Fun & Open Instructors
import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
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
    const { isDarkMode } = useTheme();
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [instructorFilter, setInstructorFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Mock data - replace it with actual API call
    useEffect(() => {
        setTimeout(() => {
            const mockTeams = [
                // Currently empty - matches the "0" values shown in images
            ];
            setTeams(mockTeams);
            setFilteredTeams(mockTeams);
            setIsLoading(false);
        }, 1000);
    }, []);

    // Filter teams based on search and filters
    useEffect(() => {
        let filtered = teams.filter(team => {
            const matchesSearch = team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                team.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesInstructor = instructorFilter === 'all' || team.instructor === instructorFilter;
            const matchesStatus = statusFilter === 'all' || team.status === statusFilter;

            return matchesSearch && matchesInstructor && matchesStatus;
        });
        setFilteredTeams(filtered);
    }, [searchTerm, instructorFilter, statusFilter, teams]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setInstructorFilter('all');
        setStatusFilter('all');
    };

    // Handle action buttons
    const handleViewTeam = (team) => {
        console.log('View team:', team);
        // Navigate to the team details page
    };

    const handleEditTeam = (team) => {
        console.log('Edit team:', team);
        // Open edit modal
    };

    const handleDeleteTeam = (team) => {
        console.log('Delete team:', team);
        // Show confirmation and delete
    };

    const handleAssignInstructor = (team) => {
        console.log('Assign instructor to team:', team);
        // Open instructor assignment modal
    };

    const handleManageKids = (team) => {
        console.log('Manage kids for team:', team);
        // Navigate to kids management for this team
    };

    // Mock instructor data for demonstration
    const mockInstructors = [
        { id: 1, name: 'John Doe', hasTeam: false },
        { id: 2, name: 'Jane Smith', hasTeam: true },
        { id: 3, name: 'Mike Johnson', hasTeam: false },
    ];

    const stats = {
        totalTeams: teams.length,
        openInstructors: mockInstructors.filter(i => !i.hasTeam).length, // Instructors without teams
        avgKidsPerTeam: teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + (t.kidsCount || 0), 0) / teams.length) : 0
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`teams-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1><UsersGroup size={32} className="page-title-icon" /> Teams Management</h1>

                <div className="teams-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        <button className="btn-primary">
                            <Plus className="btn-icon" size={18} />
                            Add New Team
                        </button>

                        <div className="header-actions">
                            <button className="btn-secondary">
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
                                    <button className="btn-primary" style={{ marginRight: '10px' }}>
                                        <Plus className="btn-icon" size={18} />
                                        Create First Team
                                    </button>
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
                                                <div className="team-description">{team.description}</div>
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
                                                    {team.kidsCount || 0}
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
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditTeam(team)}
                                                    title="Edit Team"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteTeam(team)}
                                                    title="Delete Team"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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