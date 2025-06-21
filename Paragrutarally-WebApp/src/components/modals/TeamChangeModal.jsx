// src/components/TeamChangeModal.jsx - CLEAN VERSION with CSS classes only
import React, { useState, useEffect } from 'react';
import { getAllTeams } from '../../services/teamService';
import { updateKidTeam } from '../../services/kidService';
import {
    IconX as X,
    IconCar as Car,
    IconCheck as Check,
    IconLoader as Loader,
    IconAlertTriangle as AlertTriangle,
    IconUsers as Users,
    IconUser as User
} from '@tabler/icons-react';
import './TeamChangeModal.css';

const TeamChangeModal = ({ kid, isOpen, onClose, onTeamChanged }) => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && kid) {
            loadTeams();
            setSelectedTeamId(kid?.teamId || '');
            setError(null);
        }
    }, [isOpen, kid]);

    const loadTeams = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const teamsData = await getAllTeams();
            const activeTeams = teamsData.filter(team => team.active !== false);
            setTeams(activeTeams);
        } catch (err) {
            console.error('Error loading teams:', err);
            setError(`Failed to load teams: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (selectedTeamId === (kid?.teamId || '')) {
            onClose();
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await updateKidTeam(kid.id, selectedTeamId || null);

            if (onTeamChanged) {
                onTeamChanged(kid.id, selectedTeamId || null);
            }
        } catch (err) {
            console.error('Error updating team:', err);
            setError(`Failed to update team: ${err.message}`);
            setIsSaving(false);
        }
    };

    const handleRemoveTeam = async () => {
        try {
            setIsSaving(true);
            setError(null);

            await updateKidTeam(kid.id, null);

            if (onTeamChanged) {
                onTeamChanged(kid.id, null);
            }
        } catch (err) {
            console.error('Error removing team:', err);
            setError(`Failed to remove from team: ${err.message}`);
            setIsSaving(false);
        }
    };

    if (!isOpen || !kid) {
        return null;
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content team-modal-content" onClick={(e) => e.stopPropagation()}>

                {/* Modal Header */}
                <div className="modal-header">
                    <h3 className="modal-title">
                        <Car size={28} className="modal-title-icon" />
                        Change Team for {kid?.name}
                    </h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">

                    {/* Error Alert */}
                    {error && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20} />
                            <div className="alert-content">
                                <strong>Error:</strong> {error}
                                <button
                                    onClick={() => setError(null)}
                                    className="alert-dismiss"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Current Team Section */}
                    <div className="form-section current-team-section">
                        <div className="section-header">
                            <Users className="section-icon" size={20} />
                            <h3>Current Assignment</h3>
                        </div>
                        <div className="card current-team-card">
                            <div className="card-header">
                                <Car className="card-icon" size={16} />
                                <span className="card-title">
                                    <strong>Current Team:</strong> {kid?.team || 'No Team'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading available teams...</p>
                        </div>
                    ) : (
                        <>
                            {/* Team Selection Section */}
                            <div className="form-section team-selection-section">
                                <div className="section-header">
                                    <Car className="section-icon" size={20} />
                                    <h3>Select New Team</h3>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Users className="label-icon" size={16} />
                                        Choose Team Assignment
                                    </label>
                                    <select
                                        className="form-select team-select"
                                        value={selectedTeamId}
                                        onChange={(e) => setSelectedTeamId(e.target.value)}
                                        disabled={isSaving}
                                    >
                                        <option value="">🚫 No Team Assigned</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                🏁 {team.name} {team.kidIds ? `(${team.kidIds.length} members)` : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {teams.length === 0 && !isLoading && (
                                        <div className="empty-state">
                                            <Users className="empty-icon" size={40} />
                                            <h3>No Active Teams</h3>
                                            <p>There are currently no active teams available for assignment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Team Preview */}
                            {selectedTeam && (
                                <div className="form-section team-preview-section">
                                    <div className="section-header">
                                        <Check className="section-icon" size={20} />
                                        <h3>Team Preview</h3>
                                    </div>
                                    <div className="card selected team-preview-card">
                                        <div className="card-header">
                                            <Users className="card-icon" size={18} />
                                            <h4 className="card-title">{selectedTeam.name}</h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="team-details">
                                                <div className="team-detail-item">
                                                    <Users size={14} className="detail-icon" />
                                                    <span><strong>Members:</strong> {selectedTeam.kidIds?.length || 0}</span>
                                                </div>
                                                {selectedTeam.description && (
                                                    <div className="team-detail-item">
                                                        <Car size={14} className="detail-icon" />
                                                        <span><strong>Description:</strong> {selectedTeam.description}</span>
                                                    </div>
                                                )}
                                                {selectedTeam.instructorIds && selectedTeam.instructorIds.length > 0 && (
                                                    <div className="team-detail-item">
                                                        <User size={14} className="detail-icon" />
                                                        <span><strong>Instructors:</strong> {selectedTeam.instructorIds.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Actions */}
                <div className="modal-actions">

                    {/* Remove Button */}
                    {kid?.teamId && (
                        <button
                            className="btn btn-danger btn-remove-team"
                            onClick={handleRemoveTeam}
                            disabled={isSaving || isLoading}
                        >
                            {isSaving ? (
                                <>
                                    <div className="loading-spinner-mini"></div>
                                    Removing...
                                </>
                            ) : (
                                <>
                                    <X size={16} />
                                    Remove from Team
                                </>
                            )}
                        </button>
                    )}

                    {/* Main Action Buttons */}
                    <div className="modal-action-buttons">
                        <button
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            <X size={16} />
                            Cancel
                        </button>

                        <button
                            className={`btn btn-primary ${selectedTeamId === (kid?.teamId || '') ? 'btn-disabled' : ''}`}
                            onClick={handleSave}
                            disabled={isSaving || isLoading || selectedTeamId === (kid?.teamId || '')}
                        >
                            {isSaving ? (
                                <>
                                    <div className="loading-spinner-mini"></div>
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamChangeModal;