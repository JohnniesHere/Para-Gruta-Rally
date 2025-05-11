// // src/App.jsx
// import React from 'react';
// import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
// import {useAuth} from './hooks/useAuth.jsx';
//
// // Auth Pages
// import LoginPage from './pages/auth/LoginPage';
// import PasswordResetPage from './pages/auth/PasswordResetPage';
//
// // Admin Pages
// import AdminDashboardPage from './pages/admin/AdminDashboardPage';
// import EventManagementPage from './pages/admin/EventManagementPage';
// import CreateEventPage from './pages/admin/CreateEventPage';
// import ViewEventsPage from './pages/admin/ViewEventsPage';
// import UserManagementPage from './pages/admin/UserManagementPage';
// import FormsManagementPage from './pages/admin/FormsManagementPage';
// import BackupSyncPage from './pages/admin/BackupSyncPage';
// import ImportExportPage from './pages/admin/ImportExportPage';
//
// // Instructor Pages
// import InstructorDashboardPage from './pages/instructor/InstructorDashboardPage';
// import ViewTeamsPage from './pages/instructor/ViewTeamsPage';
//
// // Host Pages
// import HostDashboardPage from './pages/host/HostDashboardPage';
//
// // Shared Pages
// import GalleryPage from './pages/shared/GalleryPage';
// import MyAccountPage from './pages/shared/MyAccountPage';
//
// // Protected Route Component
// const ProtectedRoute = ({children, allowedRoles}) => {
//     const {user, userRole} = useAuth();
//
//     if (!user) {
//         return <Navigate to="/login"/>;
//     }
//
//     if (allowedRoles && !allowedRoles.includes(userRole)) {
//         // Redirect to the appropriate dashboard based on role
//         if (userRole === 'admin') {
//             return <Navigate to="/admin/dashboard"/>;
//         } else if (userRole === 'instructor') {
//             return <Navigate to="/instructor/dashboard"/>;
//         } else if (userRole === 'host') {
//             return <Navigate to="/host/dashboard"/>;
//         } else {
//             return <Navigate to="/login"/>;
//         }
//     }
//
//     return children;
// };
//
// const App = () => {
//     return (
//         <Routes>
//             {/* Public Routes */}
//             <Route path="/login" element={<LoginPage/>}/>
//             <Route path="/reset-password" element={<PasswordResetPage/>}/>
//
//             {/* Admin Routes */}
//             <Route path="/admin/dashboard" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <AdminDashboardPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/events" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <EventManagementPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/events/create" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <CreateEventPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/events/view" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <ViewEventsPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/users" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <UserManagementPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/forms" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <FormsManagementPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/backup" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <BackupSyncPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/admin/import-export" element={
//                 <ProtectedRoute allowedRoles={['admin']}>
//                     <ImportExportPage/>
//                 </ProtectedRoute>
//             }/>
//
//             {/* Instructor Routes */}
//             <Route path="/instructor/dashboard" element={
//                 <ProtectedRoute allowedRoles={['instructor']}>
//                     <InstructorDashboardPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/instructor/teams" element={
//                 <ProtectedRoute allowedRoles={['instructor']}>
//                     <ViewTeamsPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/instructor/events" element={
//                 <ProtectedRoute allowedRoles={['instructor']}>
//                     <ViewEventsPage/>
//                 </ProtectedRoute>
//             }/>
//
//             {/* Host Routes */}
//             <Route path="/host/dashboard" element={
//                 <ProtectedRoute allowedRoles={['host']}>
//                     <HostDashboardPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/host/events" element={
//                 <ProtectedRoute allowedRoles={['host']}>
//                     <ViewEventsPage/>
//                 </ProtectedRoute>
//             }/>
//
//             {/* Shared Routes */}
//             <Route path="/gallery" element={
//                 <ProtectedRoute allowedRoles={['admin', 'instructor', 'host']}>
//                     <GalleryPage/>
//                 </ProtectedRoute>
//             }/>
//             <Route path="/my-account" element={
//                 <ProtectedRoute allowedRoles={['admin', 'instructor', 'host']}>
//                     <MyAccountPage/>
//                 </ProtectedRoute>
//             }/>
//
//             {/* Default Route */}
//             <Route path="/" element={<Navigate to="/login"/>}/>
//             <Route path="*" element={<Navigate to="/login"/>}/>
//         </Routes>
//     );
// };
//
// export default App;

// This is a simple React component that renders a "Hello World" message for testing purposes.
// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // Use your actual path

// Keep mock notification provider
const MockNotificationProvider = ({ children }) => <>{children}</>;

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <MockNotificationProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </MockNotificationProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;