import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import './App.css';

import ErrorBoundary from './ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
