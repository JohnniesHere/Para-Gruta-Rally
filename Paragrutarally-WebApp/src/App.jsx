// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PermissionProvider } from './hooks/usePermissions.jsx'; // Add a permission provider
import ErrorBoundary from './components/layout/ErrorBoundary';

// Import pages
import Login from './components/auth/Login';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventManagementPage from './pages/admin/EventManagementPage';
import CreateEventPage from './pages/admin/CreateEventPage';
import ViewEventsPage from './pages/admin/ViewEventsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import FormsManagementPage from './pages/admin/FormsManagementPage';
import BackupSyncPage from './pages/admin/BackupSyncPage';
import ImportExportPage from './pages/admin/ImportExportPage';
import GalleryPage from './pages/shared/GalleryPage';
import InstructorDashboardPage from './pages/instructor/InstructorDashboardPage';
import HostDashboardPage from './pages/host/HostDashboardPage';
import MyAccountPage from './pages/shared/MyAccountPage';

// Import vehicle management components
import VehiclesPage from './pages/admin/VehiclesPage';
import ViewVehiclePage from './pages/admin/ViewVehiclePage';
import AddVehiclePage from './pages/admin/AddVehiclePage';
import EditVehiclePage from './pages/admin/EditVehiclePage';

// Import new management components
import KidsManagementPage from './pages/admin/KidsManagementPage';
import TeamsManagementPage from './pages/admin/TeamsManagementPage';
// Import new page components
import AddKidPage from './pages/admin/AddKidPage';
import EditKidPage from './pages/admin/EditKidPage';
import ViewKidPage from './pages/admin/ViewKidPage';
import AddTeamPage from './pages/admin/AddTeamPage';
import EditTeamPage from './pages/admin/EditTeamPage';
import ViewTeamPage from './pages/admin/ViewTeamPage';

// Import permission-aware components
import KidDetailView from './components/kids/KidDetail.jsx'; // Use existing component path

// Import styles
import './styles/theme.css';
import './App.css';
import EditEventPage from "./pages/admin/EditEventPage.jsx";

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
                        <PermissionProvider>  {/* Add permission provider inside AuthProvider */}
                            <Router>
                                <div className="App">
                                    <Routes>
                                        {/* Public routes */}
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/forgot-password" element={<Login />} />

                                        {/* Protected routes */}
                                        <Route
                                            path="/admin/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <AdminDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/instructor/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/host/dashboard"
                                            element={
                                                <ProtectedRoute requiredRole="host">
                                                    <HostDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/my-account"
                                            element={
                                                <ProtectedRoute>
                                                    <MyAccountPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Admin routes */}
                                        <Route
                                            path="/admin/events"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EventManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Event management routes - UPDATED */}
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
                                            path="/admin/events/edit/:eventId"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditEventPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* FIXED: Event view route with correct parameter name */}
                                        <Route
                                            path="/admin/events/view/:eventId"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <ViewEventsPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/admin/users"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <UserManagementPage />
                                                </ProtectedRoute>
                                            }
                                        />

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
                                            path="/admin/kids/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditKidPage />
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

                                        {/* Permission-aware kid detail route for testing */}
                                        <Route
                                            path="/kid/:kidId"
                                            element={
                                                <ProtectedRoute>
                                                    <KidDetailView />
                                                </ProtectedRoute>
                                            }
                                        />

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
                                            path="/admin/teams/edit/:id"
                                            element={
                                                <ProtectedRoute requiredRole="admin">
                                                    <EditTeamPage />
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

                                        {/* ========================================
                                           VEHICLES MANAGEMENT ROUTES
                                           ======================================== */}

                                        {/* Main vehicles page - accessible to admin, instructor, parent */}
                                        <Route
                                            path="/admin/vehicles"
                                            element={
                                                <ProtectedRoute>
                                                    <VehiclesPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* View vehicle details - accessible to admin, instructor, parent */}
                                        <Route
                                            path="/admin/vehicles/view/:id"
                                            element={
                                                <ProtectedRoute>
                                                    <ViewVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Add new vehicle - admin and instructor only */}
                                        <Route
                                            path="/admin/vehicles/add"
                                            element={
                                                <ProtectedRoute>
                                                    <AddVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Edit vehicle - admin and instructor only */}
                                        <Route
                                            path="/admin/vehicles/edit/:id"
                                            element={
                                                <ProtectedRoute>
                                                    <EditVehiclePage />
                                                </ProtectedRoute>
                                            }
                                        />

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

                                        {/* Instructor routes */}
                                        <Route
                                            path="/instructor/events"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route
                                            path="/instructor/teams"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <InstructorDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Instructor-specific vehicle routes */}
                                        <Route
                                            path="/instructor/vehicles"
                                            element={
                                                <ProtectedRoute requiredRole="instructor">
                                                    <VehiclesPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Host routes */}
                                        <Route
                                            path="/host/events"
                                            element={
                                                <ProtectedRoute requiredRole="host">
                                                    <HostDashboardPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* ========================================
                                           GALLERY ROUTES - NEW
                                           ======================================== */}

                                        {/* Main gallery - accessible to all authenticated users */}
                                        <Route
                                            path="/gallery"
                                            element={
                                                <ProtectedRoute>
                                                    <GalleryPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Event-specific gallery - accessible to all authenticated users */}
                                        <Route
                                            path="/gallery/:eventId"
                                            element={
                                                <ProtectedRoute>
                                                    <GalleryPage />
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Default redirects */}
                                        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                                        <Route path="/" element={<Navigate to="/login" replace />} />

                                        {/* 404 catch-all */}
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