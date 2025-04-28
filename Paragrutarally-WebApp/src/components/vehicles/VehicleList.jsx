import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingVehicle, setEditingVehicle] = useState(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const vehiclesCollection = collection(db, 'vehicles');
                const vehicleSnapshot = await getDocs(vehiclesCollection);
                const vehicleList = vehicleSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setVehicles(vehicleList);
            } catch (err) {
                setError('Failed to fetch vehicles');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    const handleStatusChange = async (vehicleId, newStatus) => {
        try {
            const vehicleRef = doc(db, 'vehicles', vehicleId);
            await updateDoc(vehicleRef, {
                status: newStatus
            });

            // Update local state
            setVehicles(vehicles.map(vehicle =>
                vehicle.id === vehicleId ? { ...vehicle, status: newStatus } : vehicle
            ));
        } catch (err) {
            setError('Failed to update vehicle status');
            console.error(err);
        }
    };

    const handleEditClick = (vehicle) => {
        setEditingVehicle({ ...vehicle });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingVehicle(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEdit = async () => {
        try {
            const vehicleRef = doc(db, 'vehicles', editingVehicle.id);
            await updateDoc(vehicleRef, {
                name: editingVehicle.name,
                type: editingVehicle.type,
                description: editingVehicle.description,
                status: editingVehicle.status
            });

            // Update local state
            setVehicles(vehicles.map(vehicle =>
                vehicle.id === editingVehicle.id ? editingVehicle : vehicle
            ));

            // Exit edit mode
            setEditingVehicle(null);
        } catch (err) {
            setError('Failed to update vehicle');
            console.error(err);
        }
    };

    const handleCancelEdit = () => {
        setEditingVehicle(null);
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

        try {
            await deleteDoc(doc(db, 'vehicles', vehicleId));
            setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId));
        } catch (err) {
            setError('Failed to delete vehicle');
            console.error(err);
        }
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'available':
                return 'status-available';
            case 'in-use':
                return 'status-in-use';
            case 'maintenance':
                return 'status-maintenance';
            default:
                return '';
        }
    };

    if (loading) return <div>Loading vehicles...</div>;

    return (
        <div className="vehicle-list">
            <h2>Vehicles</h2>
            {error && <div className="error-message">{error}</div>}

            {vehicles.length === 0 ? (
                <p>No vehicles available. Add some vehicles to get started.</p>
            ) : (
                <div className="vehicles-table-container">
                    <table className="vehicles-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vehicles.map(vehicle => (
                            <tr key={vehicle.id}>
                                {editingVehicle && editingVehicle.id === vehicle.id ? (
                                    // Edit mode
                                    <>
                                        <td>
                                            <input
                                                type="text"
                                                name="name"
                                                value={editingVehicle.name}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="type"
                                                value={editingVehicle.type}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        <td>
                        <textarea
                            name="description"
                            value={editingVehicle.description}
                            onChange={handleEditChange}
                            rows="2"
                        />
                                        </td>
                                        <td>
                                            <select
                                                name="status"
                                                value={editingVehicle.status}
                                                onChange={handleEditChange}
                                            >
                                                <option value="available">Available</option>
                                                <option value="in-use">In Use</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </td>
                                        <td className="actions-cell">
                                            <button onClick={handleSaveEdit} className="save-btn">Save</button>
                                            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    // View mode
                                    <>
                                        <td>{vehicle.name}</td>
                                        <td>{vehicle.type}</td>
                                        <td>{vehicle.description}</td>
                                        <td>
                        <span className={`status-badge ${getStatusClass(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button onClick={() => handleEditClick(vehicle)} className="edit-btn">Edit</button>
                                            <button onClick={() => handleDeleteVehicle(vehicle.id)} className="delete-btn">Delete</button>
                                            <div className="status-dropdown">
                                                <button className="status-btn">Change Status</button>
                                                <div className="dropdown-content">
                                                    <a onClick={() => handleStatusChange(vehicle.id, 'available')}>Available</a>
                                                    <a onClick={() => handleStatusChange(vehicle.id, 'in-use')}>In Use</a>
                                                    <a onClick={() => handleStatusChange(vehicle.id, 'maintenance')}>Maintenance</a>
                                                </div>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VehicleList;
