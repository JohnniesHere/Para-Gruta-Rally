// src/components/data/DataImport.jsx

import React, { useState } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { storage, db } from '../../firebase/config';
import ExcelJS from 'exceljs';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function DataImport() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [importType, setImportType] = useState('kids');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { currentUser } = useAuth();
    const { notifySuccess, notifyError, notifyWarning } = useNotification();

    // Available import types
    const importTypes = [
        { id: 'kids', label: 'Kids Data' },
        { id: 'teams', label: 'Teams Data' },
        { id: 'activities', label: 'Activities Data' },
        { id: 'forms', label: 'Forms Data' }
    ];

    // Handle file selection
    const handleFileChange = async (e) => {
        if (e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);

            // Parse Excel file for preview
            try {
                setLoading(true);
                const arrayBuffer = await selectedFile.arrayBuffer();
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(arrayBuffer);

                const worksheet = workbook.getWorksheet(1); // Get first worksheet

                if (!worksheet) {
                    throw new Error('Worksheet not found in Excel file');
                }

                // Convert to array of arrays for display
                const jsonData = [];
                worksheet.eachRow((row, rowNumber) => {
                    const rowData = [];
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        rowData.push(cell.value);
                    });
                    jsonData.push(rowData);
                });

                // Take only first 5 rows for preview
                const previewRows = jsonData.slice(0, 5);
                setPreviewData(previewRows);
                setError('');
            } catch (err) {
                console.error('Error parsing Excel file:', err);
                setError('Failed to parse Excel file. Make sure it is a valid .xlsx file.');
                setPreviewData(null);
            } finally {
                setLoading(false);
            }
        }
    };

    // Validate data based on import type
    const validateData = (data) => {
        if (!data || data.length < 2) {
            return { valid: false, message: 'File contains no data or is missing headers' };
        }

        const headers = data[0].map(header =>
            header && typeof header === 'string' ? header.trim() : header
        );

        // Check required fields based on import type
        if (importType === 'kids') {
            const requiredFields = ['firstName', 'lastName', 'age'];
            const missingFields = requiredFields.filter(field =>
                !headers.some(header =>
                    header && typeof header === 'string' && header.toLowerCase() === field.toLowerCase()
                )
            );

            if (missingFields.length > 0) {
                return {
                    valid: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                };
            }
        }
        else if (importType === 'teams') {
            const requiredFields = ['name', 'description'];
            const missingFields = requiredFields.filter(field =>
                !headers.some(header =>
                    header && typeof header === 'string' && header.toLowerCase() === field.toLowerCase()
                )
            );

            if (missingFields.length > 0) {
                return {
                    valid: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                };
            }
        }
        // Add validations for other import types

        return { valid: true };
    };

    // Handle form submission
    const handleImport = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file to import');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Read the Excel file
            const arrayBuffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.getWorksheet(1); // Get first worksheet

            if (!worksheet) {
                throw new Error('Worksheet not found in Excel file');
            }

            // Convert to array of arrays for validation and processing
            const jsonData = [];
            worksheet.eachRow((row, rowNumber) => {
                const rowData = [];
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    rowData.push(cell.value);
                });
                jsonData.push(rowData);
            });

            // Validate data
            const validation = validateData(jsonData);
            if (!validation.valid) {
                setError(validation.message);
                setLoading(false);
                return;
            }

            // Process the data
            const headers = jsonData[0].map(header =>
                header && typeof header === 'string' ? header.trim() : String(header)
            );
            const rows = jsonData.slice(1);

            // Create objects from rows
            const objects = rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    if (header) {
                        obj[header] = row[index] !== undefined ? row[index] : '';
                    }
                });
                return obj;
            });

            // Save to Firebase based on import type
            const batch = writeBatch(db);

            if (importType === 'kids') {
                objects.forEach((kid) => {
                    const docRef = doc(collection(db, 'kids'));
                    batch.set(docRef, {
                        ...kid,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                });
            }
            else if (importType === 'teams') {
                objects.forEach((team) => {
                    const docRef = doc(collection(db, 'teams'));
                    batch.set(docRef, {
                        ...team,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                });
            }
            // Handle other import types

            // Commit the batch
            await batch.commit();

            // Upload the original file for record
            const storageRef = ref(storage, `imports/${importType}/${Date.now()}_${fileName}`);
            await uploadBytes(storageRef, file);

            // Log the import
            await addDoc(collection(db, 'importLogs'), {
                fileName,
                importType,
                rowCount: objects.length,
                importedAt: serverTimestamp(),
                importedBy: currentUser?.uid || 'unknown'
            });

            setSuccess(`Successfully imported ${objects.length} ${importType} records`);
            notifySuccess(`Successfully imported ${objects.length} ${importType} records`);
            setFile(null);
            setFileName('');
            setPreviewData(null);
        } catch (err) {
            console.error('Error processing Excel file:', err);
            const errorMessage = `Error processing Excel file: ${err.message}`;
            setError(errorMessage);
            notifyError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                        <div className="md:grid md:grid-cols-3 md:gap-6">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Data Import</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Import data from Excel files into the system. Make sure your Excel file has the correct headers.
                                </p>

                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-900">Import Guidelines:</h4>
                                    <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
                                        <li>Use the provided template for best results</li>
                                        <li>Ensure all required fields are filled</li>
                                        <li>Maximum file size: 10MB</li>
                                        <li>Supported formats: .xlsx, .xls</li>
                                    </ul>
                                </div>

                                <div className="mt-8">

                                    <a href="#"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                    Download template
                                </a>
                            </div>
                        </div>

                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <form onSubmit={handleImport}>
                                <div className="space-y-6">
                                    {/* Import type selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Select Import Type
                                        </label>
                                        <select
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            value={importType}
                                            onChange={(e) => setImportType(e.target.value)}
                                        >
                                            {importTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* File upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Upload Excel File
                                        </label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                            <div className="space-y-1 text-center">
                                                <svg
                                                    className="mx-auto h-12 w-12 text-gray-400"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    viewBox="0 0 48 48"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                        strokeWidth={2}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                                <div className="flex text-sm text-gray-600">
                                                    <label
                                                        htmlFor="file-upload"
                                                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                                    >
                                                        <span>Upload a file</span>
                                                        <input
                                                            id="file-upload"
                                                            name="file-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            accept=".xlsx,.xls"
                                                            onChange={handleFileChange}
                                                            disabled={loading}
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Excel files up to 10MB
                                                </p>

                                                {fileName && (
                                                    <p className="text-sm text-gray-700 mt-2">
                                                        Selected: {fileName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data preview */}
                                    {previewData && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Data Preview (First 5 rows)</h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                    <tr>
                                                        {previewData[0].map((header, idx) => (
                                                            <th
                                                                key={idx}
                                                                scope="col"
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                            >
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                    {previewData.slice(1).map((row, rowIdx) => (
                                                        <tr key={rowIdx}>
                                                            {row.map((cell, cellIdx) => (
                                                                <td
                                                                    key={cellIdx}
                                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                                >
                                                                    {cell && typeof cell === 'object' ? JSON.stringify(cell) : cell}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error and success messages */}
                                    {error && (
                                        <div className="rounded-md bg-red-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-red-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-red-800">
                                                        Error
                                                    </h3>
                                                    <div className="mt-2 text-sm text-red-700">
                                                        <p>{error}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="rounded-md bg-green-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-green-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-green-800">
                                                        Success
                                                    </h3>
                                                    <div className="mt-2 text-sm text-green-700">
                                                        <p>{success}</p>
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
                                                setFile(null);
                                                setFileName('');
                                                setPreviewData(null);
                                                setError('');
                                                setSuccess('');
                                            }}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            disabled={!file || loading}
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Importing...
                                                    </span>
                                            ) : 'Import Data'}
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

export default DataImport;