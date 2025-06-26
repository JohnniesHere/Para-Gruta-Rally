// src/pages/admin/ViewVehiclePage.jsx - Individual Vehicle Details with Schema Integration and Full Translation Support
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getVehicleById, assignVehicleToKid, unassignVehicle } from '../../services/vehicleService';
import { getKidById } from '../../services/kidService';
import { getTeamById } from '../../services/teamService';
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
    IconInfoCircle as InfoCircle, IconArrowRight as ArrowRight
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
    const [currentKid, setCurrentKid] = useState(null);
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

            // Load current kid info if assigned - WITH BETTER ERROR HANDLING
            if (vehicleData.currentKidId) {
                try {
                    console.log(`🔍 Loading kid data for ID: ${vehicleData.currentKidId}`);
                    const kidData = await getKidById(vehicleData.currentKidId);
                    if (kidData) {
                        setCurrentKid(kidData);
                        console.log(`✅ Kid data loaded successfully for: ${kidData.personalInfo?.firstName}`);
                    } else {
                        console.warn(`⚠️ Kid not found for ID: ${vehicleData.currentKidId}`);
                        setCurrentKid(null);
                    }
                } catch (kidError) {
                    console.error('❌ Error loading kid data:', kidError);
                    // Don't fail the whole page if kid loading fails
                    setCurrentKid(null);
                }
            }

            // Load assigned team info if teamId exists
            if (vehicleData.teamId) {
                try {
                    const teamData = await getTeamById(vehicleData.teamId);
                    setAssignedTeam(teamData);
                } catch (teamError) {
                    console.error('Error loading team data:', teamError);
                    setAssignedTeam(null);
                }
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
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Status info function - TRANSLATED
    const getStatusInfo = () => {
        if (!vehicle?.active) {
            return {
                status: t('viewVehicle.status.inactive', 'Inactive'),
                className: 'status-inactive',
                icon: <XCircle size={20} />,
                description: t('viewVehicle.status.inactiveDescription', 'This vehicle is currently inactive')
            };
        }

        if (vehicle.currentKidId) {
            return {
                status: t('viewVehicle.status.inUse', 'In Use'),
                className: 'status-in-use',
                icon: <User size={20} />,
                description: t('viewVehicle.status.inUseDescription', 'Currently assigned to a racer')
            };
        }

        return {
            status: t('viewVehicle.status.available', 'Available'),
            className: 'status-available',
            icon: <CheckCircle size={20} />,
            description: t('viewVehicle.status.availableDescription', 'Ready for assignment')
        };
    };

    // Battery status function - TRANSLATED
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

    // Vehicle history rendering function - TRANSLATED
    const renderVehicleHistory = () => {
        if (!vehicle.history || vehicle.history.length === 0) {
            return (
                <div className="no-history">
                    <History size={40} className="no-history-icon" />
                    <p>{t('viewVehicle.noUsageHistory', 'No usage history recorded')}</p>
                </div>
            );
        }

        return (
            <div className="history-list">
                {vehicle.history.map((historyItem, index) => {
                    // Handle both old format (string kidId) and new format (object)
                    if (typeof historyItem === 'string') {
                        // Old format: just kidId as string
                        return (
                            <div key={index} className="history-item">
                                <User size={16} />
                                <span>{t('viewVehicle.kidId', 'Kid ID:')} {historyItem}</span>
                            </div>
                        );
                    } else if (typeof historyItem === 'object' && historyItem !== null) {
                        // New format: object with kidId, kidName, assignedAt, assignedBy
                        return (
                            <div key={index} className="history-item enhanced">
                                <User size={16} />
                                <div className="history-item-details">
                                    <div className="history-kid-info">
                                        <span className="kid-name">{historyItem.kidName || `${t('viewVehicle.kidId', 'Kid ID:')} ${historyItem.kidId}`}</span>
                                        {historyItem.assignedAt && (
                                            <span className="assignment-date">
                                                {t('viewVehicle.assigned', 'Assigned:')} {formatDate(historyItem.assignedAt)}
                                            </span>
                                        )}
                                    </div>
                                    {historyItem.assignedBy && (
                                        <span className="assigned-by">{t('viewVehicle.assignedBy', 'by {assignedBy}', { assignedBy: historyItem.assignedBy })}</span>
                                    )}
                                </div>
                            </div>
                        );
                    } else {
                        // Fallback for any unexpected format
                        return (
                            <div key={index} className="history-item">
                                <User size={16} />
                                <span>{t('viewVehicle.unknownAssignment', 'Unknown assignment')}</span>
                            </div>
                        );
                    }
                })}
            </div>
        );
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
                {/* Page Title - TRANSLATED */}
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
                    {/* Header - TRANSLATED */}
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
                        {/* Vehicle Photo and Basic Info - TRANSLATED */}
                        <div className="form-section vehicle-photo-section">
                            <div className="section-header">
                                <Photo className="section-icon" size={24} />
                                <h2>{t('viewVehicle.vehiclePhoto', 'Vehicle Photo')}</h2>
                            </div>
                            <div className="vehicle-photo-container">
                                {vehicle.photo ? (
                                    <img
                                        src={vehicle.photo}
                                        alt={`${vehicle.make} ${vehicle.model}`}
                                        className="vehicle-photo-large"
                                    />
                                ) : (
                                    <div className="vehicle-photo-placeholder-large">
                                        <Car size={80} />
                                        <p>{t('viewVehicle.noPhotoAvailable', 'No photo available')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Information - TRANSLATED */}
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

                        {/* Basic Vehicle Information - TRANSLATED */}
                        <div className="form-section basic-info-section">
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h2>{t('viewVehicle.vehicleInformation', 'Vehicle Information')}</h2>
                            </div>
                            <div className="info-grid">
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

                        {/* Current Assignment - TRANSLATED - IMPROVED ERROR HANDLING */}
                        <div className="form-section assignment-section">
                            <div className="section-header">
                                <User className="section-icon" size={24} />
                                <h2>{t('viewVehicle.currentAssignment', 'Current Assignment')}</h2>
                            </div>
                            <div className="assignment-content">
                                {vehicle.currentKidId ? (
                                    <div className="current-assignment">
                                        {currentKid ? (
                                            <div className="kid-info">
                                                <div className="kid-details">
                                                    <h4>{currentKid.personalInfo?.firstName} {currentKid.personalInfo?.lastName}</h4>
                                                    {canViewSensitiveInfo() && (
                                                        <button
                                                            onClick={() => navigate(`/admin/kids/view/${currentKid.id}`)}
                                                            className="btn-secondary btn-sm"
                                                        >
                                                            {t('viewVehicle.viewKidProfile', 'View Kid\'s Profile')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="assignment-error">
                                                <AlertTriangle size={20} />
                                                <div>
                                                    <p><strong>{t('viewVehicle.assignmentIssue', 'Assignment Issue:')}</strong> {t('viewVehicle.vehicleAssignedTo', 'Vehicle is assigned to kid ID: {kidId}', { kidId: vehicle.currentKidId })}</p>
                                                    <p>{t('viewVehicle.racerProfileNotLoaded', 'However, the racer profile could not be loaded. The racer may have been deleted or there\'s a data inconsistency.')}</p>
                                                    <p className="suggestion">{t('viewVehicle.suggestionReassign', '💡 Consider reassigning this vehicle to resolve the issue.')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="no-assignment">
                                        <Users size={40} className="no-assignment-icon" />
                                        <h4>{t('viewVehicle.availableForAssignment', 'Available for Assignment')}</h4>
                                        <p>{t('viewVehicle.notAssignedToRacer', 'This vehicle is not currently assigned to any racer')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modifications and Notes - Only for admins and instructors - TRANSLATED */}
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

                        {/* Vehicle History - Only for admins and instructors - TRANSLATED */}
                        {canViewSensitiveInfo() && vehicle.history && vehicle.history.length > 0 && (
                            <div className="form-section history-section">
                                <div className="section-header">
                                    <History className="section-icon" size={24} />
                                    <h2>{t('viewVehicle.usageHistory', 'Usage History')}</h2>
                                </div>
                                <div className="history-content">
                                    <p>{t('viewVehicle.previousRacersUsed', 'Previous racers who used this vehicle:')}</p>
                                    {renderVehicleHistory()}
                                </div>
                            </div>
                        )}

                        {/* Timestamps - Only for admins - TRANSLATED */}
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