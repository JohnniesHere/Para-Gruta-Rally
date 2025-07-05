// src/pages/instructor/InstructorVehiclesPage.jsx - Team-Based Vehicle Management
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVehiclesByTeam } from '@/services/vehicleService.js';
import { getKidsByTeam } from '@/services/kidService.js';
import {
    assignVehicleToKidInTeam,
    unassignVehicleFromKidInTeam,
    getAvailableTeamVehicles,
    getAssignedTeamVehicles
} from '@/services/vehicleAssignmentService.js';
import './InstructorVehiclesPage.css';
import {usePermissions} from "@/hooks/usePermissions.jsx";

const InstructorVehiclesPage = () => {
    const { user } = usePermissions();
    const { t } = useLanguage();

    // State management
    const [teamVehicles, setTeamVehicles] = useState([]);
    const [teamKids, setTeamKids] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [assignedVehicles, setAssignedVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedKid, setSelectedKid] = useState('');

    // Get user's team (assuming instructor belongs to one team)
    const userTeamId = user?.teamId;

    useEffect(() => {
        if (userTeamId) {
            loadTeamData();
        }
    }, [userTeamId]);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load all team data in parallel
            const [vehicles, kids, available, assigned] = await Promise.all([
                getVehiclesByTeam(userTeamId),
                getKidsByTeam(userTeamId),
                getAvailableTeamVehicles(userTeamId),
                getAssignedTeamVehicles(userTeamId)
            ]);

            setTeamVehicles(vehicles);
            setTeamKids(kids);
            setAvailableVehicles(available);
            setAssignedVehicles(assigned);

        } catch (error) {
            console.error('Error loading team data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignVehicle = async () => {
        if (!selectedVehicle || !selectedKid) {
            alert(t('instructor.vehicles.selectVehicleAndKid', 'Please select both a vehicle and a kid'));
            return;
        }

        try {
            const kid = teamKids.find(k => k.id === selectedKid);
            await assignVehicleToKidInTeam(
                selectedVehicle.id,
                selectedKid,
                kid.personalInfo.firstName + ' ' + kid.personalInfo.lastName,
                user.uid,
                userTeamId
            );

            // Reload data
            await loadTeamData();

            // Close modal and reset
            setAssignmentModalOpen(false);
            setSelectedVehicle(null);
            setSelectedKid('');

            alert(t('instructor.vehicles.assignmentSuccess', 'Vehicle assigned successfully!'));

        } catch (error) {
            console.error('Error assigning vehicle:', error);
            alert(t('instructor.vehicles.assignmentError', 'Failed to assign vehicle: ') + error.message);
        }
    };

    const handleUnassignVehicle = async (vehicleId) => {
        if (!window.confirm(t('instructor.vehicles.confirmUnassign', 'Are you sure you want to unassign this vehicle?'))) {
            return;
        }

        try {
            await unassignVehicleFromKidInTeam(vehicleId, user.uid, userTeamId);
            await loadTeamData();
            alert(t('instructor.vehicles.unassignmentSuccess', 'Vehicle unassigned successfully!'));

        } catch (error) {
            console.error('Error unassigning vehicle:', error);
            alert(t('instructor.vehicles.unassignmentError', 'Failed to unassign vehicle: ') + error.message);
        }
    };

    const getKidName = (kidId) => {
        const kid = teamKids.find(k => k.id === kidId);
        if (!kid) return t('common.unknown', 'Unknown');

        return `${kid.personalInfo.firstName} ${kid.personalInfo.lastName}`.trim() ||
            t('common.unnamedKid', 'Unnamed Kid');
    };

    const getAvailableKidsForVehicle = () => {
        // Return kids who don't have a vehicle assigned
        const assignedKidIds = assignedVehicles.map(v => v.currentKidId);
        return teamKids.filter(kid => !assignedKidIds.includes(kid.id));
    };

    if (!userTeamId) {
        return (
            <div className="instructor-vehicles-page">
                <div className="error-message">
                    {t('instructor.vehicles.noTeamAssigned', 'You are not assigned to any team. Please contact an administrator.')}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="instructor-vehicles-page">
                <div className="loading">{t('common.loading', 'Loading...')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="instructor-vehicles-page">
                <div className="error-message">
                    {t('common.error', 'Error')}: {error}
                    <button onClick={loadTeamData} className="retry-button">
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="instructor-vehicles-page">
            <div className="page-header">
                <h1>{t('instructor.vehicles.title', 'Team Vehicles Management')}</h1>
                <p className="team-info">
                    {t('instructor.vehicles.teamVehicles', 'Managing vehicles for your team')}
                    ({teamVehicles.length} {t('instructor.vehicles.vehiclesTotal', 'vehicles total')})
                </p>
            </div>

            {/* Statistics Overview */}
            <div className="vehicles-stats">
                <div className="stat-card">
                    <h3>{availableVehicles.length}</h3>
                    <p>{t('instructor.vehicles.availableVehicles', 'Available Vehicles')}</p>
                </div>
                <div className="stat-card">
                    <h3>{assignedVehicles.length}</h3>
                    <p>{t('instructor.vehicles.assignedVehicles', 'Assigned Vehicles')}</p>
                </div>
                <div className="stat-card">
                    <h3>{teamKids.length}</h3>
                    <p>{t('instructor.vehicles.teamKids', 'Team Kids')}</p>
                </div>
            </div>

            {/* Available Vehicles Section */}
            <div className="vehicles-section">
                <div className="section-header">
                    <h2>{t('instructor.vehicles.availableForAssignment', 'Available for Assignment')}</h2>
                    {availableVehicles.length > 0 && (
                        <button
                            onClick={() => setAssignmentModalOpen(true)}
                            className="assign-button primary"
                        >
                            {t('instructor.vehicles.assignVehicle', 'Assign Vehicle')}
                        </button>
                    )}
                </div>

                {availableVehicles.length === 0 ? (
                    <div className="empty-state">
                        <p>{t('instructor.vehicles.noAvailableVehicles', 'No vehicles available for assignment.')}</p>
                        <small>
                            {teamVehicles.length === 0
                                ? t('instructor.vehicles.noTeamVehicles', 'Your team has no vehicles assigned. Contact an administrator.')
                                : t('instructor.vehicles.allVehiclesAssigned', 'All team vehicles are currently assigned to kids.')
                            }
                        </small>
                    </div>
                ) : (
                    <div className="vehicles-grid">
                        {availableVehicles.map(vehicle => (
                            <div key={vehicle.id} className="vehicle-card available">
                                <div className="vehicle-info">
                                    <h3>{vehicle.make} {vehicle.model}</h3>
                                    <p className="license-plate">{vehicle.licensePlate}</p>
                                    {vehicle.photo && (
                                        <img src={vehicle.photo} alt="Vehicle" className="vehicle-photo" />
                                    )}
                                    {vehicle.notes && (
                                        <p className="vehicle-notes">{vehicle.notes}</p>
                                    )}
                                </div>
                                <div className="vehicle-actions">
                                    <button
                                        onClick={() => {
                                            setSelectedVehicle(vehicle);
                                            setAssignmentModalOpen(true);
                                        }}
                                        className="assign-button"
                                    >
                                        {t('instructor.vehicles.assign', 'Assign')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assigned Vehicles Section */}
            <div className="vehicles-section">
                <div className="section-header">
                    <h2>{t('instructor.vehicles.currentlyAssigned', 'Currently Assigned')}</h2>
                </div>

                {assignedVehicles.length === 0 ? (
                    <div className="empty-state">
                        <p>{t('instructor.vehicles.noAssignedVehicles', 'No vehicles are currently assigned to kids.')}</p>
                    </div>
                ) : (
                    <div className="vehicles-grid">
                        {assignedVehicles.map(vehicle => (
                            <div key={vehicle.id} className="vehicle-card assigned">
                                <div className="vehicle-info">
                                    <h3>{vehicle.make} {vehicle.model}</h3>
                                    <p className="license-plate">{vehicle.licensePlate}</p>
                                    <div className="assignment-info">
                                        <span className="assigned-to">
                                            {t('instructor.vehicles.assignedTo', 'Assigned to')}:
                                            <strong> {getKidName(vehicle.currentKidId)}</strong>
                                        </span>
                                    </div>
                                    {vehicle.photo && (
                                        <img src={vehicle.photo} alt="Vehicle" className="vehicle-photo" />
                                    )}
                                    {vehicle.notes && (
                                        <p className="vehicle-notes">{vehicle.notes}</p>
                                    )}
                                </div>
                                <div className="vehicle-actions">
                                    <button
                                        onClick={() => handleUnassignVehicle(vehicle.id)}
                                        className="unassign-button"
                                    >
                                        {t('instructor.vehicles.unassign', 'Unassign')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {assignmentModalOpen && (
                <div className="modal-overlay">
                    <div className="assignment-modal">
                        <div className="modal-header">
                            <h2>{t('instructor.vehicles.assignVehicleToKid', 'Assign Vehicle to Kid')}</h2>
                            <button
                                onClick={() => {
                                    setAssignmentModalOpen(false);
                                    setSelectedVehicle(null);
                                    setSelectedKid('');
                                }}
                                className="close-button"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            {/* Vehicle Selection */}
                            <div className="form-group">
                                <label>{t('instructor.vehicles.selectVehicle', 'Select Vehicle')}</label>
                                <select
                                    value={selectedVehicle?.id || ''}
                                    onChange={(e) => {
                                        const vehicle = availableVehicles.find(v => v.id === e.target.value);
                                        setSelectedVehicle(vehicle);
                                    }}
                                    className="form-select"
                                >
                                    <option value="">
                                        {t('instructor.vehicles.chooseVehicle', 'Choose a vehicle...')}
                                    </option>
                                    {availableVehicles.map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Kid Selection */}
                            <div className="form-group">
                                <label>{t('instructor.vehicles.selectKid', 'Select Kid')}</label>
                                <select
                                    value={selectedKid}
                                    onChange={(e) => setSelectedKid(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">
                                        {t('instructor.vehicles.chooseKid', 'Choose a kid...')}
                                    </option>
                                    {getAvailableKidsForVehicle().map(kid => (
                                        <option key={kid.id} value={kid.id}>
                                            {kid.personalInfo.firstName} {kid.personalInfo.lastName}
                                            ({kid.participantNumber})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {getAvailableKidsForVehicle().length === 0 && (
                                <div className="warning-message">
                                    {t('instructor.vehicles.noAvailableKids', 'All kids in your team already have vehicles assigned.')}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setAssignmentModalOpen(false);
                                    setSelectedVehicle(null);
                                    setSelectedKid('');
                                }}
                                className="cancel-button"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={handleAssignVehicle}
                                disabled={!selectedVehicle || !selectedKid || getAvailableKidsForVehicle().length === 0}
                                className="confirm-button"
                            >
                                {t('instructor.vehicles.confirmAssignment', 'Assign Vehicle')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorVehiclesPage;