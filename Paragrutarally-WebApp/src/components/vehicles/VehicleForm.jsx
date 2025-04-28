import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const VehicleForm = ({ onVehicleAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        description: '',
        status: 'available'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const vehicleData = {
                ...formData,
                createdAt: serverTimestamp(),
                lastMaintenanceDate: null,
                photos: []
            };

            const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);

            setSuccess(true);
            if (onVehicleAdded) {
                onVehicleAdded({ id: docRef.id, ...vehicleData });
            }

            // Reset form
            setFormData({
                name: '',
                type: '',
                description: '',
                status: 'available'
            });
        } catch (err) {
            setError('Failed to add vehicle');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vehicle-form">
            <h2>Add New Vehicle</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Vehicle added successfully!</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Vehicle Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="type">Vehicle Type</label>
                    <input
                        type="text"
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                    >
                        <option value="available">Available</option>
                        <option value="in-use">In Use</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Vehicle'}
                </button>
            </form>
        </div>
    );
};

export default VehicleForm;