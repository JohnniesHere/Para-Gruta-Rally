// src/components/layout/ContactUsModal.jsx
import React, { useState } from 'react';
import './ContactUsModal.css';

const ContactUsModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate sending the contact message
        setTimeout(() => {
            setSubmitMessage('Your message has been sent. We will get back to you soon.');
            setIsSubmitting(false);

            // Reset form after submission
            setTimeout(() => {
                setName('');
                setEmail('');
                setMessage('');
                setSubmitMessage('');
                onClose();
            }, 3000);
        }, 1500);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>

                <h2>Contact Us</h2>

                {submitMessage ? (
                    <div className="success-message">{submitMessage}</div>
                ) : (
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact-email">Email</label>
                            <input
                                type="email"
                                id="contact-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows="5"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ContactUsModal;