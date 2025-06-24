// src/pages/instructor/InstructorVehiclesPage.jsx - FIXED instructor ID logic
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import Dashboard from '../../components/layout/Dashboard';
import {
    IconCar as Car,
    IconEye as Eye,
    IconEdit as Edit,
    IconSearch as Search,
    IconFilter as Filter,
    IconSettings as Settings,
    IconUsers as Users,
    IconCalendar as Calendar
} from '@tabler/icons-react';

const InstructorVehiclesPage = () => {
    const { permissions, userRole, userData, user } = usePermissions();
    const { t } = useLanguage();

    const [vehicles, setVehicles] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Load vehicles and instructor's teams
    useEffect(() => {
        const loadVehicleData = async () => {
            // FIXED: Use same logic as InstructorEventsPage
            const instructorId = user?.uid || userData?.id;

            if (!instructorId || userRole !== 'instructor') {
                console.log('Access check failed:', { instructorId, userRole, userData, user });
                setError(t('instructor.accessDenied', 'Access denied: Instructor credentials required'));
                setLoading(false);
                return;
            }

            try {
                setError('');
                console.log('Loading vehicles for instructor:', instructorId);

                // Load ALL vehicles (instructors can see all but edit only assigned ones)
                const vehiclesQuery = query(
                    collection(db, 'vehicles'),
                    orderBy('name', 'asc')
                );

                const vehiclesSnapshot = await getDocs(vehiclesQuery);
                const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // FIXED: Load instructor's teams using instructorIds array
                const teamsQuery = query(
                    collection(db, 'teams'),
                    where('instructorIds', 'array-contains', instructorId),
                    orderBy('name', 'asc')
                );

                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsData = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log('Found vehicles:', vehiclesData.length);
                console.log('Found teams for instructor:', teamsData.length, teamsData);

                setVehicles(vehiclesData);
                setTeams(teamsData);
            } catch (err) {
                console.error('Error loading vehicle data:', err);
                setError(t('instructor.failedToLoad', 'Failed to load vehicles. Please try again.'));
            } finally {
                setLoading(false);
            }
        };

        loadVehicleData();
    }, [userData, userRole, user, t]);

    // Filter vehicles based on search and filters
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle => {
            const matchesSearch = searchTerm === '' ||
                vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === '' || vehicle.status === statusFilter;
            const matchesType = typeFilter === '' || vehicle.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [vehicles, searchTerm, statusFilter, typeFilter]);

    // Check if instructor can edit this vehicle
    const canEditVehicle = (vehicle) => {
        // Instructor can edit if vehicle is assigned to one of their teams
        return teams.some(team => vehicle.assignedTeams?.includes(team.id));
    };

    // Get vehicle assignment status for instructor
    const getVehicleAssignmentStatus = (vehicle) => {
        const assignedToMyTeams = teams.some(team => vehicle.assignedTeams?.includes(team.id));
        if (assignedToMyTeams) {
            return { status: 'assigned', label: t('vehicles.assignedToYou', 'Assigned to You') };
        }
        if (vehicle.assignedTeams && vehicle.assignedTeams.length > 0) {
            return { status: 'other', label: t('vehicles.assignedToOther', 'Assigned to Other') };
        }
        return { status: 'unassigned', label: t('vehicles.unassigned', 'Unassigned') };
    };

    // Get unique vehicle types and statuses for filters
    const vehicleTypes = [...new Set(vehicles.map(v => v.type).filter(Boolean))];
    const vehicleStatuses = [...new Set(vehicles.map(v => v.status).filter(Boolean))];

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

    // Count vehicles by assignment status
    const myAssignedVehicles = vehicles.filter(v =>
        teams.some(team => v.assignedTeams?.includes(team.id))
    ).length;

    const availableVehicles = vehicles.filter(v =>
        !v.assignedTeams || v.assignedTeams.length === 0
    ).length;

    return (
        <Dashboard userRole={userRole}>
            <div className="admin-page">
                {/* Add styles for highlighting assigned vehicles */}
                <style>
                    {`
                        .vehicle-assigned-to-me {
                            background-color: rgba(139, 69, 255, 0.05) !important;
                            border-left: 4px solid var(--racing-purple) !important;
                        }
                        .vehicle-assigned-to-me:hover {
                            background-color: rgba(139, 69, 255, 0.1) !important;
                        }
                        .badge.info {
                            background-color: #3498db;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 500;
                        }
                    `}
                </style>

                <h1>
                    <Car className="page-title-icon" size={48} />
                    {t('nav.vehicles', 'Vehicles')}
                </h1>

                <div className="admin-container">
                    {/* Racing Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>
                                    <Car size={40} />
                                    {t('nav.vehicles', 'Vehicle Management')}
                                </h1>
                                <p className="subtitle">
                                    {t('instructor.manageVehicles', 'View all vehicles and manage your assigned ones')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">
                                <Car size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.totalVehicles', 'Total Vehicles')}</h3>
                                <div className="stat-value">{vehicles.length}</div>
                                <div className="stat-subtitle">{t('stats.inFleet', 'In Fleet')}</div>
                            </div>
                        </div>

                        <div className="stat-card instructors">
                            <div className="stat-icon">
                                <Settings size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.yourVehicles', 'Your Vehicles')}</h3>
                                <div className="stat-value">{myAssignedVehicles}</div>
                                <div className="stat-subtitle">{t('stats.assignedToYou', 'Assigned to You')}</div>
                            </div>
                        </div>

                        <div className="stat-card parents">
                            <div className="stat-icon">
                                <Calendar size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.available', 'Available')}</h3>
                                <div className="stat-value">{availableVehicles}</div>
                                <div className="stat-subtitle">{t('stats.unassigned', 'Unassigned')}</div>
                            </div>
                        </div>

                        <div className="stat-card teams">
                            <div className="stat-icon">
                                <Users size={40} />
                            </div>
                            <div className="stat-content">
                                <h3>{t('stats.yourTeams', 'Your Teams')}</h3>
                                <div className="stat-value">{teams.length}</div>
                                <div className="stat-subtitle">{t('stats.managed', 'Managed')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
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
                                    placeholder={t('vehicles.searchPlaceholder', 'Search by name, license plate, or model...')}
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

                        <div className="filter-container">
                            <label className="filter-label">
                                <Filter size={16} />
                                {t('common.status', 'Status')}
                            </label>
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">{t('common.allStatuses', 'All Statuses')}</option>
                                {vehicleStatuses.map(status => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Car size={16} />
                                {t('common.type', 'Type')}
                            </label>
                            <select
                                className="filter-select"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="">{t('common.allTypes', 'All Types')}</option>
                                {vehicleTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Results Summary */}
                    {(searchTerm || statusFilter || typeFilter) && (
                        <div className="results-summary">
                            <span>{t('common.showing', 'Showing')} {filteredVehicles.length} {t('common.results', 'results')}</span>
                            {searchTerm && <span className="search-applied">for "{searchTerm}"</span>}
                            {statusFilter && <span className="filter-applied">{t('common.status', 'status')}: {statusFilter}</span>}
                            {typeFilter && <span className="filter-applied">{t('common.type', 'type')}: {typeFilter}</span>}
                        </div>
                    )}

                    {/* Vehicles Table */}
                    <div className="table-container">
                        {filteredVehicles.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Car size={80} />
                                </div>
                                <h3>{t('vehicles.noVehiclesFound', 'No Vehicles Found')}</h3>
                                <p>
                                    {searchTerm || statusFilter || typeFilter
                                        ? t('vehicles.noVehiclesMatchFilter', 'No vehicles match your current filter')
                                        : t('vehicles.noVehiclesAvailable', 'No vehicles available in the system')
                                    }
                                </p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>{t('vehicles.name', 'Name')}</th>
                                    <th>{t('vehicles.type', 'Type')}</th>
                                    <th>{t('vehicles.licensePlate', 'License Plate')}</th>
                                    <th>{t('vehicles.batteryType', 'Battery Type')}</th>
                                    <th>{t('vehicles.batteryExpDate', 'Battery Exp.')}</th>
                                    <th>{t('vehicles.steeringType', 'Steering')}</th>
                                    <th>{t('vehicles.status', 'Status')}</th>
                                    <th>{t('vehicles.assignment', 'Assignment')}</th>
                                    <th>{t('common.actions', 'Actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredVehicles.map(vehicle => {
                                    const assignmentStatus = getVehicleAssignmentStatus(vehicle);
                                    return (
                                        <tr key={vehicle.id} className={assignmentStatus.status === 'assigned' ? 'vehicle-assigned-to-me' : ''}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {assignmentStatus.status === 'assigned' && (
                                                        <span style={{
                                                            fontSize: '16px',
                                                            title: t('vehicles.assignedToMyTeams', 'Assigned to my teams')
                                                        }}>
                                                            🏁
                                                        </span>
                                                    )}
                                                    <strong>{vehicle.name}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                    <span className="badge secondary">
                                                        {vehicle.type || t('common.unknown', 'Unknown')}
                                                    </span>
                                            </td>
                                            <td>
                                                <code style={{
                                                    background: 'var(--bg-tertiary)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}>
                                                    {vehicle.licensePlate || t('common.notSet', 'Not Set')}
                                                </code>
                                            </td>
                                            <td>
                                                <span className="badge info">
                                                    {vehicle.batteryType || t('common.notSpecified', 'Not Specified')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '12px', color: vehicle.batteryExpDate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                    {vehicle.batteryExpDate ?
                                                        new Date(vehicle.batteryExpDate).toLocaleDateString() :
                                                        t('common.notSet', 'Not Set')
                                                    }
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge secondary">
                                                    {vehicle.steeringType || t('common.notSpecified', 'Not Specified')}
                                                </span>
                                            </td>
                                            <td>
                                                    <span className={`status-badge ${
                                                        vehicle.status === 'active' ? 'ready' :
                                                            vehicle.status === 'maintenance' ? 'pending' : 'inactive'
                                                    }`}>
                                                        {vehicle.status || t('common.unknown', 'unknown')}
                                                    </span>
                                            </td>
                                            <td>
                                                    <span className={`badge ${
                                                        assignmentStatus.status === 'assigned' ? 'success' :
                                                            assignmentStatus.status === 'other' ? 'warning' : 'secondary'
                                                    }`}>
                                                        {assignmentStatus.label}
                                                    </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Link
                                                        to={`/instructor/vehicles/view/${vehicle.id}`}
                                                        className="btn-action view"
                                                        title={t('common.view', 'View')}
                                                    >
                                                        <Eye size={14} />
                                                    </Link>
                                                    {canEditVehicle(vehicle) && (
                                                        <Link
                                                            to={`/instructor/vehicles/edit/${vehicle.id}`}
                                                            className="btn-action edit"
                                                            title={t('common.edit', 'Edit')}
                                                        >
                                                            <Edit size={14} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default InstructorVehiclesPage;