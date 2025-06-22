// src/services/GoogleDriveService.js - Updated for Google Identity Services (GIS)
class GoogleDriveService {
    constructor() {
        this.isInitialized = false;
        this.isSignedIn = false;
        this.accessToken = null;
        this.gapi = null;
        this.tokenClient = null;

        // Google Drive API configuration - Updated for Vite
        this.CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        this.API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';

        // Folder for backups
        this.BACKUP_FOLDER_NAME = 'Charity App Backups';
        this.backupFolderId = null;

        // Validate environment variables
        if (!this.CLIENT_ID || !this.API_KEY) {
            console.error('Google Drive API credentials not found. Please check your .env file.');
            console.error('Required variables: VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY');
        }
    }

    // Initialize Google API with new GIS
    async initialize() {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                resolve(true);
                return;
            }

            const initializeGoogleServices = async () => {
                try {
                    // Load both GAPI and GIS scripts
                    await Promise.all([
                        this.loadGapi(),
                        this.loadGis()
                    ]);

                    this.isInitialized = true;
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };

            // Check if scripts are already loaded
            if (!window.gapi || !window.google?.accounts) {
                this.loadScripts().then(initializeGoogleServices).catch(reject);
            } else {
                initializeGoogleServices().catch(reject);
            }
        });
    }

    // Load required scripts
    async loadScripts() {
        const scripts = [];

        // Load GAPI script if not present
        if (!window.gapi) {
            scripts.push(new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Google API script'));
                document.head.appendChild(script);
            }));
        }

        // Load GIS script if not present
        if (!window.google?.accounts) {
            scripts.push(new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
                document.head.appendChild(script);
            }));
        }

        if (scripts.length > 0) {
            await Promise.all(scripts);
        }
    }

    // Initialize GAPI client
    async loadGapi() {
        return new Promise((resolve, reject) => {
            console.log('[GoogleDrive] Initializing GAPI client...');

            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: this.API_KEY,
                        discoveryDocs: [this.DISCOVERY_DOC],
                    });

                    this.gapi = window.gapi;
                    console.log('[GoogleDrive] GAPI client initialized successfully');
                    resolve();
                } catch (error) {
                    console.error('[GoogleDrive] GAPI initialization error:', error);
                    reject(error);
                }
            });
        });
    }

    // Initialize Google Identity Services
    async loadGis() {
        return new Promise((resolve, reject) => {
            console.log('[GoogleDrive] Initializing Google Identity Services...');

            try {
                if (!window.google?.accounts?.oauth2) {
                    throw new Error('Google Identity Services not loaded');
                }

                this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: this.SCOPES,
                    callback: (response) => {
                        console.log('[GoogleDrive] Default callback triggered:', response);
                        // This is the default callback, actual handling happens in signIn()
                    },
                });

                if (!this.tokenClient) {
                    throw new Error('Failed to create token client');
                }

                console.log('[GoogleDrive] GIS initialized successfully');
                console.log('[GoogleDrive] Token client created:', !!this.tokenClient);
                resolve();
            } catch (error) {
                console.error('[GoogleDrive] GIS initialization error:', error);
                reject(error);
            }
        });
    }

    // Sign in to Google using new GIS
    async signIn() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (this.isSignedIn && this.accessToken) {
                console.log('[GoogleDrive] Already signed in');
                return true;
            }

            // Check for stored token
            const storedToken = localStorage.getItem('googleDriveAccessToken');
            if (storedToken) {
                console.log('[GoogleDrive] Found stored token, verifying...');
                this.accessToken = storedToken;
                this.isSignedIn = true;

                // Verify token is still valid
                try {
                    await this.getStorageInfo();
                    console.log('[GoogleDrive] Stored token is valid');
                    return true;
                } catch (error) {
                    console.log('[GoogleDrive] Stored token is invalid, clearing...');
                    // Token is invalid, clear it and continue with new auth
                    localStorage.removeItem('googleDriveAccessToken');
                    localStorage.removeItem('googleDriveConnected');
                    this.accessToken = null;
                    this.isSignedIn = false;
                }
            }

            console.log('[GoogleDrive] Starting OAuth flow...');

            return new Promise((resolve, reject) => {
                let authCompleted = false;

                // Set up callback for successful authentication
                const originalCallback = this.tokenClient.callback;
                this.tokenClient.callback = (response) => {
                    console.log('[GoogleDrive] OAuth callback triggered:', response);

                    // Restore original callback
                    this.tokenClient.callback = originalCallback;

                    if (authCompleted) {
                        console.log('[GoogleDrive] Auth already completed, ignoring duplicate callback');
                        return;
                    }
                    authCompleted = true;

                    if (response.error) {
                        console.error('[GoogleDrive] OAuth error:', response.error);
                        reject(new Error(`Authentication failed: ${response.error}`));
                        return;
                    }

                    if (!response.access_token) {
                        console.error('[GoogleDrive] No access token in response:', response);
                        reject(new Error('No access token received'));
                        return;
                    }

                    console.log('[GoogleDrive] Setting access token...');
                    this.accessToken = response.access_token;
                    this.isSignedIn = true;

                    // Store connection status
                    localStorage.setItem('googleDriveConnected', 'true');
                    localStorage.setItem('googleDriveAccessToken', this.accessToken);

                    console.log('[GoogleDrive] Authentication successful, tokens stored');
                    console.log('[GoogleDrive] isSignedIn:', this.isSignedIn);
                    console.log('[GoogleDrive] accessToken exists:', !!this.accessToken);

                    resolve(true);
                };

                // Set timeout in case callback never fires
                const timeoutId = setTimeout(() => {
                    if (!authCompleted) {
                        authCompleted = true;
                        console.error('[GoogleDrive] OAuth timeout - callback never fired');
                        reject(new Error('Authentication timeout - popup may have been blocked'));
                    }
                }, 60000); // 60 second timeout

                try {
                    // Request access token
                    console.log('[GoogleDrive] Requesting access token...');
                    this.tokenClient.requestAccessToken({
                        prompt: 'consent',  // Force consent screen to ensure fresh token
                        hint: ''
                    });
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (!authCompleted) {
                        authCompleted = true;
                        reject(error);
                    }
                }
            });

        } catch (error) {
            console.error('Error signing in to Google:', error);
            throw new Error('Failed to connect to Google Drive');
        }
    }

    // Sign out from Google
    async signOut() {
        try {
            if (this.accessToken) {
                // Revoke the access token
                window.google.accounts.oauth2.revoke(this.accessToken);
            }

            this.isSignedIn = false;
            this.accessToken = null;

            // Clear stored data
            localStorage.removeItem('googleDriveConnected');
            localStorage.removeItem('googleDriveAccessToken');
            this.backupFolderId = null;

            return true;
        } catch (error) {
            console.error('Error signing out from Google:', error);
            throw new Error('Failed to disconnect from Google Drive');
        }
    }

    // Check connection status
    getConnectionStatus() {
        return {
            isConnected: this.isSignedIn || localStorage.getItem('googleDriveConnected') === 'true',
            userEmail: null // We'll need to get this separately with new API
        };
    }

    // Make authenticated API request
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, clear it
                this.signOut();
                throw new Error('Authentication expired. Please reconnect.');
            }
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return response.json();
    }

    // Create or find backup folder
    async ensureBackupFolder() {
        try {
            if (this.backupFolderId) {
                return this.backupFolderId;
            }

            // Search for existing backup folder
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${this.BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const response = await this.makeAuthenticatedRequest(searchUrl);

            if (response.files.length > 0) {
                this.backupFolderId = response.files[0].id;
                return this.backupFolderId;
            }

            // Create new backup folder
            const createUrl = 'https://www.googleapis.com/drive/v3/files';
            const folderData = {
                name: this.BACKUP_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const folderResponse = await this.makeAuthenticatedRequest(createUrl, {
                method: 'POST',
                body: JSON.stringify(folderData)
            });

            this.backupFolderId = folderResponse.id;
            return this.backupFolderId;
        } catch (error) {
            console.error('Error creating backup folder:', error);
            throw new Error('Failed to create backup folder');
        }
    }

    // Upload backup to Google Drive
    async uploadBackup(backupData, filename) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not connected to Google Drive');
            }

            // Ensure backup folder exists
            const folderId = await this.ensureBackupFolder();

            // Convert backup data to JSON string
            const jsonData = JSON.stringify(backupData, null, 2);

            // Create file metadata
            const metadata = {
                name: filename,
                parents: [folderId],
                description: `Charity app backup created on ${new Date().toISOString()}`
            };

            // Upload using multipart upload
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const body =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                jsonData +
                close_delim;

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': `multipart/related; boundary="${boundary}"`
                },
                body: body
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            return {
                fileId: result.id,
                fileName: result.name,
                size: jsonData.length,
                webViewLink: `https://drive.google.com/file/d/${result.id}/view`
            };
        } catch (error) {
            console.error('Error uploading backup:', error);
            throw new Error(`Failed to upload backup: ${error.message}`);
        }
    }

    // List backups from Google Drive
    async listBackups() {
        try {
            if (!this.isSignedIn) {
                return [];
            }

            const folderId = await this.ensureBackupFolder();
            const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=createdTime desc&fields=files(id,name,size,createdTime,modifiedTime)`;

            const response = await this.makeAuthenticatedRequest(url);

            return response.files.map(file => ({
                id: file.id,
                name: file.name,
                size: parseInt(file.size) || 0,
                createdAt: new Date(file.createdTime),
                modifiedAt: new Date(file.modifiedTime),
                webViewLink: `https://drive.google.com/file/d/${file.id}/view`
            }));
        } catch (error) {
            console.error('Error listing backups:', error);
            throw new Error('Failed to list backups from Google Drive');
        }
    }

    // Get storage quota information
    async getStorageInfo() {
        try {
            if (!this.isSignedIn) {
                return null;
            }

            const url = 'https://www.googleapis.com/drive/v3/about?fields=storageQuota';
            const response = await this.makeAuthenticatedRequest(url);

            const quota = response.storageQuota;
            return {
                limit: parseInt(quota.limit) || 0,
                usage: parseInt(quota.usage) || 0,
                usageInDrive: parseInt(quota.usageInDrive) || 0
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    // Download backup from Google Drive
    async downloadBackup(fileId) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not connected to Google Drive');
            }

            const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Error downloading backup:', error);
            throw new Error('Failed to download backup from Google Drive');
        }
    }

    // Delete backup from Google Drive
    async deleteBackup(fileId) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Not connected to Google Drive');
            }

            const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
            await this.makeAuthenticatedRequest(url, { method: 'DELETE' });

            return true;
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw new Error('Failed to delete backup from Google Drive');
        }
    }

    // Restore backup data to Firestore
    async restoreBackup(backupData) {
        try {
            if (!backupData || !backupData.data) {
                throw new Error('Invalid backup data format');
            }

            console.log('[GoogleDrive] Starting backup restoration...');
            const results = {
                success: [],
                errors: [],
                totalDocuments: 0,
                restoredDocuments: 0
            };

            // Import required Firebase functions at the top level
            const { doc, setDoc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');

            // Count total documents for progress tracking
            Object.values(backupData.data).forEach(documents => {
                results.totalDocuments += documents.length;
            });

            console.log(`[GoogleDrive] Total documents to restore: ${results.totalDocuments}`);

            // Restore each collection using batch operations for better performance
            for (const [collectionName, documents] of Object.entries(backupData.data)) {
                try {
                    console.log(`[GoogleDrive] Restoring ${documents.length} documents to ${collectionName}`);

                    // Process documents in batches of 500 (Firestore batch limit)
                    const batchSize = 500;
                    for (let i = 0; i < documents.length; i += batchSize) {
                        const batch = writeBatch(db);
                        const batchDocuments = documents.slice(i, i + batchSize);

                        for (const docData of batchDocuments) {
                            try {
                                // Remove the 'id' field and use it as document ID
                                const { id, ...cleanDocData } = docData;

                                if (!id) {
                                    console.warn(`Document in ${collectionName} missing ID, skipping...`);
                                    continue;
                                }

                                // Add to batch
                                const docRef = doc(db, collectionName, id);
                                batch.set(docRef, cleanDocData);

                            } catch (docError) {
                                console.error(`Error preparing document ${docData.id} in ${collectionName}:`, docError);
                                results.errors.push(`${collectionName}/${docData.id}: ${docError.message}`);
                            }
                        }

                        // Commit the batch
                        try {
                            await batch.commit();
                            results.restoredDocuments += batchDocuments.length;
                            console.log(`[GoogleDrive] Batch ${Math.floor(i/batchSize) + 1} committed for ${collectionName}`);
                        } catch (batchError) {
                            console.error(`Error committing batch for ${collectionName}:`, batchError);
                            results.errors.push(`${collectionName} batch ${Math.floor(i/batchSize) + 1}: ${batchError.message}`);
                        }
                    }

                    results.success.push(`${collectionName}: ${documents.length} documents`);
                    console.log(`[GoogleDrive] Successfully restored ${collectionName}`);

                } catch (collectionError) {
                    console.error(`Error restoring collection ${collectionName}:`, collectionError);
                    results.errors.push(`${collectionName}: ${collectionError.message}`);
                }
            }

            console.log(`[GoogleDrive] Restoration complete. Restored ${results.restoredDocuments}/${results.totalDocuments} documents`);
            return results;

        } catch (error) {
            console.error('Error during backup restoration:', error);
            throw new Error(`Failed to restore backup: ${error.message}`);
        }
    }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

// For debugging - expose service to window object
if (typeof window !== 'undefined') {
    window.googleDriveService = googleDriveService;
}

export default googleDriveService;