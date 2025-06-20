// src/components/modals/TeamAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { getAllTeams } from '../../services/teamService';
import {
    IconX as X,
    IconUsers as Users,
    IconUser as User,
    IconCheck as Check,
    IconLoader as Loader
} from '@tabler/icons-react';
import './TeamAssignmentModal.css';

const TeamAssignmentModal = ({ isOpen, onClose, onAssignTeams, currentTeamIds = [], eventName }) => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadAvailableTeams();
            setSelectedTeamIds([]); // Reset selection when modal opens
        }
    }, [isOpen, currentTeamIds]);

    const loadAvailableTeams = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const allTeams = await getAllTeams({ active: true });
            // Filter out teams that are already assigned to this event
            const availableTeams = allTeams.filter(team => !currentTeamIds.includes(team.id));
            setTeams(availableTeams);
        } catch (err) {
            console.error('Error loading teams:', err);
            setError('Failed to load teams. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeamToggle = (teamId) => {
        setSelectedTeamIds(prev => {
            if (prev.includes(teamId)) {
                return prev.filter(id => id !== teamId);
            } else {
                return [...prev, teamId];
            }
        });
    };

    const handleAccept = () => {
        if (selectedTeamIds.length > 0) {
            onAssignTeams(selectedTeamIds);
        }
        onClose();
    };

    const handleCancel = () => {
        setSelectedTeamIds([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="team-assignment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <Users size={24} />
                        Assign Teams to {eventName}
                    </h2>
                    <button className="modal-close" onClick={handleCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                            <button onClick={loadAvailableTeams} className="retry-button">
                                Try Again
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading-container">
                            <Loader className="loading-spinner" size={32} />
                            <p>Loading available teams...</p>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} className="empty-icon" />
                            <h3>No Available Teams</h3>
                            <p>All active teams are already assigned to this event, or no teams exist.</p>
                        </div>
                    ) : (
                        <>
                            <div className="modal-instructions">
                                <p>Select teams to assign to this event. Click on team cards to select them.</p>
                                <div className="selection-count">
                                    {selectedTeamIds.length} team{selectedTeamIds.length !== 1 ? 's' : ''} selected
                                </div>
                            </div>

                            <div className="teams-grid">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className={`team-card ${selectedTeamIds.includes(team.id) ? 'selected' : ''}`}
                                        onClick={() => handleTeamToggle(team.id)}
                                    >
                                        {selectedTeamIds.includes(team.id) && (
                                            <div className="selection-indicator">
                                                <Check size={16} />
                                            </div>
                                        )}

                                        <div className="team-card-header">
                                            <Users className="team-icon" size={20} />
                                            <h3>{team.name}</h3>
                                        </div>

                                        <div className="team-details">
                                            {team.teamLeader && (
                                                <div className="team-leader">
                                                    <User size={14} />
                                                    <span>Leader: {team.teamLeader.firstName} {team.teamLeader.lastName}</span>
                                                </div>
                                            )}

                                            <div className="team-member-count">
                                                <Users size={14} />
                                                <span>Kids in team: {team.kidIds?.length || 0}</span>
                                            </div>

                                            {team.description && (
                                                <div className="team-description">
                                                    {team.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-cancel"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-accept"
                        onClick={handleAccept}
                        disabled={selectedTeamIds.length === 0 || isLoading}
                    >
                        <Check size={16} />
                        Assign {selectedTeamIds.length} Team{selectedTeamIds.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamAssignmentModal;