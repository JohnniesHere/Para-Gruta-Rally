// src/pages/admin/AnalyticsDashboardPage.jsx - Complete Racing Analytics Dashboard with Translations
import React, { useState, useEffect } from 'react';
import TooltipModal from "../../components/modals/TooltipModal.jsx";
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    getSystemOverview,
    getVehicleAnalytics,
    getTeamAnalytics,
    getParticipationAnalytics,
    getPerformanceMetrics
} from '../../services/analyticsService';
import {
    IconChartBar as Analytics,
    IconDashboard as Overview,
    IconCar as Vehicle,
    IconUsers as Team,
    IconTrophy as Participation,
    IconTool as Maintenance,
    IconRefresh as Refresh,
    IconAlertTriangle as AlertTriangle,
    IconTrendingUp as TrendingUp,
    IconSettings as Settings,
    IconBattery as Battery,
    IconCalendar as Calendar,
    IconUserCheck as UserCheck,
    IconSparkles as Sparkles,
    IconFlag as Flag,
    IconTarget as Target,
    IconGauge as Gauge,
    IconActivity as Activity
} from '@tabler/icons-react';
import './AnalyticsDashboardPage.css';

const InfoTooltip = ({ title, description, action, className = "" }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (event) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
        setIsModalOpen(true);
    };

    const handleMouseLeave = () => {
        setIsModalOpen(false);
    };

    const handleMouseMove = (event) => {
        // Update position while hovering for dynamic positioning
        if (isModalOpen) {
            setMousePosition({ x: event.clientX, y: event.clientY });
        }
    };

    return (
        <>
            <div className={`tooltip-container ${className}`}>
                <div
                    className="info-tooltip"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                />
            </div>

            <TooltipModal
                isOpen={isModalOpen}
                title={title}
                description={description}
                action={action}
                mousePosition={mousePosition}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

// Main Component
const AnalyticsDashboardPage = () => {
    const { appliedTheme } = useTheme();
    const { userRole } = usePermissions();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [analyticsData, setAnalyticsData] = useState({
        overview: null,
        vehicles: null,
        teams: null,
        participation: null,
        performance: null
    });

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const loadAnalyticsData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [overview, vehicles, teams, participation, performance] = await Promise.all([
                getSystemOverview(),
                getVehicleAnalytics(),
                getTeamAnalytics(),
                getParticipationAnalytics(),
                getPerformanceMetrics()
            ]);

            setAnalyticsData({ overview, vehicles, teams, participation, performance });
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading analytics:', error);
            setError(t('analytics.failedToLoad', 'Failed to load analytics data. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: t('analytics.tabs.overview', 'Overview'), icon: Overview, description: t('analytics.tabs.overviewDesc', 'System health & KPIs') },
        { id: 'vehicles', label: t('analytics.tabs.vehicles', 'Vehicles'), icon: Vehicle, description: t('analytics.tabs.vehiclesDesc', 'Usage & maintenance') },
        { id: 'teams', label: t('analytics.tabs.teams', 'Teams'), icon: Team, description: t('analytics.tabs.teamsDesc', 'Performance & capacity') },
        { id: 'participation', label: t('analytics.tabs.participation', 'Events'), icon: Participation, description: t('analytics.tabs.participationDesc', 'Participation & engagement') },
        { id: 'maintenance', label: t('analytics.tabs.maintenance', 'Maintenance'), icon: Maintenance, description: t('analytics.tabs.maintenanceDesc', 'Alerts & recommendations') }
    ];

    if (isLoading) {
        return (
            <Dashboard requiredRole="admin">
                <div className={`admin-page analytics-page ${appliedTheme}-mode`}>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('analytics.loadingAnalytics', 'Loading analytics data...')}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard requiredRole="admin">
            <div className={`admin-page analytics-page ${appliedTheme}-mode`}>
                <h1 className="page-title">
                    <Analytics size={32} className="page-title-icon" />
                    {t('analytics.pageTitle', 'Racing Analytics Dashboard')}
                    <Sparkles size={24} className="sparkle-icon" />
                </h1>

                <div>
                    <div className="analytics-header">
                        <div className="header-info">
                            <h2>{t('analytics.raceControlTitle', '🏁 Race Control Analytics')}</h2>
                            <p>{t('analytics.subtitle', 'Comprehensive data insights for your racing program')}</p>
                            {lastUpdated && (
                                <small>{t('analytics.lastUpdated', 'Last updated')}: {lastUpdated.toLocaleTimeString()}</small>
                            )}
                        </div>
                        <button onClick={() => loadAnalyticsData()} className="btn-primary" disabled={isLoading}>
                            <Refresh size={18} />
                            {t('analytics.refreshData', 'Refresh Data')}
                        </button>
                    </div>

                    {error && (
                        <div className="alert error-alert">
                            <AlertTriangle size={20} />
                            {error}
                        </div>
                    )}

                    <div className="tabs-container">
                        <div className="tabs-nav">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon size={20} />
                                    <span className="tab-label">{tab.label}</span>
                                    <span className="tab-description">{tab.description}</span>
                                </button>
                            ))}
                        </div>

                        <div className="tab-content">
                            {activeTab === 'overview' && <OverviewTab data={analyticsData.overview} performance={analyticsData.performance} />}
                            {activeTab === 'vehicles' && <VehiclesTab data={analyticsData.vehicles} />}
                            {activeTab === 'teams' && <TeamsTab data={analyticsData.teams} />}
                            {activeTab === 'participation' && <ParticipationTab data={analyticsData.participation} />}
                            {activeTab === 'maintenance' && <MaintenanceTab vehicles={analyticsData.vehicles} performance={analyticsData.performance} />}
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

// Overview Tab Component
const OverviewTab = ({ data, performance }) => {
    const { t } = useLanguage();

    if (!data) {
        return (
            <div className="loading-placeholder">
                <div className="loading-spinner"></div>
                {t('analytics.loadingOverview', 'Loading overview...')}
            </div>
        );
    }

    return (
        <div className="tab-panel overview-panel">
            <div className="stats-grid analytics-stats">
                <div className="stat-card total">
                    <div className="stat-icon"><Vehicle size={40} /></div>
                    <div className="stat-content">
                        <h3>{t('analytics.overview.totalVehicles', 'Total Vehicles')}</h3>
                        <div className="stat-value">{data.summary.totalVehicles}</div>
                        <div className="stat-subtitle">{data.summary.activeVehicles} {t('analytics.overview.active', 'Active')}</div>
                    </div>
                </div>

                <div className="stat-card kids">
                    <div className="stat-icon"><UserCheck size={40} /></div>
                    <div className="stat-content">
                        <h3>{t('analytics.overview.totalRacers', 'Total Racers')}</h3>
                        <div className="stat-value">{data.summary.totalKids}</div>
                        <div className="stat-subtitle">{data.summary.activeKids} {t('analytics.overview.active', 'Active')}</div>
                    </div>
                </div>

                <div className="stat-card teams">
                    <div className="stat-icon"><Team size={40} /></div>
                    <div className="stat-content">
                        <h3>{t('analytics.overview.racingTeams', 'Racing Teams')}</h3>
                        <div className="stat-value">{data.summary.totalTeams}</div>
                        <div className="stat-subtitle">{data.summary.activeTeams} {t('analytics.overview.active', 'Active')}</div>
                    </div>
                </div>

                <div className="stat-card events">
                    <div className="stat-icon"><Calendar size={40} /></div>
                    <div className="stat-content">
                        <h3>{t('analytics.overview.events', 'Events')}</h3>
                        <div className="stat-value">{data.summary.totalEvents}</div>
                        <div className="stat-subtitle">{data.summary.upcomingEvents} {t('analytics.overview.upcoming', 'Upcoming')}</div>
                    </div>
                </div>
            </div>

            {performance && (
                <div className="kpi-section">
                    <h3>
                        <Target size={28} />
                        {t('analytics.overview.kpiTitle', 'Key Performance Indicators')}
                        <InfoTooltip
                            title={t('analytics.tooltip.systemPerformance.title', 'System Performance')}
                            description={t('analytics.tooltip.systemPerformance.description', 'Critical metrics showing how well your racing program is running. These percentages help identify improvement areas.')}
                            action={t('analytics.tooltip.systemPerformance.action', 'Aim for 80%+ on all metrics. Lower scores indicate specific areas needing attention.')}
                        />
                    </h3>
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-header">
                                <h4>{t('analytics.overview.vehicleUtilization', 'Vehicle Utilization')}</h4>
                                <Gauge size={20} />
                                <InfoTooltip
                                    title={t('analytics.tooltip.vehicleUsage.title', 'Vehicle Usage Rate')}
                                    description={t('analytics.tooltip.vehicleUsage.description', 'Percentage of your vehicle fleet currently assigned and being used regularly by teams.')}
                                    action={t('analytics.tooltip.vehicleUsage.action', 'Low utilization? Redistribute vehicles or recruit participants. High? You may need more vehicles.')}
                                />
                            </div>
                            <div className="kpi-value">{Math.round(performance.kpis.vehicleUtilization)}%</div>
                            <div className="kpi-description">{t('analytics.overview.vehicleUtilizationDesc', 'Percentage of vehicles currently in use')}</div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-header">
                                <h4>{t('analytics.overview.teamCapacity', 'Team Capacity')}</h4>
                                <Team size={20} />
                                <InfoTooltip
                                    title={t('analytics.tooltip.teamFillRate.title', 'Team Fill Rate')}
                                    description={t('analytics.tooltip.teamFillRate.description', 'How full your teams are compared to maximum capacity. Shows room for more participants.')}
                                    action={t('analytics.tooltip.teamFillRate.action', 'Low capacity? Focus on recruitment. High? Consider creating new teams or expanding existing ones.')}
                                />
                            </div>
                            <div className="kpi-value">{Math.round(performance.kpis.teamCapacityUtilization)}%</div>
                            <div className="kpi-description">{t('analytics.overview.teamCapacityDesc', 'Current members vs maximum capacity')}</div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-header">
                                <h4>{t('analytics.overview.systemHealth', 'System Health')}</h4>
                                <Activity size={20} />
                                <InfoTooltip
                                    title={t('analytics.tooltip.systemOverallStatus.title', 'Overall System Status')}
                                    description={t('analytics.tooltip.systemOverallStatus.description', 'Combined score of vehicle condition, team organization, and program operations. High score means smooth running.')}
                                    action={t('analytics.tooltip.systemOverallStatus.action', 'Monitor closely. If below 75%, check maintenance alerts and team management issues.')}
                                />
                            </div>
                            <div className="kpi-value">{Math.round(performance.kpis.systemHealth)}%</div>
                            <div className="kpi-description">{t('analytics.overview.systemHealthDesc', 'Overall system operational status')}</div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-header">
                                <h4>{t('analytics.overview.participation', 'Participation')}</h4>
                                <Flag size={20} />
                                <InfoTooltip
                                    title={t('analytics.tooltip.activeParticipationRate.title', 'Active Participation Rate')}
                                    description={t('analytics.tooltip.activeParticipationRate.description', 'Percentage of registered racers actively participating with completed required forms.')}
                                    action={t('analytics.tooltip.activeParticipationRate.action', 'Low participation? Follow up on incomplete registrations and engage less active participants.')}
                                />
                            </div>
                            <div className="kpi-value">{Math.round(performance.kpis.participationRate)}%</div>
                            <div className="kpi-description">{t('analytics.overview.participationDesc', 'Active racers with completed forms')}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Vehicles Tab Component
const VehiclesTab = ({ data }) => {
    const { t } = useLanguage();

    if (!data) {
        return (
            <div className="loading-placeholder">
                <div className="loading-spinner"></div>
                {t('analytics.loadingVehicleAnalytics', 'Loading vehicle analytics...')}
            </div>
        );
    }

    return (
        <div className="tab-panel vehicles-panel">
            <div className="analytics-section">
                <h3>{t('analytics.vehicles.fleetOverview', '🚗 Vehicle Fleet Overview')}</h3>
                <div className="summary-cards">
                    <div className="summary-card">
                        <h4>{t('analytics.vehicles.fleetStatus', 'Fleet Status')}</h4>
                        <div className="summary-stats">
                            <div className="summary-stat">
                                <span className="stat-label">{t('analytics.vehicles.totalVehicles', 'Total Vehicles')}</span>
                                <span className="stat-value">{data.summary.totalVehicles}</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-label">{t('analytics.vehicles.currentlyInUse', 'Currently In Use')}</span>
                                <span className="stat-value">{data.summary.vehiclesInUse}</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-label">{t('analytics.vehicles.available', 'Available')}</span>
                                <span className="stat-value">{data.summary.availableVehicles}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3>
                    {t('analytics.vehicles.utilizationTitle', '📊 Vehicle Utilization')}
                    <InfoTooltip
                        title={t('analytics.tooltip.usageAnalytics.title', 'Usage Analytics')}
                        description={t('analytics.tooltip.usageAnalytics.description', 'Track which vehicles are used most and least. Helps identify popular vehicles and those needing attention.')}
                        action={t('analytics.tooltip.usageAnalytics.action', 'Rotate high-usage vehicles to prevent wear and investigate why some are used less.')}
                    />
                </h3>
                <div className="utilization-grid">
                    <div className="utilization-card">
                        <h4>
                            {t('analytics.vehicles.mostUsed', '🏆 Most Used Vehicles')}
                            <InfoTooltip
                                title={t('analytics.tooltip.highUsage.title', 'High-Usage Fleet')}
                                description={t('analytics.tooltip.highUsage.description', 'These vehicles are in high demand. Monitor them for maintenance needs due to heavy usage.')}
                                action={t('analytics.tooltip.highUsage.action', 'Schedule regular maintenance and consider rotating to prevent overuse.')}
                            />
                        </h4>
                        <div className="vehicle-list">
                            {data.utilization.mostUsed.slice(0, 5).map((vehicle, index) => (
                                <div key={vehicle.id} className="vehicle-item">
                                    <div className="vehicle-rank">#{index + 1}</div>
                                    <div className="vehicle-info">
                                        <div className="vehicle-name">{vehicle.name}</div>
                                        <div className="vehicle-stats">
                                            {vehicle.totalAssignments} {t('analytics.vehicles.assignments', 'assignments')} • {vehicle.teamAssigned}
                                        </div>
                                    </div>
                                    <div className={`vehicle-status ${vehicle.currentlyInUse ? 'in-use' : 'available'}`}>
                                        {vehicle.currentlyInUse ? t('analytics.vehicles.inUse', '🔴 In Use') : t('analytics.vehicles.available', '🟢 Available')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="utilization-card">
                        <h4>{t('analytics.vehicles.usageByTeam', '📈 Usage by Team')}</h4>
                        <div className="team-utilization-list">
                            {data.utilization.utilizationByTeam.map((team, index) => (
                                <div key={index} className="team-util-item">
                                    <div className="team-name">{team.teamName}</div>
                                    <div className="team-metrics">
                                        <span>{team.vehicleCount} {t('analytics.vehicles.vehiclesCount', 'vehicles')}</span>
                                        <span>{Math.round(team.utilizationRate)}% {t('analytics.vehicles.utilized', 'utilized')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3>
                    {t('analytics.vehicles.batteryStatus', '🔋 Battery Maintenance Status')}
                    <InfoTooltip
                        title={t('analytics.tooltip.batteryHealth.title', 'Battery Health Monitoring')}
                        description={t('analytics.tooltip.batteryHealth.description', 'Track battery age and condition to prevent unexpected failures during events.')}
                        action={t('analytics.tooltip.batteryHealth.action', 'Replace batteries showing warning signs immediately and schedule regular checks.')}
                    />
                </h3>
                <div className="maintenance-grid">
                    <div className="maintenance-card urgent">
                        <h4>
                            {t('analytics.vehicles.needsReplacement', '🚨 Needs Replacement')}
                            <InfoTooltip
                                title={t('analytics.tooltip.criticalBattery.title', 'Critical Battery Alert')}
                                description={t('analytics.tooltip.criticalBattery.description', 'These batteries are old and need immediate replacement to avoid vehicle downtime.')}
                                action={t('analytics.tooltip.criticalBattery.action', 'Order replacement batteries now and schedule immediate maintenance.')}
                            />
                        </h4>
                        <div className="maintenance-count">
                            {data.maintenance.batteriesNeedingReplacement.length}
                        </div>
                        <div className="maintenance-list">
                            {data.maintenance.batteriesNeedingReplacement.slice(0, 3).map((vehicle) => (
                                <div key={vehicle.id} className="maintenance-item">
                                    <span>{vehicle.name}</span>
                                    <span>{vehicle.daysOld} {t('analytics.vehicles.daysOld', 'days old')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="maintenance-card warning">
                        <h4>
                            {t('analytics.vehicles.monitorClosely', '⚠️ Monitor Closely')}
                            <InfoTooltip
                                title={t('analytics.tooltip.preventiveMaintenance.title', 'Preventive Maintenance')}
                                description={t('analytics.tooltip.preventiveMaintenance.description', 'These batteries are approaching replacement time but can still be used with careful monitoring.')}
                                action={t('analytics.tooltip.preventiveMaintenance.action', 'Order spare batteries and check these vehicles weekly for performance issues.')}
                            />
                        </h4>
                        <div className="maintenance-count">
                            {data.maintenance.batteriesNeedingMonitoring.length}
                        </div>
                        <div className="maintenance-list">
                            {data.maintenance.batteriesNeedingMonitoring.slice(0, 3).map((vehicle) => (
                                <div key={vehicle.id} className="maintenance-item">
                                    <span>{vehicle.name}</span>
                                    <span>{vehicle.daysOld} {t('analytics.vehicles.daysOld', 'days old')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Teams Tab Component
const TeamsTab = ({ data }) => {
    const { t } = useLanguage();

    if (!data) {
        return (
            <div className="loading-placeholder">
                <div className="loading-spinner"></div>
                {t('analytics.loadingTeamAnalytics', 'Loading team analytics...')}
            </div>
        );
    }

    return (
        <div className="tab-panel teams-panel">
            <div className="analytics-section">
                <h3>{t('analytics.teams.performanceOverview', '👥 Team Performance Overview')}</h3>
                <div className="summary-cards">
                    <div className="summary-card">
                        <h4>{t('analytics.teams.teamStatistics', 'Team Statistics')}</h4>
                        <div className="summary-stats">
                            <div className="summary-stat">
                                <span className="stat-label">{t('analytics.teams.totalTeams', 'Total Teams')}</span>
                                <span className="stat-value">{data.summary.totalTeams}</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-label">{t('analytics.teams.averageTeamSize', 'Average Team Size')}</span>
                                <span className="stat-value">{data.summary.averageTeamSize}</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-label">{t('analytics.teams.totalCapacity', 'Total Capacity')}</span>
                                <span className="stat-value">{data.summary.totalCapacity}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3>
                    {t('analytics.teams.capacityUtilization', '📊 Capacity Utilization')}
                    <InfoTooltip
                        title={t('analytics.tooltip.teamCapacityAnalysis.title', 'Team Capacity Analysis')}
                        description={t('analytics.tooltip.teamCapacityAnalysis.description', 'See how full each team is and identify opportunities for growth or redistribution.')}
                        action={t('analytics.tooltip.teamCapacityAnalysis.action', 'Teams under 70% capacity can take more members. Teams over 90% may need to split or expand.')}
                    />
                </h3>
                <div className="team-utilization-grid">
                    {data.capacity.teamUtilization.slice(0, 6).map((team) => (
                        <div key={team.id} className="team-card">
                            <div className="team-header">
                                <h4>{team.name}</h4>
                                <div className="utilization-badge">{team.utilizationRate}%</div>
                                <InfoTooltip
                                    title={t('analytics.tooltip.teamAnalysis.title', `Team ${team.name} Analysis`)}
                                    description={t('analytics.tooltip.teamAnalysis.description', `This team is ${team.utilizationRate}% full with ${team.currentMembers} out of ${team.maxCapacity} possible members.`)}
                                    action={team.utilizationRate < 70 ? t('analytics.tooltip.teamAnalysis.actionLow', "Consider recruiting more members for this team.") : team.utilizationRate > 90 ? t('analytics.tooltip.teamAnalysis.actionHigh', "This team is near capacity. Consider expansion or creating a new team.") : t('analytics.tooltip.teamAnalysis.actionOptimal', "Team size is optimal.")}
                                />
                            </div>
                            <div className="team-stats">
                                <div className="team-stat">
                                    <span>{t('analytics.teams.members', 'Members')}</span>
                                    <span>{team.currentMembers}/{team.maxCapacity}</span>
                                </div>
                                <div className="team-stat">
                                    <span>{t('analytics.vehicles.vehiclesCount', 'Vehicles')}</span>
                                    <span>{team.vehicleCount}</span>
                                </div>
                                <div className="team-stat">
                                    <span>{t('analytics.teams.instructors', 'Instructors')}</span>
                                    <span>{team.instructorCount}</span>
                                </div>
                            </div>
                            <div className="capacity-bar">
                                <div className="capacity-fill" style={{ width: `${team.utilizationRate}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="analytics-section">
                <h3>
                    {t('analytics.teams.vehicleDistribution', '🚗 Vehicle Distribution')}
                    <InfoTooltip
                        title={t('analytics.tooltip.resourceAllocation.title', 'Resource Allocation')}
                        description={t('analytics.tooltip.resourceAllocation.description', 'Shows how vehicles are distributed across teams and the ratio of vehicles to members.')}
                        action={t('analytics.tooltip.resourceAllocation.action', 'Ensure fair distribution. Aim for similar vehicle-to-member ratios across teams.')}
                    />
                </h3>
                <div className="resource-cards">
                    {data.resources.vehicleDistribution.slice(0, 8).map((team, index) => (
                        <div key={index} className="resource-card">
                            <div className="resource-header">
                                <span className="team-name">{team.teamName}</span>
                                <span className="vehicle-count">{team.vehicleCount} {t('analytics.vehicles.vehiclesCount', 'vehicles')}</span>
                            </div>
                            <div className="resource-metrics">
                                <span>{team.memberCount} {t('analytics.teams.members', 'members')}</span>
                                <span>{t('analytics.teams.ratio', 'Ratio')}: {team.vehicleToMemberRatio}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Participation Tab Component
const ParticipationTab = ({ data }) => {
    const { t } = useLanguage();

    if (!data) {
        return (
            <div className="loading-placeholder">
                <div className="loading-spinner"></div>
                {t('analytics.loadingParticipationAnalytics', 'Loading participation analytics...')}
            </div>
        );
    }

    return (
        <div className="tab-panel participation-panel">
            <div className="analytics-section">
                <h3>{t('analytics.participation.eventsOverview', '🏁 Events Overview')}</h3>
                <div className="events-summary">
                    <div className="event-stats">
                        <div className="event-stat">
                            <h4>{t('analytics.participation.totalEvents', 'Total Events')}</h4>
                            <div className="stat-value">{data.events.totalEvents}</div>

                            <h4>{t('analytics.participation.upcomingEvents', 'Upcoming')}</h4>
                            <div className="stat-value">{data.events.upcomingEvents}</div>
                        </div>
                        <div className="event-stat">
                            <h4>{t('analytics.participation.completedEvents', 'Completed')}</h4>
                            <div className="stat-value">{data.events.completedEvents}</div>
                        </div>
                        <div className="event-stat">
                            <h4>
                                {t('analytics.participation.avgParticipation', 'Avg Participation')}
                                <InfoTooltip
                                    title={t('analytics.tooltip.participationRate.title', 'Participation Rate')}
                                    description={t('analytics.tooltip.participationRate.description', 'Average number of participants per event. This helps gauge event popularity and engagement.')}
                                    action={t('analytics.tooltip.participationRate.action', 'Low participation? Try different event types or timing. High participation? Consider larger venues or more events.')}
                                />
                            </h4>
                            <div className="stat-value">{data.participation.averageParticipationPerEvent}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3>{t('analytics.participation.mostActiveRacers', '🏆 Most Active Racers')}</h3>
                <div className="participants-grid">
                    <div className="participants-card">
                        <h4>
                            {t('analytics.participation.allTimeLeaders', 'All Time Leaders')}
                            <InfoTooltip
                                title={t('analytics.tooltip.participationHistory.title', 'Participation History')}
                                description={t('analytics.tooltip.participationHistory.description', 'Racers with the highest total event participation. These are your most dedicated participants.')}
                                action={t('analytics.tooltip.participationHistory.action', 'Consider special recognition or leadership roles for top participants.')}
                            />
                        </h4>
                        <div className="participants-list">
                            {data.participation.mostActiveKids.slice(0, 10).map((kid, index) => (
                                <div key={kid.kidId} className="participant-item">
                                    <div className="participant-rank">#{index + 1}</div>
                                    <div className="participant-info">
                                        <div className="participant-name">{kid.name}</div>
                                        <div className="participant-details">
                                            #{kid.participantNumber} • {kid.totalEvents} {t('analytics.participation.eventsCount', 'events')}
                                        </div>
                                    </div>
                                    <div className="participant-badge">{kid.totalEvents}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="participants-card">
                        <h4>
                            {t('analytics.participation.recentActivity', 'Recent Activity (30 days)')}
                            <InfoTooltip
                                title={t('analytics.tooltip.currentEngagement.title', 'Current Engagement')}
                                description={t('analytics.tooltip.currentEngagement.description', 'Racers who have been most active in recent events. This shows current engagement levels.')}
                                action={t('analytics.tooltip.currentEngagement.action', 'Engage with recently active participants and encourage others to join upcoming events.')}
                            />
                        </h4>
                        <div className="participants-list">
                            {data.participation.recentParticipation.slice(0, 10).map((kid, index) => (
                                <div key={kid.kidId} className="participant-item">
                                    <div className="participant-rank">#{index + 1}</div>
                                    <div className="participant-info">
                                        <div className="participant-name">{kid.name}</div>
                                        <div className="participant-details">
                                            #{kid.participantNumber} • {kid.recentEvents} {t('analytics.participation.recent', 'recent')}
                                        </div>
                                    </div>
                                    <div className="participant-badge recent">{kid.recentEvents}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3>{t('analytics.participation.recentEvents', '📅 Recent Events')}</h3>
                <div className="events-list">
                    {data.events.eventDetails.slice(0, 6).map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-header">
                                <h4>{event.name}</h4>
                                <span className="event-date">{event.date}</span>
                            </div>
                            <div className="event-stats">
                                <span>{event.participantCount} {t('analytics.participation.participants', 'participants')}</span>
                                <span>{event.teamCount} {t('analytics.participation.teams', 'teams')}</span>
                                <span>{event.vehicleCount} {t('analytics.vehicles.vehiclesCount', 'vehicles')}</span>
                            </div>
                            <div className="event-status">
                                <span className={`status-badge ${event.status}`}>{event.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Maintenance Tab Component
const MaintenanceTab = ({ vehicles, performance }) => {
    const { t } = useLanguage();

    if (!vehicles || !performance) {
        return (
            <div className="loading-placeholder">
                <div className="loading-spinner"></div>
                {t('analytics.loadingMaintenanceData', 'Loading maintenance data...')}
            </div>
        );
    }

    return (
        <div className="tab-panel maintenance-panel">
            <div className="alerts-section">
                <h3>{t('analytics.maintenance.urgentAlerts', '🚨 Urgent Maintenance Alerts')}</h3>
                <div className="alerts-grid">
                    {vehicles.maintenance.batteriesNeedingReplacement.map((vehicle) => (
                        <div key={vehicle.id} className="alert-card urgent">
                            <div className="alert-icon">
                                <Battery size={24} />
                            </div>
                            <div className="alert-content">
                                <h4>{t('analytics.maintenance.batteryReplacement', 'Battery Replacement Required')}</h4>
                                <p><strong>{vehicle.name}</strong> ({vehicle.licensePlate})</p>
                                <p>{t('analytics.maintenance.batteryAge', 'Battery is {daysOld} days old', { daysOld: vehicle.daysOld })}</p>
                                <p>{t('analytics.maintenance.batteryType', 'Type')}: {vehicle.batteryType}</p>
                            </div>
                            <div className="alert-priority">{t('analytics.maintenance.priorityHigh', 'HIGH')}</div>
                            <InfoTooltip
                                title={t('analytics.tooltip.criticalBattery.title', 'Critical Battery Alert')}
                                description={t('analytics.tooltip.criticalBattery.description', 'This battery has exceeded its recommended lifespan and needs immediate replacement.')}
                                action={t('analytics.tooltip.criticalBattery.action', 'Order a replacement battery today and schedule maintenance within 24 hours.')}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {vehicles.maintenance.batteriesNeedingMonitoring.length > 0 && (
                <div className="alerts-section">
                    <h3>
                        {t('analytics.maintenance.batteriesToMonitor', '⚠️ Batteries to Monitor')}
                        <InfoTooltip
                            title={t('analytics.tooltip.preventiveMaintenance.title', 'Preventive Maintenance')}
                            description={t('analytics.tooltip.preventiveMaintenance.description', 'These batteries are approaching replacement time but can still be used with careful monitoring.')}
                            action={t('analytics.tooltip.preventiveMaintenance.action', 'Order spare batteries and check these vehicles weekly for performance issues.')}
                        />
                    </h3>
                    <div className="monitoring-list">
                        {vehicles.maintenance.batteriesNeedingMonitoring.map((vehicle) => (
                            <div key={vehicle.id} className="monitoring-item">
                                <div className="monitoring-info">
                                    <span className="vehicle-name">{vehicle.name}</span>
                                    <span className="vehicle-plate">({vehicle.licensePlate})</span>
                                </div>
                                <div className="monitoring-details">
                                    <span>{vehicle.daysOld} {t('analytics.vehicles.daysOld', 'days old')}</span>
                                    <span>{vehicle.batteryType}</span>
                                </div>
                                <div className="monitoring-priority">{t('analytics.maintenance.priorityMedium', 'MEDIUM')}</div>
                                <InfoTooltip
                                    title={t('analytics.tooltip.maintenanceWatch.title', 'Maintenance Watch')}
                                    description={t('analytics.tooltip.maintenanceWatch.description', 'Keep an eye on this vehicle\'s performance and plan for battery replacement soon.')}
                                    action={t('analytics.tooltip.maintenanceWatch.action', 'Schedule replacement within 2-4 weeks and monitor for reduced performance.')}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {performance.recommendations && performance.recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h3>
                        {t('analytics.maintenance.systemRecommendations', '💡 System Recommendations')}
                        <InfoTooltip
                            title={t('analytics.tooltip.optimizationSuggestions.title', 'Optimization Suggestions')}
                            description={t('analytics.tooltip.optimizationSuggestions.description', 'AI-generated recommendations to improve your racing program\'s efficiency and performance.')}
                            action={t('analytics.tooltip.optimizationSuggestions.action', 'Review these suggestions and implement high-priority items first.')}
                        />
                    </h3>
                    <div className="recommendations-list">
                        {performance.recommendations.map((rec, index) => (
                            <div key={index} className={`recommendation-card ${rec.priority}`}>
                                <div className="recommendation-header">
                                    <h4>{rec.title}</h4>
                                    <span className={`priority-badge ${rec.priority}`}>
                                        {rec.priority.toUpperCase()}
                                    </span>
                                    <InfoTooltip
                                        title={t('analytics.tooltip.priorityRecommendation.title', `${rec.priority.toUpperCase()} Priority Recommendation`)}
                                        description={rec.description}
                                        action={t('analytics.tooltip.priorityRecommendation.action', `Implementation: ${rec.action}`)}
                                    />
                                </div>
                                <div className="recommendation-content">
                                    <p>{rec.description}</p>
                                    <div className="recommendation-action">
                                        <strong>{t('analytics.tooltip.priorityRecommendation.actionLabel', 'Action')}:</strong> {rec.action}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="health-section">
                <h3>
                    {t('analytics.maintenance.healthIndicators', '📊 System Health Indicators')}
                    <InfoTooltip
                        title={t('analytics.tooltip.healthMonitoring.title', 'Health Monitoring')}
                        description={t('analytics.tooltip.healthMonitoring.description', 'Overall health scores for different aspects of your racing program. Scores above 80% are considered healthy.')}
                        action={t('analytics.tooltip.healthMonitoring.action', 'Focus on areas with lower scores. Check maintenance alerts and team management for improvement opportunities.')}
                    />
                </h3>
                <div className="health-grid">
                    <div className="health-card">
                        <h4>
                            {t('analytics.maintenance.vehicleHealth', 'Vehicle Health')}
                            <InfoTooltip
                                title={t('analytics.tooltip.fleetCondition.title', 'Fleet Condition')}
                                description={t('analytics.tooltip.fleetCondition.description', 'Overall condition of your vehicle fleet based on maintenance status, battery health, and usage patterns.')}
                                action={t('analytics.tooltip.fleetCondition.action', 'Low scores indicate maintenance issues. Check the maintenance alerts above for specific actions.')}
                            />
                        </h4>
                        <div className="health-score">{performance.healthIndicators.vehicleHealth}%</div>
                        <div className="health-bar">
                            <div className="health-fill" style={{ width: `${performance.healthIndicators.vehicleHealth}%` }}></div>
                        </div>
                    </div>

                    <div className="health-card">
                        <h4>
                            {t('analytics.maintenance.teamHealth', 'Team Health')}
                            <InfoTooltip
                                title={t('analytics.tooltip.teamOrganization.title', 'Team Organization')}
                                description={t('analytics.tooltip.teamOrganization.description', 'How well your teams are organized, balanced, and resourced. Includes capacity utilization and resource distribution.')}
                                action={t('analytics.tooltip.teamOrganization.action', 'Low scores suggest team imbalances. Check the Teams tab for capacity and resource distribution insights.')}
                            />
                        </h4>
                        <div className="health-score">{performance.healthIndicators.teamHealth}%</div>
                        <div className="health-bar">
                            <div className="health-fill" style={{ width: `${performance.healthIndicators.teamHealth}%` }}></div>
                        </div>
                    </div>

                    <div className="health-card">
                        <h4>
                            {t('analytics.overview.systemHealth', 'System Health')}
                            <InfoTooltip
                                title={t('analytics.tooltip.overallProgramHealth.title', 'Overall Program Health')}
                                description={t('analytics.tooltip.overallProgramHealth.description', 'Combined score representing the overall health of your racing program, including all vehicles, teams, and operations.')}
                                action={t('analytics.tooltip.overallProgramHealth.action', 'This is your master health indicator. Scores below 75% indicate systemic issues that need attention.')}
                            />
                        </h4>
                        <div className="health-score">{performance.healthIndicators.systemHealth}%</div>
                        <div className="health-bar">
                            <div className="health-fill" style={{ width: `${performance.healthIndicators.systemHealth}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboardPage;