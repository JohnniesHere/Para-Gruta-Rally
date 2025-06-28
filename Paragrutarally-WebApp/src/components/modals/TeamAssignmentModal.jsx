// src/components/TeamAssignmentModal.jsx - Rewritten with High Z-index
import React, { useState, useEffect } from 'react';
import { getAllTeams } from '../../services/teamService';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import {
    IconX as X,
    IconUsers as Users,
    IconUser as User,
    IconCheck as Check,
    IconClock as Clock,
    IconUserPlus as UserPlus,
    IconAlertTriangle as AlertTriangle
} from '@tabler/icons-react';
import './TeamAssignmentModal.css';

const TeamAssignmentModal = ({
                                 isOpen,
                                 onClose,
                                 onAssignTeams,
                                 currentTeamIds = [],
                                 eventName
                             }) => {
    const { t } = useLanguage();
    const { appliedTheme } = useTheme();

    const [teams, setTeams] = useState([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load teams when modal opens
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


            // Don't filter out already assigned teams - show all teams but mark assigned ones as selected
            setTeams(allTeams);

            // Pre-select teams that are already assigned to this event
            setSelectedTeamIds([...currentTeamIds]);


        } catch (err) {
            console.error('❌ Error loading teams:', err);
            setError('Failed to load teams. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTeamToggle = (teamId) => {
        setSelectedTeamIds(prev => {
            if (prev.includes(teamId)) {
                // Remove team from selection
                return prev.filter(id => id !== teamId);
            } else {
                // Add team to selection
                return [...prev, teamId];
            }
        });
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {


            // Call the callback with selected team IDs
            await onAssignTeams(selectedTeamIds);


            onClose();
        } catch (error) {
            console.error('❌ Error saving team assignments:', error);
            setError('Failed to save team assignments. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setSelectedTeamIds([...currentTeamIds]); // Reset to original assignments
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={`team-assignment-overlay ${appliedTheme}-mode`} onClick={handleOverlayClick}>
            <div className="team-assignment-container" onClick={(e) => e.stopPropagation()}>
                <div className="team-assignment-header">
                    <h2>
                        <Users size={24} />
                        {t('events.assignTeams', 'Assign Teams to')} {eventName}
                    </h2>
                    <button className="team-assignment-close" onClick={handleCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="team-assignment-body">
                    {error && (
                        <div className="team-assignment-error">
                            <AlertTriangle className="error-icon" size={20} />
                            <p>{error}</p>
                            <button onClick={loadAvailableTeams} className="retry-button">
                                {t('common.tryAgain', 'Try Again')}
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="team-assignment-loading">
                            <Clock className="loading-spinner" size={32} />
                            <p>{t('teams.loading', 'Loading teams...')}</p>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="team-assignment-empty">
                            <Users size={48} className="empty-icon" />
                            <h3>{t('teams.noTeams', 'No Teams Available')}</h3>
                            <p>{t('teams.noTeamsDescription', 'No active teams found. Create some teams first to assign them to events.')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="team-assignment-instructions">
                                <UserPlus className="instructions-icon" size={20} />
                                <div className="instructions-content">
                                    <p>{t('events.teamAssignmentInstructions', 'Select teams to assign to this event. Click on team cards to select or deselect them.')}</p>
                                    <div className="selection-count">
                                        <strong>{selectedTeamIds.length}</strong> {t('teams.teamsSelected', 'team(s) selected')}
                                    </div>
                                </div>
                            </div>

                            <div className="teams-assignment-grid">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className={`team-assignment-card ${selectedTeamIds.includes(team.id) ? 'selected' : ''}`}
                                        onClick={() => handleTeamToggle(team.id)}
                                    >
                                        {selectedTeamIds.includes(team.id) && (
                                            <div className="team-selection-indicator">
                                                <Check size={16} />
                                            </div>
                                        )}

                                        <div className="team-assignment-card-header">
                                            <Users className="team-card-icon" size={20} />
                                            <h3>{team.name}</h3>
                                        </div>

                                        <div className="team-assignment-details">
                                            {team.teamLeader && (
                                                <div className="team-leader-info">
                                                    <User size={14} />
                                                    <span>{t('teams.leader', 'Leader')}: {team.teamLeader.firstName} {team.teamLeader.lastName}</span>
                                                </div>
                                            )}

                                            <div className="team-members-info">
                                                <Users size={14} />
                                                <span>{team.kidIds?.length || 0} {t('teams.kidsInTeam', 'kids in team')}</span>
                                            </div>

                                            {team.description && (
                                                <div className="team-assignment-description">
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

                <div className="team-assignment-actions">
                    <button
                        className="btn-cancel-assignment"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        className="btn-save-assignment"
                        onClick={handleSave}
                        disabled={isSubmitting || isLoading}
                    >
                        {isSubmitting ? (
                            <>
                                <Clock className="loading-spinner" size={16} />
                                {t('common.saving', 'Saving...')}
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                {t('events.assignTeams', 'Assign')} {selectedTeamIds.length} {t('teams.teams', 'Team(s)')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamAssignmentModal;