// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PermissionProvider } from './hooks/usePermissions.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Import pages
import Login from './components/auth/Login';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventManagementPage from './pages/admin/EventManagementPage';
import CreateEventPage from './pages/admin/CreateEventPage';
import ViewEventsPage from './pages/admin/ViewEventsPage';
import EditEventPage from './pages/admin/EditEventPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import FormsManagementPage from './pages/admin/FormsManagementPage';
import BackupSyncPage from './pages/admin/BackupSyncPage';
import ImportExportPage from './pages/admin/ImportExportPage';
import AnalyticsDashboardPage from './pages/admin/AnalyticsDashboardPage';

// Admin Kids Management
import KidsManagementPage from './pages/admin/KidsManagementPage';
import AddKidPage from './pages/admin/AddKidPage';
import EditKidPage from './pages/admin/EditKidPage';
import ViewKidPage from './pages/admin/ViewKidPage';

// Admin Teams Management
import TeamsManagementPage from './pages/admin/TeamsManagementPage';
import AddTeamPage from './pages/admin/AddTeamPage';
import EditTeamPage from './pages/admin/EditTeamPage';
import ViewTeamPage from './pages/admin/ViewTeamPage';

// Admin Vehicles Management
import VehiclesPage from './pages/admin/VehiclesPage';
import ViewVehiclePage from './pages/admin/ViewVehiclePage';
import AddVehiclePage from './pages/admin/AddVehiclePage';
import EditVehiclePage from './pages/admin/EditVehiclePage';

// Instructor pages
import InstructorDashboardPage from './pages/instructor/InstructorDashboardPage';
import InstructorKidsManagementPage from './pages/instructor/InstructorKidsManagementPage';
import InstructorTeamsManagementPage from './pages/instructor/InstructorTeamsManagementPage';
import InstructorVehiclesPage from './pages/instructor/InstructorVehiclesPage';
import InstructorEventsPage from './pages/instructor/InstructorEventsPage';

// Parent pages
import ParentDashboardPage from './pages/parent/ParentDashboardPage';
import ParentKidDetailPage from './pages/parent/ParentKidDetailPage';

// Host pages
import HostDashboardPage from './pages/host/HostDashboardPage';

// Shared pages
import GalleryPage from './pages/shared/GalleryPage';
import MyAccountPage from './pages/shared/MyAccountPage';

// Permission-aware components
import KidDetailView from './components/kids/KidDetail.jsx';

// Import styles
import './styles/theme.css';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
    // This would typically check authentication and authorization
    // For now, we'll assume the Dashboard component handles this
    // You can enhance this later to use permissions
    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <LanguageProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <PermissionProvider>
                            <Router>
                                <div className="App">
                                    <Routes>
                                        {/* ========================================
                                           PUBLIC ROUTES
                                           ======================================== */}
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/forgot-password" element={<Login />} />

                                        {/* ========================================
                                           ADMIN ROUTES
                                           ======================================== */}
                                        <Route
                                            path="/admin/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <AdminDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Events Management */}
                                        <Route
                                            path="/admin/events"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EventManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/events/create"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <CreateEventPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/events/view"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ViewEventsPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/events/view/:eventId"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ViewEventsPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/events/edit/:eventId"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditEventPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Users Management */}
                                        <Route
                                            path="/admin/users"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <UserManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Kids Management */}
                                        <Route
                                            path="/admin/kids"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <KidsManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/kids/add"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <AddKidPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/kids/view/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ViewKidPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/kids/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditKidPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Teams Management */}
                                        <Route
                                            path="/admin/teams"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <TeamsManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/teams/add"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <AddTeamPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/teams/view/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ViewTeamPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/teams/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditTeamPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Vehicles Management */}
                                        <Route
                                            path="/admin/vehicles"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <VehiclesPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/vehicles/add"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <AddVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/vehicles/view/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ViewVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/vehicles/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin Other Management */}
                                        <Route
                                            path="/admin/forms"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <FormsManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/backup"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <BackupSyncPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/import-export"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ImportExportPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/analytics"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <AnalyticsDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* ========================================
                                           INSTRUCTOR ROUTES
                                           ======================================== */}
                                        <Route
                                            path="/instructor/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Instructor Events */}
                                        <Route
                                            path="/instructor/events"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorEventsPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Instructor Kids Management */}
                                        <Route
                                            path="/instructor/kids"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorKidsManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/instructor/kids/view/:id"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <ViewKidPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/instructor/kids/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <EditKidPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Instructor Teams Management */}
                                        <Route
                                            path="/instructor/teams"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorTeamsManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/instructor/teams/view/:id"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <ViewTeamPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/instructor/teams/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <EditTeamPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Instructor Vehicles Management */}
                                        <Route
                                            path="/instructor/vehicles"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorVehiclesPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/instructor/vehicles/view/:id"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <ViewVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/instructor/vehicles/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <EditVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* ========================================
                                           PARENT ROUTES
                                           ======================================== */}
                                        <Route
                                            path="/parent/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="parent">
                                                    <ParentDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/parent/kid/:id"
                                            element={
                                                <ProtectedRoute requiredRole="parent">
                                                    <ParentKidDetailPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* ========================================
                                           HOST/GUEST ROUTES
                                           ======================================== */}
                                        <Route
                                            path="/host/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="host">
                                                    <HostDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/host/events"
                                            element={
                                                <ProtectedRoute requiredRole="host">
                                                    <HostDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* ========================================
                                           SHARED ROUTES
                                           ======================================== */}

                                        {/* My Account - accessible to all authenticated users */}
                                        <Route
                                            path="/my-account"
                                            element={
                                                <ProtectedRoute>
                                                    <MyAccountPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Gallery - accessible to all authenticated users */}
                                        <Route
                                            path="/gallery"
                                            element={
                                                <ProtectedRoute>
                                                    <GalleryPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/gallery/:eventId"
                                            element={
                                                <ProtectedRoute>
                                                    <GalleryPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Permission-aware kid detail route for testing */}
                                        <Route
                                            path="/kid/:kidId"
                                            element={
                                                <ProtectedRoute>
                                                    <KidDetailView />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* ========================================
                                           DEFAULT REDIRECTS & 404
                                           ======================================== */}
                                        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                                        <Route path="/" element={<Navigate to="/login" replace />} />
                                        <Route path="*" element={<Navigate to="/login" replace />} />
                                    </Routes>
                                </div>
                            </Router>
                        </PermissionProvider>
                    </AuthProvider>
                </ThemeProvider>
            </LanguageProvider>
        </ErrorBoundary>
    );
}

export default App;