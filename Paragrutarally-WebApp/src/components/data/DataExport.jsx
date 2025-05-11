// src/components/data/DataExport.jsx

import React, { useState } from 'react';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ExcelJS from 'exceljs';
import { useNotification } from '../../contexts/NotificationContext';

function DataExport() {
    const [exportType, setExportType] = useState('kids');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const { currentUser } = useAuth();
    // If you don't have NotificationContext yet, use a simple placeholder
    const notifySuccess = (message) => console.log('Success:', message);
    const notifyError = (message) => console.error('Error:', message);
    const notifyWarning = (message) => console.warn('Warning:', message);

    // Available export types
    const exportTypes = [
        { id: 'kids', label: 'Kids Data' },
        { id: 'teams', label: 'Teams Data' },
        { id: 'activities', label: 'Activities Data' },
        { id: 'forms', label: 'Forms Data' }
    ];

    // Handle export
    const handleExport = async () => {
        setLoading(true);
        setDownloadUrl(null);

        try {
            let data = [];
            let fileName = '';

            // Fetch data based on export type
            if (exportType === 'kids') {
                data = await fetchKidsData();
                fileName = `Kids_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            } else if (exportType === 'teams') {
                data = await fetchTeamsData();
                fileName = `Teams_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            } else if (exportType === 'activities') {
                data = await fetchActivitiesData();
                fileName = `Activities_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            } else if (exportType === 'forms') {
                data = await fetchFormsData();
                fileName = `Forms_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            }

            if (data.length === 0) {
                notifyWarning('No data found to export');
                setLoading(false);
                return;
            }

            // Create workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Data');

            // Add headers
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                worksheet.addRow(headers);

                // Add data rows
                data.forEach(item => {
                    worksheet.addRow(Object.values(item));
                });
            }

            // Write to buffer
            const buffer = await workbook.xlsx.writeBuffer();

            // Create Blob
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Save directly to user's device
            downloadFile(blob, fileName);

            // Upload to Firebase Storage
            await uploadToStorage(blob, fileName);

            notifySuccess('Export completed successfully');
        } catch (error) {
            console.error('Export error:', error);
            notifyError('Export failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Download file directly
    const downloadFile = (blob, fileName) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    // Upload to Firebase Storage
    const uploadToStorage = async (blob, fileName) => {
        try {
            const storageRef = ref(storage, `exports/${currentUser.uid}/${fileName}`);
            await uploadBytes(storageRef, blob);

            const downloadURL = await getDownloadURL(storageRef);
            setDownloadUrl(downloadURL);

            // Log export
            await addDoc(collection(db, 'exportLogs'), {
                fileName,
                exportType,
                exportedAt: serverTimestamp(),
                exportedBy: currentUser.uid,
                fileUrl: downloadURL
            });
        } catch (error) {
            console.error('Storage upload error:', error);
            throw error;
        }
    };

    // Fetch kids data
    const fetchKidsData = async () => {
        let kidsQuery = collection(db, 'kids');

        // Apply date filters if provided
        if (dateRange.start && dateRange.end) {
            kidsQuery = query(
                kidsQuery,
                where('createdAt', '>=', new Date(dateRange.start)),
                where('createdAt', '<=', new Date(dateRange.end)),
            );
        }

        // Apply sorting
        kidsQuery = query(kidsQuery, orderBy('lastName'), orderBy('firstName'));

        const kidsSnapshot = await getDocs(kidsQuery);

        // Format data for Excel
        const kidsData = kidsSnapshot.docs.map(doc => {
            const data = doc.data();

            // Format dates
            const createdAt = data.createdAt && data.createdAt.toDate ?
                data.createdAt.toDate().toISOString().slice(0, 10) : '';
            const updatedAt = data.updatedAt && data.updatedAt.toDate ?
                data.updatedAt.toDate().toISOString().slice(0, 10) : '';

            return {
                id: doc.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                age: data.age || '',
                gender: data.gender || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                emergencyContact: data.emergencyContact || '',
                emergencyPhone: data.emergencyPhone || '',
                teamId: data.teamId || '',
                notes: data.notes || '',
                createdAt,
                updatedAt
            };
        });

        return kidsData;
    };

    // Fetch teams data
    const fetchTeamsData = async () => {
        let teamsQuery = collection(db, 'teams');

        // Apply date filters if provided
        if (dateRange.start && dateRange.end) {
            teamsQuery = query(
                teamsQuery,
                where('createdAt', '>=', new Date(dateRange.start)),
                where('createdAt', '<=', new Date(dateRange.end)),
            );
        }

        // Apply sorting
        teamsQuery = query(teamsQuery, orderBy('name'));

        const teamsSnapshot = await getDocs(teamsQuery);

        // Format data for Excel
        const teamsData = teamsSnapshot.docs.map(doc => {
            const data = doc.data();

            // Format dates
            const createdAt = data.createdAt && data.createdAt.toDate ?
                data.createdAt.toDate().toISOString().slice(0, 10) : '';
            const updatedAt = data.updatedAt && data.updatedAt.toDate ?
                data.updatedAt.toDate().toISOString().slice(0, 10) : '';

            return {
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                instructorId: data.instructorId || '',
                type: data.type || '',
                maxCapacity: data.maxCapacity || '',
                meetingDays: data.meetingDays || '',
                meetingTime: data.meetingTime || '',
                location: data.location || '',
                notes: data.notes || '',
                createdAt,
                updatedAt
            };
        });

        return teamsData;
    };

    // Fetch activities data
    const fetchActivitiesData = async () => {
        // Placeholder function - implement based on your data model
        return [];
    };

    // Fetch forms data
    const fetchFormsData = async () => {
        // Placeholder function - implement based on your data model
        return [];
    };

    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                        <div className="md:grid md:grid-cols-3 md:gap-6">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Data Export</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Export your data to Excel files for reporting, backup, or analysis.
                                </p>

                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-900">Export Guidelines:</h4>
                                    <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
                                        <li>Choose the type of data to export</li>
                                        <li>Optionally set a date range for filtering</li>
                                        <li>Click Export to download the file</li>
                                        <li>Large datasets may take some time to process</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-5 md:mt-0 md:col-span-2">
                                <form onSubmit={(e) => { e.preventDefault(); handleExport(); }}>
                                    <div className="space-y-6">
                                        {/* Export type selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Select Export Type
                                            </label>
                                            <select
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                value={exportType}
                                                onChange={(e) => setExportType(e.target.value)}
                                            >
                                                {exportTypes.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Date range */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Date Range (Optional)
                                            </label>
                                            <div className="mt-1 flex space-x-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500">Start Date</label>
                                                    <input
                                                        type="date"
                                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                        value={dateRange.start}
                                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500">End Date</label>
                                                    <input
                                                        type="date"
                                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                        value={dateRange.end}
                                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Download link */}
                                        {downloadUrl && (
                                            <div className="rounded-md bg-green-50 p-4">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-green-800">Export successful</h3>
                                                        <div className="mt-2 text-sm text-green-700">
                                                            <p>
                                                                Your export has been saved to our servers. You can download it again using the link below.
                                                            </p>
                                                            <p className="mt-2">
                                                                <a
                                                                    href={downloadUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="font-medium text-green-700 underline"
                                                                >
                                                                    Download Export File
                                                                </a>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                onClick={() => {
                                                    setExportType('kids');
                                                    setDateRange({ start: '', end: '' });
                                                    setDownloadUrl(null);
                                                }}
                                            >
                                                Reset
                                            </button>
                                            <button
                                                type="submit"
                                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Exporting...
                          </span>
                                                ) : (
                                                    'Export Data'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DataExport;