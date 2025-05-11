// // src/main.jsx
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter as Router } from 'react-router-dom';
// import App from './App';
// import { AuthProvider } from './contexts/AuthContext';
// import { NotificationProvider } from './contexts/NotificationContext';
// import './index.css';
//
// // If this is in main.jsx
// ReactDOM.createRoot(document.getElementById('root')).render(
//     <React.StrictMode>
//         <Router>
//             <AuthProvider>
//                 <NotificationProvider>
//                     <App />
//                 </NotificationProvider>
//             </AuthProvider>
//         </Router>
//     </React.StrictMode>
// );

// this is for testing only
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);