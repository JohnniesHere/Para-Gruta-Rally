// src/pages/admin/ViewTeamPage.jsx - Fun Racing Theme View Team Page
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getTeamWithDetails, deleteTeam } from '../../services/teamService';
import {
    IconUsers as UsersGroup,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconArrowLeft as ArrowLeft,
    IconCheck as Check,
    IconAlertTriangle as AlertTriangle,
    IconUser as User,
    IconUsers as Users,
    IconUserCircle as Baby,
    IconNotes as FileText,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconTarget as Target,
    IconStar as Star,
    IconFlag as Flag,
    IconCrown as Crown,
    IconCar as Car,
    IconPhone as Phone,
    IconMail as Mail
} from '@tabler/icons-react';
import './ViewTeamPage.css';

const ViewTeamPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [teamData, setTeamData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Check for success message from location state
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);
        }
        loadTeamData();
    }, [id]);

    const loadTeamData = async () => {
        try {
            setIsLoading(true);

            // Load team data with details (kids, instructors, team leader)
            const team = await getTeamWithDetails(id);
            if (!team) {
                setError('Team not found!');
                return;
            }

            setTeamData(team);

        } catch (error) {
            console.error('Error loading team data:', error);
            setError('Failed to load team data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        navigate(`/admin/teams/edit/${id}`);
    };

    const handleDelete = async () => {
        if (userRole !== 'admin') {
            alert('Only administrators can delete teams.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete team "${teamData.name}"? This action cannot be undone.`)) {
            try {
                await deleteTeam(id);
                navigate('/admin/teams', {
                    state: {
                        message: `Team "${teamData.name}" has been disbanded.`,
                        type: 'success'
                    }
                });
            } catch (error) {
                console.error('Error deleting team:', error);
                alert('Failed to delete team. Please try again.');
            }
        }
    };

    const handleBack = () => {
        navigate('/admin/teams');
    };

    const handleKidClick = (kidId) => {
        navigate(`/admin/kids/view/${kidId}`);
    };

    const getStatusColor = (active) => {
        return active ? 'success' : 'secondary';
    };

    const getTeamPerformance = () => {
        if (!teamData?.kids) return { total: 0, ready: 0, pending: 0 };

        const total = teamData.kids.length;
        const ready = teamData.kids.filter(kid => kid.signedFormStatus === 'Completed').length;
        const pending = teamData.kids.filter(kid => kid.signedFormStatus === 'Pending').length;

        return { total, ready, pending };
    };

    if (isLoading) {
        return (
            <Dashboard requiredRole={userRole}>
                <div className={`view-team-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading racing team data...</p>
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
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={handleBack} className="btn-primary">
                            <ArrowLeft className="btn-icon" size={18} />
                            Back to Teams
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const performance = getTeamPerformance();

    return (
        <Dashboard requiredRole={userRole}>
            <div className={`view-team-page ${appliedTheme}-mode`}>
                {/* Racing Theme Header */}
                <div className="racing-header">
                    <div className="header-content">
                        <button onClick={handleBack} className="back-button">
                            <ArrowLeft className="btn-icon" size={20} />
                            Back to Teams
                        </button>
                        <div className="title-section">
                            <h1>
                                <Trophy size={32} className="page-title-icon" />
                                Racing Team Profile!
                                <Star size={24} className="star-icon" />
                            </h1>
                            <p className="subtitle">Meet the amazing racing squad! 🏁</p>
                        </div>
                        <div className="header-actions">
                            {(userRole === 'admin' || userRole === 'instructor') && (
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
                        <div className="hero-content">
                            <div className="team-avatar">
                                <UsersGroup size={60} className="avatar-icon" />
                                <div className="team-status">
                                    <span className={`status-badge ${getStatusColor(teamData.active)}`}>
                                        {teamData.active ? '✅ Active' : '⏸️ Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="hero-info">
                                <h2 className="team-name">{teamData.name}</h2>
                                <p className="team-description">{teamData.description || 'Ready to race and conquer the track!'}</p>
                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <Baby className="stat-icon" size={16} />
                                        <span>{performance.total} Racers</span>
                                    </div>
                                    <div className="stat-item">
                                        <Check className="stat-icon" size={16} />
                                        <span>{performance.ready} Ready</span>
                                    </div>
                                    <div className="stat-item">
                                        <Users className="stat-icon" size={16} />
                                        <span>{teamData.instructors?.length || 0} Instructors</span>
                                    </div>
                                    <div className="stat-item">
                                        <Target className="stat-icon" size={16} />
                                        <span>Max: {teamData.maxCapacity}</span>
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
                                <h3>🏎️ Team Details</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>🏁 Team Name</label>
                                    <div className="info-value">{teamData.name}</div>
                                </div>

                                <div className="info-item">
                                    <label>📊 Status</label>
                                    <div className="info-value">
                                        <span className={`status-badge ${getStatusColor(teamData.active)}`}>
                                            {teamData.active ? '✅ Active & Racing' : '⏸️ Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <label>👥 Team Capacity</label>
                                    <div className="info-value">
                                        <span className="capacity-display">
                                            {performance.total} / {teamData.maxCapacity} racers
                                        </span>
                                        <div className="capacity-bar">
                                            <div
                                                className="capacity-fill"
                                                style={{ width: `${(performance.total / teamData.maxCapacity) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-item full-width">
                                    <label>📝 Team Description</label>
                                    <div className="info-value">
                                        {teamData.description || 'This team is ready to race and show their amazing skills on the track!'}
                                    </div>
                                </div>

                                {teamData.notes && (
                                    <div className="info-item full-width">
                                        <label>🗒️ Special Notes</label>
                                        <div className="info-value">{teamData.notes}</div>
                                    </div>
                                )}

                                <div className="info-item">
                                    <label>📅 Created</label>
                                    <div className="info-value">
                                        {teamData.createdAt ? new Date(teamData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Leader & Instructors */}
                        <div className="info-section instructors-section">
                            <div className="section-header">
                                <Crown className="section-icon" size={24} />
                                <h3>👨‍🏫 Racing Coaches</h3>
                            </div>

                            {teamData.teamLeader && (
                                <div className="team-leader-card">
                                    <div className="leader-header">
                                        <Crown className="leader-icon" size={20} />
                                        <span className="leader-title">Team Leader</span>
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
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <User className="empty-icon" size={30} />
                                        <p>No instructors assigned yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Team Racers */}
                        <div className="info-section racers-section full-width">
                            <div className="section-header">
                                <Baby className="section-icon" size={24} />
                                <h3>🏎️ Team Racers ({performance.total}/{teamData.maxCapacity})</h3>
                            </div>

                            <div className="racers-stats">
                                <div className="stat-card ready">
                                    <Check className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{performance.ready}</span>
                                        <span className="stat-label">Ready to Race</span>
                                    </div>
                                </div>

                                <div className="stat-card pending">
                                    <Flag className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{performance.pending}</span>
                                        <span className="stat-label">Getting Ready</span>
                                    </div>
                                </div>

                                <div className="stat-card total">
                                    <Trophy className="stat-icon" size={20} />
                                    <div className="stat-info">
                                        <span className="stat-number">{performance.total}</span>
                                        <span className="stat-label">Total Racers</span>
                                    </div>
                                </div>
                            </div>

                            <div className="racers-grid">
                                {teamData.kids?.length > 0 ? (
                                    teamData.kids.map(kid => (
                                        <div
                                            key={kid.id}
                                            className="racer-card"
                                            onClick={() => handleKidClick(kid.id)}
                                        >
                                            <div className="racer-header">
                                                <Baby className="racer-icon" size={18} />
                                                <span className="race-number">#{kid.participantNumber}</span>
                                                <span className={`status-dot ${kid.signedFormStatus?.toLowerCase()}`}></span>
                                            </div>
                                            <div className="racer-info">
                                                <h4 className="racer-name">
                                                    {`${kid.personalInfo?.firstName || ''} ${kid.personalInfo?.lastName || ''}`.trim() || 'Racing Star'}
                                                </h4>
                                                <div className="racer-details">
                                                    {kid.parentInfo?.name && (
                                                        <div className="parent-info">
                                                            👨‍👩‍👧‍👦 {kid.parentInfo.name}
                                                        </div>
                                                    )}
                                                    <div className="status-info">
                                                        Status: {kid.signedFormStatus || 'Pending'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <Baby className="empty-icon" size={40} />
                                        <h4>No racers assigned yet!</h4>
                                        <p>This team is waiting for some amazing kids to join the race! 🏎️</p>
                                        {(userRole === 'admin' || userRole === 'instructor') && (
                                            <button
                                                onClick={() => navigate(`/admin/teams/edit/${id}`, { state: { focusKids: true } })}
                                                className="assign-kids-button"
                                            >
                                                <Baby className="btn-icon" size={16} />
                                                Assign Racers
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