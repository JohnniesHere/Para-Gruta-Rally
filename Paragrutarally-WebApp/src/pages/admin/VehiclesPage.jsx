// src/pages/admin/VehiclesPage.jsx - Enhanced with Mobile-Responsive Card Layout and Delete Function
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
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
    const { permissions, userRole, userData } = usePermissions();

    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null); // Track which vehicle is being deleted

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
            setError('Failed to load vehicles. Please try again.');
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

    // Helper function to get team name from team ID
    const getTeamName = (teamId) => {
        if (!teamId) return 'Unassigned';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
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

    // NEW: Handle delete vehicle
    const handleDeleteVehicle = async (vehicle) => {
        if (userRole !== 'admin') {
            alert('You do not have permission to delete vehicles.');
            return;
        }

        const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`;

        // Extra confirmation if vehicle is currently assigned
        let confirmMessage = `Are you sure you want to delete ${vehicleName}?`;
        if (vehicle.currentKidId) {
            confirmMessage += '\n\nWARNING: This vehicle is currently assigned to a racer. Deleting it will remove the assignment.';
        }
        confirmMessage += '\n\nThis action cannot be undone.';

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

            alert(`${vehicleName} has been successfully deleted.`);

        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert(`Failed to delete ${vehicleName}: ${error.message}`);
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

    const getStatusBadge = (vehicle) => {
        if (!vehicle.active) {
            return <span className="badge danger">Inactive</span>;
        }
        if (vehicle.currentKidId) {
            return <span className="badge warning">In Use</span>;
        }
        return <span className="badge success">Available</span>;
    };

    const getVehicleStats = () => {
        const total = vehicles.length;
        const active = vehicles.filter(v => v.active).length;
        const inUse = vehicles.filter(v => v.currentKidId && v.active).length;
        const available = vehicles.filter(v => !v.currentKidId && v.active).length;

        return { total, active, inUse, available };
    };

    // Mobile card component - UPDATED: Add delete button
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
                    <div className="vehicle-mobile-detail-label">Team</div>
                    <div className="vehicle-mobile-detail-value">
                        <span className="team-name">{getTeamName(vehicle.teamId)}</span>
                    </div>
                </div>
                <div className="vehicle-mobile-detail">
                    <div className="vehicle-mobile-detail-label">License Plate</div>
                    <div className="vehicle-mobile-detail-value">
                        <span className="license-plate">{vehicle.licensePlate}</span>
                    </div>
                </div>
                <div className="vehicle-mobile-detail">
                    <div className="vehicle-mobile-detail-label">Current User</div>
                    <div className="vehicle-mobile-detail-value">
                        {vehicle.currentKidId ? (
                            <span className="current-user">Assigned</span>
                        ) : (
                            <span className="no-user">Available</span>
                        )}
                    </div>
                </div>
                <div className="vehicle-mobile-detail">
                    <div className="vehicle-mobile-detail-label">Battery</div>
                    <div className="vehicle-mobile-detail-value">
                        <div className="battery-info">
                            <Battery size={16} />
                            <span>{vehicle.batteryType || 'N/A'}</span>
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
                        title="View Vehicle"
                    >
                        <Eye size={14} />
                        View
                    </button>
                    {canEdit(vehicle) && (
                        <button
                            onClick={() => handleEditVehicle(vehicle.id)}
                            className="btn-mobile-action btn-mobile-edit"
                            title="Edit Vehicle"
                        >
                            <Edit size={14} />
                            Edit
                        </button>
                    )}
                    {canDelete(vehicle) && (
                        <button
                            onClick={() => handleDeleteVehicle(vehicle)}
                            className="btn-mobile-action btn-mobile-delete"
                            title="Delete Vehicle"
                            disabled={isDeleting === vehicle.id}
                        >
                            {isDeleting === vehicle.id ? (
                                <div className="loading-spinner-mini"></div>
                            ) : (
                                <Trash2 size={14} />
                            )}
                            {isDeleting === vehicle.id ? 'Deleting...' : 'Delete'}
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
                        <p>Loading vehicles...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const stats = getVehicleStats();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page vehicles-page ${appliedTheme}-mode`}>
                {/* Page Title */}
                <h1>
                    <Car size={32} className="page-title-icon" />
                    Racing Vehicles
                    <Settings size={24} className="sparkle-icon" />
                </h1>
                <div className="page-header">
                    <div className="header-actions">
                        {(userRole === 'admin' || userRole === 'instructor') && (
                            <button onClick={handleAddVehicle} className="btn-primary">
                                <Plus size={18} />
                                Add Vehicle
                            </button>
                        )}
                    </div>
                </div>
                <div className="vehicle-management-container">
                    {/* Header with stats */}


                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <Car size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>Total Vehicles</h3>
                                <p className="stat-value">{stats.total}</p>
                                <p className="stat-subtitle">In Fleet</p>
                            </div>
                        </div>

                        <div className="stat-card teams">
                            <div className="stat-icon">
                                <Settings size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>Active Vehicles</h3>
                                <p className="stat-value">{stats.active}</p>
                                <p className="stat-subtitle">Ready to Race</p>
                            </div>
                        </div>

                        <div className="stat-card kids">
                            <div className="stat-icon">
                                <User size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>In Use</h3>
                                <p className="stat-value">{stats.inUse}</p>
                                <p className="stat-subtitle">Currently Racing</p>
                            </div>
                        </div>

                        <div className="stat-card open-instructors">
                            <div className="stat-icon">
                                <Battery size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>Available</h3>
                                <p className="stat-value">{stats.available}</p>
                                <p className="stat-subtitle">Ready for Assignment</p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="search-filter-section">
                        <div className="search-container">
                            <label className="search-label">
                                <Search size={16} />
                                Search Vehicles
                            </label>
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by make, model, license plate, or team..."
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
                                Team
                            </label>
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Teams</option>
                                <option value="">Unassigned</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Settings size={16} />
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="in-use">In Use</option>
                                <option value="available">Available</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Summary */}
                    {(searchTerm || teamFilter || statusFilter) && (
                        <div className="results-summary">
                            <Car className="results-icon" size={18} />
                            Showing {filteredVehicles.length} of {vehicles.length} vehicles
                            {searchTerm && <span className="search-applied"> matching "{searchTerm}"</span>}
                            {teamFilter && <span className="filter-applied"> in team "{getTeamName(teamFilter)}"</span>}
                            {statusFilter && <span className="filter-applied"> with status "{statusFilter}"</span>}
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
                            <h3>No Vehicles Found</h3>
                            <p>
                                {searchTerm || teamFilter || statusFilter
                                    ? "No vehicles match your current filters."
                                    : "No vehicles have been added yet."
                                }
                            </p>
                            {(userRole === 'admin' || userRole === 'instructor') && !searchTerm && !teamFilter && !statusFilter && (
                                <button onClick={handleAddVehicle} className="btn-primary">
                                    <Plus size={18} />
                                    Add First Vehicle
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View - UPDATED: Better column widths and add delete button */}
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>Vehicle</th>
                                        <th>Team</th>
                                        <th>License Plate</th>
                                        <th>Status</th>
                                        <th>Current User</th>
                                        <th>Battery</th>
                                        <th>Actions</th>
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
                                                    <span className="current-user">Assigned</span>
                                                ) : (
                                                    <span className="no-user">Available</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="battery-info">
                                                    <Battery size={16} />
                                                    <span>{vehicle.batteryType || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleViewVehicle(vehicle.id)}
                                                        className="btn-action view"
                                                        title="View Vehicle"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {canEdit(vehicle) && (
                                                        <button
                                                            onClick={() => handleEditVehicle(vehicle.id)}
                                                            className="btn-action edit"
                                                            title="Edit Vehicle"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                    {canDelete(vehicle) && (
                                                        <button
                                                            onClick={() => handleDeleteVehicle(vehicle)}
                                                            className="btn-action delete"
                                                            title="Delete Vehicle"
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