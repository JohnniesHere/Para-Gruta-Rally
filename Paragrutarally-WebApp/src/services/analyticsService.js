// src/services/analyticsService.js - Comprehensive Racing Data Analytics
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Import existing services
import { getAllVehicles } from './vehicleService';
import { getAllTeams } from './teamService';

/**
 * 📊 OVERVIEW ANALYTICS - System-wide statistics
 */
export const getSystemOverview = async () => {
    try {
        const [vehicles, kids, teams, users, events] = await Promise.all([
            getDocs(collection(db, 'vehicles')),
            getDocs(collection(db, 'kids')),
            getDocs(collection(db, 'teams')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'events'))
        ]);

        const vehicleData = vehicles.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const kidData = kids.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const teamData = teams.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userData = users.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const eventData = events.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return {
            summary: {
                totalVehicles: vehicleData.length,
                activeVehicles: vehicleData.filter(v => v.active).length,
                totalKids: kidData.length,
                activeKids: kidData.filter(k => k.signedFormStatus === 'completed').length,
                totalTeams: teamData.length,
                activeTeams: teamData.filter(t => t.active).length,
                totalEvents: eventData.length,
                upcomingEvents: eventData.filter(e => e.status === 'upcoming').length,
                totalUsers: userData.length,
                instructors: userData.filter(u => u.role === 'instructor').length
            },
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting system overview:', error);
        throw new Error('Failed to generate system overview');
    }
};

/**
 * 🚗 VEHICLE ANALYTICS - Usage, Maintenance, Performance
 */
export const getVehicleAnalytics = async () => {
    try {
        const vehicles = await getAllVehicles();
        const now = new Date();

        // Calculate vehicle utilization
        const utilizationStats = vehicles.map(vehicle => {
            const historyCount = Array.isArray(vehicle.history) ? vehicle.history.length : 0;
            const isCurrentlyInUse = !!vehicle.currentKidId;

            return {
                id: vehicle.id,
                name: `${vehicle.make} ${vehicle.model}`,
                licensePlate: vehicle.licensePlate,
                totalAssignments: historyCount,
                currentlyInUse: isCurrentlyInUse,
                teamAssigned: vehicle.teamName || 'Unassigned',
                batteryAge: vehicle.batteryDate ?
                    Math.floor((now - new Date(vehicle.batteryDate)) / (1000 * 60 * 60 * 24)) : null
            };
        });

        // Find most/least used vehicles
        const sortedByUsage = [...utilizationStats].sort((a, b) => b.totalAssignments - a.totalAssignments);

        // Battery maintenance analysis
        const batteryAnalysis = vehicles.map(vehicle => {
            if (!vehicle.batteryDate) return { ...vehicle, batteryStatus: 'unknown', daysOld: null };

            const batteryDate = new Date(vehicle.batteryDate);
            const daysOld = Math.floor((now - batteryDate) / (1000 * 60 * 60 * 24));

            let batteryStatus = 'good';
            if (daysOld > 180) batteryStatus = 'needs_replacement'; // 6 months
            else if (daysOld > 90) batteryStatus = 'monitor'; // 3 months

            return {
                id: vehicle.id,
                name: `${vehicle.make} ${vehicle.model}`,
                licensePlate: vehicle.licensePlate,
                batteryType: vehicle.batteryType,
                batteryDate: vehicle.batteryDate,
                daysOld,
                batteryStatus,
                priority: batteryStatus === 'needs_replacement' ? 'high' :
                    batteryStatus === 'monitor' ? 'medium' : 'low'
            };
        }).filter(v => v.batteryDate); // Only include vehicles with battery dates

        return {
            summary: {
                totalVehicles: vehicles.length,
                activeVehicles: vehicles.filter(v => v.active).length,
                vehiclesInUse: vehicles.filter(v => v.currentKidId).length,
                availableVehicles: vehicles.filter(v => v.active && !v.currentKidId).length,
                averageUsagePerVehicle: utilizationStats.length > 0 ?
                    Math.round(utilizationStats.reduce((sum, v) => sum + v.totalAssignments, 0) / utilizationStats.length) : 0
            },
            utilization: {
                mostUsed: sortedByUsage.slice(0, 5),
                leastUsed: sortedByUsage.slice(-5).reverse(),
                utilizationByTeam: getVehicleUtilizationByTeam(vehicles)
            },
            maintenance: {
                batteriesNeedingReplacement: batteryAnalysis.filter(v => v.batteryStatus === 'needs_replacement'),
                batteriesNeedingMonitoring: batteryAnalysis.filter(v => v.batteryStatus === 'monitor'),
                upcomingMaintenance: batteryAnalysis.sort((a, b) => b.daysOld - a.daysOld).slice(0, 10)
            }
        };
    } catch (error) {
        console.error('Error getting vehicle analytics:', error);
        throw new Error('Failed to generate vehicle analytics');
    }
};

/**
 * 👥 TEAM ANALYTICS - Performance, Capacity, Distribution
 */
export const getTeamAnalytics = async () => {
    try {
        const [teams, kids, vehicles] = await Promise.all([
            getDocs(collection(db, 'teams')),
            getDocs(collection(db, 'kids')),
            getDocs(collection(db, 'vehicles'))
        ]);

        const teamData = teams.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const kidData = kids.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const vehicleData = vehicles.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const teamAnalytics = teamData.map(team => {
            const teamKids = kidData.filter(kid => kid.teamId === team.id);
            const teamVehicles = vehicleData.filter(vehicle => vehicle.teamId === team.id);
            const completedKids = teamKids.filter(kid => kid.signedFormStatus === 'completed');

            return {
                id: team.id,
                name: team.name,
                maxCapacity: team.maxCapacity || 0,
                currentMembers: teamKids.length,
                completedMembers: completedKids.length,
                utilizationRate: team.maxCapacity > 0 ?
                    Math.round((teamKids.length / team.maxCapacity) * 100) : 0,
                vehicleCount: teamVehicles.length,
                activeVehicles: teamVehicles.filter(v => v.active).length,
                vehiclesInUse: teamVehicles.filter(v => v.currentKidId).length,
                teamLeader: team.teamLeaderId || null,
                instructorCount: Array.isArray(team.instructorIds) ? team.instructorIds.length : 0
            };
        });

        const sortedByCapacity = [...teamAnalytics].sort((a, b) => b.utilizationRate - a.utilizationRate);

        return {
            summary: {
                totalTeams: teamData.length,
                activeTeams: teamData.filter(t => t.active).length,
                totalCapacity: teamData.reduce((sum, team) => sum + (team.maxCapacity || 0), 0),
                totalMembers: kidData.length,
                averageTeamSize: teamData.length > 0 ?
                    Math.round(kidData.length / teamData.length) : 0
            },
            capacity: {
                highUtilization: sortedByCapacity.filter(t => t.utilizationRate > 80),
                lowUtilization: sortedByCapacity.filter(t => t.utilizationRate < 50),
                teamUtilization: sortedByCapacity
            },
            resources: {
                teamsNeedingVehicles: teamAnalytics.filter(t => t.vehicleCount === 0),
                teamsWithMostVehicles: teamAnalytics.sort((a, b) => b.vehicleCount - a.vehicleCount).slice(0, 5),
                vehicleDistribution: teamAnalytics.map(t => ({
                    teamName: t.name,
                    vehicleCount: t.vehicleCount,
                    memberCount: t.currentMembers,
                    vehicleToMemberRatio: t.currentMembers > 0 ?
                        Math.round((t.vehicleCount / t.currentMembers) * 100) / 100 : 0
                }))
            }
        };
    } catch (error) {
        console.error('Error getting team analytics:', error);
        throw new Error('Failed to generate team analytics');
    }
};

/**
 * 🏁 PARTICIPATION ANALYTICS - Events, Performance, Engagement
 */
export const getParticipationAnalytics = async () => {
    try {
        const [events, participants, kids] = await Promise.all([
            getDocs(collection(db, 'events')),
            getDocs(collection(db, 'eventParticipants')),
            getDocs(collection(db, 'kids'))
        ]);

        const eventData = events.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const participantData = participants.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const kidData = kids.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Event participation analysis
        const eventAnalytics = eventData.map(event => {
            const eventParticipants = participantData.filter(p => p.eventId === event.id);
            const uniqueKids = [...new Set(eventParticipants.map(p => p.kidId))];
            const uniqueTeams = [...new Set(eventParticipants.map(p => p.teamId))];
            const uniqueVehicles = [...new Set(eventParticipants.map(p => p.vehicleId))];

            return {
                id: event.id,
                name: event.name,
                date: event.date,
                status: event.status,
                participantCount: uniqueKids.length,
                teamCount: uniqueTeams.length,
                vehicleCount: uniqueVehicles.length,
                organizer: event.organizer
            };
        });

        // Kid participation analysis
        const kidParticipation = kidData.map(kid => {
            const kidEvents = participantData.filter(p => p.kidId === kid.id);
            const eventsAttended = kidEvents.length;
            const recentEvents = kidEvents.filter(p => {
                const eventDate = eventData.find(e => e.id === p.eventId)?.date;
                if (!eventDate) return false;
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(eventDate) > thirtyDaysAgo;
            });

            return {
                kidId: kid.id,
                name: `${kid.personalInfo?.firstName} ${kid.personalInfo?.lastName}`,
                participantNumber: kid.participantNumber,
                totalEvents: eventsAttended,
                recentEvents: recentEvents.length,
                teamId: kid.teamId,
                signedFormStatus: kid.signedFormStatus
            };
        });

        return {
            events: {
                totalEvents: eventData.length,
                upcomingEvents: eventData.filter(e => e.status === 'upcoming').length,
                completedEvents: eventData.filter(e => e.status === 'completed').length,
                eventDetails: eventAnalytics.sort((a, b) => new Date(b.date) - new Date(a.date))
            },
            participation: {
                mostActiveKids: kidParticipation.sort((a, b) => b.totalEvents - a.totalEvents).slice(0, 10),
                recentParticipation: kidParticipation.sort((a, b) => b.recentEvents - a.recentEvents).slice(0, 10),
                averageParticipationPerEvent: eventAnalytics.length > 0 ?
                    Math.round(participantData.length / eventAnalytics.length) : 0
            }
        };
    } catch (error) {
        console.error('Error getting participation analytics:', error);
        throw new Error('Failed to generate participation analytics');
    }
};

/**
 * 📈 TRENDS ANALYTICS - Historical patterns and predictions
 */
export const getTrendsAnalytics = async () => {
    try {
        const [vehicles, kids, events] = await Promise.all([
            getDocs(collection(db, 'vehicles')),
            getDocs(collection(db, 'kids')),
            getDocs(collection(db, 'events'))
        ]);

        const vehicleData = vehicles.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const kidData = kids.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const eventData = events.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Registration trends (kids joining over time)
        const registrationTrends = getTimeSeriesData(kidData, 'createdAt', 30); // Last 30 days

        // Vehicle utilization trends
        const vehicleUtilizationTrends = vehicleData.map(vehicle => {
            const historyLength = Array.isArray(vehicle.history) ? vehicle.history.length : 0;
            const daysSinceCreation = vehicle.createdAt ?
                Math.floor((new Date() - vehicle.createdAt.toDate()) / (1000 * 60 * 60 * 24)) : 0;

            return {
                vehicleId: vehicle.id,
                name: `${vehicle.make} ${vehicle.model}`,
                usageRate: daysSinceCreation > 0 ? historyLength / daysSinceCreation : 0,
                totalUsage: historyLength
            };
        });

        return {
            registration: {
                dailyRegistrations: registrationTrends,
                growthRate: calculateGrowthRate(registrationTrends),
                predictedRegistrations: predictFutureRegistrations(registrationTrends)
            },
            vehicleUsage: {
                utilizationTrends: vehicleUtilizationTrends.sort((a, b) => b.usageRate - a.usageRate),
                averageUsageRate: vehicleUtilizationTrends.length > 0 ?
                    vehicleUtilizationTrends.reduce((sum, v) => sum + v.usageRate, 0) / vehicleUtilizationTrends.length : 0
            },
            events: {
                eventFrequency: getEventFrequencyTrends(eventData),
                seasonalPatterns: getSeasonalPatterns(eventData)
            }
        };
    } catch (error) {
        console.error('Error getting trends analytics:', error);
        throw new Error('Failed to generate trends analytics');
    }
};

/**
 * 🎯 PERFORMANCE METRICS - KPIs and health indicators
 */
export const getPerformanceMetrics = async () => {
    try {
        const [systemOverview, vehicleAnalytics, teamAnalytics] = await Promise.all([
            getSystemOverview(),
            getVehicleAnalytics(),
            getTeamAnalytics()
        ]);

        // Calculate key performance indicators
        const kpis = {
            vehicleUtilization: vehicleAnalytics.summary.vehiclesInUse / vehicleAnalytics.summary.activeVehicles * 100,
            teamCapacityUtilization: (teamAnalytics.summary.totalMembers / teamAnalytics.summary.totalCapacity) * 100,
            systemHealth: calculateSystemHealth(systemOverview, vehicleAnalytics, teamAnalytics),
            participationRate: calculateParticipationRate(systemOverview)
        };

        return {
            kpis,
            healthIndicators: {
                vehicleHealth: getVehicleHealthScore(vehicleAnalytics),
                teamHealth: getTeamHealthScore(teamAnalytics),
                systemHealth: kpis.systemHealth
            },
            recommendations: generateRecommendations(vehicleAnalytics, teamAnalytics, kpis)
        };
    } catch (error) {
        console.error('Error getting performance metrics:', error);
        throw new Error('Failed to generate performance metrics');
    }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

const getVehicleUtilizationByTeam = (vehicles) => {
    const teamGroups = vehicles.reduce((acc, vehicle) => {
        const teamName = vehicle.teamName || 'Unassigned';
        if (!acc[teamName]) acc[teamName] = [];
        acc[teamName].push(vehicle);
        return acc;
    }, {});

    return Object.entries(teamGroups).map(([teamName, teamVehicles]) => ({
        teamName,
        vehicleCount: teamVehicles.length,
        activeCount: teamVehicles.filter(v => v.active).length,
        inUseCount: teamVehicles.filter(v => v.currentKidId).length,
        utilizationRate: teamVehicles.length > 0 ?
            (teamVehicles.filter(v => v.currentKidId).length / teamVehicles.length) * 100 : 0
    }));
};

const getTimeSeriesData = (data, dateField, days) => {
    const now = new Date();
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const count = data.filter(item => {
            const itemDate = item[dateField]?.toDate ? item[dateField].toDate() : new Date(item[dateField]);
            return itemDate >= dayStart && itemDate <= dayEnd;
        }).length;

        trends.push({
            date: dayStart.toISOString().split('T')[0],
            count
        });
    }

    return trends;
};

const calculateGrowthRate = (trends) => {
    if (trends.length < 2) return 0;
    const recent = trends.slice(-7).reduce((sum, t) => sum + t.count, 0);
    const previous = trends.slice(-14, -7).reduce((sum, t) => sum + t.count, 0);
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
};

const predictFutureRegistrations = (trends) => {
    if (trends.length < 7) return 0;
    const recentAverage = trends.slice(-7).reduce((sum, t) => sum + t.count, 0) / 7;
    return Math.round(recentAverage * 7); // Predict next week
};

const getEventFrequencyTrends = (events) => {
    const monthlyCount = events.reduce((acc, event) => {
        if (!event.date) return acc;
        const month = event.date.substring(0, 7); // YYYY-MM format
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(monthlyCount).map(([month, count]) => ({ month, count }));
};

const getSeasonalPatterns = (events) => {
    const seasonalCount = events.reduce((acc, event) => {
        if (!event.date) return acc;
        const month = new Date(event.date).getMonth();
        const season = Math.floor(month / 3); // 0=Winter, 1=Spring, 2=Summer, 3=Fall
        const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
        acc[seasons[season]] = (acc[seasons[season]] || 0) + 1;
        return acc;
    }, {});

    return seasonalCount;
};

const calculateSystemHealth = (overview, vehicles, teams) => {
    const scores = [
        vehicles.summary.activeVehicles / vehicles.summary.totalVehicles * 100,
        teams.summary.activeTeams / teams.summary.totalTeams * 100,
        overview.summary.activeKids / overview.summary.totalKids * 100
    ];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

const calculateParticipationRate = (overview) => {
    return overview.summary.totalKids > 0 ?
        (overview.summary.activeKids / overview.summary.totalKids) * 100 : 0;
};

const getVehicleHealthScore = (analytics) => {
    const { summary, maintenance } = analytics;
    const maintenanceIssues = maintenance.batteriesNeedingReplacement.length +
        maintenance.batteriesNeedingMonitoring.length;
    const healthScore = Math.max(0, 100 - (maintenanceIssues / summary.totalVehicles * 100));
    return Math.round(healthScore);
};

const getTeamHealthScore = (analytics) => {
    const lowUtilization = analytics.capacity.lowUtilization.length;
    const totalTeams = analytics.summary.totalTeams;
    const healthScore = Math.max(0, 100 - (lowUtilization / totalTeams * 50));
    return Math.round(healthScore);
};

const generateRecommendations = (vehicles, teams, kpis) => {
    const recommendations = [];

    if (kpis.vehicleUtilization < 60) {
        recommendations.push({
            type: 'vehicle',
            priority: 'medium',
            title: 'Low Vehicle Utilization',
            description: 'Consider reassigning underused vehicles or investigating usage barriers.',
            action: 'Review vehicle assignments and team needs'
        });
    }

    if (vehicles.maintenance.batteriesNeedingReplacement.length > 0) {
        recommendations.push({
            type: 'maintenance',
            priority: 'high',
            title: 'Urgent Battery Replacements',
            description: `${vehicles.maintenance.batteriesNeedingReplacement.length} vehicles need immediate battery replacement.`,
            action: 'Schedule battery replacements for flagged vehicles'
        });
    }

    if (teams.resources.teamsNeedingVehicles.length > 0) {
        recommendations.push({
            type: 'resource',
            priority: 'medium',
            title: 'Teams Without Vehicles',
            description: `${teams.resources.teamsNeedingVehicles.length} teams have no assigned vehicles.`,
            action: 'Assign vehicles to teams or consider vehicle redistribution'
        });
    }

    return recommendations;
};