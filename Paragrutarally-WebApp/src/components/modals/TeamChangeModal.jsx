// src/components/TeamChangeModal.jsx - Fixed with translations
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

    console.log(t('debug.teamChangeModalRender', '🔍 TeamChangeModal render:'), { kid, isOpen, selectedTeamId });

    useEffect(() => {
        if (isOpen && kid) {
            console.log(t('debug.loadingTeamsForModal', '📂 Loading teams for modal...'));
            loadTeams();
            setSelectedTeamId(kid?.teamId || '');
            setError(null);
        }
    }, [isOpen, kid, t]);

    const loadTeams = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const teamsData = await getAllTeams();
            const activeTeams = teamsData.filter(team => team.active !== false);
            setTeams(activeTeams);
            console.log(t('debug.teamsLoadedForModal', '✅ Teams loaded for modal:'), activeTeams);
        } catch (err) {
            console.error(t('debug.errorLoadingTeams', 'Error loading teams:'), err);
            setError(t('teamChange.failedToLoadTeams', 'Failed to load teams: {error}', { error: err.message }));
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
            console.error(t('debug.errorUpdatingTeam', 'Error updating team:'), err);
            setError(t('teamChange.failedToUpdateTeam', 'Failed to update team: {error}', { error: err.message }));
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
            console.error(t('debug.errorRemovingTeam', 'Error removing team:'), err);
            setError(t('teamChange.failedToRemoveFromTeam', 'Failed to remove from team: {error}', { error: err.message }));
            setIsSaving(false);
        }
    };

    const handleTeamCardClick = (teamId) => {
        setSelectedTeamId(teamId);
    };

    if (!isOpen || !kid) {
        return null;
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const kidName = kid?.personalInfo?.firstName || kid?.name || t('common.unnamedKid', 'Unnamed Kid');

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
                                <strong>{t('teamChange.currentTeam', 'Current Team')}:</strong> {kid?.team || t('teamChange.noTeam', 'No Team')}
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
                                        {teams.map(team => (
                                            <div
                                                key={team.id}
                                                className={`team-modal-team-card ${selectedTeamId === team.id ? 'team-modal-selected' : ''}`}
                                                onClick={() => handleTeamCardClick(team.id)}
                                            >
                                                <div className="team-modal-team-header">
                                                    <Users className="team-modal-team-icon" size={18} />
                                                    <span className="team-modal-team-name">{team.name}</span>
                                                    {selectedTeamId === team.id && (
                                                        <Check className="team-modal-selected-icon" size={16} />
                                                    )}
                                                </div>
                                                <div className="team-modal-team-details">
                                                    <div className="team-modal-team-members">
                                                        <Users size={14} />
                                                        <span>
                                                            {team.kidIds?.length || 0} / {team.maxCapacity || 15} {t('teamChange.members', 'members')}
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
                                                </div>
                                            </div>
                                        ))}
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
                    {/* Remove Button */}
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

                        {/* Save Button */}
                        <button
                            className={`team-modal-btn team-modal-btn-primary ${selectedTeamId === (kid?.teamId || '') ? 'team-modal-btn-disabled' : ''}`}
                            onClick={handleSave}
                            disabled={isSaving || isLoading || selectedTeamId === (kid?.teamId || '')}
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