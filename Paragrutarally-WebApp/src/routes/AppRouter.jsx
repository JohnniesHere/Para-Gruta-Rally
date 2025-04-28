import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layout components
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ParentLayout from '../components/layout/ParentLayout';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminEvents from '../pages/admin/AdminEvents';
import AdminVehicles from '../pages/admin/AdminVehicles';
import AdminInstructors from '../pages/admin/AdminInstructors'; // New
import InstructorDetailPage from '../pages/admin/InstructorDetailPage'; // New

// Parent pages
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentEvents from '../pages/parent/ParentEvents';
import ParentProfile from '../pages/parent/ParentProfile';

// Event pages
import EventDetailPage from '../pages/events/EventDetailPage';
import EventEditPage from '../pages/admin/EventEditPage';

// Public pages
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import EventsPage from '../pages/public/EventsPage';
import GalleryPage from '../pages/public/GalleryPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="events" element={<EventsPage />} />
                    <Route path="gallery" element={<GalleryPage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* Admin routes */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="events/:eventId" element={<EventDetailPage />} />
                    <Route path="events/:eventId/edit" element={<EventEditPage />} />
                    <Route path="vehicles" element={<AdminVehicles />} />
                    <Route path="instructors" element={<AdminInstructors />} />
                    <Route path="instructors/:instructorId" element={<InstructorDetailPage />} />
                </Route>

                {/* Parent routes */}
                <Route
                    path="/parent"
                    element={
                        <ProtectedRoute allowedRoles={['parent']}>
                            <ParentLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ParentDashboard />} />
                    <Route path="events" element={<ParentEvents />} />
                    <Route path="events/:eventId" element={<EventDetailPage />} />
                    <Route path="profile" element={<ParentProfile />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;