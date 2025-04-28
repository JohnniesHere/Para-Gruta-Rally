import React, { useState } from 'react';
import VehicleList from '../../components/vehicles/VehicleList';
import VehicleForm from '../../components/vehicles/VehicleForm';

const AdminVehicles = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [vehicles, setVehicles] = useState([]);

    const handleVehicleAdded = (newVehicle) => {
        setVehicles([...vehicles, newVehicle]);
        setShowAddForm(false);
    };

    return (
        <div className="admin-vehicles-page">
            <div className="page-header">
                <h1>Vehicle Management</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="add-button"
                >
                    {showAddForm ? 'Cancel' : 'Add New Vehicle'}
                </button>
            </div>

            {showAddForm && (
                <div className="card">
                    <VehicleForm onVehicleAdded={handleVehicleAdded} />
                </div>
            )}

            <div className="card">
                <VehicleList />
            </div>
        </div>
    );
};

export default AdminVehicles;