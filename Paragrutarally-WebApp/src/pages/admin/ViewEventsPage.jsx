// src/pages/admin/ViewEventsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import {
    IconCalendarEvent as Calendar,
    IconEye as Eye,
    IconEdit as Edit,
    IconTrash as Trash2,
    IconPlus as Plus,
    IconMapPin as MapPin,
    IconClock as Clock,
    IconUsers as Users,
    IconSearch as Search,
    IconFilter as Filter,
    IconGrid3x3 as Grid,
    IconList as List,
    IconChevronLeft as ChevronLeft,
    IconChevronRight as ChevronRight,
    IconSparkles as Sparkles,
    IconTrophy as Trophy,
    IconTarget as Target,
    IconRefresh as RefreshCw,
    IconDownload as Download
} from '@tabler/icons-react';
import './ViewEventsPage.css';

const ViewEventsPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, appliedTheme } = useTheme();
    const { permissions, userRole } = usePermissions();

    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Mock events data
    useEffect(() => {
        loadEventsData();
    }, []);

    const loadEventsData = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockEvents = [
                {
                    id: '1',
                    name: 'Summer Racing Championship 2025',
                    description: 'The biggest racing event of the year featuring teams from all over the region. Join us for an exciting day of competition and fun!',
                    type: 'race',
                    date: '2025-07-15',
                    time: '09:00',
                    location: 'Jerusalem Racing Park',
                    address: '123 Speed Avenue, Jerusalem',
                    participants: 45,
                    maxParticipants: 60,
                    status: 'upcoming',
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
                    organizer: 'Racing Committee'
                },
                {
                    id: '2',
                    name: 'Kids Practice Session',
                    description: 'Weekly practice session for young racers to improve their skills and learn new techniques.',
                    type: 'practice',
                    date: '2025-06-20',
                    time: '16:00',
                    location: 'Training Center',
                    address: '456 Practice Road, Tel Aviv',
                    participants: 28,
                    maxParticipants: 30,
                    status: 'upcoming',
                    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
                    organizer: 'Training Team'
                },
                {
                    id: '3',
                    name: 'Safety Workshop',
                    description: 'Important safety training session covering racing safety protocols and emergency procedures.',
                    type: 'workshop',
                    date: '2025-06-10',
                    time: '14:00',
                    location: 'Community Center',
                    address: '789 Safety Street, Haifa',
                    participants: 52,
                    maxParticipants: 50,
                    status: 'completed',
                    image: 'https://images.unsplash.com/photo-1504274066651-8d31a536b-8a8?w=400&h=250&fit=crop',
                    organizer: 'Safety Team'
                },
                {
                    id: '4',
                    name: 'Night Racing Series',
                    description: 'Exciting night racing series with spectacular lights and enhanced competition atmosphere.',
                    type: 'race',
                    date: '2025-08-22',
                    time: '20:00',
                    location: 'Night Track Stadium',
                    address: '321 Night Drive, Eilat',
                    participants: 38,
                    maxParticipants: 45,
                    status: 'upcoming',
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
                    organizer: 'Night Racing Club'
                },
                {
                    id: '5',
                    name: 'Team Building Day',
                    description: 'Fun team building activities and racing challenges for all skill levels.',
                    type: 'social',
                    date: '2025-05-30',
                    time: '10:00',
                    location: 'Adventure Park',
                    address: '654 Team Street, Netanya',
                    participants: 75,
                    maxParticipants: 80,
                    status: 'completed',
                    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
                    organizer: 'Community Team'
                }
            ];

            setEvents(mockEvents);
            setFilteredEvents(mockEvents);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter events based on search and filters
    useEffect(() => {
        let filtered = events;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(event => event.status === statusFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const eventDate = new Date(event.date);

            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(event => {
                        const eventDate = new Date(event.date);
                        return eventDate.toDateString() === now.toDateString();
                    });
                    break;
                case 'upcoming':
                    filtered = filtered.filter(event => {
                        const eventDate = new Date(event.date);
                        return eventDate > now;
                    });
                    break;
                case 'past':
                    filtered = filtered.filter(event => {
                        const eventDate = new Date(event.date);
                        return eventDate < now;
                    });
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        filtered = filtered.filter(event => {
                            const eventDate = new Date(event.date);
                            return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
                        });
                    }
                    break;
            }
        }

        setFilteredEvents(filtered);
    }, [events, searchTerm, statusFilter, dateFilter, startDate, endDate]);

    const handleCreateEvent = () => {
        navigate('/admin/events/create');
    };

    const handleViewEvent = (eventId) => {
        navigate(`/admin/events/${eventId}`);
    };

    const handleEditEvent = (eventId) => {
        navigate(`/admin/events/edit/${eventId}`);
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                setEvents(events.filter(event => event.id !== eventId));
            } catch (error) {
                console.error('Error deleting event:', error);
            }
        }
    };

    const getEventTypeIcon = (type) => {
        switch (type) {
            case 'race': return <Trophy className="w-4 h-4" />;
            case 'practice': return <Target className="w-4 h-4" />;
            case 'workshop': return <Users className="w-4 h-4" />;
            case 'social': return <Sparkles className="w-4 h-4" />;
            default: return <Calendar className="w-4 h-4" />;
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'upcoming':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
            case 'cancelled':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const EventCard = ({ event }) => (
        <div className="racing-event-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <div className="relative">
                <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3">
                    <span className={getStatusBadge(event.status)}>
                        {event.status}
                    </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                    {getEventTypeIcon(event.type)}
                    <span className="text-xs font-medium capitalize">{event.type}</span>
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {event.description}
                </p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(event.date)} at {formatTime(event.time)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-2" />
                        {event.participants} / {event.maxParticipants} participants
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        By {event.organizer}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleViewEvent(event.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Event"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {permissions.canEdit && (
                            <button
                                onClick={() => handleEditEvent(event.id)}
                                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                title="Edit Event"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                        {permissions.canDelete && (
                            <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Event"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="racing-events-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Racing Events
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage all racing events and activities
                        </p>
                    </div>
                    {permissions.canCreate && (
                        <button
                            onClick={handleCreateEvent}
                            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Event
                        </button>
                    )}
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Date Filter */}
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past Events</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {/* Custom Date Range */}
                        {dateFilter === 'custom' && (
                            <>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </>
                        )}

                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <Grid className="w-4 h-4 mr-1" />
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <List className="w-4 h-4 mr-1" />
                                List
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {filteredEvents.length} of {events.length} events
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={loadEventsData}
                                className="flex items-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Refresh
                            </button>
                            <button className="flex items-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Events Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading events...</p>
                        </div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                            No events found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                ? "Try adjusting your filters to see more events."
                                : "Get started by creating your first racing event."
                            }
                        </p>
                        {permissions.canCreate && (
                            <button
                                onClick={handleCreateEvent}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Create First Event
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                    }>
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default ViewEventsPage;