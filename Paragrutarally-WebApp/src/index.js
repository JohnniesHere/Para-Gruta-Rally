// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import global styles
import './styles/theme.css';
import './App.css';
import './index.css';

// Get the root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);