// src/components/TeamChangeModal.jsx - Simple team change modal
import React, { useState, useEffect } from 'react';
import { getAllTeams } from '../../services/teamService';
import { updateKidTeam } from '../../services/kidService'; // You'll need to create this function
import {
    IconX as X,
    IconCar as Car,
    IconCheck as Check,
    IconLoader as Loader
} from '@tabler/icons-react';
import './TeamChangeModal.css';

const TeamChangeModal = ({ kid, isOpen, onClose, onTeamChanged }) => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(kid?.teamId || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadTeams();
            setSelectedTeamId(kid?.teamId || '');
        }
    }, [isOpen, kid]);

    const loadTeams = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const teamsData = await getAllTeams();
            setTeams(teamsData.filter(team => team.active !== false)); // Only show active teams
        } catch (err) {
            console.error('Error loading teams:', err);
            setError('Failed to load teams');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (selectedTeamId === kid.teamId) {
            onClose(); // No change needed
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            // Update the kid's team in Firestore
            await updateKidTeam(kid.id, selectedTeamId);

            // Notify parent component
            onTeamChanged(kid.id, selectedTeamId);

            onClose();
        } catch (err) {
            console.error('Error updating team:', err);
            setError('Failed to update team');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveTeam = async () => {
        try {
            setIsSaving(true);
            setError(null);

            await updateKidTeam(kid.id, null); // Remove team
            onTeamChanged(kid.id, null);
            onClose();
        } catch (err) {
            console.error('Error removing team:', err);
            setError('Failed to remove team');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="team-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        <Car size={24} />
                        Change Team for {kid?.name}
                    </h3>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-content">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading-state">
                            <Loader className="spinner" size={24} />
                            Loading teams...
                        </div>
                    ) : (
                        <>
                            <div className="current-team">
                                <strong>Current Team:</strong> {kid?.team || 'No Team'}
                            </div>

                            <div className="team-selection">
                                <label>Select New Team:</label>
                                <select
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                    disabled={isSaving}
                                >
                                    <option value="">No Team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name} {team.maxMembers ? `(${team.currentMembers || 0}/${team.maxMembers})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="team-info">
                                {selectedTeamId && teams.find(t => t.id === selectedTeamId) && (
                                    <div className="selected-team-info">
                                        <h4>Team Info:</h4>
                                        <p><strong>Name:</strong> {teams.find(t => t.id === selectedTeamId)?.name}</p>
                                        <p><strong>Instructor:</strong> {teams.find(t => t.id === selectedTeamId)?.instructorName || 'TBD'}</p>
                                        <p><strong>Members:</strong> {teams.find(t => t.id === selectedTeamId)?.currentMembers || 0}/{teams.find(t => t.id === selectedTeamId)?.maxMembers || '∞'}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-actions">
                    {kid?.teamId && (
                        <button
                            className="btn-remove"
                            onClick={handleRemoveTeam}
                            disabled={isSaving || isLoading}
                        >
                            Remove from Team
                        </button>
                    )}

                    <div className="action-buttons">
                        <button
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={isSaving || isLoading || selectedTeamId === kid?.teamId}
                        >
                            {isSaving ? (
                                <>
                                    <Loader className="spinner" size={16} />
                                    Saving...
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