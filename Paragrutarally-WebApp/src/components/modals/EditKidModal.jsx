// src/components/modals/EditKidModal.jsx - Quick Edit Modal for Kids
import React, { useState, useEffect } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { updateKid } from '../../services/kidService';
import { db } from '../../firebase/config';
import {
    IconX as X,
    IconDeviceFloppy as Save,
    IconUserCircle as Baby,
    IconCar as Car,
    IconUser as User,
    IconUsers as Users,
    IconHeart as Heart,
    IconCheck as Check,
    IconNotes as FileText,
    IconSparkles as Sparkles,
    IconCalendar as Calendar
} from '@tabler/icons-react';
import './EditKidModal.css';

const EditKidModal = ({ kid, isOpen, onClose, onKidUpdated }) => {
    const [formData, setFormData] = useState({
        participantNumber: '',
        personalInfo: {
            address: '',
            dateOfBirth: '',
            capabilities: '',
            announcersNotes: ''
        },
        parentInfo: {
            name: '',
            email: '',
            phone: '',
            parentId: '',
            grandparentsInfo: {
                names: '',
                phone: ''
            }
        },
        instructorId: '',
        teamId: '',
        signedFormStatus: 'Pending',
        signedDeclaration: false,
        additionalComments: ''
    });

    const [teams, setTeams] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [parents, setParents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (isOpen && kid) {
            // Initialize form data with kid data
            setFormData({
                participantNumber: kid.originalData?.participantNumber || '',
                personalInfo: {
                    address: kid.originalData?.personalInfo?.address || '',
                    dateOfBirth: kid.originalData?.personalInfo?.dateOfBirth || '',
                    capabilities: kid.originalData?.personalInfo?.capabilities || '',
                    announcersNotes: kid.originalData?.personalInfo?.announcersNotes || ''
                },
                parentInfo: {
                    name: kid.originalData?.parentInfo?.name || '',
                    email: kid.originalData?.parentInfo?.email || '',
                    phone: kid.originalData?.parentInfo?.phone || '',
                    parentId: kid.originalData?.parentInfo?.parentId || '',
                    grandparentsInfo: {
                        names: kid.originalData?.parentInfo?.grandparentsInfo?.names || '',
                        phone: kid.originalData?.parentInfo?.grandparentsInfo?.phone || ''
                    }
                },
                instructorId: kid.originalData?.instructorId || '',
                teamId: kid.originalData?.teamId || '',
                signedFormStatus: kid.originalData?.signedFormStatus || 'Pending',
                signedDeclaration: kid.originalData?.signedDeclaration || false,
                additionalComments: kid.originalData?.additionalComments || ''
            });

            loadSupportingData();
        }
    }, [isOpen, kid]);

    const loadSupportingData = async () => {
        setIsLoading(true);
        try {
            // Load teams, instructors, and parents
            const [teamsSnapshot, instructorsSnapshot, parentsSnapshot] = await Promise.all([
                getDocs(collection(db, 'teams')),
                getDocs(collection(db, 'instructors')),
                getDocs(query(collection(db, 'users'), where('role', '==', 'parent')))
            ]);

            setTeams(teamsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(team => team.active !== false)
            );

            setInstructors(instructorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));

            setParents(parentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error('Error loading supporting data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (path, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newData;
        });

        // Clear specific error when user starts typing
        if (fieldErrors[path]) {
            setFieldErrors(prev => ({
                ...prev,
                [path]: false
            }));
        }
        if (errors[path]) {
            setErrors(prev => ({
                ...prev,
                [path]: undefined
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const newFieldErrors = {};

        // Required field validations
        if (!formData.participantNumber) {
            newErrors.participantNumber = 'Participant number is required';
            newFieldErrors.participantNumber = true;
        }

        if (!formData.personalInfo.dateOfBirth) {
            newErrors['personalInfo.dateOfBirth'] = 'Date of birth is required';
            newFieldErrors['personalInfo.dateOfBirth'] = true;
        }

        if (!formData.parentInfo.name) {
            newErrors['parentInfo.name'] = 'Parent name is required';
            newFieldErrors['parentInfo.name'] = true;
        }

        if (!formData.parentInfo.email) {
            newErrors['parentInfo.email'] = 'Parent email is required';
            newFieldErrors['parentInfo.email'] = true;
        } else if (!/\S+@\S+\.\S+/.test(formData.parentInfo.email)) {
            newErrors['parentInfo.email'] = 'Please enter a valid email address';
            newFieldErrors['parentInfo.email'] = true;
        }

        if (!formData.parentInfo.phone) {
            newErrors['parentInfo.phone'] = 'Parent phone is required';
            newFieldErrors['parentInfo.phone'] = true;
        }

        // Validate date of birth
        if (formData.personalInfo.dateOfBirth) {
            const birthDate = new Date(formData.personalInfo.dateOfBirth);
            const today = new Date();
            if (birthDate >= today) {
                newErrors['personalInfo.dateOfBirth'] = 'Date of birth must be in the past';
                newFieldErrors['personalInfo.dateOfBirth'] = true;
            }
        }

        setErrors(newErrors);
        setFieldErrors(newFieldErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            await updateKid(kid.id, formData);
            onKidUpdated(kid.id, formData);
            onClose();
        } catch (error) {
            console.error('Error updating kid:', error);
            setErrors({ general: 'Failed to update kid. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        setFieldErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content edit-kid-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <Baby size={24} style={{ marginRight: '8px' }} />
                        Edit Racing Star: {kid?.name}
                    </h2>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {errors.general && (
                        <div className="alert error-alert">
                            {errors.general}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading form data...</p>
                        </div>
                    ) : (
                        <form className="edit-kid-form">
                            {/* Basic Info Section */}
                            <div className="form-section racing-section">
                                <div className="section-header">
                                    <Baby className="section-icon" size={20} />
                                    <h3>🏎️ Racer Profile</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">🏁 Race Number *</label>
                                        <input
                                            type="text"
                                            className={`form-input ${fieldErrors.participantNumber ? 'error' : ''}`}
                                            placeholder="001"
                                            value={formData.participantNumber}
                                            onChange={(e) => handleInputChange('participantNumber', e.target.value)}
                                        />
                                        {errors.participantNumber && <span className="error-text">{errors.participantNumber}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">🎂 Birthday *</label>
                                        <input
                                            type="date"
                                            className={`form-input ${fieldErrors['personalInfo.dateOfBirth'] ? 'error' : ''}`}
                                            value={formData.personalInfo.dateOfBirth}
                                            onChange={(e) => handleInputChange('personalInfo.dateOfBirth', e.target.value)}
                                        />
                                        {errors['personalInfo.dateOfBirth'] && <span className="error-text">{errors['personalInfo.dateOfBirth']}</span>}
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">🏠 Home Base Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Where our racer calls home"
                                            value={formData.personalInfo.address}
                                            onChange={(e) => handleInputChange('personalInfo.address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Information */}
                            <div className="form-section parent-section">
                                <div className="section-header">
                                    <Heart className="section-icon" size={20} />
                                    <h3>👨‍👩‍👧‍👦 Racing Family</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">👤 Parent/Guardian Name *</label>
                                        <input
                                            type="text"
                                            className={`form-input ${fieldErrors['parentInfo.name'] ? 'error' : ''}`}
                                            placeholder="Racing coach's name"
                                            value={formData.parentInfo.name}
                                            onChange={(e) => handleInputChange('parentInfo.name', e.target.value)}
                                        />
                                        {errors['parentInfo.name'] && <span className="error-text">{errors['parentInfo.name']}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">📧 Email Address *</label>
                                        <input
                                            type="email"
                                            className={`form-input ${fieldErrors['parentInfo.email'] ? 'error' : ''}`}
                                            placeholder="parent@racingfamily.com"
                                            value={formData.parentInfo.email}
                                            onChange={(e) => handleInputChange('parentInfo.email', e.target.value)}
                                        />
                                        {errors['parentInfo.email'] && <span className="error-text">{errors['parentInfo.email']}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">📱 Phone Number *</label>
                                        <input
                                            type="tel"
                                            className={`form-input ${fieldErrors['parentInfo.phone'] ? 'error' : ''}`}
                                            placeholder="Racing hotline"
                                            value={formData.parentInfo.phone}
                                            onChange={(e) => handleInputChange('parentInfo.phone', e.target.value)}
                                        />
                                        {errors['parentInfo.phone'] && <span className="error-text">{errors['parentInfo.phone']}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">🔗 Parent Account</label>
                                        <select
                                            value={formData.parentInfo.parentId}
                                            onChange={(e) => handleInputChange('parentInfo.parentId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">Choose Parent Account (Optional)</option>
                                            {parents.map(parent => (
                                                <option key={parent.id} value={parent.id}>
                                                    {parent.displayName || parent.name} ({parent.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Team Assignment */}
                            <div className="form-section team-section">
                                <div className="section-header">
                                    <Car className="section-icon" size={20} />
                                    <h3>🏎️ Racing Team</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">🏁 Racing Team</label>
                                        <select
                                            value={formData.teamId}
                                            onChange={(e) => handleInputChange('teamId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">🚫 No Team Assigned</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>
                                                    🏁 {team.name} ({team.kidIds?.length || 0} racers)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">👨‍🏫 Racing Instructor</label>
                                        <select
                                            value={formData.instructorId}
                                            onChange={(e) => handleInputChange('instructorId', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">No Instructor Assigned</option>
                                            {instructors.map(instructor => (
                                                <option key={instructor.id} value={instructor.id}>
                                                    🏎️ {instructor.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="form-section status-section">
                                <div className="section-header">
                                    <Check className="section-icon" size={20} />
                                    <h3>📋 Racing Status</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">📊 Form Status</label>
                                        <select
                                            value={formData.signedFormStatus}
                                            onChange={(e) => handleInputChange('signedFormStatus', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="Pending">⏳ Pending - Getting Ready</option>
                                            <option value="Completed">✅ Completed - Ready to Race!</option>
                                            <option value="Needs Review">🔍 Needs Review</option>
                                            <option value="Cancelled">❌ Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.signedDeclaration}
                                                onChange={(e) => handleInputChange('signedDeclaration', e.target.checked)}
                                            />
                                            🛡️ Safety Declaration Signed
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Notes */}
                            <div className="form-section skills-section">
                                <div className="section-header">
                                    <Sparkles className="section-icon" size={20} />
                                    <h3>💪 Skills & Notes</h3>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">🌟 Amazing Abilities</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Tell us about this racer's awesome skills!"
                                            value={formData.personalInfo.capabilities}
                                            onChange={(e) => handleInputChange('personalInfo.capabilities', e.target.value)}
                                            rows="2"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">📢 Announcer Notes</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Fun facts for race day!"
                                            value={formData.personalInfo.announcersNotes}
                                            onChange={(e) => handleInputChange('personalInfo.announcersNotes', e.target.value)}
                                            rows="2"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">🗒️ Additional Notes</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Any special notes about this racing star!"
                                            value={formData.additionalComments}
                                            onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-secondary"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                    >
                        {isSaving ? (
                            <>
                                <div className="loading-spinner-mini"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes 🏁
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditKidModal;