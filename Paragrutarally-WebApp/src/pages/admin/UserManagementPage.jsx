// src/pages/admin/UserManagementPage.jsx - Fun & Reorganized with Clickable Stats
import React, {useState, useEffect, useCallback} from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import CreateUserModal from '../../components/modals/CreateUserModal';
import ExportUsersModal from '../../components/modals/ExportUsersModal';
import UpdateUserModal from '../../components/modals/UpdateUserModal';
import UsersTable from '../../components/tables/UsersTable';
import { db } from '../../firebase/config';
import {
    IconUsers as Users,
    IconUserPlus as UserPlus,
    IconDownload as Download,
    IconCrown as Crown,
    IconCar as Car,
    IconUserCheck as UserCheck,
    IconSearch as Search,
    IconTag as Tag,
    IconEraser as Eraser,
    IconFile as FileSpreadsheet,
    IconX as X
} from '@tabler/icons-react';
import './UserManagement.css';

const UserManagementPage = () => {
    const { isDarkMode, appliedTheme } = useTheme();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch users from the Firestore
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(usersQuery);
            const usersData = [];

            querySnapshot.forEach((doc) => {
                usersData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter users by role and search
    const filterUsers = useCallback(() => {
        let filtered = users;

        // Filter by role
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Filter by search term
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(user =>
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    }, [users, roleFilter, searchTerm]);

    // Handle filter changes
    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearFilters = () => {
        setRoleFilter('all');
        setSearchTerm('');
    };

    // Handle stat card clicks to filter users
    const handleStatCardClick = (filterType) => {
        switch (filterType) {
            case 'total':
                setRoleFilter('all');
                break;
            case 'admin':
                setRoleFilter('admin');
                break;
            case 'instructor':
                setRoleFilter('instructor');
                break;
            case 'parent':
                setRoleFilter('parent');
                break;
            default:
                break;
        }
        // Clear search when clicking stat cards
        setSearchTerm('');
    };

    // Modal handlers
    const handleCreateUser = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleUserCreated = () => {
        fetchUsers();
        console.log('User created successfully!');
    };

    const handleUserUpdated = () => {
        fetchUsers();
        setSelectedUser(null);
        console.log('User updated successfully!');
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedUser(null);
    };

    const handleExportUsers = () => {
        setIsExportModalOpen(true);
    };

    const handleCloseExportModal = () => {
        setIsExportModalOpen(false);
    };

    const handleUpdateUser = (user) => {
        setSelectedUser(user);
        setIsUpdateModalOpen(true);
    };

    // Load users on component mount
    useEffect(() => {
        const fetchData = async () => {
            await fetchUsers();
        };
        fetchData();
    }, []);

    // Re-filter when filters change
    useEffect(() => {
        const applyFilters = async () => {
            await filterUsers();
        };
        applyFilters();
    }, [filterUsers]);

    // Calculate stats
    const stats = {
        totalUsers: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        instructors: users.filter(u => u.role === 'instructor').length,
        parents: users.filter(u => u.role === 'parent').length,
        hosts: users.filter(u => u.role === 'host').length
    };

    return (
        <Dashboard requiredRole="admin">
            <div className={`user-management-page ${appliedTheme}-mode`}>
                <h1><Users size={32} className="page-title-icon" /> User Management</h1>

                <div className="user-management-container">
                    {/* Header with Export in top-right */}
                    <div className="page-header">
                        <button
                            className="btn-primary"
                            onClick={handleCreateUser}
                        >
                            <UserPlus className="btn-icon" size={18} />
                            Create New User
                        </button>

                        <button
                            className="btn-export"
                            onClick={handleExportUsers}
                        >
                            <Download className="btn-icon" size={18} />
                            Export Users
                        </button>
                    </div>

                    {/* Clickable Stats Cards */}
                    <div className="stats-grid">
                        <div
                            className={`stat-card total ${roleFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('total')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Users className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Total Users</h3>
                                <div className="stat-value">{stats.totalUsers}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card admins ${roleFilter === 'admin' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('admin')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Crown className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Admins</h3>
                                <div className="stat-value">{stats.admins}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card instructors ${roleFilter === 'instructor' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('instructor')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Car className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Instructors</h3>
                                <div className="stat-value">{stats.instructors}</div>
                            </div>
                        </div>

                        <div
                            className={`stat-card parents ${roleFilter === 'parent' ? 'active' : ''}`}
                            onClick={() => handleStatCardClick('parent')}
                            style={{ cursor: 'pointer' }}
                        >
                            <UserCheck className="stat-icon" size={40} />
                            <div className="stat-content">
                                <h3>Parents</h3>
                                <div className="stat-value">{stats.parents}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters - Side by Side */}
                    <div className="search-filter-section">
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                {searchTerm && (
                                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-container">
                            <label className="filter-label">
                                <Tag className="filter-icon" size={16} />
                                Filter by Role
                            </label>
                            <select
                                className="filter-select"
                                value={roleFilter}
                                onChange={handleRoleFilterChange}
                            >
                                <option value="all">⭐ All Roles</option>
                                <option value="admin">👑 Admin</option>
                                <option value="instructor">🏎️ Instructor</option>
                                <option value="parent">👨‍👩‍👧‍👦 Parent</option>
                                <option value="host">🏠 Host</option>
                            </select>
                        </div>

                        <button className="btn-clear" onClick={handleClearFilters}>
                            <Eraser className="btn-icon" size={18} />
                            Clear Filters
                        </button>
                    </div>

                    {/* Results Info */}
                    <div className="results-info">
                        <FileSpreadsheet className="results-icon" size={18} />
                        Showing {filteredUsers.length} of {users.length} users
                        {roleFilter !== 'all' && <span className="filter-applied"> • Filtered by: {roleFilter}</span>}
                        {searchTerm && <span className="search-applied"> • Searching: "{searchTerm}"</span>}
                    </div>

                    <UsersTable
                        users={filteredUsers}
                        isLoading={isLoading}
                        onUpdateUser={handleUpdateUser}
                    />
                </div>
            </div>

            {/* Modals */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onUserCreated={handleUserCreated}
            />

            <ExportUsersModal
                isOpen={isExportModalOpen}
                onClose={handleCloseExportModal}
            />

            <UpdateUserModal
                isOpen={isUpdateModalOpen}
                onClose={handleCloseUpdateModal}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />
        </Dashboard>
    );
};

export default UserManagementPage;