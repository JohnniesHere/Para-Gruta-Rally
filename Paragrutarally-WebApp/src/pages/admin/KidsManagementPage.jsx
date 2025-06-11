// src/pages/admin/KidsManagementPage.jsx - Fun & Priority Kids Without Teams
import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import {
    IconUserCircle as Baby,
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
    IconTarget as Target,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconClock as Clock,
    IconCircleX as XCircle
} from '@tabler/icons-react';
import './KidsManagementPage.css';

const KidsManagementPage = () => {
    const { isDarkMode } = useTheme();
    const [kids, setKids] = useState([]);
    const [filteredKids, setFilteredKids] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [teamFilter, setTeamFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showingKidsWithoutTeams, setShowingKidsWithoutTeams] = useState(false);

    // Mock data - replace with actual API call
    useEffect(() => {
        setTimeout(() => {
            const mockKids = [
                {
                    id: 1,
                    name: 'kids name',
                    parentName: "Parent's name",
                    age: 'N/A',
                    team: 'No Team',
                    status: 'active'
                }
            ];
            setKids(mockKids);
            setFilteredKids(mockKids);
            setIsLoading(false);
        }, 1000);
    }, []);

    // Filter kids based on search and filters
    useEffect(() => {
        let filtered = kids.filter(kid => {
            const matchesSearch = kid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kid.parentName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTeam = teamFilter === 'all' ||
                (teamFilter === 'no-team' && kid.team === 'No Team') ||
                (teamFilter !== 'no-team' && kid.team === teamFilter);
            const matchesStatus = statusFilter === 'all' || kid.status === statusFilter;

            return matchesSearch && matchesTeam && matchesStatus;
        });
        setFilteredKids(filtered);
    }, [searchTerm, teamFilter, statusFilter, kids]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setTeamFilter('all');
        setStatusFilter('all');
        setShowingKidsWithoutTeams(false);
    };

    // Handle clicking on the "Kids without Teams" stat card
    const handleShowKidsWithoutTeams = () => {
        setTeamFilter('no-team');
        setShowingKidsWithoutTeams(true);
    };

    // Handle action buttons
    const handleViewKid = (kid) => {
        console.log('View kid:', kid);
        // Navigate to kid details page
    };

    const handleChangeTeam = (kid) => {
        console.log('Change team for kid:', kid);
        // Open team assignment modal
    };

    const handleEditKid = (kid) => {
        console.log('Edit kid:', kid);
        // Open edit modal
    };

    const handleDeleteKid = (kid) => {
        console.log('Delete kid:', kid);
        // Show confirmation and delete
    };

    const stats = {
        kidsWithoutTeams: kids.filter(k => k.team === 'No Team').length,
        totalKids: kids.length,
        activeKids: kids.filter(k => k.status === 'active').length,
        kidsWithTeams: kids.filter(k => k.team !== 'No Team').length
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`kids-management-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                <h1><Baby size={32} className="page-title-icon" /> Kids Management</h1>

                <div className="kids-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        <button className="btn-primary">
                            <Plus className="btn-icon" size={18} />
                            Add New Kid
                        </button>

                        <div className="header-actions">
                            <button className="btn-secondary">
                                <RefreshCw className="btn-icon" size={18} />
                                Refresh
                            </button>
                            <button className="btn-export">
                                <Download className="btn-icon" size={18} />
                                Export Kids
                            </button>
                        </div>
                    </div>

                    {/* Priority Stats Cards - Kids Without Teams First */}
                    <div className="stats-grid">
                        <div
                            className="stat-card priority-warning clickable"
                            onClick={handleShowKidsWithoutTeams}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleShowKidsWithoutTeams()}
                        >
                            <AlertTriangle className="stat-icon warning" size={45} />
                            <div className="stat-content">
                                <h3>Kids without Teams</h3>
                                <div className="stat-value">{stats.kidsWithoutTeams}</div>
                                <div className="stat-subtitle">Click to view</div>
                            </div>
                        </div>

                        <div className="stat-card total">
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Kids</h3>
                                <div className="stat-value">{stats.totalKids}</div>
                            </div>
                        </div>

                        <div className="stat-card active">
                            <Check className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Active Kids</h3>
                                <div className="stat-value">{stats.activeKids}</div>
                            </div>
                        </div>

                        <div className="stat-card with-teams">
                            <Car className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Kids with Teams</h3>
                                <div className="stat-value">{stats.kidsWithTeams}</div>
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
                                    placeholder="Search by kid name or parent name..."
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
                                <Tag className="filter-icon" size={16} />
                                Team Status
                            </label>
                            <select
                                className="filter-select"
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                            >
                                <option value="all">⭐ All Kids</option>
                                <option value="no-team">⚠️ No Team</option>
                                <option value="with-team">🏎️ With Team</option>
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
                                <option value="pending">⏳ Pending</option>
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
                        Showing {filteredKids.length} of {kids.length} kids
                        {showingKidsWithoutTeams && <span className="priority-filter"> • 🚨 PRIORITY: Kids without teams</span>}
                        {teamFilter !== 'all' && !showingKidsWithoutTeams && <span className="filter-applied"> • Team: {teamFilter}</span>}
                        {searchTerm && <span className="search-applied"> • Search: "{searchTerm}"</span>}
                    </div>

                    {/* Enhanced Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th><Baby size={16} style={{ marginRight: '8px' }} />Kid Info</th>
                                <th>🎂 Age</th>
                                <th><Car size={16} style={{ marginRight: '8px' }} />Team</th>
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
                                            Loading kids...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredKids.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="empty-state">
                                            <Baby className="empty-icon" size={60} />
                                            <h3>No kids found</h3>
                                            <p>Try adjusting your search or filters</p>
                                            <button className="btn-primary" style={{ marginTop: '15px' }}>
                                                <Plus className="btn-icon" size={18} />
                                                Add First Kid
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredKids.map(kid => (
                                    <tr key={kid.id} className={kid.team === 'No Team' ? 'priority-row' : ''}>
                                        <td>
                                            <div className="kid-info">
                                                <div className="kid-name">
                                                    {kid.team === 'No Team' && <AlertTriangle className="priority-indicator" size={16} />}
                                                    {kid.name}
                                                </div>
                                                <div className="parent-name">👨‍👩‍👧‍👦 {kid.parentName}</div>
                                            </div>
                                        </td>
                                        <td>{kid.age}</td>
                                        <td>
                                                <span className={`team-badge ${kid.team === 'No Team' ? 'no-team' : 'with-team'}`}>
                                                    {kid.team === 'No Team' ? (
                                                        <>
                                                            <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                                                            No Team
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Car size={14} style={{ marginRight: '4px' }} />
                                                            {kid.team}
                                                        </>
                                                    )}
                                                </span>
                                        </td>
                                        <td>
                                                <span className={`status-badge status-${kid.status}`}>
                                                    {kid.status === 'active' && <Check size={14} style={{ marginRight: '4px' }} />}
                                                    {kid.status === 'inactive' && <XCircle size={14} style={{ marginRight: '4px' }} />}
                                                    {kid.status === 'pending' && <Clock size={14} style={{ marginRight: '4px' }} />}
                                                    {kid.status.charAt(0).toUpperCase() + kid.status.slice(1)}
                                                </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={() => handleViewKid(kid)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {kid.team === 'No Team' ? (
                                                    <button
                                                        className="btn-action assign-team priority"
                                                        onClick={() => handleChangeTeam(kid)}
                                                        title="Assign Team"
                                                    >
                                                        <Target size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-action change-team"
                                                        onClick={() => handleChangeTeam(kid)}
                                                        title="Change Team"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditKid(kid)}
                                                    title="Edit Kid"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteKid(kid)}
                                                    title="Delete Kid"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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

export default KidsManagementPage;