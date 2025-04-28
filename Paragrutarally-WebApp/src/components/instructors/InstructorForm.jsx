import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';

const InstructorForm = ({ onInstructorAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        availability: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
        }
    });
    const [specialty, setSpecialty] = useState('');
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

    const handleAvailabilityChange = (day) => {
        setFormData(prevData => ({
            ...prevData,
            availability: {
                ...prevData.availability,
                [day]: !prevData.availability[day]
            }
        }));
    };

    const handleAddSpecialty = () => {
        if (specialty.trim() && !formData.specialties.includes(specialty.trim())) {
            setFormData(prevData => ({
                ...prevData,
                specialties: [...prevData.specialties, specialty.trim()]
            }));
            setSpecialty('');
        }
    };

    const handleRemoveSpecialty = (index) => {
        setFormData(prevData => ({
            ...prevData,
            specialties: prevData.specialties.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const instructorData = {
                ...formData,
                createdAt: serverTimestamp(),
                assignedEvents: []
            };

            const docRef = await addDoc(collection(db, 'instructors'), instructorData);

            setSuccess(true);
            if (onInstructorAdded) {
                onInstructorAdded({ id: docRef.id, ...instructorData });
            }

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                specialties: [],
                availability: {
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                    sunday: false
                }
            });
        } catch (err) {
            setError('Failed to add instructor');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="instructor-form">
            <h2>Add New Instructor</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Instructor added successfully!</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Instructor Name</label>
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
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Specialties</label>
                    <div className="specialty-input">
                        <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="Add a specialty"
                        />
                        <button
                            type="button"
                            onClick={handleAddSpecialty}
                            className="add-specialty-btn"
                        >
                            Add
                        </button>
                    </div>

                    {formData.specialties.length > 0 && (
                        <div className="specialties-list">
                            {formData.specialties.map((spec, index) => (
                                <div key={index} className="specialty-tag">
                                    <span>{spec}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSpecialty(index)}
                                        className="remove-specialty-btn"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Availability</label>
                    <div className="availability-checkboxes">
                        {Object.keys(formData.availability).map((day) => (
                            <div key={day} className="availability-day">
                                <input
                                    type="checkbox"
                                    id={`day-${day}`}
                                    checked={formData.availability[day]}
                                    onChange={() => handleAvailabilityChange(day)}
                                />
                                <label htmlFor={`day-${day}`} className="day-label">
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Instructor'}
                </button>
            </form>
        </div>
    );
};

export default InstructorForm;
