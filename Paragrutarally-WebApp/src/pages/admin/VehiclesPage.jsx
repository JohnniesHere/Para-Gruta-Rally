// src/pages/admin/VehiclesPage.jsx - UPDATED: Team-based assignments instead of kid-based
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getAllVehicles, getVehiclesByTeam, deleteVehicle } from '@/services/vehicleService.js';
import { unassignVehicleFromTeam} from '@/services/vehicleAssignmentService.js'; // UPDATED: Import team unassignment
import { getAllTeams } from '@/services/teamService.js';
import {
    IconCar as Car,
    IconPlus as Plus,
    IconSearch as Search,
    IconFilter as Filter,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconBattery as Battery,
    IconEngine as Engine,
    IconSteeringWheel as Steering,
    IconUser as User,
    IconUsers as Users,
    IconCalendar as Calendar,
    IconPhoto as Photo,
    IconAlertTriangle as AlertTriangle,
    IconSettings as Settings,
    IconUserCircle as Baby
} from '@tabler/icons-react';
import './VehiclePage.css';

const VehiclesPage = () => {
    const navigate = useNavigate();
    const { appliedTheme } = useTheme();
    const { t } = useLanguage();
    const { permissions, userRole, userData } = usePermissions();

    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null); // Track which vehicle is being deleted
    const [activeCardFilter, setActiveCardFilter] = useState('total'); // Track active card

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadData();
    }, [userRole, userData]);

    useEffect(() => {
        applyFilters();
    }, [vehicles, searchTerm, teamFilter, statusFilter]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load teams for filter dropdown
            const teamsData = await getAllTeams();
            setTeams(teamsData);

            let vehiclesData = [];

            switch (userRole) {
                case 'admin':
                    vehiclesData = await getAllVehicles();
                    break;
                case 'instructor':
                    if (userData?.teamId) {
                        vehiclesData = await getVehiclesByTeam(userData.teamId);
                    } else {
                        vehiclesData = [];
                    }
                    break;
                case 'parent':
                    // UPDATED: Parents see vehicles through their kids' teams
                    vehiclesData = []; // Parents typically don't need direct vehicle access
                    break;
                case 'guest':
                    vehiclesData = [];
                    break;
                default:
                    vehiclesData = [];
            }

            setVehicles(vehiclesData);

        } catch (error) {
            console.error('Error loading data:', error);
            setError(t('vehicles.failedToLoad', 'Failed to load vehicles. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = vehicles;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(vehicle =>
                vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getTeamName(vehicle.teamId)?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Team filter
        if (teamFilter) {
            if (teamFilter === 'unassigned') {
                filtered = filtered.filter(vehicle => !vehicle.teamId);
            } else {
                filtered = filtered.filter(vehicle => vehicle.teamId === teamFilter);
            }
        }

        // Status filter
        if (statusFilter) {
            if (statusFilter === 'active') {
                filtered = filtered.filter(vehicle => vehicle.active);
            } else if (statusFilter === 'inactive') {
                filtered = filtered.filter(vehicle => !vehicle.active);
            } else if (statusFilter === 'in-use') {
                // UPDATED: Check if vehicle has assigned kids (currentKidIds array)
                filtered = filtered.filter(vehicle => vehicle.currentKidIds && vehicle.currentKidIds.length > 0);
            } else if (statusFilter === 'available') {
                // UPDATED: Available means active and no kids assigned
                filtered = filtered.filter(vehicle => vehicle.active && (!vehicle.currentKidIds || vehicle.currentKidIds.length === 0));
            }
        }

        setFilteredVehicles(filtered);
    };

    // Helper function to get team name from team ID
    const getTeamName = (teamId) => {
        if (!teamId) return t('vehicles.unassigned', 'Unassigned');
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : t('vehicles.unknownTeam', 'Unknown Team');
    };

    // UPDATED: Get kids count for vehicle (from currentKidIds)
    const getVehicleKidsCount = (vehicle) => {
        return vehicle.currentKidIds ? vehicle.currentKidIds.length : 0;
    };

    // Handle stat card clicks to filter vehicles
    const handleStatCardClick = (filterType) => {
        setActiveCardFilter(filterType);

        switch (filterType) {
            case 'total':
                setStatusFilter('');
                setTeamFilter('');
                break;
            case 'active':
                setStatusFilter('active');
                setTeamFilter('');
                break;
            case 'in-use':
                setStatusFilter('in-use');
                setTeamFilter('');
                break;
            case 'available':
                setStatusFilter('available');
                setTeamFilter('');
                break;
            default:
                break;
        }
        setSearchTerm('');
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setTeamFilter('');
        setStatusFilter('');
        setActiveCardFilter('total');
    };

    const handleViewVehicle = (vehicleId) => {
        navigate(`/admin/vehicles/view/${vehicleId}`);
    };

    const handleEditVehicle = (vehicleId) => {
        if (userRole === 'admin' || userRole === 'instructor') {
            navigate(`/admin/vehicles/edit/${vehicleId}`);
        }
    };

    const handleAddVehicle = () => {
        if (userRole === 'admin' || userRole === 'instructor') {
            navigate('/admin/vehicles/add');
        }
    };

    // UPDATED: Handle delete vehicle with team unassignment
    const handleDeleteVehicle = async (vehicle) => {
        if (userRole !== 'admin') {
            alert(t('vehicles.delete.noPermission', 'You do not have permission to delete vehicles.'));
            return;
        }

        const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`;
        const kidCount = getVehicleKidsCount(vehicle);

        // UPDATED: Extra confirmation if vehicle is assigned to team or has kids
        let confirmMessage = t('vehicles.delete.confirm', 'Are you sure you want to delete {vehicleName}?', { vehicleName });

        if (vehicle.teamId) {
            confirmMessage += '\n\n' + t('vehicles.delete.warningTeamAssigned', 'WARNING: This vehicle is assigned to team "{teamName}".', { teamName: getTeamName(vehicle.teamId) });
        }

        if (kidCount > 0) {
            confirmMessage += '\n\n' + t('vehicles.delete.warningKidsAssigned', 'WARNING: This vehicle is currently used by {count} racer(s).', { count: kidCount });
        }

        confirmMessage += '\n\n' + t('vehicles.delete.cannotUndo', 'This action cannot be undone.');

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setIsDeleting(vehicle.id);

            // UPDATED: If vehicle is assigned to team, unassign it first
            if (vehicle.teamId) {
                await unassignVehicleFromTeam(vehicle.id);
            }

            // Delete the vehicle
            await deleteVehicle(vehicle.id);

            // Update local state
            setVehicles(prev => prev.filter(v => v.id !== vehicle.id));

            alert(t('vehicles.delete.success', '{vehicleName} has been successfully deleted.', { vehicleName }));

        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert(t('vehicles.delete.failed', 'Failed to delete {vehicleName}: {error}', { vehicleName, error: error.message }));
        } finally {
            setIsDeleting(null);
        }
    };

    const canEdit = (vehicle) => {
        if (userRole === 'admin') return true;
        if (userRole === 'instructor' && userData?.teamId === vehicle.teamId) return true;
        return false;
    };

    const canDelete = (vehicle) => {
        return userRole === 'admin';
    };

    // UPDATED: Status badge function to reflect team-based assignments
    const getStatusBadge = (vehicle) => {
        if (!vehicle.active) {
            return <span className="badge danger">{t('vehicles.status.inactive', 'Inactive')}</span>;
        }

        const kidCount = getVehicleKidsCount(vehicle);
        if (kidCount > 0) {
            return <span className="badge warning">{t('vehicles.status.inUseWithCount', 'In Use ({count})', { count: kidCount })}</span>;
        }

        return <span className="badge success">{t('vehicles.status.available', 'Available')}</span>;
    };

    const getVehicleStats = () => {
        const total = vehicles.length;
        const active = vehicles.filter(v => v.active).length;
        // UPDATED: Count vehicles with assigned kids
        const inUse = vehicles.filter(v => v.currentKidIds && v.currentKidIds.length > 0).length;
        const available = vehicles.filter(v => v.active && (!v.currentKidIds || v.currentKidIds.length === 0)).length;

        return { total, active, inUse, available };
    };

    // UPDATED: Mobile card component with team-based info
    const VehicleMobileCard = ({ vehicle }) => {
        const kidCount = getVehicleKidsCount(vehicle);

        return (
            <div className="vehicle-mobile-card">
                <div className="vehicle-mobile-header">
                    {vehicle.photo ? (
                        <img
                            src={vehicle.photo}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="vehicle-mobile-photo"
                        />
                    ) : (
                        <div className="vehicle-mobile-photo-placeholder">
                            <Car size={24} />
                        </div>
                    )}
                    <div className="vehicle-mobile-info">
                        <div className="vehicle-mobile-name">
                            {vehicle.make} {vehicle.model}
                        </div>
                        <div className="vehicle-mobile-type">
                            {vehicle.driveType} • {vehicle.steeringType}
                        </div>
                    </div>
                </div>

                <div className="vehicle-mobile-details">
                    <div className="vehicle-mobile-detail">
                        <div className="vehicle-mobile-detail-label">{t('vehicles.mobile.team', 'Team')}</div>
                        <div className="vehicle-mobile-detail-value">
                            <span
                                className="team-name clickable"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (vehicle.teamId) {
                                        navigate(`/admin/teams/view/${vehicle.teamId}`);
                                    }
                                }}
                            >
                                {getTeamName(vehicle.teamId)}
                            </span>
                        </div>
                    </div>
                    <div className="vehicle-mobile-detail">
                        <div className="vehicle-mobile-detail-label">{t('vehicles.mobile.licensePlate', 'License Plate')}</div>
                        <div className="vehicle-mobile-detail-value">
                            <span className="license-plate">{vehicle.licensePlate}</span>
                        </div>
                    </div>
                    <div className="vehicle-mobile-detail">
                        <div className="vehicle-mobile-detail-label">{t('vehicles.mobile.currentUsers', 'Current Users')}</div>
                        <div className="vehicle-mobile-detail-value">
                            {kidCount > 0 ? (
                                <span className="current-users">
                                    <Baby size={14} />
                                    {t('vehicles.kidsAssigned', '{count} kids assigned', { count: kidCount })}
                                </span>
                            ) : (
                                <span className="no-users">{t('vehicles.status.available', 'Available')}</span>
                            )}
                        </div>
                    </div>
                    <div className="vehicle-mobile-detail">
                        <div className="vehicle-mobile-detail-label">{t('vehicles.mobile.battery', 'Battery')}</div>
                        <div className="vehicle-mobile-detail-value">
                            <div className="battery-info">
                                <Battery size={16} />
                                <span>{vehicle.batteryType || t('vehicles.notAvailable', 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vehicle-mobile-actions">
                    <div className="vehicle-mobile-status">
                        {getStatusBadge(vehicle)}
                    </div>
                    <div className="vehicle-mobile-buttons">
                        <button
                            onClick={() => handleViewVehicle(vehicle.id)}
                            className="btn-mobile-action btn-mobile-view"
                            title={t('vehicles.actions.viewVehicle', 'View Vehicle')}
                        >
                            <Eye size={14} />
                            {t('vehicles.actions.view', 'View')}
                        </button>
                        {canEdit(vehicle) && (
                            <button
                                onClick={() => handleEditVehicle(vehicle.id)}
                                className="btn-mobile-action btn-mobile-edit"
                                title={t('vehicles.actions.editVehicle', 'Edit Vehicle')}
                            >
                                <Edit size={14} />
                                {t('vehicles.actions.edit', 'Edit')}
                            </button>
                        )}
                        {canDelete(vehicle) && (
                            <button
                                onClick={() => handleDeleteVehicle(vehicle)}
                                className="btn-mobile-action btn-mobile-delete"
                                title={t('vehicles.actions.deleteVehicle', 'Delete Vehicle')}
                                disabled={isDeleting === vehicle.id}
                            >
                                {isDeleting === vehicle.id ? (
                                    <div className="loading-spinner-mini"></div>
                                ) : (
                                    <Trash2 size={14} />
                                )}
                                {isDeleting === vehicle.id ? t('vehicles.deleting', 'Deleting...') : t('vehicles.actions.delete', 'Delete')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page vehicles-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('vehicles.loadingVehicles', 'Loading vehicles...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const stats = getVehicleStats();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`vehicles-page ${appliedTheme}-mode`}>
                {/* Page Title */}
                <h1 className="page-title">
                    <Car size={32} className="page-title-icon" />
                    {t('vehicles.title', 'Racing Vehicles')}
                    <Settings size={24} className="sparkle-icon" />
                </h1>
                <div className="page-header">
                    <div className="header-actions">
                        {(userRole === 'admin' || userRole === 'instructor') && (
                            <button onClick={handleAddVehicle} className="btn-primary">
                                <Plus size={18} />
                                {t('vehicles.addVehicle', 'Add Vehicle')}
                            </button>
                        )}
                    </div>
                </div>
                <div className="vehicle-management-container">
                    {/* Stats Cards - Single Row Layout */}
                    <div className="stats-grid-optimized">
                        <div
                            className={`stat-card total ${activeCardFilter === 'total' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('total')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Car className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('vehicles.totalVehicles', 'Total Vehicles')}</h3>
                                <div className="stat-value">{stats.total}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card active-vehicles ${activeCardFilter === 'active' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('active')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Settings className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('vehicles.activeVehicles', 'Active Vehicles')}</h3>
                                <div className="stat-value">{stats.active}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card in-use ${activeCardFilter === 'in-use' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('in-use')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Baby className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('vehicles.inUse', 'In Use')}</h3>
                                <div className="stat-value">{stats.inUse}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card available ${activeCardFilter === 'available' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('available')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Battery className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('vehicles.available', 'Available')}</h3>
                                <div className="stat-value">{stats.available}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="search-filter-section">
                        <div className="search-container">
                            <label className="search-label">
                                <Search size={16} />
                                {t('vehicles.searchVehicles', 'Search Vehicles')}
                            </label>
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder={t('vehicles.searchPlaceholder', 'Search by make, model, license plate, or team...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="clear-search"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Filter size={16} />
                                {t('vehicles.teamFilter', 'Team')}
                            </label>
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">{t('vehicles.allTeams', 'All Teams')}</option>
                                <option value="unassigned">{t('vehicles.unassigned', 'Unassigned')}</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Settings size={16} />
                                {t('vehicles.statusFilter', 'Status')}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">{t('vehicles.allStatus', 'All Status')}</option>
                                <option value="active">{t('vehicles.active', 'Active')}</option>
                                <option value="inactive">{t('vehicles.inactive', 'Inactive')}</option>
                                <option value="in-use">{t('vehicles.inUse', 'In Use')}</option>
                                <option value="available">{t('vehicles.available', 'Available')}</option>
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Settings className="btn-icon" size={18} />
                            {t('vehicles.clearAll', 'Clear All')}
                        </button>
                    </div>

                    {/* Results Summary */}
                    {(searchTerm || teamFilter || statusFilter) && (
                        <div className="results-summary">
                            <Car className="results-icon" size={18} />
                            {t('vehicles.showing', 'Showing')} {filteredVehicles.length} {t('vehicles.of', 'of')} {vehicles.length} {t('vehicles.vehicles', 'vehicles')}
                            {searchTerm && <span className="search-applied"> {t('vehicles.matching', 'matching')} "{searchTerm}"</span>}
                            {teamFilter && <span className="filter-applied"> {t('vehicles.inTeam', 'in team')} "{getTeamName(teamFilter)}"</span>}
                            {statusFilter && <span className="filter-applied"> {t('vehicles.withStatus', 'with status')} "{statusFilter}"</span>}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20} />
                            {error}
                        </div>
                    )}

                    {/* Vehicles Content */}
                    {filteredVehicles.length === 0 ? (
                        <div className="empty-state">
                            <Car className="empty-icon" size={80} />
                            <h3>{t('vehicles.noVehiclesFound', 'No Vehicles Found')}</h3>
                            <p>
                                {searchTerm || teamFilter || statusFilter
                                    ? t('vehicles.noVehiclesMatch', 'No vehicles match your current filters.')
                                    : t('vehicles.noVehiclesAdded', 'No vehicles have been added yet.')
                                }
                            </p>
                            {(userRole === 'admin' || userRole === 'instructor') && !searchTerm && !teamFilter && !statusFilter && (
                                <button onClick={handleAddVehicle} className="btn-primary">
                                    <Plus size={18} />
                                    {t('vehicles.addFirstVehicle', 'Add First Vehicle')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View - UPDATED with team-based columns */}
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>{t('vehicles.table.vehicle', 'Vehicle')}</th>
                                        <th>{t('vehicles.table.team', 'Team')}</th>
                                        <th>{t('vehicles.table.licensePlate', 'License Plate')}</th>
                                        <th>{t('vehicles.table.status', 'Status')}</th>
                                        <th>{t('vehicles.table.assignedKids', 'Assigned Kids')}</th>
                                        <th>{t('vehicles.table.battery', 'Battery')}</th>
                                        <th>{t('vehicles.table.actions', 'Actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredVehicles.map(vehicle => {
                                        const kidCount = getVehicleKidsCount(vehicle);

                                        return (
                                            <tr key={vehicle.id}>
                                                <td>
                                                    <div className="vehicle-info">
                                                        {vehicle.photo ? (
                                                            <img
                                                                src={vehicle.photo}
                                                                alt={`${vehicle.make} ${vehicle.model}`}
                                                                className="vehicle-photo-small"
                                                            />
                                                        ) : (
                                                            <div className="vehicle-photo-placeholder">
                                                                <Car size={20} />
                                                            </div>
                                                        )}
                                                        <div className="vehicle-details">
                                                            <div className="vehicle-name">
                                                                {vehicle.make} {vehicle.model}
                                                            </div>
                                                            <div className="vehicle-type">
                                                                {vehicle.driveType} • {vehicle.steeringType}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="team-name clickable"
                                                        onClick={() => {
                                                            if (vehicle.teamId) {
                                                                navigate(`/admin/teams/view/${vehicle.teamId}`);
                                                            }
                                                        }}
                                                        style={{ cursor: vehicle.teamId ? 'pointer' : 'default' }}
                                                    >
                                                        {getTeamName(vehicle.teamId)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="license-plate">{vehicle.licensePlate}</span>
                                                </td>
                                                <td>
                                                    {getStatusBadge(vehicle)}
                                                </td>
                                                <td>
                                                    {kidCount > 0 ? (
                                                        <div className="assigned-kids-info">
                                                            <Baby size={16} />
                                                            <span className="kids-count">{kidCount} {t('vehicles.kids', 'kids')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="no-kids">{t('vehicles.noKidsAssigned', 'No kids assigned')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="battery-info">
                                                        <Battery size={16} />
                                                        <span>{vehicle.batteryType || t('vehicles.notAvailable', 'N/A')}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => handleViewVehicle(vehicle.id)}
                                                            className="btn-action view"
                                                            title={t('vehicles.actions.viewVehicle', 'View Vehicle')}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {canEdit(vehicle) && (
                                                            <button
                                                                onClick={() => handleEditVehicle(vehicle.id)}
                                                                className="btn-action edit"
                                                                title={t('vehicles.actions.editVehicle', 'Edit Vehicle')}
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        )}
                                                        {canDelete(vehicle) && (
                                                            <button
                                                                onClick={() => handleDeleteVehicle(vehicle)}
                                                                className="btn-action delete"
                                                                title={t('vehicles.actions.deleteVehicle', 'Delete Vehicle')}
                                                                disabled={isDeleting === vehicle.id}
                                                            >
                                                                {isDeleting === vehicle.id ? (
                                                                    <div className="loading-spinner-tiny"></div>
                                                                ) : (
                                                                    <Trash2 size={14} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="vehicles-mobile-grid">
                                {filteredVehicles.map(vehicle => (
                                    <VehicleMobileCard key={vehicle.id} vehicle={vehicle} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default VehiclesPage;