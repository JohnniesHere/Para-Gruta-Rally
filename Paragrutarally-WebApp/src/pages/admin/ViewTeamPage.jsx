// src/pages/admin/ViewTeamPage.jsx - UPDATED: Added team vehicles section
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getTeamWithDetails, deleteTeam } from '@/services/teamService.js';
import { getVehicleById } from '@/services/vehicleService.js'; // NEW: Import for loading team vehicles
import { getVehiclePhotoInfo } from '@/services/vehiclePhotoService.js'; // NEW: Import for vehicle photos
import {
    IconUsers as UsersGroup,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconArrowLeft as ArrowLeft,
    IconArrowRight as ArrowRight,
    IconCheck as Check,
    IconUser as User,
    IconUsers as Users,
    IconUserCircle as Baby,
    IconTrophy as Trophy,
    IconTarget as Target,
    IconStar as Star,
    IconFlag as Flag,
    IconCrown as Crown,
    IconPhone as Phone,
    IconMail as Mail,
    IconCar as Car, // NEW: Import for vehicles
    IconBattery as Battery, // NEW: Import for battery info
    IconSettings as Settings, // NEW: Import for vehicle settings
    IconEngine as Engine, // NEW: Import for engine/drive type
    IconSteeringWheel as Steering, // NEW: Import for steering type
    IconEye as Eye // NEW: Import for view actions
} from '@tabler/icons-react';
import './ViewTeamPage.css';

const ViewTeamPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { appliedTheme } = useTheme();
    const { t, isHebrew, isRTL } = useLanguage();
    const { userRole } = usePermissions();

    const [teamData, setTeamData] = useState(null);
    const [teamVehicles, setTeamVehicles] = useState([]); // NEW: Team vehicles state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const loadTeamData = React.useCallback(async () => {
        try {
            setIsLoading(true);

            // Load team data with details (kids, instructors, team leader)
            const team = await getTeamWithDetails(id);
            if (!team) {
                setError(t('teams.teamNotFoundView', 'Team not found!'));
                return;
            }

            setTeamData(team);

            // NEW: Load team vehicles
            if (team.vehicleIds && team.vehicleIds.length > 0) {
                try {
                    const vehiclePromises = team.vehicleIds.map(vehicleId => getVehicleById(vehicleId));
                    const vehicles = await Promise.all(vehiclePromises);
                    setTeamVehicles(vehicles.filter(vehicle => vehicle !== null));
                } catch (vehicleError) {
                    console.warn('Could not load team vehicles:', vehicleError);
                    setTeamVehicles([]);
                }
            } else {
                setTeamVehicles([]);
            }

        } catch (error) {
            console.error('❌ Error loading team data:', error);
            setError(t('teams.loadTeamDataError', 'Failed to load team data. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        // Check for success message from location state
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear message after 5 seconds
            const timeoutId = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timeoutId);
        }
    }, [location.state?.message]);

    useEffect(() => {
        loadTeamData();
    }, [loadTeamData]);

    const handleEdit = () => {
        navigate(`/admin/teams/edit/${id}`);
    };

    const handleDelete = async () => {
        if (userRole !== 'admin') {
            alert(t('teams.onlyAdminsCanDeleteTeams', 'Only administrators can delete teams.'));
            return;
        }

        if (window.confirm(t('teams.deleteTeamConfirm', 'Are you sure you want to delete team "{teamName}"? This action cannot be undone.', { teamName: teamData.name }))) {
            try {
                await deleteTeam(id);
                navigate('/admin/teams', {
                    state: {
                        message: t('teams.teamDisbanded', 'Team "{teamName}" has been disbanded.', { teamName: teamData.name }),
                        type: 'success'
                    }
                });
            } catch (error) {
                console.error('Error deleting team:', error);
                alert(t('teams.deleteTeamError', 'Failed to delete team. Please try again.'));
            }
        }
    };

    const handleBack = () => {
        navigate('/admin/teams');
    };

    const handleKidClick = (kidId) => {
        navigate(`/admin/kids/view/${kidId}`);
    };

    // NEW: Handle vehicle click
    const handleVehicleClick = (vehicleId) => {
        navigate(`/admin/vehicles/view/${vehicleId}`);
    };

    const getStatusColor = (active) => {
        return active ? 'success' : 'secondary';
    };

    const getTeamPerformance = () => {
        if (!teamData?.kids) return { total: 0, ready: 0, pending: 0 };

        const total = teamData.kids.length;

        // Count kids by their signedFormStatus
        let ready = 0;
        let pending = 0;

        teamData.kids.forEach(kid => {
            // Check various possible status values that indicate "ready"
            const status = kid.signedFormStatus;
            if (status === 'Completed' || status === 'completed' || status === 'Complete' || status === 'complete') {
                ready++;
            } else {
                pending++;
            }
        });

        return { total, ready, pending };
    };

    // NEW: Get team vehicle statistics
    const getVehicleStats = () => {
        const total = teamVehicles.length;
        const active = teamVehicles.filter(v => v.active).length;
        const inUse = teamVehicles.filter(v => v.currentKidIds && v.currentKidIds.length > 0).length;
        const available = teamVehicles.filter(v => v.active && (!v.currentKidIds || v.currentKidIds.length === 0)).length;

        return { total, active, inUse, available };
    };

    // NEW: Get vehicle status badge
    const getVehicleStatusBadge = (vehicle) => {
        if (!vehicle.active) {
            return <span className="badge danger">{t('vehicles.status.inactive', 'Inactive')}</span>;
        }
        if (vehicle.currentKidIds && vehicle.currentKidIds.length > 0) {
            return <span className="badge warning">{t('vehicles.status.inUse', 'In Use')}</span>;
        }
        return <span className="badge success">{t('vehicles.status.available', 'Available')}</span>;
    };

    // NEW: Get assigned kids for a vehicle
    const getAssignedKidsForVehicle = (vehicle) => {
        if (!vehicle.currentKidIds || !teamData?.kids) return [];

        return teamData.kids.filter(kid =>
            vehicle.currentKidIds.includes(kid.id) || kid.vehicleId === vehicle.id
        );
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`view-team-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('teams.loadingRacingTeamData', 'Loading racing team data...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`view-team-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button onClick={handleBack} className={`btn-primary ${isRTL ? 'rtl' : ''}`}>
                            {isHebrew ? (
                                <>
                                    {t('teams.backToTeams', 'Back to Teams')}
                                    <ArrowRight className="btn-icon" size={18} />
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="btn-icon" size={18} />
                                    {t('teams.backToTeams', 'Back to Teams')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const performance = getTeamPerformance();
    const vehicleStats = getVehicleStats(); // NEW: Get vehicle statistics

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`view-team-page ${appliedTheme}-mode`}>
                {/* Racing Theme Header */}
                <button
                    onClick={handleBack}
                    className={`back-button ${appliedTheme}-back-button ${isRTL ? 'rtl' : ''}`}>
                    {isHebrew ? (
                        <>
                            {t('teams.backToTeams', 'Back to Teams')}
                            <ArrowRight className="btn-icon" size={20} />
                        </>
                    ) : (
                        <>
                            <ArrowLeft className="btn-icon" size={20} />
                            {t('teams.backToTeams', 'Back to Teams')}
                        </>
                    )}
                </button>
                <div className="racing-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1>
                                <Trophy size={32} className="page-title-icon" />
                                {t('teams.racingTeamProfile', 'Racing Team Profile!')}
                                <Star size={24} className="star-icon" />
                            </h1>
                            <p className="subtitle">{t('teams.meetAmazingRacingSquad', 'Meet the amazing racing squad! 🏁')}</p>
                        </div>
                        <div className="header-actions">
                            {(userRole === 'admin' || userRole === 'instructor') && (
                                <button onClick={handleEdit} className="edit-button">
                                    <Edit className="btn-icon" size={18} />
                                    {t('general.edit', 'Edit')}
                                </button>
                            )}
                            {userRole === 'admin' && (
                                <button onClick={handleDelete} className="delete-button">
                                    <Trash2 className="btn-icon" size={18} />
                                    {t('general.delete', 'Delete')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="success-alert">
                        <Check size={20} />
                        {successMessage}
                    </div>
                )}

                <div className="view-team-container">
                    {/* Team Hero Section */}
                    <div className="hero-section">
                        <h1 className="team-name-display">{teamData.name}</h1>
                        <div className="hero-content">
                            <div className="team-avatar">
                                <UsersGroup size={60} className="avatar-icon" />
                                <div className="team-status">
                                    <span className={`status-badge ${getStatusColor(teamData.active)}`}>
                                        {teamData.active ? t('teams.activeRacing', '✅ Active') : t('teams.inactiveStatus', '⏸️ Inactive')}
                                    </span>
                                </div>
                            </div>
                            <div className="hero-info">
                                <p className="team-description">
                                    {teamData.description || t('teams.readyToRaceAndConquer', 'Ready to race and conquer the track!')}
                                </p>
                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <Baby className="stat-icon" size={16} />
                                        <span>{t('teams.racersCount', '{count} Kids', { count: performance.total })}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Check className="stat-icon" size={16} />
                                        <span>{t('teams.readyCount', '{count} Ready', { count: performance.ready })}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Users className="stat-icon" size={16} />
                                        <span>{t('teams.instructorsCount', '{count} Instructors', { count: teamData.instructors?.length || 0 })}</span>
                                    </div>
                                    {/* NEW: Vehicle count in hero stats */}
                                    <div className="stat-item">
                                        <Car className="stat-icon" size={16} />
                                        <span>{t('teams.vehiclesCount', '{count} Vehicles', { count: vehicleStats.total })}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Target className="stat-icon" size={16} />
                                        <span>{t('teams.maxCapacity', 'Max: {capacity}', { capacity: teamData.maxCapacity || teamData.maxMembers || 15 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-grid">
                        {/* Team Information */}
                        <div className="info-section team-info-section">
                            <div className="section-header">
                                <Trophy className="section-icon" size={24} />
                                <h3>{t('teams.teamDetails', '🏎️ Team Details')}</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>{t('teams.teamNameLabel', '🏁 Team Name')}</label>
                                    <div className="info-value">{teamData.name}</div>
                                </div>

                                <div className="info-item">
                                    <label>{t('teams.statusLabel', '📊 Status')}</label>
                                    <span className={`status-badge info-value ${getStatusColor(teamData.active)}` }>
                                        {teamData.active ? t('teams.activeAndRacing', '✅ Active & Racing') : t('teams.inactiveTeam', '⏸️ Inactive')}
                                    </span>
                                </div>

                                <div className="info-item">
                                    <label>{t('teams.teamCapacityLabel', '👥 Team Capacity')}</label>
                                    <div className="info-value">
                                        <span className="capacity-display">
                                            {t('teams.capacityDisplay', '{current} / {max} racers', {
                                                current: performance.total,
                                                max: teamData.maxCapacity || teamData.maxMembers || 15
                                            })}
                                        </span>
                                        <div className="capacity-bar">
                                            <div
                                                className="capacity-fill"
                                                style={{ width: `${(performance.total / (teamData.maxCapacity || teamData.maxMembers || 15)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-item full-width">
                                    <label>{t('teams.teamDescriptionLabel', '📝 Team Description')}</label>
                                    <div className="info-value">
                                        {teamData.description || t('teams.defaultTeamDescription', 'This team is ready to race and show their amazing skills on the track!')}
                                    </div>
                                </div>

                                {teamData.notes && (
                                    <div className="info-item full-width">
                                        <label>{t('teams.specialNotes', '🗒️ Special Notes')}</label>
                                        <div className="info-value">{teamData.notes}</div>
                                    </div>
                                )}

                                <div className="info-item">
                                    <label>{t('teams.createdLabel', '📅 Created')}</label>
                                    <div className="info-value">
                                        {teamData.createdAt ?
                                            (teamData.createdAt.seconds ?
                                                    new Date(teamData.createdAt.seconds * 1000).toLocaleDateString() :
                                                    new Date(teamData.createdAt).toLocaleDateString()
                                            ) :
                                            t('teams.unknownDate', 'Unknown')
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Leader & Instructors */}
                        <div className="info-section">
                            <div className="section-header">
                                <Crown className="section-icon" size={24} />
                                <h3>{t('teams.racingCoaches', '👨‍🏫 Racing Coaches')}</h3>
                            </div>
                            <div className="instructors-section">
                                {teamData.teamLeader && (
                                    <div className="team-leader-card">
                                        <div className="leader-header">
                                            <Crown className="leader-icon" size={20} />
                                            <span className="leader-title">{t('teams.teamLeaderLabel', 'Team Leader')}</span>
                                        </div>
                                        <div className="leader-info">
                                            <h4>{teamData.teamLeader.name}</h4>
                                            {teamData.teamLeader.phone && (
                                                <div className="contact-info">
                                                    <Phone size={14} />
                                                    {teamData.teamLeader.phone}
                                                </div>
                                            )}
                                            {teamData.teamLeader.email && (
                                                <div className="contact-info">
                                                    <Mail size={14} />
                                                    {teamData.teamLeader.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="instructors-grid">
                                    {teamData.instructors?.length > 0 ? (
                                        teamData.instructors.map(instructor => (
                                            <div key={instructor.id} className="instructor-card">
                                                <div className="instructor-header">
                                                    <User className="instructor-icon" size={18} />
                                                    <span className="instructor-name">{instructor.name}</span>
                                                </div>
                                                {instructor.phone && (
                                                    <div className="contact-info">
                                                        <Phone size={12} />
                                                        {instructor.phone}
                                                    </div>
                                                )}
                                                {instructor.email && (
                                                    <div className="contact-info">
                                                        <Mail size={12} />
                                                        {instructor.email}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <User className="empty-icon" size={30} />
                                            <p>{t('teams.noInstructorsAssignedYet', 'No instructors assigned yet')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* NEW: Team Vehicles Section */}
                        <div className="info-section vehicles-section full-width">
                            <div className="section-header">
                                <Car className="section-icon" size={24} />
                                <h3>{t('teams.teamVehiclesWithCount', '🏎️ Team Fleet ({total} vehicles)', {
                                    total: vehicleStats.total
                                })}</h3>
                            </div>

                            <div className="vehicles-stats">
                                <div className="stat-card total">
                                    <Car className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{vehicleStats.total}</span>
                                        <span className="stat-label">{t('teams.totalVehicles', 'Total Vehicles')}</span>
                                    </div>
                                </div>

                                <div className="stat-card active">
                                    <Settings className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{vehicleStats.active}</span>
                                        <span className="stat-label">{t('teams.activeVehicles', 'Active')}</span>
                                    </div>
                                </div>

                                <div className="stat-card in-use">
                                    <Battery className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{vehicleStats.inUse}</span>
                                        <span className="stat-label">{t('teams.vehiclesInUse', 'In Use')}</span>
                                    </div>
                                </div>

                                <div className="stat-card available">
                                    <Check className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{vehicleStats.available}</span>
                                        <span className="stat-label">{t('teams.vehiclesAvailable', 'Available')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="vehicles-grid">
                                {teamVehicles?.length > 0 ? (
                                    teamVehicles.map(vehicle => {
                                        const vehiclePhotoInfo = getVehiclePhotoInfo(vehicle);
                                        const assignedKids = getAssignedKidsForVehicle(vehicle);

                                        return (
                                            <div
                                                key={vehicle.id}
                                                className="vehicle-card"
                                                onClick={() => handleVehicleClick(vehicle.id)}
                                            >
                                                <div className="vehicle-header">
                                                    {vehiclePhotoInfo.hasPhoto ? (
                                                        <img
                                                            src={vehiclePhotoInfo.url}
                                                            alt={`${vehicle.make} ${vehicle.model}`}
                                                            className="vehicle-photo"
                                                        />
                                                    ) : (
                                                        <div className="vehicle-photo-placeholder">
                                                            <Car size={24} />
                                                        </div>
                                                    )}
                                                    <div className="vehicle-status-indicator">
                                                        {getVehicleStatusBadge(vehicle)}
                                                    </div>
                                                </div>
                                                <div className="vehicle-info">
                                                    <h4 className="vehicle-name">
                                                        {vehicle.make} {vehicle.model}
                                                    </h4>
                                                    <div className="vehicle-details">
                                                        <div className="license-info">
                                                            🏷️ {vehicle.licensePlate}
                                                        </div>
                                                        <div className="vehicle-specs">
                                                            <span className="drive-type">{vehicle.driveType}</span>
                                                            <span className="steering-type">{vehicle.steeringType}</span>
                                                        </div>
                                                        {vehicle.batteryType && (
                                                            <div className="battery-info">
                                                                <Battery size={14} />
                                                                {vehicle.batteryType}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Current assignment info */}
                                                    <div className="assignment-info">
                                                        {assignedKids.length > 0 ? (
                                                            <div className="assigned-kids">
                                                                <span className="assignment-label">{t('teams.currentlyUsedBy', 'Currently used by:')}</span>
                                                                <div className="assigned-kids-list">
                                                                    {assignedKids.map(kid => (
                                                                        <span
                                                                            key={kid.id}
                                                                            className="assigned-kid"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleKidClick(kid.id);
                                                                            }}
                                                                        >
                                                                            #{kid.participantNumber} {kid.personalInfo?.firstName || 'Racer'}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="no-assignment">
                                                                <span className="available-status">{t('teams.availableForAssignment', '✅ Available for assignment')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-state">
                                        <Car className="empty-icon" size={40} />
                                        <h4>{t('teams.noVehiclesAssignedYet', 'No vehicles assigned yet!')}</h4>
                                        <p>{t('teams.assignVehiclesToTeam', 'This team needs some awesome vehicles to race with! 🏎️')}</p>
                                        {(userRole === 'admin' || userRole === 'instructor') && (
                                            <button
                                                onClick={() => navigate(`/admin/teams/edit/${id}`, { state: { focusVehicles: true } })}
                                                className="assign-vehicles-button"
                                            >
                                                <Car className="btn-icon" size={16} />
                                                {t('teams.assignVehicles', 'Assign Vehicles')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Team Racers */}
                        <div className="info-section racers-section full-width">
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h3>{t('teams.teamRacersWithCount', '🏎️ Team Racers ({current}/{max})', {
                                    current: performance.total,
                                    max: teamData.maxCapacity || teamData.maxMembers || 15
                                })}</h3>
                            </div>

                            <div className="racers-stats">
                                <div className="stat-card ready">
                                    <Check className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{performance.ready}</span>
                                        <span className="stat-label">{t('teams.readyToRace', 'Ready to Race')}</span>
                                    </div>
                                </div>

                                <div className="stat-card pending">
                                    <Flag className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{performance.pending}</span>
                                        <span className="stat-label">{t('teams.gettingReady', 'Getting Ready')}</span>
                                    </div>
                                </div>

                                <div className="stat-card total">
                                    <Trophy className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{performance.total}</span>
                                        <span className="stat-label">{t('teams.totalRacers', 'Total Racers')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="racers-grid">
                                {teamData.kids?.length > 0 ? (
                                    teamData.kids.map(kid => {
                                        // Find the vehicle assigned to this kid
                                        const assignedVehicle = teamVehicles.find(vehicle => vehicle.id === kid.vehicleId);

                                        return (
                                            <div
                                                key={kid.id}
                                                className="racer-card"
                                                onClick={() => handleKidClick(kid.id)}
                                            >
                                                <div className="racer-header">
                                                    <Baby className="racer-icon" size={18} />
                                                    <span className="race-number">#{kid.participantNumber || 'N/A'}</span>
                                                    <span className={`status-dot ${(kid.signedFormStatus || 'pending').toLowerCase()}`}></span>
                                                </div>
                                                <div className="racer-info">
                                                    <h4 className="racer-name">
                                                        {`${kid.personalInfo?.firstName || ''} ${kid.personalInfo?.lastName || ''}`.trim() || t('teams.racingStar', 'Racing Star')}
                                                    </h4>
                                                    <div className="racer-details">
                                                        {kid.parentInfo?.name && (
                                                            <div className="parent-info">
                                                                👨‍👩‍👧‍👦 {kid.parentInfo.name}
                                                            </div>
                                                        )}
                                                        <div className="status-info">
                                                            {t('teams.statusInfo', 'Status: {status}', {
                                                                status: kid.signedFormStatus || t('status.pending', 'Pending')
                                                            })}
                                                        </div>
                                                        {/* NEW: Show assigned vehicle info */}
                                                        {assignedVehicle && (
                                                            <div className="vehicle-assignment-info">
                                                                <Car size={14} />
                                                                <span
                                                                    className="assigned-vehicle-link"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleVehicleClick(assignedVehicle.id);
                                                                    }}
                                                                >
                                                                    {assignedVehicle.make} {assignedVehicle.model}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-state">
                                        <Baby className="empty-icon" size={40} />
                                        <h4>{t('teams.noRacersAssignedYet', 'No racers assigned yet!')}</h4>
                                        <p>{t('teams.waitingForKidsToJoin', 'This team is waiting for some amazing kids to join the race! 🏎️')}</p>
                                        {(userRole === 'admin' || userRole === 'instructor') && (
                                            <button
                                                onClick={() => navigate(`/admin/teams/edit/${id}`, { state: { focusKids: true } })}
                                                className="assign-kids-button"
                                            >
                                                <Baby className="btn-icon" size={16} />
                                                {t('teams.assignRacers', 'Assign Racers')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ViewTeamPage;