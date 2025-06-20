// src/pages/admin/ViewKidPage.jsx - TRANSLATED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext'; // Add this import
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getKidById, deleteKid } from '../../services/kidService';
import { getTeamById } from '../../services/teamService';
import { getKidPhotoInfo } from '../../services/kidPhotoService';
import { getVehicleById } from '../../services/vehicleService';
import { getVehiclePhotoInfo } from '../../services/vehiclePhotoService';
import {
    IconUserCircle as Baby,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconArrowLeft as ArrowLeft,
    IconCheck as Check,
    IconCar as Car,
    IconHeart as Heart,
    IconCalendar as Calendar,
    IconNotes as FileText,
    IconTrophy as Trophy,
    IconStar as Star,
    IconFlag as Flag,
    IconChevronDown as ChevronDown,
    IconChevronRight as ChevronRight,
    IconCamera as Camera,
    IconSettings as Settings,
    IconBattery as Battery
} from '@tabler/icons-react';
import './ViewKidPage.css';

const ViewKidPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { appliedTheme } = useTheme();
    const { t } = useLanguage(); // Add this hook
    const { userRole } = usePermissions();

    const [kidData, setKidData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [vehicleData, setVehicleData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // COLLAPSIBLE SECTIONS STATE
    const [collapsedSections, setCollapsedSections] = useState({
        personal: false,
        family: false,
        team: false,
        comments: false
    });

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            setTimeout(() => setSuccessMessage(''), 5000);
        }

        const loadData = async () => {
            await loadKidData();
        };

        loadData();
    }, [id, location.state?.message]);

    const loadKidData = async () => {
        try {
            setIsLoading(true);

            const kid = await getKidById(id);
            if (!kid) {
                setError(t('viewKid.kidNotFound', 'Kid not found!'));
                return;
            }

            // SIMPLIFIED: Role-based access
            if (userRole !== 'admin') {
                setError(t('viewKid.noPermissionView', 'You do not have permission to view this kid.'));
                return;
            }

            setKidData(kid);

            // Load team data if assigned
            if (kid.teamId) {
                try {
                    const team = await getTeamById(kid.teamId);
                    setTeamData(team);
                } catch (teamError) {
                    console.warn('Could not load team data:', teamError);
                }
            }

            // Load vehicle data if assigned
            if (kid.vehicleIds && kid.vehicleIds.length > 0) {
                try {
                    // For now, load the first vehicle (kids typically have one primary vehicle)
                    const vehicle = await getVehicleById(kid.vehicleIds[0]);
                    setVehicleData(vehicle);
                } catch (vehicleError) {
                    console.warn('Could not load vehicle data:', vehicleError);
                }
            }

        } catch (error) {
            console.error('Error loading kid data:', error);
            setError(t('viewKid.loadDataError', 'Failed to load kid data. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    // TOGGLE SECTION COLLAPSE
    const toggleSection = (sectionName) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const handleEdit = () => {
        navigate(`/admin/kids/edit/${id}`);
    };

    const handleDelete = async () => {
        if (userRole !== 'admin') {
            alert(t('viewKid.deletePermissionDenied', 'You do not have permission to delete this kid.'));
            return;
        }

        const kidName = kidData.personalInfo?.firstName || kidData.participantNumber || 'this kid';
        if (window.confirm(t('viewKid.deleteConfirm', 'Are you sure you want to delete {kidName}? This action cannot be undone.', { kidName }))) {
            try {
                await deleteKid(id);
                navigate('/admin/kids', {
                    state: {
                        message: t('viewKid.deleteSuccess', '{kidName} has been removed from the racing program.', { kidName }),
                        type: 'success'
                    }
                });
            } catch (error) {
                console.error('Error deleting kid:', error);
                alert(t('viewKid.deleteFailed', 'Failed to delete kid. Please try again.'));
            }
        }
    };

    const handleBack = () => {
        navigate('/admin/kids');
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'active': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    };

    // Get photo information for display
    const getPhotoDisplay = () => {
        if (!kidData) return null;

        const photoInfo = getKidPhotoInfo(kidData);

        if (photoInfo.hasPhoto) {
            return (
                <div className="racer-avatar with-photo">
                    <img
                        src={photoInfo.url}
                        alt={`${kidData.personalInfo?.firstName || 'Kid'} ${kidData.personalInfo?.lastName || ''}`}
                        className="racer-photo"
                    />
                    <div className="race-number">#{kidData.participantNumber}</div>
                </div>
            );
        } else {
            return (
                <div className="racer-avatar">
                    <div className="racer-photo-placeholder">
                        {photoInfo.placeholder}
                    </div>
                    <div className="race-number">#{kidData.participantNumber}</div>
                </div>
            );
        }
    };

    // Get vehicle display component - UPDATED: Photo moved to bottom
    const getVehicleDisplay = () => {
        if (!vehicleData) {
            return (
                <div className="vehicle-assignment">
                    <div className="no-vehicle">
                        <Car size={40} className="no-vehicle-icon" />
                        <div className="no-vehicle-text">
                            <p>{t('viewKid.noVehicleAssigned', 'No Vehicle Assigned')}</p>
                            <span>{t('viewKid.readyForAssignment', 'Ready for assignment!')}</span>
                        </div>
                    </div>
                </div>
            );
        }

        const vehiclePhotoInfo = getVehiclePhotoInfo(vehicleData);

        return (
            <div className="vehicle-assignment">
                <div className="vehicle-card">
                    <div className="vehicle-details">
                        <h4 className="vehicle-name">
                            {vehicleData.make} {vehicleData.model}
                        </h4>
                        <div className="vehicle-info-grid">
                            <div className="vehicle-detail">
                                <span className="detail-label">{t('viewKid.licensePlate', 'License Plate:')}</span>
                                <span className="license-plate">{vehicleData.licensePlate}</span>
                            </div>
                            <div className="vehicle-detail">
                                <span className="detail-label">{t('viewKid.type', 'Type:')}</span>
                                <span>{vehicleData.driveType} • {vehicleData.steeringType}</span>
                            </div>
                            <div className="vehicle-detail">
                                <span className="detail-label">{t('viewKid.battery', 'Battery:')}</span>
                                <div className="battery-info">
                                    <Battery size={16} />
                                    <span>{vehicleData.batteryType || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="vehicle-detail">
                                <span className="detail-label">{t('viewKid.status', 'Status:')}</span>
                                <span className={`vehicle-status ${vehicleData.active ? 'active' : 'inactive'}`}>
                                    {vehicleData.active ? t('viewKid.vehicleActive', '✅ Active') : t('viewKid.vehicleInactive', '❌ Inactive')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* UPDATED: Actions and photo together at bottom */}
                    <div className="vehicle-actions">
                        <div className="vehicle-actions-buttons">
                            <button
                                onClick={() => navigate(`/admin/vehicles/view/${vehicleData.id}`)}
                                className="btn-vehicle-view"
                            >
                                <Settings size={16} />
                                {t('viewKid.viewVehicle', 'View Vehicle')}
                            </button>
                        </div>

                        {/* UPDATED: Photo moved here without border */}
                        <div className="vehicle-photo-section-bottom">
                            {vehiclePhotoInfo.hasPhoto ? (
                                <img
                                    src={vehiclePhotoInfo.url}
                                    alt={`${vehicleData.make} ${vehicleData.model}`}
                                    className="vehicle-photo-bottom"
                                />
                            ) : (
                                <div className="vehicle-photo-placeholder-bottom">
                                    <Car size={24} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`view-kid-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('viewKid.loadingRacingStarData', 'Loading racing star data...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`view-kid-page ${appliedTheme}-mode`}>
                    <div className="error-container">
                        <h3>{t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button onClick={handleBack} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            {t('editKid.backToKids', 'Back to Kids')}
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const firstName = kidData.personalInfo?.firstName;

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`view-kid-page ${appliedTheme}-mode`}>
                <button onClick={handleBack} className={`back-button ${appliedTheme}-back-button`}>
                    <ArrowLeft className="btn-icon" size={20} />
                    {t('editKid.backToKids', 'Back to Kids')}
                </button>
                <div className="racing-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1>
                                <Star size={32} className="page-title-icon" />
                                {t('viewKid.racingStarProfile', 'Racing Star Profile!')}
                                <Trophy size={24} className="trophy-icon" />
                            </h1>
                            <p className="subtitle">{t('viewKid.meetOurRacer', 'Meet our amazing racer! 🏁')}</p>
                        </div>
                        <div className="header-actions">
                            {userRole === 'admin' && (
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

                {successMessage && (
                    <div className="success-alert">
                        <Check size={20} />
                        {successMessage}
                    </div>
                )}

                <div className="view-kid-container">
                    <div className="hero-section">
                        <div className="hero-content">
                            {getPhotoDisplay()}
                            <div className="hero-info">
                                <h2 className="racer-name">
                                    {userRole === 'admin'
                                        ? `${kidData.personalInfo?.firstName || ''} ${kidData.personalInfo?.lastName || ''}`.trim() || t('viewKid.kidNumber', 'Kid #{number}', { number: kidData.participantNumber })
                                        : t('viewKid.nameRestricted', 'Name Restricted')
                                    }
                                </h2>
                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <Calendar className="stat-icon" size={16} />
                                        <span>{t('viewKid.ageLabel', 'Age: {age}', { age: calculateAge(kidData.personalInfo?.dateOfBirth) })}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Flag className="stat-icon" size={16} />
                                        <span className={`status-badge ${getStatusColor(kidData.signedFormStatus)}`}>
                                            {t(`status.${kidData.signedFormStatus}`, kidData.signedFormStatus || t('status.pending', 'Pending'))}
                                        </span>
                                    </div>
                                    {teamData && (
                                        <div className="stat-item">
                                            <Car className="stat-icon" size={16} />
                                            <span>{t('viewKid.teamLabel', 'Team: {teamName}', { teamName: teamData.name })}</span>
                                        </div>
                                    )}
                                    {vehicleData && (
                                        <div className="stat-item">
                                            <Settings className="stat-icon" size={16} />
                                            <span>{t('viewKid.vehicleLabel', 'Vehicle: {make} {model}', { make: vehicleData.make, model: vehicleData.model })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-grid">
                        {/* COLLAPSIBLE Personal Information */}
                        <div className="info-section personal-section">
                            <div
                                className="section-header clickable"
                                onClick={() => toggleSection('personal')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                <div className="section-header-content">
                                    <Baby className="section-icon" size={24} />
                                    <h3>{t('viewKid.personalProfile', '🏎️ {firstName}\'s Profile', { firstName: firstName || 'Racer' })}</h3>
                                </div>
                                <div className="collapse-indicator">
                                    {collapsedSections.personal ?
                                        <ChevronRight size={20} className="collapse-icon" /> :
                                        <ChevronDown size={20} className="collapse-icon" />
                                    }
                                </div>
                            </div>

                            {!collapsedSections.personal && (
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>{t('editKid.raceNumber', '🏁 Race Number')}</label>
                                        <div className="info-value">{kidData.participantNumber}</div>
                                    </div>

                                    <div className="info-item">
                                        <label>{t('editKid.birthday', '🎂 Date of Birth')}</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.dateOfBirth || 'N/A'}
                                        </div>
                                    </div>

                                    {/* ADD: Photo section in personal info */}
                                    <div className="info-item">
                                        <label>{t('viewKid.racingPhoto', '📸 Racing Photo')}</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.photo ? (
                                                <div className="photo-display">
                                                    <img
                                                        src={kidData.personalInfo.photo}
                                                        alt="Racing photo"
                                                        className="inline-photo"
                                                    />
                                                    <span className="photo-status">{t('viewKid.photoUploaded', '✅ Uploaded')}</span>
                                                </div>
                                            ) : (
                                                <span className="no-photo">{t('viewKid.noPhotoUploaded', '📷 No photo uploaded')}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>{t('viewKid.homeBase', '🏠 Home Base')}</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.address || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>{t('viewKid.superPowersAbilities', '🌟 Super Powers & Abilities')}</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.capabilities || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>{t('viewKid.announcerNotes', '📢 Announcer Notes')}</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.announcersNotes || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* COLLAPSIBLE Family Information */}
                        <div className="info-section family-section">
                            <div
                                className="section-header clickable"
                                onClick={() => toggleSection('family')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                <div className="section-header-content">
                                    <Heart className="section-icon" size={24} />
                                    <h3>{t('viewKid.familyInfo', '👨‍👩‍👧‍👦 {firstName}\'s Family', { firstName: firstName || 'Racer' })}</h3>
                                </div>
                                <div className="collapse-indicator">
                                    {collapsedSections.family ?
                                        <ChevronRight size={20} className="collapse-icon" /> :
                                        <ChevronDown size={20} className="collapse-icon" />
                                    }
                                </div>
                            </div>

                            {!collapsedSections.family && (
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>{t('viewKid.parentGuardian', '👤 Parent/Guardian')}</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.name || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>{t('viewKid.email', '📧 Email')}</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.email || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>{t('viewKid.phone', '📱 Phone')}</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.phone || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>{t('viewKid.grandparents', '👵👴 Grandparents')}</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.grandparentsInfo?.names || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>{t('viewKid.grandparentsPhone', '☎️ Grandparents Phone')}</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.grandparentsInfo?.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* UPDATED: Team & Vehicle Info */}
                        <div className="info-section team-section">
                            <div
                                className="section-header clickable"
                                onClick={() => toggleSection('team')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                <div className="section-header-content">
                                    <Car className="section-icon" size={24} />
                                    <h3>{t('viewKid.teamVehicleInfo', '🏎️ {firstName}\'s Team & Vehicle', { firstName: firstName || 'Racer' })}</h3>
                                </div>
                                <div className="collapse-indicator">
                                    {collapsedSections.team ?
                                        <ChevronRight size={20} className="collapse-icon" /> :
                                        <ChevronDown size={20} className="collapse-icon" />
                                    }
                                </div>
                            </div>

                            {!collapsedSections.team && (
                                <div className="team-vehicle-content">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>{t('viewKid.team', '🏁 Team')}</label>
                                            <div className="info-value">
                                                {teamData ? (
                                                    <span className="team-link" onClick={() => navigate(`/admin/teams/view/${teamData.id}`)}>
                                                        {teamData.name}
                                                    </span>
                                                ) : (
                                                    <span className="no-team">{t('viewKid.noTeamAssigned', 'No Team Assigned')}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <label>{t('viewKid.formStatus', '📋 Form Status')}</label>
                                            <div className="info-value">
                                                <span className={`status-badge ${getStatusColor(kidData.signedFormStatus)}`}>
                                                    {t(`status.${kidData.signedFormStatus}`, kidData.signedFormStatus || t('status.pending', 'Pending'))}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <label>{t('viewKid.safetyDeclaration', '🛡️ Safety Declaration')}</label>
                                            <div className="info-value">
                                                <span className={`declaration-badge ${kidData.signedDeclaration ? 'signed' : 'pending'}`}>
                                                    {kidData.signedDeclaration ? t('viewKid.signed', '✅ Signed') : t('viewKid.pending', '⏳ Pending')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle Assignment Section */}
                                    <div className="vehicle-section">
                                        <div className="vehicle-header">
                                            <Settings size={20} />
                                            <h4>{t('viewKid.racingVehicleAssignment', 'Racing Vehicle Assignment')}</h4>
                                        </div>
                                        {getVehicleDisplay()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* COLLAPSIBLE Comments & Notes */}
                        <div className="info-section comments-section full-width">
                            <div
                                className="section-header clickable"
                                onClick={() => toggleSection('comments')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                <div className="section-header-content">
                                    <FileText className="section-icon" size={24} />
                                    <h3>{t('viewKid.notesComments', '💬 {firstName}\'s Notes & Comments', { firstName: firstName || 'Racer' })}</h3>
                                </div>
                                <div className="collapse-indicator">
                                    {collapsedSections.comments ?
                                        <ChevronRight size={20} className="collapse-icon" /> :
                                        <ChevronDown size={20} className="collapse-icon" />
                                    }
                                </div>
                            </div>

                            {!collapsedSections.comments && (
                                <div className="comments-grid">
                                    <div className="comment-item">
                                        <label>{t('viewKid.parentComments', '👨‍👩‍👧‍👦 Parent Comments')}</label>
                                        <div className="comment-value">
                                            {kidData.comments?.parent || t('viewKid.noComments', 'No comments')}
                                        </div>
                                    </div>

                                    <div className="comment-item">
                                        <label>{t('viewKid.organizationComments', '🏢 Organization Comments')}</label>
                                        <div className="comment-value">
                                            {kidData.comments?.organization || t('viewKid.noComments', 'No comments')}
                                        </div>
                                    </div>

                                    <div className="comment-item">
                                        <label>{t('viewKid.teamLeaderComments', '👨‍🏫 Team Leader Comments')}</label>
                                        <div className="comment-value">
                                            {kidData.comments?.teamLeader || t('viewKid.noComments', 'No comments')}
                                        </div>
                                    </div>

                                    <div className="comment-item">
                                        <label>{t('viewKid.additionalNotes', '🗒️ Additional Notes')}</label>
                                        <div className="comment-value">
                                            {kidData.additionalComments || t('viewKid.noAdditionalNotes', 'No additional notes')}
                                        </div>
                                    </div>

                                    {/* ADD: Instructor Comments Timeline */}
                                    {kidData.instructorsComments && kidData.instructorsComments.length > 0 && (
                                        <div className="comment-item full-width">
                                            <label>{t('viewKid.teamNotesHistory', '👨‍🏫 Team Notes History')}</label>
                                            <div className="comment-value">
                                                <div className="comments-timeline">
                                                    {kidData.instructorsComments.map((comment, index) => (
                                                        <div key={index} className="timeline-comment">
                                                            <div className="comment-header">
                                                                <span className="comment-author">{comment.author}</span>
                                                                <span className="comment-role">({comment.authorRole})</span>
                                                                <span className="comment-date">
                                                                    {new Date(comment.timestamp).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="comment-text">{comment.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ViewKidPage;