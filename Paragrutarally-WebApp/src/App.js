// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireAdmin, RequireStaff } from './components/routing/ProtectedRoute';

// Auth components
import Login from './components/auth/Login';
import PasswordReset from './components/auth/PasswordReset';

// Layout components
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';

// User management
import UserManagement from './components/users/UserManagement';
import UserForm from './components/users/UserForm';

// Data management
import DataImport from './components/data/DataImport';
import DataExport from './components/data/DataExport';

// Teams management
import TeamsManagement from './components/teams/TeamsManagement';
import TeamForm from './components/teams/TeamForm';
import TeamDetail from './components/teams/TeamDetail';

// Kids management
import KidsManagement from './components/kids/KidsManagement';
import KidDetail from './components/kids/KidDetail';
import KidForm from './components/kids/KidForm';

// Forms management
import FormsManagement from './components/forms/FormsManagement';
import FormBuilder from './components/forms/FormBuilder';
import FormSubmission from './components/forms/FormSubmission';
import FormReview from './components/forms/FormReview';

// Search components
import AdvancedSearch from './components/search/AdvancedSearch';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password" element={<PasswordReset />} />

                    {/* Protected routes - require authentication */}
                    <Route element={<RequireAuth />}>
                        <Route element={<Layout />}>
                            {/* Dashboard */}
                            <Route path="/dashboard" element={<Dashboard />} />

                            {/* Data Management - All authenticated users */}
                            <Route path="/data">
                                <Route path="export" element={<DataExport />} />
                            </Route>

                            {/* Advanced Search - All authenticated users */}
                            <Route path="/search" element={<AdvancedSearch />} />

                            {/* Protected routes - require staff role */}
                            <Route element={<RequireStaff />}>
                                {/* Data Management - Staff only */}
                                <Route path="/data">
                                    <Route path="import" element={<DataImport />} />
                                </Route>

                                {/* Teams Management - Staff only */}
                                <Route path="/teams">
                                    <Route index element={<TeamsManagement />} />
                                    <Route path="new" element={<TeamForm />} />
                                    <Route path=":teamId" element={<TeamDetail />} />
                                    <Route path=":teamId/edit" element={<TeamForm />} />
                                </Route>

                                {/* Kids Management - Staff only */}
                                <Route path="/kids">
                                    <Route index element={<KidsManagement />} />
                                    <Route path="new" element={<KidForm />} />
                                    <Route path=":kidId" element={<KidDetail />} />
                                    <Route path=":kidId/edit" element={<KidForm />} />
                                </Route>

                                {/* Forms Management - Staff only */}
                                <Route path="/forms">
                                    <Route index element={<FormsManagement />} />
                                    <Route path="submissions" element={<FormSubmission />} />
                                    <Route path="review" element={<FormReview />} />
                                </Route>
                            </Route>

                            {/* Protected routes - require admin role */}
                            <Route element={<RequireAdmin />}>
                                {/* User Management - Admin only */}
                                <Route path="/users">
                                    <Route index element={<UserManagement />} />
                                    <Route path="new" element={<UserForm />} />
                                    <Route path=":userId/edit" element={<UserForm />} />
                                </Route>

                                {/* Form Builder - Admin only */}
                                <Route path="/forms/builder" element={<FormBuilder />} />
                                <Route path="/forms/builder/:formId" element={<FormBuilder />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Redirect from root to dashboard or login */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* 404 route */}
                    <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold">404</h1>
                                <p className="mt-2">Page not found</p>
                            </div>
                        </div>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;