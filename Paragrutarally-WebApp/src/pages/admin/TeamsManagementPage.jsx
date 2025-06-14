// src/pages/admin/TeamsManagementPage.jsx - DEBUG VERSION
import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/layout/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { getAllTeams } from '../../services/teamService';

const TeamsManagementPage = () => {
    const { appliedTheme } = useTheme();
    const { permissions, userRole, loading: permissionsLoading, error: permissionsError } = usePermissions();

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // MASSIVE DEBUG LOGGING
    console.log('🔍 TeamsManagementPage RENDER:', {
        permissionsLoading,
        hasPermissions: !!permissions,
        permissionsType: typeof permissions,
        userRole,
        permissionsError,
        isLoading,
        teamsCount: teams.length
    });

    // Load teams when permissions are ready
    useEffect(() => {
        console.log('🔍 TeamsManagementPage useEffect triggered:', {
            permissionsLoading,
            hasPermissions: !!permissions,
            userRole
        });

        if (!permissionsLoading && permissions) {
            console.log('✅ Conditions met, calling loadTeams');
            loadTeams();
        } else {
            console.log('❌ Conditions not met:', {
                permissionsLoadingCheck: !permissionsLoading,
                permissionsCheck: !!permissions
            });
        }
    }, [permissionsLoading, permissions]);

    const loadTeams = async () => {
        console.log('🔄 loadTeams started');
        try {
            setIsLoading(true);
            setError(null);

            const teamsData = await getAllTeams();
            console.log('✅ Teams loaded successfully:', teamsData.length);
            setTeams(teamsData);
        } catch (err) {
            console.error('💥 Error loading teams:', err);
            setError(err.message);
        } finally {
            console.log('🏁 loadTeams finished, setting isLoading to false');
            setIsLoading(false);
        }
    };

    // ALWAYS show current state in UI
    return (
        <Dashboard requiredRole={userRole}>
            <div className={`teams-management-page ${appliedTheme}-mode`}>
                <h1>Teams Management - DEBUG MODE</h1>

                {/* ALWAYS VISIBLE DEBUG INFO */}
                <div style={{
                    background: '#f0f0f0',
                    border: '2px solid #333',
                    padding: '15px',
                    margin: '10px 0',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                }}>
                    <h3>🔍 DEBUG INFO:</h3>
                    <div>permissionsLoading: {permissionsLoading ? 'TRUE' : 'FALSE'}</div>
                    <div>permissions: {permissions ? 'EXISTS' : 'NULL'} ({typeof permissions})</div>
                    <div>userRole: {userRole || 'undefined'}</div>
                    <div>permissionsError: {permissionsError || 'none'}</div>
                    <div>isLoading: {isLoading ? 'TRUE' : 'FALSE'}</div>
                    <div>teams.length: {teams.length}</div>
                    <div>error: {error || 'none'}</div>

                    {permissions && (
                        <div style={{ marginTop: '10px', background: '#e6ffe6', padding: '5px' }}>
                            <strong>Permissions Object:</strong>
                            <div>canCreate: {permissions.canCreate ? 'YES' : 'NO'}</div>
                            <div>canEdit: {permissions.canEdit ? 'YES' : 'NO'}</div>
                            <div>canDelete: {permissions.canDelete ? 'YES' : 'NO'}</div>
                        </div>
                    )}
                </div>

                {/* CONDITIONAL RENDERING WITH CLEAR STATES */}
                {permissionsLoading ? (
                    <div style={{ background: '#fff3cd', padding: '20px', textAlign: 'center' }}>
                        <h2>🔄 PERMISSIONS LOADING</h2>
                        <p>Waiting for permissions to load...</p>
                    </div>
                ) : permissionsError ? (
                    <div style={{ background: '#f8d7da', padding: '20px', textAlign: 'center' }}>
                        <h2>❌ PERMISSIONS ERROR</h2>
                        <p>{permissionsError}</p>
                        <button onClick={() => window.location.reload()}>Reload Page</button>
                    </div>
                ) : !permissions ? (
                    <div style={{ background: '#f8d7da', padding: '20px', textAlign: 'center' }}>
                        <h2>❌ NO PERMISSIONS OBJECT</h2>
                        <p>Permissions object is null or undefined</p>
                        <button onClick={() => window.location.reload()}>Reload Page</button>
                    </div>
                ) : isLoading ? (
                    <div style={{ background: '#d1ecf1', padding: '20px', textAlign: 'center' }}>
                        <h2>🔄 DATA LOADING</h2>
                        <p>Loading teams data from Firestore...</p>
                    </div>
                ) : error ? (
                    <div style={{ background: '#f8d7da', padding: '20px', textAlign: 'center' }}>
                        <h2>❌ DATA ERROR</h2>
                        <p>{error}</p>
                        <button onClick={loadTeams}>Try Again</button>
                    </div>
                ) : (
                    <div style={{ background: '#d4edda', padding: '20px' }}>
                        <h2>✅ SUCCESS!</h2>
                        <p>Everything loaded successfully!</p>
                        <p><strong>User Role:</strong> {userRole}</p>
                        <p><strong>Teams Count:</strong> {teams.length}</p>
                        <p><strong>Can Create:</strong> {permissions.canCreate ? 'Yes' : 'No'}</p>

                        {teams.length > 0 && (
                            <div style={{ marginTop: '15px' }}>
                                <h3>Sample Teams:</h3>
                                <ul>
                                    {teams.slice(0, 3).map(team => (
                                        <li key={team.id}>
                                            ID: {team.id} | Name: {team.name || 'Unnamed'} |
                                            Active: {team.active ? 'Yes' : 'No'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {permissions.canCreate && (
                            <button
                                onClick={() => alert('Add team functionality would go here')}
                                style={{
                                    marginTop: '15px',
                                    padding: '10px 20px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px'
                                }}
                            >
                                Add New Team
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default TeamsManagementPage;