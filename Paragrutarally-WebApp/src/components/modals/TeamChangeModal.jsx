// src/components/TeamChangeModal.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
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
    const { t, isRTL } = useLanguage();
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [currentTeamName, setCurrentTeamName] = useState('');

    // Initialize modal data when it opens
    useEffect(() => {
        if (isOpen && kid) {
            console.log('🔄 Modal opened for kid:', kid);

            // Set current selection to kid's current team
            const currentTeam = kid?.teamId || '';
            setSelectedTeamId(currentTeam);
            console.log('🎯 Setting initial selected team:', currentTeam);

            // Load teams and current team info
            loadTeams();
            fetchCurrentTeamName();
        } else {
            // Reset state when modal closes
            setTeams([]);
            setSelectedTeamId('');
            setCurrentTeamName('');
            setError(null);
        }
    }, [isOpen, kid]);

    const fetchCurrentTeamName = async () => {
        if (kid?.teamId) {
            try {
                console.log('🔍 Fetching current team name for teamId:', kid.teamId);
                const { getTeamById } = await import('../../services/teamService');
                const team = await getTeamById(kid.teamId);
                const teamName = team?.name || t('teamChange.unknownTeam', 'Unknown Team');
                setCurrentTeamName(teamName);
                console.log('✅ Current team name:', teamName);
            } catch (error) {
                console.error('❌ Error fetching current team:', error);
                setCurrentTeamName(t('teamChange.unknownTeam', 'Unknown Team'));
            }
        } else {
            setCurrentTeamName('');
            console.log('ℹ️ Kid has no current team');
        }
    };

    const loadTeams = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('🔄 Loading all teams...');

            const teamsData = await getAllTeams();
            console.log('📊 Raw teams data:', teamsData);

            // Filter only active teams but don't filter by capacity here
            const activeTeams = teamsData.filter(team => team.active !== false);
            console.log('✅ Active teams:', activeTeams);

            setTeams(activeTeams);

        } catch (err) {
            console.error('❌ Error loading teams:', err);
            setError(t('teamChange.failedToLoadTeams', 'Failed to load teams: {error}', { error: err.message }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const currentTeamId = kid?.teamId || '';

        // If no change, just close
        if (selectedTeamId === currentTeamId) {
            console.log('ℹ️ No team change needed');
            onClose();
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            console.log('💾 Saving team change:', { from: currentTeamId, to: selectedTeamId });

            await updateKidTeam(kid.id, selectedTeamId || null);
            console.log('✅ Team updated successfully');

            if (onTeamChanged) {
                onTeamChanged(kid.id, selectedTeamId || null);
            }

            onClose();
        } catch (err) {
            console.error('❌ Error updating team:', err);
            setError(t('teamChange.failedToUpdateTeam', 'Failed to update team: {error}', { error: err.message }));
            setIsSaving(false);
        }
    };

    const handleRemoveTeam = async () => {
        try {
            setIsSaving(true);
            setError(null);
            console.log('🗑️ Removing kid from current team');

            await updateKidTeam(kid.id, null);
            console.log('✅ Kid removed from team successfully');

            if (onTeamChanged) {
                onTeamChanged(kid.id, null);
            }

            onClose();
        } catch (err) {
            console.error('❌ Error removing team:', err);
            setError(t('teamChange.failedToRemoveFromTeam', 'Failed to remove from team: {error}', { error: err.message }));
            setIsSaving(false);
        }
    };

    const handleTeamCardClick = (teamId) => {
        console.log('🎯 Team card clicked:', teamId);
        setSelectedTeamId(teamId);
    };

    // Check if a team is full (but allow if kid is already in this team)
    const isTeamFull = (team) => {
        const currentMembers = team.kidIds?.length || 0;
        const maxCapacity = team.maxCapacity || 15;
        const isCurrentTeam = team.id === kid?.teamId;

        return currentMembers >= maxCapacity && !isCurrentTeam;
    };

    if (!isOpen || !kid) {
        return null;
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const kidName = kid?.personalInfo?.firstName || kid?.name || t('common.unnamedKid', 'Unnamed Kid');
    const hasTeamChange = selectedTeamId !== (kid?.teamId || '');

    return (
        <div className="team-modal-overlay" onClick={onClose} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>

                {/* Modal Header */}
                <div className="team-modal-header">
                    <div className="team-modal-title">
                        <Car size={28} className="team-modal-title-icon" />
                        <h3>{t('teamChange.changeTeamFor', 'Change Team for {kidName}', { kidName })}</h3>
                    </div>
                    <button
                        className="team-modal-close"
                        onClick={onClose}
                        aria-label={t('common.close', 'Close modal')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="team-modal-body">

                    {/* Error Alert */}
                    {error && (
                        <div className="team-modal-error">
                            <AlertTriangle size={20} />
                            <div className="team-modal-error-content">
                                <strong>{t('common.error', 'Error')}:</strong> {error}
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="team-modal-error-dismiss"
                            >
                                {t('teamChange.dismiss', 'Dismiss')}
                            </button>
                        </div>
                    )}

                    {/* Current Team Section */}
                    <div className="team-modal-section">
                        <div className="team-modal-section-header">
                            <Users className="team-modal-section-icon" size={20} />
                            <h4>{t('teamChange.currentAssignment', 'Current Assignment')}</h4>
                        </div>
                        <div className="team-modal-current-team">
                            <Car className="team-modal-current-icon" size={16} />
                            <span>
                                <strong>{t('teamChange.currentTeam', 'Current Team')}:</strong> {currentTeamName || t('teamChange.noTeam', 'No Team')}
                            </span>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="team-modal-loading">
                            <div className="team-modal-spinner"></div>
                            <p>{t('teamChange.loadingTeams', 'Loading available teams...')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Team Selection Section */}
                            <div className="team-modal-section">
                                <div className="team-modal-section-header">
                                    <Car className="team-modal-section-icon" size={20} />
                                    <h4>{t('teamChange.selectNewTeam', 'Select New Team')}</h4>
                                </div>

                                {/* "No Team" Option */}
                                <div
                                    className={`team-modal-team-card team-modal-no-team ${selectedTeamId === '' ? 'team-modal-selected' : ''}`}
                                    onClick={() => handleTeamCardClick('')}
                                >
                                    <div className="team-modal-team-header">
                                        <X className="team-modal-team-icon" size={18} />
                                        <span className="team-modal-team-name">
                                            🚫 {t('teamChange.noTeamAssignment', 'No Team Assignment')}
                                        </span>
                                        {selectedTeamId === '' && (
                                            <Check className="team-modal-selected-icon" size={16} />
                                        )}
                                    </div>
                                    <div className="team-modal-team-description">
                                        {t('teamChange.removeFromAllTeams', 'Remove this kid from all teams')}
                                    </div>
                                </div>

                                {/* Teams Grid */}
                                {teams.length === 0 ? (
                                    <div className="team-modal-empty">
                                        <Users className="team-modal-empty-icon" size={40} />
                                        <h4>{t('teamChange.noActiveTeams', 'No Active Teams')}</h4>
                                        <p>{t('teamChange.noActiveTeamsDescription', 'There are currently no active teams available for assignment.')}</p>
                                    </div>
                                ) : (
                                    <div className="team-modal-teams-grid">
                                        {teams.map(team => {
                                            const isFull = isTeamFull(team);
                                            const isSelected = selectedTeamId === team.id;
                                            const currentMembers = team.kidIds?.length || 0;
                                            const maxCapacity = team.maxCapacity || 15;

                                            return (
                                                <div
                                                    key={team.id}
                                                    className={`team-modal-team-card ${isSelected ? 'team-modal-selected' : ''} ${isFull ? 'team-modal-team-full' : ''}`}
                                                    onClick={() => !isFull && handleTeamCardClick(team.id)}
                                                    style={{
                                                        opacity: isFull ? 0.6 : 1,
                                                        cursor: isFull ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    <div className="team-modal-team-header">
                                                        <Users className="team-modal-team-icon" size={18} />
                                                        <span className="team-modal-team-name">
                                                            {team.name}
                                                            {isFull && ' (מלא)'}
                                                        </span>
                                                        {isSelected && (
                                                            <Check className="team-modal-selected-icon" size={16} />
                                                        )}
                                                    </div>
                                                    <div className="team-modal-team-details">
                                                        <div className="team-modal-team-members">
                                                            <Users size={14} />
                                                            <span>
                                                                {currentMembers} / {maxCapacity} {t('teamChange.members', 'members')}
                                                            </span>
                                                        </div>
                                                        {team.description && (
                                                            <div className="team-modal-team-description">
                                                                {team.description}
                                                            </div>
                                                        )}
                                                        {team.instructorIds && team.instructorIds.length > 0 && (
                                                            <div className="team-modal-team-instructors">
                                                                <User size={12} />
                                                                <span>
                                                                    {team.instructorIds.length} {team.instructorIds.length !== 1
                                                                    ? t('teamChange.instructors', 'instructors')
                                                                    : t('teamChange.instructor', 'instructor')
                                                                }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {isFull && (
                                                            <div className="team-modal-team-full-notice">
                                                                🔒 {t('teamChange.teamFull', 'Team is full')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Selected Team Preview */}
                            {selectedTeam && (
                                <div className="team-modal-section">
                                    <div className="team-modal-section-header">
                                        <Check className="team-modal-section-icon" size={20} />
                                        <h4>{t('teamChange.selectedTeamPreview', 'Selected Team Preview')}</h4>
                                    </div>
                                    <div className="team-modal-preview">
                                        <div className="team-modal-preview-header">
                                            <Users className="team-modal-preview-icon" size={18} />
                                            <span className="team-modal-preview-name">{selectedTeam.name}</span>
                                        </div>
                                        <div className="team-modal-preview-details">
                                            <div>
                                                <Users size={14} />
                                                <span>
                                                    <strong>{t('teamChange.membersLabel', 'Members')}:</strong> {selectedTeam.kidIds?.length || 0} / {selectedTeam.maxCapacity || 15}
                                                </span>
                                            </div>
                                            {selectedTeam.description && (
                                                <div>
                                                    <Car size={14} />
                                                    <span>
                                                        <strong>{t('teamChange.descriptionLabel', 'Description')}:</strong> {selectedTeam.description}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedTeam.instructorIds && selectedTeam.instructorIds.length > 0 && (
                                                <div>
                                                    <User size={14} />
                                                    <span>
                                                        <strong>{t('teamChange.instructorsLabel', 'Instructors')}:</strong> {selectedTeam.instructorIds.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Actions */}
                <div className="team-modal-actions">
                    {/* Remove Button - Only show if kid currently has a team */}
                    {kid?.teamId && (
                        <button
                            className="team-modal-btn team-modal-btn-danger"
                            onClick={handleRemoveTeam}
                            disabled={isSaving || isLoading}
                        >
                            {isSaving ? (
                                <>
                                    <div className="team-modal-spinner-mini"></div>
                                    {t('teamChange.removing', 'Removing...')}
                                </>
                            ) : (
                                <>
                                    <X size={16} />
                                    {t('teamChange.removeFromTeam', 'Remove from Team')}
                                </>
                            )}
                        </button>
                    )}

                    <div className="team-modal-action-buttons">
                        {/* Cancel Button */}
                        <button
                            className="team-modal-btn team-modal-btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            <X size={16} />
                            {t('common.cancel', 'Cancel')}
                        </button>

                        {/* Save Button - Only enabled if there's a change */}
                        <button
                            className={`team-modal-btn team-modal-btn-primary ${!hasTeamChange ? 'team-modal-btn-disabled' : ''}`}
                            onClick={handleSave}
                            disabled={isSaving || isLoading || !hasTeamChange}
                        >
                            {isSaving ? (
                                <>
                                    <div className="team-modal-spinner-mini"></div>
                                    {t('teamChange.savingChanges', 'Saving Changes...')}
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    {t('teamChange.saveChanges', 'Save Changes!')} 🏁
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