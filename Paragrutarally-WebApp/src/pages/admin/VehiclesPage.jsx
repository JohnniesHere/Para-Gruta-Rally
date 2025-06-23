// src/pages/admin/VehiclesPage.jsx - OPTIMIZED VERSION with single-row stats
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getAllVehicles, getVehiclesByTeam, getVehiclesByKids, deleteVehicle } from '../../services/vehicleService';
import { unassignVehicleFromKid } from '../../services/vehicleAssignmentService'; // Import for cleanup
import { getAllTeams } from '../../services/teamService';
import { getKidsByParent } from '../../services/kidService';
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
    IconSettings as Settings
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
    const [activeCardFilter, setActiveCardFilter] = useState('total'); // NEW: Track active card

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
                    try {
                        const parentKids = await getKidsByParent(userData.uid);
                        const kidIds = parentKids.map(kid => kid.id);
                        vehiclesData = await getVehiclesByKids(kidIds);
                    } catch (error) {
                        console.error('Error loading parent vehicles:', error);
                        vehiclesData = [];
                    }
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
            filtered = filtered.filter(vehicle => vehicle.teamId === teamFilter);
        }

        // Status filter
        if (statusFilter) {
            if (statusFilter === 'active') {
                filtered = filtered.filter(vehicle => vehicle.active);
            } else if (statusFilter === 'inactive') {
                filtered = filtered.filter(vehicle => !vehicle.active);
            } else if (statusFilter === 'in-use') {
                filtered = filtered.filter(vehicle => vehicle.currentKidId);
            } else if (statusFilter === 'available') {
                filtered = filtered.filter(vehicle => !vehicle.currentKidId && vehicle.active);
            }
        }

        setFilteredVehicles(filtered);
    };

    // Helper function to get team name from team ID - TRANSLATED
    const getTeamName = (teamId) => {
        if (!teamId) return t('vehicles.unassigned', 'Unassigned');
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : t('vehicles.unknownTeam', 'Unknown Team');
    };

    // Handle stat card clicks to filter vehicles - UPDATED WITH ACTIVE CARD TRACKING
    const handleStatCardClick = (filterType) => {
        setActiveCardFilter(filterType); // NEW: Set active card

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
        setActiveCardFilter('total'); // NEW: Reset to total
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

    // Handle delete vehicle - TRANSLATED
    const handleDeleteVehicle = async (vehicle) => {
        if (userRole !== 'admin') {
            alert(t('vehicles.delete.noPermission', 'You do not have permission to delete vehicles.'));
            return;
        }

        const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`;

        // Extra confirmation if vehicle is currently assigned - TRANSLATED
        let confirmMessage = t('vehicles.delete.confirm', 'Are you sure you want to delete {vehicleName}?', { vehicleName });
        if (vehicle.currentKidId) {
            confirmMessage += '\n\n' + t('vehicles.delete.warningAssigned', 'WARNING: This vehicle is currently assigned to a racer. Deleting it will remove the assignment.');
        }
        confirmMessage += '\n\n' + t('vehicles.delete.cannotUndo', 'This action cannot be undone.');

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setIsDeleting(vehicle.id);

            // If vehicle is assigned, unassign it first
            if (vehicle.currentKidId) {
                console.log(`🔄 Unassigning vehicle ${vehicle.id} before deletion...`);
                await unassignVehicleFromKid(vehicle.id);
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

    // Status badge function - TRANSLATED
    const getStatusBadge = (vehicle) => {
        if (!vehicle.active) {
            return <span className="badge danger">{t('vehicles.status.inactive', 'Inactive')}</span>;
        }
        if (vehicle.currentKidId) {
            return <span className="badge warning">{t('vehicles.status.inUse', 'In Use')}</span>;
        }
        return <span className="badge success">{t('vehicles.status.available', 'Available')}</span>;
    };

    const getVehicleStats = () => {
        const total = vehicles.length;
        const active = vehicles.filter(v => v.active).length;
        const inUse = vehicles.filter(v => v.currentKidId && v.active).length;
        const available = vehicles.filter(v => !v.currentKidId && v.active).length;

        return { total, active, inUse, available };
    };

    // Mobile card component - TRANSLATED
    const VehicleMobileCard = ({ vehicle }) => (
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
                        <span className="team-name">{getTeamName(vehicle.teamId)}</span>
                    </div>
                </div>
                <div className="vehicle-mobile-detail">
                    <div className="vehicle-mobile-detail-label">{t('vehicles.mobile.licensePlate', 'License Plate')}</div>
                    <div className="vehicle-mobile-detail-value">
                        <span className="license-plate">{vehicle.licensePlate}</span>
                    </div>
                </div>
                <div className="vehicle-mobile-detail">
                    <div className="vehicle-mobile-detail-label">{t('vehicles.mobile.currentUser', 'Current User')}</div>
                    <div className="vehicle-mobile-detail-value">
                        {vehicle.currentKidId ? (
                            <span className="current-user">{t('vehicles.status.assigned', 'Assigned')}</span>
                        ) : (
                            <span className="no-user">{t('vehicles.status.available', 'Available')}</span>
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
            <div className={`admin-page vehicles-page ${appliedTheme}-mode`}>
                {/* Page Title - TRANSLATED */}
                <h1>
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
                    {/* OPTIMIZED Stats Cards - Single Row Layout */}
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
                                <div className="stat-subtitle">{t('vehicles.inFleet', 'In Fleet')}</div>
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
                                <div className="stat-subtitle">{t('vehicles.readyToRace', 'Ready to Race')}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card in-use ${activeCardFilter === 'in-use' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('in-use')}
                            style={{ cursor: 'pointer' }}
                        >
                            <User className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>{t('vehicles.inUse', 'In Use')}</h3>
                                <div className="stat-value">{stats.inUse}</div>
                                <div className="stat-subtitle">{t('vehicles.currentlyRacing', 'Currently Racing')}</div>
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
                                <div className="stat-subtitle">{t('vehicles.readyForAssignment', 'Ready for Assignment')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters - TRANSLATED */}
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
                                <option value="">{t('vehicles.unassigned', 'Unassigned')}</option>
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

                    {/* Results Summary - TRANSLATED */}
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
                            {/* Desktop Table View - TRANSLATED */}
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>{t('vehicles.table.vehicle', 'Vehicle')}</th>
                                        <th>{t('vehicles.table.team', 'Team')}</th>
                                        <th>{t('vehicles.table.licensePlate', 'License Plate')}</th>
                                        <th>{t('vehicles.table.status', 'Status')}</th>
                                        <th>{t('vehicles.table.currentUser', 'Current User')}</th>
                                        <th>{t('vehicles.table.battery', 'Battery')}</th>
                                        <th>{t('vehicles.table.actions', 'Actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredVehicles.map(vehicle => (
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
                                                <span className="team-name">{getTeamName(vehicle.teamId)}</span>
                                            </td>
                                            <td>
                                                <span className="license-plate">{vehicle.licensePlate}</span>
                                            </td>
                                            <td>
                                                {getStatusBadge(vehicle)}
                                            </td>
                                            <td>
                                                {vehicle.currentKidId ? (
                                                    <span className="current-user">{t('vehicles.status.assigned', 'Assigned')}</span>
                                                ) : (
                                                    <span className="no-user">{t('vehicles.status.available', 'Available')}</span>
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
                                    ))}
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