// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Import pages
import Login from './components/auth/Login';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventManagementPage from './pages/admin/EventManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import FormsManagementPage from './pages/admin/FormsManagementPage';
import BackupSyncPage from './pages/admin/BackupSyncPage';
import ImportExportPage from './pages/admin/ImportExportPage';
import GalleryPage from './pages/shared/GalleryPage';
import InstructorDashboardPage from './pages/instructor/InstructorDashboardPage';
import HostDashboardPage from './pages/host/HostDashboardPage';
import MyAccountPage from './pages/shared/MyAccountPage';

// Import styles
import './styles/theme.css';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole }) => {
    // This would typically check authentication and authorization
    // For now, we'll assume the Dashboard component handles this
    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <LanguageProvider>
                <ThemeProvider>
                    <AuthProvider>
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

                                    <Route
                                        path="/admin/users"
                                        element={
                                            <ProtectedRoute requiredRole="admin">
                                                <UserManagementPage />
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

                                    {/* Host routes */}
                                    <Route
                                        path="/host/events"
                                        element={
                                            <ProtectedRoute requiredRole="host">
                                                <HostDashboardPage />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Shared routes */}
                                    <Route
                                        path="/gallery"
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
                    </AuthProvider>
                </ThemeProvider>
            </LanguageProvider>
        </ErrorBoundary>
    );
}

export default App;