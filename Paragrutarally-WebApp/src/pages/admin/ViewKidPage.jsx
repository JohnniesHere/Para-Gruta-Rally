// src/pages/admin/ViewKidPage.jsx - COLLAPSIBLE SECTIONS VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getKidById, deleteKid } from '../../services/kidService';
import { getTeamById } from '../../services/teamService';
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
    IconChevronRight as ChevronRight
} from '@tabler/icons-react';
import './ViewKidPage.css';

const ViewKidPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { appliedTheme } = useTheme();
    const { userRole } = usePermissions();

    const [kidData, setKidData] = useState(null);
    const [teamData, setTeamData] = useState(null);
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
                setError('Kid not found!');
                return;
            }

            // SIMPLIFIED: Role-based access
            if (userRole !== 'admin') {
                setError('You do not have permission to view this kid.');
                return;
            }

            setKidData(kid);

            if (kid.teamId) {
                try {
                    const team = await getTeamById(kid.teamId);
                    setTeamData(team);
                } catch (teamError) {
                    console.warn('Could not load team data:', teamError);
                }
            }

        } catch (error) {
            console.error('Error loading kid data:', error);
            setError('Failed to load kid data. Please try again.');
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
            alert('You do not have permission to delete this kid.');
            return;
        }

        const kidName = kidData.personalInfo?.firstName || kidData.participantNumber || 'this kid';
        if (window.confirm(`Are you sure you want to delete ${kidName}? This action cannot be undone.`)) {
            try {
                await deleteKid(id);
                navigate('/admin/kids', {
                    state: {
                        message: `${kidName} has been removed from the racing program.`,
                        type: 'success'
                    }
                });
            } catch (error) {
                console.error('Error deleting kid:', error);
                alert('Failed to delete kid. Please try again.');
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

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`view-kid-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading racing star data...</p>
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
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={handleBack} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            Back to Kids
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`view-kid-page ${appliedTheme}-mode`}>
                <div className="racing-header">
                    <div className="header-content">
                        <button onClick={handleBack} className="back-button">
                            <ArrowLeft className="btn-icon" size={20} />
                            Back to Kids
                        </button>
                        <div className="title-section">
                            <h1>
                                <Star size={32} className="page-title-icon" />
                                Racing Star Profile!
                                <Trophy size={24} className="trophy-icon" />
                            </h1>
                            <p className="subtitle">Meet our amazing racer! 🏁</p>
                        </div>
                        <div className="header-actions">
                            {userRole === 'admin' && (
                                <button onClick={handleEdit} className="edit-button">
                                    <Edit className="btn-icon" size={18} />
                                    Edit
                                </button>
                            )}
                            {userRole === 'admin' && (
                                <button onClick={handleDelete} className="delete-button">
                                    <Trash2 className="btn-icon" size={18} />
                                    Delete
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
                            <div className="racer-avatar">
                                <Baby size={60} className="avatar-icon" />
                                <div className="race-number">#{kidData.participantNumber}</div>
                            </div>
                            <div className="hero-info">
                                <h2 className="racer-name">
                                    {userRole === 'admin'
                                        ? `${kidData.personalInfo?.firstName || ''} ${kidData.personalInfo?.lastName || ''}`.trim() || `Kid #${kidData.participantNumber}`
                                        : 'Name Restricted'
                                    }
                                </h2>
                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <Calendar className="stat-icon" size={16} />
                                        <span>Age: {calculateAge(kidData.personalInfo?.dateOfBirth)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Flag className="stat-icon" size={16} />
                                        <span className={`status-badge ${getStatusColor(kidData.signedFormStatus)}`}>
                                            {kidData.signedFormStatus || 'Pending'}
                                        </span>
                                    </div>
                                    {teamData && (
                                        <div className="stat-item">
                                            <Car className="stat-icon" size={16} />
                                            <span>Team: {teamData.name}</span>
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
                                    <h3>🏎️ Racer Profile</h3>
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
                                        <label>🏁 Race Number</label>
                                        <div className="info-value">{kidData.participantNumber}</div>
                                    </div>

                                    <div className="info-item">
                                        <label>🎂 Date of Birth</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.dateOfBirth || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>🏠 Home Base</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.address || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>🌟 Super Powers & Abilities</label>
                                        <div className="info-value">
                                            {kidData.personalInfo?.capabilities || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>📢 Announcer Notes</label>
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
                                    <h3>👨‍👩‍👧‍👦 Racing Family</h3>
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
                                        <label>👤 Parent/Guardian</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.name || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>📧 Email</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.email || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>📱 Phone</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.phone || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>👵👴 Grandparents</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.grandparentsInfo?.names || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>☎️ Grandparents Phone</label>
                                        <div className="info-value">
                                            {kidData.parentInfo?.grandparentsInfo?.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* COLLAPSIBLE Team & Racing Info */}
                        <div className="info-section team-section">
                            <div
                                className="section-header clickable"
                                onClick={() => toggleSection('team')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                <div className="section-header-content">
                                    <Car className="section-icon" size={24} />
                                    <h3>🏎️ Racing Team</h3>
                                </div>
                                <div className="collapse-indicator">
                                    {collapsedSections.team ?
                                        <ChevronRight size={20} className="collapse-icon" /> :
                                        <ChevronDown size={20} className="collapse-icon" />
                                    }
                                </div>
                            </div>

                            {!collapsedSections.team && (
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>🏁 Team</label>
                                        <div className="info-value">
                                            {teamData ? (
                                                <span className="team-link" onClick={() => navigate(`/admin/teams/view/${teamData.id}`)}>
                                                    {teamData.name}
                                                </span>
                                            ) : (
                                                <span className="no-team">No Team Assigned</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>📋 Form Status</label>
                                        <div className="info-value">
                                            <span className={`status-badge ${getStatusColor(kidData.signedFormStatus)}`}>
                                                {kidData.signedFormStatus || 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <label>🛡️ Safety Declaration</label>
                                        <div className="info-value">
                                            <span className={`declaration-badge ${kidData.signedDeclaration ? 'signed' : 'pending'}`}>
                                                {kidData.signedDeclaration ? '✅ Signed' : '⏳ Pending'}
                                            </span>
                                        </div>
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
                                    <h3>💬 Racing Notes & Comments</h3>
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
                                        <label>👨‍👩‍👧‍👦 Parent Comments</label>
                                        <div className="comment-value">
                                            {kidData.comments?.parent || 'No comments'}
                                        </div>
                                    </div>

                                    <div className="comment-item">
                                        <label>🏢 Organization Comments</label>
                                        <div className="comment-value">
                                            {kidData.comments?.organization || 'No comments'}
                                        </div>
                                    </div>

                                    <div className="comment-item">
                                        <label>👨‍🏫 Team Leader Comments</label>
                                        <div className="comment-value">
                                            {kidData.comments?.teamLeader || 'No comments'}
                                        </div>
                                    </div>

                                    <div className="comment-item">
                                        <label>🗒️ Additional Notes</label>
                                        <div className="comment-value">
                                            {kidData.additionalComments || 'No additional notes'}
                                        </div>
                                    </div>
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