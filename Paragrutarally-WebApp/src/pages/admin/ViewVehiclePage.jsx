// src/pages/admin/ViewVehiclePage.jsx - UPDATED: Team-based Vehicle Assignment System
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getVehicleById } from '../../services/vehicleService'; // UPDATED: Removed vehicle assignment imports
import { getKidById } from '../../services/kidService';
import { getTeamById } from '../../services/teamService';
import { getVehiclePhotoInfo } from '../../services/vehiclePhotoService'; // NEW: For vehicle photos
import {
    IconCar as Car,
    IconArrowLeft as ArrowLeft,
    IconEdit as Edit,
    IconBattery as Battery,
    IconEngine as Engine,
    IconSteeringWheel as Steering,
    IconUser as User,
    IconUsers as Users,
    IconCalendar as Calendar,
    IconPhoto as Photo,
    IconAlertTriangle as AlertTriangle,
    IconSettings as Settings,
    IconClock as Clock,
    IconMapPin as MapPin,
    IconFileText as FileText,
    IconHistory as History,
    IconTool as Tool,
    IconCircle as CheckCircle,
    IconCircle as XCircle,
    IconInfoCircle as InfoCircle,
    IconArrowRight as ArrowRight,
    IconUserCircle as Baby
} from '@tabler/icons-react';
import './ViewVehiclePage.css';

const ViewVehiclePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { appliedTheme } = useTheme();
    const { t, isRTL, isHebrew } = useLanguage();
    const { permissions, userRole, userData } = usePermissions();

    const [vehicle, setVehicle] = useState(null);
    const [assignedKids, setAssignedKids] = useState([]); // UPDATED: Array of kids instead of single kid
    const [assignedTeam, setAssignedTeam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
        loadVehicleData();
    }, [id]);

    const loadVehicleData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const vehicleData = await getVehicleById(id);
            setVehicle(vehicleData);

            // UPDATED: Load multiple assigned kids (currentKidIds array)
            if (vehicleData.currentKidIds && vehicleData.currentKidIds.length > 0) {
                try {
                    const kidPromises = vehicleData.currentKidIds.map(kidId => getKidById(kidId));
                    const kidResults = await Promise.all(kidPromises);
                    // Filter out any null results in case some kids weren't found
                    const validKids = kidResults.filter(kid => kid !== null);
                    setAssignedKids(validKids);

                    if (validKids.length !== vehicleData.currentKidIds.length) {
                        console.warn(`⚠️ Some kids not found. Expected: ${vehicleData.currentKidIds.length}, Found: ${validKids.length}`);
                    }
                } catch (kidError) {
                    console.error('❌ Error loading kids data:', kidError);
                    setAssignedKids([]);
                }
            } else {
                setAssignedKids([]);
            }

            // UPDATED: Load assigned team info (now required since vehicles are team-based)
            if (vehicleData.teamId) {
                try {
                    const teamData = await getTeamById(vehicleData.teamId);
                    setAssignedTeam(teamData);
                } catch (teamError) {
                    console.error('Error loading team data:', teamError);
                    setAssignedTeam(null);
                }
            } else {
                setAssignedTeam(null);
            }

        } catch (error) {
            console.error('Error loading vehicle:', error);
            setError(t('viewVehicle.failedToLoadVehicle', 'Failed to load vehicle details. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        if (canEdit()) {
            navigate(`/admin/vehicles/edit/${id}`);
        }
    };

    const handleBack = () => {
        navigate('/admin/vehicles');
    };

    // UPDATED: Can edit logic for team-based system
    const canEdit = () => {
        if (userRole === 'admin') return true;
        if (userRole === 'instructor' && userData?.teamId === vehicle?.teamId) return true;
        return false;
    };

    const canViewSensitiveInfo = () => {
        return userRole === 'admin' || userRole === 'instructor';
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('viewVehicle.notSpecified', 'Not specified');
        try {
            // Handle Firestore timestamp objects
            if (dateString.seconds) {
                return new Date(dateString.seconds * 1000).toLocaleDateString();
            }
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    // UPDATED: Status info function for team-based assignments
    const getStatusInfo = () => {
        if (!vehicle?.active) {
            return {
                status: t('viewVehicle.status.inactive', 'Inactive'),
                className: 'status-inactive',
                icon: <XCircle size={20} />,
                description: t('viewVehicle.status.inactiveDescription', 'This vehicle is currently inactive')
            };
        }

        // UPDATED: Check if vehicle has any assigned kids
        if (assignedKids.length > 0) {
            return {
                status: t('viewVehicle.status.inUse', 'In Use ({count} kids)', { count: assignedKids.length }),
                className: 'status-in-use',
                icon: <Baby size={20} />,
                description: t('viewVehicle.status.inUseDescription', 'Currently assigned to {count} racer(s)', { count: assignedKids.length })
            };
        }

        return {
            status: t('viewVehicle.status.available', 'Available'),
            className: 'status-available',
            icon: <CheckCircle size={20} />,
            description: t('viewVehicle.status.availableDescription', 'Ready for assignment')
        };
    };

    // Battery status function - same as before
    const getBatteryStatus = () => {
        if (!vehicle?.batteryDate) {
            return {
                status: t('viewVehicle.battery.unknown', 'Unknown'),
                className: 'battery-unknown',
                icon: <InfoCircle size={16} />,
                description: t('viewVehicle.battery.unknownDescription', 'Battery date not recorded')
            };
        }

        try {
            const batteryDate = new Date(vehicle.batteryDate);
            const now = new Date();
            const diffMonths = (now.getFullYear() - batteryDate.getFullYear()) * 12 +
                (now.getMonth() - batteryDate.getMonth());

            if (diffMonths > 6) {
                return {
                    status: t('viewVehicle.battery.needsAttention', 'Needs Attention'),
                    className: 'battery-old',
                    icon: <AlertTriangle size={16} />,
                    description: t('viewVehicle.battery.needsAttentionDescription', 'Battery is over 6 months old')
                };
            } else if (diffMonths > 3) {
                return {
                    status: t('viewVehicle.battery.monitor', 'Monitor'),
                    className: 'battery-aging',
                    icon: <Clock size={16} />,
                    description: t('viewVehicle.battery.monitorDescription', 'Battery should be monitored')
                };
            } else {
                return {
                    status: t('viewVehicle.battery.good', 'Good'),
                    className: 'battery-good',
                    icon: <CheckCircle size={16} />,
                    description: t('viewVehicle.battery.goodDescription', 'Battery is in good condition')
                };
            }
        } catch {
            return {
                status: t('viewVehicle.battery.error', 'Error'),
                className: 'battery-error',
                icon: <XCircle size={16} />,
                description: t('viewVehicle.battery.errorDescription', 'Invalid battery date')
            };
        }
    };

    // Get vehicle photo display
    const getVehiclePhotoDisplay = () => {
        if (!vehicle) return null;

        const photoInfo = getVehiclePhotoInfo(vehicle);

        if (photoInfo.hasPhoto) {
            return (
                <img
                    src={photoInfo.url}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="vehicle-photo-large"
                />
            );
        } else {
            return (
                <div className="vehicle-photo-placeholder-large">
                    <Car size={80} />
                    <p>{t('viewVehicle.noPhotoAvailable', 'No photo available')}</p>
                </div>
            );
        }
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page view-vehicle-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('viewVehicle.loadingVehicleDetails', 'Loading vehicle details...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error || !vehicle) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`admin-page view-vehicle-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('viewVehicle.error', 'Error')}</h3>
                        <p>{error || t('viewVehicle.vehicleNotFound', 'Vehicle not found')}</p>
                        <button onClick={handleBack}
                                className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                            {isHebrew ? (
                                <>
                                    {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                                    <ArrowRight className="btn-icon" size={20}/>
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="btn-icon" size={20}/>
                                    {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const statusInfo = getStatusInfo();
    const batteryInfo = getBatteryStatus();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`admin-page view-vehicle-page ${appliedTheme}-mode`}>
                {/* Page Title */}
                <button onClick={handleBack}
                        className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                    {isHebrew ? (
                        <>
                            {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                            <ArrowRight className="btn-icon" size={20}/>
                        </>
                    ) : (
                        <>
                            <ArrowLeft className="btn-icon" size={20}/>
                            {t('editVehicle.backToVehicles', 'Back to Vehicles')}
                        </>
                    )}
                </button>
                <div className="page-header">
                    <div className="title-section">
                        <h1>
                            <Car size={32} className="page-title-icon"/>
                            {t('viewVehicle.title', '{make} {model}', {make: vehicle.make, model: vehicle.model})}
                            <Settings size={24} className="sparkle-icon"/>
                        </h1>
                    </div>
                </div>

                <div className="admin-container">
                    {/* Header */}
                    <div className="racing-header">
                        <div className="header-content">
                            <div className="title-section">
                                <h1>{vehicle.make} {vehicle.model}</h1>
                                <p className="subtitle">{t('viewVehicle.licensePlateLabel', 'License Plate:')} {vehicle.licensePlate}</p>
                            </div>
                            <div className="header-actions">
                                {canEdit() && (
                                    <button onClick={handleEdit} className="edit-button">
                                        <Edit size={18} />
                                        {t('viewVehicle.editVehicle', 'Edit Vehicle')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="alert success-alert">
                            <CheckCircle size={20} />
                            {successMessage}
                        </div>
                    )}

                    {/* Vehicle Details */}
                    <div className="vehicle-details-grid">
                        {/* Vehicle Photo and Basic Info */}
                        <div className="form-section vehicle-photo-section">
                            <div className="section-header">
                                <Photo className="section-icon" size={24} />
                                <h2>{t('viewVehicle.vehiclePhoto', 'Vehicle Photo')}</h2>
                            </div>
                            <div className="vehicle-photo-container">
                                {getVehiclePhotoDisplay()}
                            </div>
                        </div>

                        {/* Status Information */}
                        <div className="form-section status-section">
                            <div className="section-header">
                                <Settings className="section-icon" size={24} />
                                <h2>{t('viewVehicle.statusInformation', 'Status Information')}</h2>
                            </div>
                            <div className="status-grid">
                                <div className={`status-card ${statusInfo.className}`}>
                                    {statusInfo.icon}
                                    <div className="status-content">
                                        <h3>{statusInfo.status}</h3>
                                        <p>{statusInfo.description}</p>
                                    </div>
                                </div>

                                <div className={`status-card ${batteryInfo.className}`}>
                                    {batteryInfo.icon}
                                    <div className="status-content">
                                        <h3>{t('viewVehicle.battery.label', 'Battery:')} {batteryInfo.status}</h3>
                                        <p>{batteryInfo.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Vehicle Information */}
                        <div className="form-section basic-info-section">
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>{t('viewVehicle.vehicleInformation', 'Vehicle Information')}</h2>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>
                                        <Engine size={16} />
                                        {t('viewVehicle.driveType', 'Drive Type')}
                                    </label>
                                    <span>{vehicle.driveType || t('viewVehicle.notSpecified', 'Not specified')}</span>
                                </div>
                                <div className="info-item">
                                    <label>
                                        <Steering size={16} />
                                        {t('viewVehicle.steeringType', 'Steering Type')}
                                    </label>
                                    <span>{vehicle.steeringType || t('viewVehicle.notSpecified', 'Not specified')}</span>
                                </div>
                                <div className="info-item">
                                    <label>
                                        <Battery size={16} />
                                        {t('viewVehicle.batteryType', 'Battery Type')}
                                    </label>
                                    <span>{vehicle.batteryType || t('viewVehicle.notSpecified', 'Not specified')}</span>
                                </div>
                                <div className="info-item">
                                    <label>
                                        <Calendar size={16} />
                                        {t('viewVehicle.batteryDate', 'Battery Date')}
                                    </label>
                                    <span>{formatDate(vehicle.batteryDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* NEW: Team Assignment Section */}
                        <div className="form-section team-assignment-section">
                            <div className="section-header">
                                <Users className="section-icon" size={24} />
                                <h2>{t('viewVehicle.teamAssignment', 'Team Assignment')}</h2>
                            </div>
                            <div className="team-assignment-content">
                                {assignedTeam ? (
                                    <div className="team-info">
                                        <div className="team-details">
                                            <h4
                                                className="team-name clickable"
                                                onClick={() => navigate(`/admin/teams/view/${assignedTeam.id}`)}
                                            >
                                                {assignedTeam.name}
                                            </h4>
                                            <p>{assignedTeam.description || t('viewVehicle.teamDescription', 'Racing team')}</p>
                                            <div className="team-stats">
                                                <span className="team-stat">
                                                    <Baby size={14} />
                                                    {assignedTeam.kids?.length || 0} {t('viewVehicle.racers', 'racers')}
                                                </span>
                                                <span className="team-stat">
                                                    <Car size={14} />
                                                    {assignedTeam.vehicleIds?.length || 0} {t('viewVehicle.vehicles', 'vehicles')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/admin/teams/view/${assignedTeam.id}`)}
                                                className="btn-secondary btn-sm"
                                            >
                                                {t('viewVehicle.viewTeamDetails', 'View Team Details')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-team-assignment">
                                        <AlertTriangle size={40} className="no-assignment-icon" />
                                        <h4>{t('viewVehicle.notAssignedToTeam', 'Not Assigned to Team')}</h4>
                                        <p>{t('viewVehicle.vehicleNeedsTeam', 'This vehicle needs to be assigned to a team before it can be used by racers.')}</p>
                                        {userRole === 'admin' && (
                                            <button
                                                onClick={() => navigate(`/admin/vehicles/edit/${id}`)}
                                                className="btn-primary btn-sm"
                                            >
                                                {t('viewVehicle.assignToTeam', 'Assign to Team')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* UPDATED: Current Kid Assignments Section */}
                        <div className="form-section assignment-section">
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h2>{t('viewVehicle.currentRacerAssignments', 'Current Racer Assignments')}</h2>
                            </div>
                            <div className="assignment-content">
                                {assignedKids.length > 0 ? (
                                    <div className="current-assignments">
                                        <div className="assignments-header">
                                            <h4>{t('viewVehicle.assignedRacers', 'Assigned Racers')} ({assignedKids.length})</h4>
                                        </div>
                                        <div className="kids-grid">
                                            {assignedKids.map(kid => (
                                                <div key={kid.id} className="kid-assignment-card">
                                                    <div className="kid-info">
                                                        <div className="kid-header">
                                                            <Baby size={18} />
                                                            <span className="race-number">#{kid.participantNumber}</span>
                                                        </div>
                                                        <div className="kid-details">
                                                            <h5>{kid.personalInfo?.firstName} {kid.personalInfo?.lastName}</h5>
                                                            {kid.parentInfo?.name && (
                                                                <p className="parent-info">
                                                                    👨‍👩‍👧‍👦 {kid.parentInfo.name}
                                                                </p>
                                                            )}
                                                            <span className={`status-badge ${kid.signedFormStatus?.toLowerCase() || 'pending'}`}>
                                                                {kid.signedFormStatus || t('viewVehicle.pending', 'Pending')}
                                                            </span>
                                                        </div>
                                                        {canViewSensitiveInfo() && (
                                                            <button
                                                                onClick={() => navigate(`/admin/kids/view/${kid.id}`)}
                                                                className="btn-secondary btn-sm"
                                                            >
                                                                {t('viewVehicle.viewProfile', 'View Profile')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-assignment">
                                        <Users size={40} className="no-assignment-icon" />
                                        <h4>{t('viewVehicle.availableForAssignment', 'Available for Assignment')}</h4>
                                        <p>{t('viewVehicle.notAssignedToRacers', 'This vehicle is not currently assigned to any racers')}</p>
                                        {assignedTeam && (
                                            <p className="assignment-note">
                                                {t('viewVehicle.assignmentNote', 'Racers can be assigned to this vehicle through the team management interface.')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modifications and Notes - Only for admins and instructors */}
                        {canViewSensitiveInfo() && (
                            <div className="form-section notes-section">
                                <div className="section-header">
                                    <FileText className="section-icon" size={24} />
                                    <h2>{t('viewVehicle.modificationsNotes', 'Modifications & Notes')}</h2>
                                </div>
                                <div className="notes-content">
                                    <div className="info-item full-width">
                                        <label>{t('viewVehicle.modifications', 'Modifications')}</label>
                                        <p>{vehicle.modifications || t('viewVehicle.noModificationsRecorded', 'No modifications recorded')}</p>
                                    </div>
                                    <div className="info-item full-width">
                                        <label>{t('viewVehicle.additionalNotes', 'Additional Notes')}</label>
                                        <p>{vehicle.notes || t('viewVehicle.noAdditionalNotes', 'No additional notes')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timestamps - Only for admins */}
                        {userRole === 'admin' && (
                            <div className="form-section timestamps-section">
                                <div className="section-header">
                                    <Clock className="section-icon" size={24} />
                                    <h2>{t('viewVehicle.recordInformation', 'Record Information')}</h2>
                                </div>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>{t('viewVehicle.created', 'Created')}</label>
                                        <span>{formatDate(vehicle.createdAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>{t('viewVehicle.lastUpdated', 'Last Updated')}</label>
                                        <span>{formatDate(vehicle.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ViewVehiclePage;