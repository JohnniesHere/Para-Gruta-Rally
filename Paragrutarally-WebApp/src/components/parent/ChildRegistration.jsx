import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ChildRegistration = () => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        dateOfBirth: '',
        specialNeeds: '',
        medicalInfo: ''
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
        if (!currentUser) return;

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await addDoc(collection(db, 'children'), {
                parentId: currentUser.uid,
                name: formData.name,
                dateOfBirth: formData.dateOfBirth,
                specialNeeds: formData.specialNeeds,
                medicalInfo: formData.medicalInfo,
                createdAt: serverTimestamp(),
                participatedEvents: []
            });

            setSuccess(true);
            setFormData({
                name: '',
                dateOfBirth: '',
                specialNeeds: '',
                medicalInfo: ''
            });
        } catch (err) {
            setError('Failed to register child. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="child-registration">
            <h2>Register Your Child</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Child registered successfully!</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Child's Name</label>
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
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="specialNeeds">Special Needs</label>
                    <textarea
                        id="specialNeeds"
                        name="specialNeeds"
                        value={formData.specialNeeds}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Please describe any special needs or requirements"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="medicalInfo">Medical Information</label>
                    <textarea
                        id="medicalInfo"
                        name="medicalInfo"
                        value={formData.medicalInfo}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Please provide relevant medical information"
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register Child'}
                </button>
            </form>
        </div>
    );
};

export default ChildRegistration;