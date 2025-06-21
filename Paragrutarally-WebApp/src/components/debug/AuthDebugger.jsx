// src/components/debug/AuthDebugger.jsx - Add this temporarily to debug the issue
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const AuthDebugger = () => {
    const authContext = useAuth();
    const permissionsContext = usePermissions();

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #333',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🐛 Auth Debug Info</h3>

            <div style={{ marginBottom: '15px' }}>
                <strong>AuthContext:</strong>
                <div style={{ marginLeft: '10px', color: '#666' }}>
                    <div>currentUser: {authContext?.currentUser ? '✓ Exists' : '✗ None'}</div>
                    <div>email: {authContext?.currentUser?.email || 'N/A'}</div>
                    <div>uid: {authContext?.currentUser?.uid || 'N/A'}</div>
                    <div>userRole: {authContext?.userRole || 'N/A'}</div>
                    <div>userData: {authContext?.userData ? JSON.stringify(authContext.userData, null, 2) : 'N/A'}</div>
                    <div>loading: {authContext?.loading ? 'true' : 'false'}</div>
                    <div>error: {authContext?.error || 'None'}</div>
                    <div>authInitialized: {authContext?.authInitialized ? 'true' : 'false'}</div>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>PermissionsContext:</strong>
                <div style={{ marginLeft: '10px', color: '#666' }}>
                    <div>userRole: {permissionsContext?.userRole || 'N/A'}</div>
                    <div>userData: {permissionsContext?.userData ? JSON.stringify(permissionsContext.userData, null, 2) : 'N/A'}</div>
                    <div>user: {permissionsContext?.user?.email || 'N/A'}</div>
                    <div>loading: {permissionsContext?.loading ? 'true' : 'false'}</div>
                    <div>error: {permissionsContext?.error || 'None'}</div>
                    <div>permissions: {permissionsContext?.permissions ? '✓ Loaded' : '✗ None'}</div>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Role Checks:</strong>
                <div style={{ marginLeft: '10px', color: '#666' }}>
                    <div>isAdmin: {authContext?.isAdmin ? 'true' : 'false'}</div>
                    <div>isInstructor: {authContext?.isInstructor ? 'true' : 'false'}</div>
                    <div>isParent: {authContext?.isParent ? 'true' : 'false'}</div>
                    <div>isHost: {authContext?.isHost ? 'true' : 'false'}</div>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Current URL:</strong>
                <div style={{ marginLeft: '10px', color: '#666' }}>
                    {window.location.pathname}
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Quick Tests:</strong>
                <div style={{ marginLeft: '10px', color: '#666' }}>
                    <button
                        onClick={() => console.log('AuthContext:', authContext)}
                        style={{ margin: '2px', padding: '4px 8px', fontSize: '10px' }}
                    >
                        Log AuthContext
                    </button>
                    <button
                        onClick={() => console.log('PermissionsContext:', permissionsContext)}
                        style={{ margin: '2px', padding: '4px 8px', fontSize: '10px' }}
                    >
                        Log Permissions
                    </button>
                    <button
                        onClick={() => {
                            console.log('Current user Firebase object:', authContext?.currentUser);
                            console.log('User role from auth:', authContext?.userRole);
                            console.log('User data from auth:', authContext?.userData);
                        }}
                        style={{ margin: '2px', padding: '4px 8px', fontSize: '10px' }}
                    >
                        Detailed User Info
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthDebugger;