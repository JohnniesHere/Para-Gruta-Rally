// src/pages/admin/KidsManagementPage.jsx - WITH FIXES FOR NAME/TEAM DISPLAY AND CLICKABLE ROWS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import TeamChangeModal from '../../components/modals/TeamChangeModal.jsx';
import EditKidModal from '../../components/modals/EditKidModal.jsx';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions, canUserAccessKid } from '../../hooks/usePermissions.jsx';
import {
    getAllKids,
    getKidsByInstructor,
    getKidsByParent,
    deleteKid
} from '../../services/kidService';
import { getAllTeams } from '../../services/teamService'; // Import team service
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
    IconEdit as Edit,
    IconTrash as Trash2,
    IconClock as Clock,
    IconCircleX as XCircle
} from '@tabler/icons-react';
import './KidsManagementPage.css';

const KidsManagementPage = () => {
    const navigate = useNavigate();
    const { appliedTheme } = useTheme();
    const { permissions, userRole, userData, user, loading: permissionsLoading, error: permissionsError } = usePermissions();

    const [kids, setKids] = useState([]);
    const [teams, setTeams] = useState([]); // Add teams state
    const [filteredKids, setFilteredKids] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [teamFilter, setTeamFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showingKidsWithoutTeams, setShowingKidsWithoutTeams] = useState(false);

    // TEAM CHANGE MODAL STATE
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedKidForTeamChange, setSelectedKidForTeamChange] = useState(null);

    // EDIT KID MODAL STATE
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedKidForEdit, setSelectedKidForEdit] = useState(null);

    // Load teams and kids
    useEffect(() => {
        if (!permissionsLoading && permissions) {
            loadTeamsAndKids();
        }
    }, [userRole, userData, permissions, permissionsLoading]);

    // Filter kids when search term or filters change
    useEffect(() => {
        filterKids();
    }, [kids, searchTerm, teamFilter, statusFilter]);

    // Helper function to get team name by ID
    const getTeamNameById = (teamId) => {
        if (!teamId) return 'No Team';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : `Team ${teamId.slice(0, 8)}...`;
    };

    // Helper function to get kid's display name based on role
    const getKidDisplayName = (kid) => {
        switch (userRole) {
            case 'admin':
                // For admin, show real name if available, otherwise participant number
                const firstName = kid.personalInfo?.firstName || '';
                const lastName = kid.personalInfo?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || `Kid #${kid.participantNumber}`;
            case 'instructor':
            case 'parent':
                // For instructor and parent, show real name
                const instFirstName = kid.personalInfo?.firstName || '';
                const instLastName = kid.personalInfo?.lastName || '';
                const instFullName = `${instFirstName} ${instLastName}`.trim();
                return instFullName || `Kid #${kid.participantNumber}`;
            default:
                return 'Restricted';
        }
    };

    const loadTeamsAndKids = async () => {
        if (!permissions) return;

        console.log(`🔄 Loading teams and kids for ${userRole}`);
        setIsLoading(true);
        setError(null);

        try {
            // Load teams first
            const teamsData = await getAllTeams();
            setTeams(teamsData);
            console.log(`✅ Loaded ${teamsData.length} teams`);

            // Load kids based on role
            let kidsData = [];

            switch (userRole) {
                case 'admin':
                    kidsData = await getAllKids();
                    break;
                case 'instructor':
                    if (userData?.instructorId) {
                        kidsData = await getKidsByInstructor(userData.instructorId);
                    }
                    break;
                case 'parent':
                    if (user?.uid) {
                        kidsData = await getKidsByParent(user.uid);
                    }
                    break;
                case 'guest':
                    kidsData = [];
                    break;
                default:
                    kidsData = [];
            }

            console.log(`✅ Loaded ${kidsData.length} kids for ${userRole}`);

            // Filter and transform based on role-based access
            const accessibleKids = kidsData
                .filter(kid => canUserAccessKid(userRole, kid, userData, user))
                .map(kid => ({
                    id: kid.id,
                    name: getKidDisplayName(kid), // Use the helper function
                    parentName: userRole === 'admin' || userRole === 'instructor'
                        ? kid.parentInfo?.name || 'N/A'
                        : userRole === 'parent'
                            ? 'You'
                            : 'Restricted',
                    age: kid.personalInfo?.dateOfBirth ? calculateAge(kid.personalInfo.dateOfBirth) : 'N/A',
                    team: getTeamNameById(kid.teamId), // Use the helper function
                    teamId: kid.teamId,
                    status: kid.signedFormStatus?.toLowerCase() || 'pending',
                    participantNumber: kid.participantNumber,
                    originalData: kid
                }));

            console.log(`✅ User can access ${accessibleKids.length} kids`);
            setKids(accessibleKids);

        } catch (err) {
            console.error('💥 Error loading teams and kids:', err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age.toString();
    };

    const filterKids = () => {
        let filtered = kids.filter(kid => {
            const matchesSearch = kid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kid.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kid.participantNumber?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTeam = teamFilter === 'all' ||
                (teamFilter === 'no-team' && kid.team === 'No Team') ||
                (teamFilter === 'with-team' && kid.team !== 'No Team');

            const matchesStatus = statusFilter === 'all' || kid.status === statusFilter;

            return matchesSearch && matchesTeam && matchesStatus;
        });
        setFilteredKids(filtered);
    };

    // Handle stat card clicks to filter kids
    const handleStatCardClick = (filterType) => {
        switch (filterType) {
            case 'total':
                setTeamFilter('all');
                setStatusFilter('all');
                setShowingKidsWithoutTeams(false);
                break;
            case 'without-teams':
                setTeamFilter('no-team');
                setStatusFilter('all');
                setShowingKidsWithoutTeams(true);
                break;
            case 'active':
                setTeamFilter('all');
                setStatusFilter('active');
                setShowingKidsWithoutTeams(false);
                break;
            case 'with-teams':
                setTeamFilter('with-team');
                setStatusFilter('all');
                setShowingKidsWithoutTeams(false);
                break;
            default:
                break;
        }
        // Clear search when clicking stat cards
        setSearchTerm('');
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setTeamFilter('all');
        setStatusFilter('all');
        setShowingKidsWithoutTeams(false);
    };

    const handleShowKidsWithoutTeams = () => {
        handleStatCardClick('without-teams');
    };

    const handleDeleteKid = async (kid) => {
        if (userRole !== 'admin') {
            alert('Only administrators can delete kids.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${kid.name}? This action cannot be undone.`)) {
            try {
                await deleteKid(kid.id);
                setKids(kids.filter(k => k.id !== kid.id));
            } catch (err) {
                console.error('Error deleting kid:', err);
                alert('Failed to delete kid. Please try again.');
            }
        }
    };

    const handleViewKid = (kid) => {
        navigate(`/admin/kids/view/${kid.id}`);
    };

    // ADD: Handle row click to view kid
    const handleRowClick = (kid, event) => {
        // Prevent row click when clicking on action buttons
        if (event.target.closest('.action-buttons-enhanced')) {
            return;
        }
        handleViewKid(kid);
    };

    // TEAM CHANGE MODAL HANDLERS
    const handleChangeTeam = (kid) => {
        setSelectedKidForTeamChange(kid);
        setTeamModalOpen(true);
    };

    const handleTeamChanged = (kidId, newTeamId) => {
        // Update the kid in the local state
        setKids(prevKids =>
            prevKids.map(kid =>
                kid.id === kidId
                    ? {
                        ...kid,
                        teamId: newTeamId,
                        team: getTeamNameById(newTeamId) // Use helper function
                    }
                    : kid
            )
        );

        // Close modal
        setTeamModalOpen(false);
        setSelectedKidForTeamChange(null);

        // Show success message
        const kidName = kids.find(k => k.id === kidId)?.name;
        const teamName = getTeamNameById(newTeamId);
        alert(`✅ ${kidName} has been ${newTeamId ? 'assigned to' : 'removed from'} ${teamName}`);
    };

    // EDIT KID MODAL HANDLERS
    const handleEditKid = (kid) => {
        setSelectedKidForEdit(kid);
        setEditModalOpen(true);
    };

    const handleKidUpdated = (kidId, updatedData) => {
        // Update the kid in the local state
        setKids(prevKids =>
            prevKids.map(kid =>
                kid.id === kidId
                    ? {
                        ...kid,
                        name: getKidDisplayName(updatedData), // Use helper function
                        parentName: userRole === 'admin' || userRole === 'instructor'
                            ? updatedData.parentInfo?.name || 'N/A'
                            : kid.parentName,
                        age: updatedData.personalInfo?.dateOfBirth ? calculateAge(updatedData.personalInfo.dateOfBirth) : 'N/A',
                        team: getTeamNameById(updatedData.teamId), // Use helper function
                        teamId: updatedData.teamId,
                        status: updatedData.signedFormStatus?.toLowerCase() || 'pending',
                        participantNumber: updatedData.participantNumber,
                        originalData: { ...kid.originalData, ...updatedData }
                    }
                    : kid
            )
        );

        // Close modal
        setEditModalOpen(false);
        setSelectedKidForEdit(null);

        // Show success message
        const kidName = kids.find(k => k.id === kidId)?.name;
        alert(`✅ ${kidName} has been updated successfully! 🏎️`);
    };

    const handleAddKid = () => {
        navigate('/admin/kids/add');
    };

    const stats = {
        kidsWithoutTeams: kids.filter(k => k.team === 'No Team').length,
        totalKids: kids.length,
        activeKids: kids.filter(k => k.status === 'active' || k.status === 'completed').length,
        kidsWithTeams: kids.filter(k => k.team !== 'No Team').length
    };

    if (permissionsLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`kids-management-page ${appliedTheme}-mode`}>
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
                <div className={`kids-management-page ${appliedTheme}-mode`}>
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
                <div className={`kids-management-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={loadTeamsAndKids} className="btn-primary">
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
            <div className={`kids-management-page ${appliedTheme}-mode`}>
                <h1><Baby size={32} className="page-title-icon" /> Kids Management</h1>

                <div className="kids-management-container">
                    {/* Header with Actions */}
                    <div className="page-header">
                        {userRole === 'admin' && (
                            <button className="btn-primary" onClick={handleAddKid}>
                                <Plus className="btn-icon" size={18} />
                                Add New Kid
                            </button>
                        )}

                        <div className="header-actions">
                            <button className="btn-secondary" onClick={loadTeamsAndKids}>
                                <RefreshCw className="btn-icon" size={18} />
                                Refresh
                            </button>
                            {(userRole === 'admin' || userRole === 'instructor') && (
                                <button className="btn-export">
                                    <Download className="btn-icon" size={18} />
                                    Export Kids
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Clickable Stats Cards */}
                    <div className="stats-grid">
                        {(userRole === 'admin' || userRole === 'instructor') && (
                            <div
                                className={`stat-card priority-warning clickable ${showingKidsWithoutTeams ? 'active' : ''}`}
                                onClick={() => handleStatCardClick('without-teams')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleStatCardClick('without-teams')}
                                style={{ cursor: 'pointer' }}
                            >
                                <AlertTriangle className="stat-icon warning" size={45} />
                                <div className="stat-content">
                                    <h3>Kids without Teams</h3>
                                    <div className="stat-value">{stats.kidsWithoutTeams}</div>
                                    <div className="stat-subtitle">Click to view</div>
                                </div>
                            </div>
                        )}

                        <div
                            className={`stat-card total ${teamFilter === 'all' && statusFilter === 'all' && !showingKidsWithoutTeams ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('total')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{userRole === 'parent' ? 'Your Kids' : 'Total Kids'}</h3>
                                <div className="stat-value">{stats.totalKids}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card active ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('active')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Check className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Active Kids</h3>
                                <div className="stat-value">{stats.activeKids}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card with-teams ${teamFilter === 'with-team' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('with-teams')}
                            style={{ cursor: 'pointer' }}
                        >
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
                                <option value="pending">⏳ Pending</option>
                                <option value="completed">🏁 Completed</option>
                                <option value="cancelled">❌ Cancelled</option>
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
                            Showing {filteredKids.length} of {kids.length} kids
                            {showingKidsWithoutTeams && <span className="priority-filter"> • 🚨 PRIORITY: Kids without teams</span>}
                            {teamFilter !== 'all' && !showingKidsWithoutTeams && <span className="filter-applied"> • Team: {teamFilter}</span>}
                            {statusFilter !== 'all' && <span className="filter-applied"> • Status: {statusFilter}</span>}
                            {searchTerm && <span className="search-applied"> • Search: "{searchTerm}"</span>}
                        </div>

                        {(teamFilter !== 'all' || statusFilter !== 'all' || searchTerm || showingKidsWithoutTeams) && (
                            <button className="btn-reset" onClick={handleClearFilters} title="Reset all filters">
                                <RefreshCw className="btn-icon" size={16} />
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Enhanced Table with Clickable Rows */}
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
                                            <p>
                                                {userRole === 'parent'
                                                    ? 'No kids registered under your account'
                                                    : 'Try adjusting your search or filters'
                                                }
                                            </p>
                                            {userRole === 'admin' && (
                                                <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleAddKid}>
                                                    <Plus className="btn-icon" size={18} />
                                                    Add First Kid
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredKids.map(kid => (
                                    <tr
                                        key={kid.id}
                                        className={`${kid.team === 'No Team' ? 'priority-row' : ''} clickable-row`}
                                        onClick={(e) => handleRowClick(kid, e)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to view details"
                                    >
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
                                                {kid.status === 'completed' && <Check size={14} style={{ marginRight: '4px' }} />}
                                                {kid.status === 'cancelled' && <XCircle size={14} style={{ marginRight: '4px' }} />}
                                                {kid.status === 'pending' && <Clock size={14} style={{ marginRight: '4px' }} />}
                                                {kid.status.charAt(0).toUpperCase() + kid.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-enhanced">
                                                <button
                                                    className="btn-action view"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewKid(kid);
                                                    }}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* TEAM CHANGE BUTTON - Opens modal instead of navigating */}
                                                {(userRole === 'admin' || userRole === 'instructor') && (
                                                    <button
                                                        className={`btn-action ${kid.team === 'No Team' ? 'assign-team priority' : 'change-team'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeTeam(kid);
                                                        }}
                                                        title={kid.team === 'No Team' ? 'Assign Team' : 'Change Team'}
                                                    >
                                                        {kid.team === 'No Team' ? <Plus size={16} /> : <Car size={16} />}
                                                    </button>
                                                )}

                                                {/* EDIT BUTTON - Opens modal instead of navigating */}
                                                {(userRole === 'admin' || userRole === 'instructor') && (
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditKid(kid);
                                                        }}
                                                        title="Edit Kid"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}

                                                {/* Delete - Admin only */}
                                                {userRole === 'admin' && (
                                                    <button
                                                        className="btn-action delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteKid(kid);
                                                        }}
                                                        title="Delete Kid"
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

                {/* TEAM CHANGE MODAL */}
                <TeamChangeModal
                    kid={selectedKidForTeamChange}
                    isOpen={teamModalOpen}
                    onClose={() => {
                        setTeamModalOpen(false);
                        setSelectedKidForTeamChange(null);
                    }}
                    onTeamChanged={handleTeamChanged}
                />

                {/* EDIT KID MODAL */}
                <EditKidModal
                    kid={selectedKidForEdit}
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedKidForEdit(null);
                    }}
                    onKidUpdated={handleKidUpdated}
                />
            </div>
        </Dashboard>
    );
};

export default KidsManagementPage;